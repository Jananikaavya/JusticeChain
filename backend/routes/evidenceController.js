import Evidence from '../models/Evidence.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { uploadToPinata, verifyEvidenceImmutability } from '../utils/pinataService.js';
import crypto from 'crypto';
import fs from 'fs';

// Helper to log activity
const logActivity = async (userId, userRole, action, caseId, resourceId = null, description = null) => {
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

// Upload evidence (Police)
export const uploadEvidence = async (req, res) => {
  try {
    const { caseId, title, description, evidenceType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Verify user is POLICE
    const user = await User.findById(userId);
    if (user.role !== 'POLICE') {
      return res.status(403).json({ message: 'Only police can upload evidence' });
    }

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Upload to Pinata/IPFS
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

    if (!pinataResult.success) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        message: 'Failed to upload to IPFS', 
        error: pinataResult.message 
      });
    }

    // Generate Evidence ID
    const evidenceId = `EVID_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Generate SHA-256 hash from file content
    const fileContent = fs.readFileSync(file.path);
    const sha256Hash = generateSHA256(fileContent);

    // Create evidence record
    const evidence = new Evidence({
      evidenceId,
      caseId,
      type: evidenceType || 'OTHER',
      title,
      description,
      uploadedBy: userId,
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      ipfsHash: pinataResult.ipfsHash,
      pinataUrl: pinataResult.pinataUrl,
      pinataIpfsGatewayUrl: pinataResult.pinataIpfsGatewayUrl,
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
    fs.unlinkSync(file.path);

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

// Verify evidence (Check IPFS availability)
export const verifyEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const evidence = await Evidence.findById(evidenceId);

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // Verify on IPFS
    const verificationResult = await verifyEvidenceImmutability(evidence.ipfsHash);

    if (verificationResult.verified) {
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

      await logActivity(userId, user.role, 'EVIDENCE_VERIFIED', evidence.caseId, evidenceId, 'IPFS verification');
    }

    res.json({
      verified: verificationResult.verified,
      ipfsHash: evidence.ipfsHash,
      sha256Hash: evidence.sha256Hash,
      blockchainHash: evidence.blockchainHash,
      message: verificationResult.verified ? 'Evidence verified on IPFS' : 'Verification failed'
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

export default { uploadEvidence, getEvidenceByCase, getEvidenceById, submitAnalysis, markImmutable, getEvidenceChain, verifyEvidence, lockEvidence, getEvidenceHashes };
