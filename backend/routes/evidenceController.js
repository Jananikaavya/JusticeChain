import Evidence from '../models/Evidence.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { uploadToPinata, verifyEvidenceImmutability } from '../utils/pinataService.js';
import { sendTamperAlertEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import fs from 'fs';

const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

// Helper to log activity
const logActivity = async (
  userId,
  userRole,
  action,
  caseId,
  resourceId = null,
  description = null,
  metadata = null
) => {
  try {
    const logId = `LOG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    await ActivityLog.create({
      logId,
      performedBy: userId,
      performedByRole: userRole,
      action,
      relatedCaseId: caseId,
      relatedResourceId: resourceId,
      description,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Generate SHA-256 hash
const generateSHA256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

const resolveIpfsUrl = (evidence) => {
  if (!evidence) return '';
  if (evidence.pinataUrl) return evidence.pinataUrl;
  if (evidence.pinataIpfsGatewayUrl?.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY_URL}${evidence.pinataIpfsGatewayUrl.replace('ipfs://', '')}`;
  }
  if (evidence.ipfsHash) return `${PINATA_GATEWAY_URL}${evidence.ipfsHash}`;
  return '';
};

const fetchContentHashFromIpfs = async (ipfsUrl) => {
  const response = await fetch(ipfsUrl);
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return generateSHA256(buffer);
};

const checkEvidenceIntegrity = async (evidence) => {
  const ipfsUrl = resolveIpfsUrl(evidence);
  let ipfsAvailable = false;
  let contentHashMatches = false;
  let computedHash = null;
  const reasons = [];

  if (!evidence?.sha256Hash) {
    reasons.push('MISSING_SHA256');
  }

  if (ipfsUrl) {
    try {
      const head = await fetch(ipfsUrl, { method: 'HEAD' });
      ipfsAvailable = head.ok;
    } catch (error) {
      ipfsAvailable = false;
    }
  }

  if (!ipfsAvailable) {
    reasons.push('IPFS_NOT_AVAILABLE');
  } else if (evidence?.sha256Hash) {
    try {
      computedHash = await fetchContentHashFromIpfs(ipfsUrl);
      contentHashMatches = computedHash === evidence.sha256Hash;
      if (!contentHashMatches) {
        reasons.push('CONTENT_HASH_MISMATCH');
      }
    } catch (error) {
      reasons.push('IPFS_FETCH_FAILED');
    }
  }

  return {
    ipfsUrl,
    ipfsAvailable,
    contentHashMatches,
    computedHash,
    tamperDetected: reasons.length > 0,
    reasons
  };
};

const buildTamperRecipients = async (caseData, actorUserId) => {
  const recipientIds = new Set();

  if (caseData?.registeredBy) recipientIds.add(caseData.registeredBy.toString());
  if (caseData?.assignedForensic) recipientIds.add(caseData.assignedForensic.toString());
  if (caseData?.assignedJudge) recipientIds.add(caseData.assignedJudge.toString());

  const admins = await User.find({ role: 'ADMIN' }).select('_id email role username');
  const caseUsers = recipientIds.size
    ? await User.find({ _id: { $in: Array.from(recipientIds) } }).select('_id email role username')
    : [];

  const combined = [...admins, ...caseUsers];
  const uniqueById = new Map();

  combined.forEach((user) => {
    uniqueById.set(user._id.toString(), user);
  });

  if (actorUserId) {
    uniqueById.delete(actorUserId.toString());
  }

  return Array.from(uniqueById.values());
};

const sendTamperAlerts = async ({
  caseData,
  evidence,
  actorUserId,
  actorRole,
  reasons,
  ipfsUrl
}) => {
  const recipients = await buildTamperRecipients(caseData, actorUserId);
  if (!recipients.length) {
    return;
  }

  const payload = {
    caseId: caseData?.caseId || caseData?._id?.toString() || 'UNKNOWN',
    evidenceId: evidence?.evidenceId || evidence?._id?.toString() || 'UNKNOWN',
    title: evidence?.title || 'Evidence',
    detectedAt: new Date().toISOString(),
    reason: reasons.join(', '),
    dashboardUrl: process.env.APP_DASHBOARD_URL || 'http://localhost:5173/login',
    ipfsUrl
  };

  await Promise.all(
    recipients
      .filter((user) => user?.email)
      .map((user) => sendTamperAlertEmail(user.email, payload))
  );

  if (actorUserId && actorRole) {
    await logActivity(
      actorUserId,
      actorRole,
      'TAMPER_DETECTED',
      caseData?._id,
      evidence?.evidenceId,
      'Evidence integrity mismatch detected',
      { reasons: payload.reason, ipfsUrl }
    );
  }
};

const markTamperDetected = async (evidence, actorUser, reasons) => {
  const now = new Date();
  const shouldAlert = !evidence.tamperAlertedAt;

  evidence.tamperDetectedAt = now;
  evidence.tamperReason = reasons.join(', ');

  if (shouldAlert) {
    evidence.tamperAlertedAt = now;
    evidence.chainOfCustody.push({
      action: 'TAMPER_DETECTED',
      performedBy: actorUser?._id || evidence.uploadedBy,
      performedByRole: actorUser?.role || 'SYSTEM',
      timestamp: now,
      details: 'Evidence integrity mismatch detected',
      hash: evidence.sha256Hash
    });
  }

  await evidence.save();
  return shouldAlert;
};

// Upload evidence (Police)
export const uploadEvidence = async (req, res) => {
  try {
    const { caseId, title, description, evidenceType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Verify user and role
    const user = await User.findById(userId);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'POLICE') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Only police can upload evidence' });
    }

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!description || !description.trim()) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Description is required' });
    }

    // Generate Evidence ID
    const evidenceId = `EVID_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Generate SHA-256 hash from file content
    const fileContent = fs.readFileSync(file.path);
    const sha256Hash = generateSHA256(fileContent);

    const pinataResult = await uploadToPinata(
      file.path,
      file.filename,
      {
        caseId: caseId,
        uploadedBy: user.username,
        evidenceType: evidenceType,
        timestamp: new Date().toISOString()
      }
    );

    if (!pinataResult.success || !pinataResult.ipfsHash || !pinataResult.pinataUrl) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        message: 'Failed to upload to IPFS',
        error: pinataResult.message || 'Pinata upload failed'
      });
    }

    // Create evidence record
    const evidence = new Evidence({
      evidenceId,
      caseId,
      type: evidenceType || 'OTHER',
      title: title || file.originalname || 'Untitled Evidence',
      description: description.trim(),
      uploadedBy: userId,
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      ipfsHash: pinataResult.ipfsHash,
      pinataUrl: pinataResult.pinataUrl,
      pinataIpfsGatewayUrl: pinataResult.pinataIpfsGatewayUrl || null,
      sha256Hash,
      status: 'UPLOADED',
      chainOfCustody: [{
        action: 'UPLOADED',
        performedBy: userId,
        performedByRole: user.role,
        timestamp: new Date(),
        details: `Evidence uploaded by ${user.username}`,
        hash: sha256Hash
      }]
    });

    await evidence.save();

    // Add evidence to case
    caseData.evidence.push(evidence._id);
    await caseData.save();

    // Clean up local file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await logActivity(userId, user.role, 'EVIDENCE_UPLOADED', caseData._id, evidenceId, title);

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: {
        _id: evidence._id,
        evidenceId: evidence.evidenceId,
        ipfsHash: evidence.ipfsHash,
        sha256Hash: evidence.sha256Hash,
        pinataUrl: evidence.pinataUrl
      }
    });

  } catch (error) {
    console.error('Evidence upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload evidence', error: error.message });
  }
};

// Get evidence by case
export const getEvidenceByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const evidences = await Evidence.find({ caseId })
      .populate('uploadedBy', 'username role email')
      .populate('analyzedBy', 'username role email')
      .populate('chainOfCustody.performedBy', 'username role')
      .sort({ uploadedAt: -1 });

    res.json({ evidences });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ message: 'Failed to fetch evidence', error: error.message });
  }
};

// Get all evidence (Admin only)
export const getAllEvidence = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const evidences = await Evidence.find()
      .populate('uploadedBy', 'username role email')
      .populate('analyzedBy', 'username role email')
      .sort({ uploadedAt: -1 });

    res.json({ evidences });
  } catch (error) {
    console.error('Error fetching all evidence:', error);
    res.status(500).json({ message: 'Failed to fetch evidence', error: error.message });
  }
};

// Get evidence by ID
export const getEvidenceById = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findById(evidenceId)
      .populate('uploadedBy', 'username role email')
      .populate('analyzedBy', 'username role email')
      .populate('verifiedBy', 'username role')
      .populate('lockedBy', 'username role')
      .populate('chainOfCustody.performedBy', 'username role email');

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    res.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ message: 'Failed to fetch evidence', error: error.message });
  }
};

// Update evidence blockchain info (Police/Admin)
export const updateEvidenceBlockchainInfo = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { blockchainTxHash, blockchainHash, smartContractAddress } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'POLICE' && user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Only police or admin can update blockchain info' });
    }

    const evidence = await Evidence.findByIdAndUpdate(
      evidenceId,
      {
        blockchainTxHash: blockchainTxHash || null,
        blockchainHash: blockchainHash || null,
        smartContractAddress: smartContractAddress || null
      },
      { new: true }
    );

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    res.json({ message: 'Blockchain info updated', evidence });
  } catch (error) {
    console.error('Error updating evidence blockchain info:', error);
    res.status(500).json({ message: 'Failed to update blockchain info', error: error.message });
  }
};

// Submit analysis (Forensic)
export const submitAnalysis = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { analysisReport, analysisNotes } = req.body;
    const userId = req.user.userId;

    // Verify user is FORENSIC
    const user = await User.findById(userId);
    if (user.role !== 'FORENSIC') {
      return res.status(403).json({ message: 'Only forensic department can submit analysis' });
    }

    evidence.status = 'ANALYSIS_COMPLETE';
    evidence.analysisStatus = 'COMPLETE';
    evidence.analyzedBy = userId;
    evidence.analysisReport = analysisReport;
    evidence.analysisNotes = analysisNotes;
    evidence.analyzedAt = new Date();

    // Add to chain of custody
    evidence.chainOfCustody.push({
      action: 'ANALYZED',
      performedBy: userId,
      performedByRole: user.role,
      timestamp: new Date(),
      details: `Analysis submitted by ${user.username}`,
      hash: evidence.sha256Hash
    });

    await evidence.save();

    await logActivity(userId, user.role, 'EVIDENCE_ANALYZED', evidence.caseId, evidenceId, title);

    res.json({
      message: 'Analysis submitted successfully',
      evidence: evidence
    });

  } catch (error) {
    console.error('Analysis submission error:', error);
    res.status(500).json({ message: 'Failed to submit analysis', error: error.message });
  }
};

// Mark evidence as immutable (Judge)
export const markImmutable = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userId = req.user.userId;

    // Verify user is JUDGE
    const user = await User.findById(userId);
    if (user.role !== 'JUDGE') {
      return res.status(403).json({ message: 'Only judge can mark evidence as immutable' });
    }

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // Verify immutability on blockchain/IPFS
    const verificationResult = await verifyEvidenceImmutability(evidence.ipfsHash);

    if (!verificationResult.verified) {
      return res.status(400).json({ 
        message: 'Could not verify evidence immutability',
        details: verificationResult.message 
      });
    }

    evidence.isVerified = true;
    evidence.status = 'VERIFIED';
    evidence.verifiedAt = new Date();
    evidence.verifiedBy = userId;
    evidence.chainOfCustody.push({
      action: 'VERIFIED',
      performedBy: userId,
      performedByRole: user.role,
      timestamp: new Date(),
      details: `Evidence verified and marked immutable by ${user.username} during hearing`,
      hash: evidence.sha256Hash
    });

    await evidence.save();

    await logActivity(userId, user.role, 'EVIDENCE_VERIFIED', evidence.caseId, evidenceId, 'Evidence verified and marked immutable');

    res.json({
      message: 'Evidence marked as immutable',
      evidence: {
        _id: evidence._id,
        evidenceId: evidence.evidenceId,
        isVerified: evidence.isVerified,
        sha256Hash: evidence.sha256Hash,
        ipfsHash: evidence.ipfsHash,
        accessibleAt: verificationResult.accessibleAt
      }
    });

  } catch (error) {
    console.error('Immutable marking error:', error);
    res.status(500).json({ message: 'Failed to mark evidence as immutable', error: error.message });
  }
};

// Get evidence chain of custody
export const getEvidenceChain = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findById(evidenceId)
      .populate('chainOfCustody.performedBy', 'username role email');
    
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    res.json({
      evidenceId: evidence.evidenceId,
      title: evidence.title,
      sha256Hash: evidence.sha256Hash,
      ipfsHash: evidence.ipfsHash,
      blockchainHash: evidence.blockchainHash,
      isVerified: evidence.isVerified,
      isLocked: evidence.isLocked,
      chainOfCustody: evidence.chainOfCustody
    });

  } catch (error) {
    console.error('Error fetching evidence chain:', error);
    res.status(500).json({ message: 'Failed to fetch evidence chain', error: error.message });
  }
};

// Verify evidence integrity (silent alerts on mismatch)
export const verifyEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const evidence = await Evidence.findById(evidenceId);

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    const caseData = await Case.findById(evidence.caseId);
    const integrity = await checkEvidenceIntegrity(evidence);

    if (integrity.tamperDetected) {
      const shouldAlert = await markTamperDetected(evidence, user, integrity.reasons);
      if (shouldAlert) {
        await sendTamperAlerts({
          caseData,
          evidence,
          actorUserId: user?._id,
          actorRole: user?.role,
          reasons: integrity.reasons,
          ipfsUrl: integrity.ipfsUrl
        });
      }
    } else {
      evidence.ipfsVerified = true;
      evidence.ipfsVerifiedAt = new Date();
      evidence.chainOfCustody.push({
        action: 'VERIFIED',
        performedBy: userId,
        performedByRole: user.role,
        timestamp: new Date(),
        details: `Evidence verified on IPFS by ${user.username}`,
        hash: evidence.sha256Hash
      });
      await evidence.save();

      await logActivity(userId, user.role, 'EVIDENCE_VERIFIED', evidence.caseId, evidenceId, 'Integrity verification');
    }

    res.json({
      checked: true,
      message: 'Verification completed'
    });
  } catch (error) {
    console.error('Error verifying evidence:', error);
    res.status(500).json({ message: 'Failed to verify evidence', error: error.message });
  }
};

// Lock evidence (After sending to forensic)
export const lockEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const evidence = await Evidence.findById(evidenceId);

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    if (evidence.isLocked) {
      return res.status(400).json({ message: 'Evidence is already locked' });
    }

    evidence.isLocked = true;
    evidence.lockedAt = new Date();
    evidence.lockedBy = userId;
    evidence.status = 'IMMUTABLE';
    evidence.chainOfCustody.push({
      action: 'LOCKED',
      performedBy: userId,
      performedByRole: user.role,
      timestamp: new Date(),
      details: `Evidence locked by ${user.username}. Evidence is now READ-ONLY`,
      hash: evidence.sha256Hash
    });

    await evidence.save();

    await logActivity(userId, user.role, 'EVIDENCE_LOCKED', evidence.caseId, evidenceId, 'Evidence locked for immutability');

    res.json({
      message: 'Evidence locked successfully',
      evidence: {
        _id: evidence._id,
        evidenceId: evidence.evidenceId,
        isLocked: evidence.isLocked,
        lockedAt: evidence.lockedAt,
        status: evidence.status
      }
    });
  } catch (error) {
    console.error('Error locking evidence:', error);
    res.status(500).json({ message: 'Failed to lock evidence', error: error.message });
  }
};

// Get evidence hashes
export const getEvidenceHashes = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    res.json({
      evidenceId: evidence.evidenceId,
      title: evidence.title,
      sha256Hash: evidence.sha256Hash,
      ipfsHash: evidence.ipfsHash,
      ipfsUrl: evidence.pinataUrl,
      blockchainHash: evidence.blockchainHash,
      blockchainTxHash: evidence.blockchainTxHash
    });
  } catch (error) {
    console.error('Error fetching hashes:', error);
    res.status(500).json({ message: 'Failed to fetch hashes', error: error.message });
  }
};

export const runEvidenceIntegritySweep = async () => {
  try {
    const limit = Number(process.env.EVIDENCE_MONITOR_LIMIT || 50);
    const evidences = await Evidence.find({ ipfsHash: { $ne: null } })
      .sort({ uploadedAt: -1 })
      .limit(limit);

    for (const evidence of evidences) {
      if (evidence.tamperAlertedAt) {
        continue;
      }

      const integrity = await checkEvidenceIntegrity(evidence);
      if (!integrity.tamperDetected) {
        continue;
      }

      const caseData = await Case.findById(evidence.caseId);
      const lastEntry = evidence.chainOfCustody?.[evidence.chainOfCustody.length - 1];
      const actorUserId = lastEntry?.performedBy || evidence.uploadedBy;
      const actorUser = actorUserId ? await User.findById(actorUserId) : null;

      const shouldAlert = await markTamperDetected(evidence, actorUser, integrity.reasons);
      if (shouldAlert) {
        await sendTamperAlerts({
          caseData,
          evidence,
          actorUserId: actorUser?._id,
          actorRole: actorUser?.role,
          reasons: integrity.reasons,
          ipfsUrl: integrity.ipfsUrl
        });
      }
    }
  } catch (error) {
    console.error('Evidence integrity sweep failed:', error);
  }
};

export default {
  uploadEvidence,
  getEvidenceByCase,
  getEvidenceById,
  submitAnalysis,
  markImmutable,
  getEvidenceChain,
  verifyEvidence,
  lockEvidence,
  getEvidenceHashes,
  runEvidenceIntegritySweep
};
