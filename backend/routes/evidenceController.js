import Evidence from '../models/Evidence.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { uploadToPinata, verifyEvidenceImmutability } from '../utils/pinataService.js';
import fs from 'fs';

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
      evidenceChain: [{
        action: 'UPLOADED',
        performedBy: userId,
        timestamp: new Date(),
        details: `Evidence uploaded by ${user.username}`
      }]
    });

    await evidence.save();

    // Add evidence to case
    caseData.evidence.push(evidence._id);
    await caseData.save();

    // Clean up local file
    fs.unlinkSync(file.path);

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: {
        _id: evidence._id,
        evidenceId: evidence.evidenceId,
        ipfsHash: evidence.ipfsHash,
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
      .populate('uploadedBy', 'username role')
      .populate('analyzedBy', 'username role');

    res.json(evidences);
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
      .populate('analyzedBy', 'username role email');

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

    const evidence = await Evidence.findByIdAndUpdate(
      evidenceId,
      {
        status: 'ANALYSIS_COMPLETE',
        analysisStatus: 'COMPLETE',
        analyzedBy: userId,
        analysisReport,
        analysisNotes,
        analyzedAt: new Date()
      },
      { new: true }
    );

    // Add to evidence chain
    evidence.evidenceChain.push({
      action: 'ANALYSIS_SUBMITTED',
      performedBy: userId,
      timestamp: new Date(),
      details: `Analysis submitted by ${user.username}`
    });

    await evidence.save();

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

    evidence.isImmutable = true;
    evidence.status = 'IMMUTABLE';
    evidence.verifiedAt = new Date();
    evidence.evidenceChain.push({
      action: 'MARKED_IMMUTABLE',
      performedBy: userId,
      timestamp: new Date(),
      details: `Evidence marked immutable by ${user.username} during hearing`
    });

    await evidence.save();

    res.json({
      message: 'Evidence marked as immutable',
      evidence: {
        _id: evidence._id,
        evidenceId: evidence.evidenceId,
        isImmutable: evidence.isImmutable,
        accessibleAt: verificationResult.accessibleAt
      }
    });

  } catch (error) {
    console.error('Immutable marking error:', error);
    res.status(500).json({ message: 'Failed to mark evidence as immutable', error: error.message });
  }
};

// Get evidence chain
export const getEvidenceChain = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    res.json({
      evidenceId: evidence.evidenceId,
      title: evidence.title,
      chain: evidence.evidenceChain,
      isImmutable: evidence.isImmutable
    });

  } catch (error) {
    console.error('Error fetching evidence chain:', error);
    res.status(500).json({ message: 'Failed to fetch evidence chain', error: error.message });
  }
};

export default { uploadEvidence, getEvidenceByCase, getEvidenceById, submitAnalysis, markImmutable, getEvidenceChain };
