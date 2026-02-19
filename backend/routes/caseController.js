import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Create activity log helper
const logActivity = async (userId, userRole, action, caseId, resourceId = null, description = null, metadata = null) => {
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

// Create a new case (Police Only)
export const createCase = async (req, res) => {
  try {
    const { title, description, caseNumber, location, priority, policeStation, isDraft, latitude, longitude, blockchainCaseId, blockchainCaseTxHash } = req.body;
    const userId = req.user.userId;

    // Verify user is POLICE
    const user = await User.findById(userId);
    if (user.role !== 'POLICE') {
      return res.status(403).json({ message: 'Only police can register cases' });
    }

    // Generate unique Case ID
    const caseId = `CASE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newCase = new Case({
      caseId,
      title,
      description,
      caseNumber,
      location,
      latitude,
      longitude,
      priority: priority || 'MEDIUM',
      registeredBy: userId,
      policeStation,
      isDraft: isDraft || false,
      blockchainCaseId: Number.isFinite(Number(blockchainCaseId)) ? Number(blockchainCaseId) : null,
      blockchainCaseTxHash: blockchainCaseTxHash || null,
      status: isDraft ? 'DRAFT' : 'REGISTERED',
      timeline: [{
        status: isDraft ? 'DRAFT' : 'REGISTERED',
        timestamp: new Date(),
        performedBy: userId,
        notes: isDraft ? 'Case created in draft mode' : 'Case registered'
      }]
    });

    await newCase.save();

    // Log activity
    await logActivity(userId, user.role, isDraft ? 'CASE_DRAFTED' : 'CASE_CREATED', newCase._id, null, 'New case created');

    res.status(201).json({
      message: 'Case created successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Case creation error:', error);
    res.status(500).json({ message: 'Failed to create case', error: error.message });
  }
};

// Set blockchain info on case (Police only)
export const setCaseBlockchainInfo = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { blockchainCaseId, blockchainCaseTxHash } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'POLICE') {
      return res.status(403).json({ message: 'Only police can update blockchain case info' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseData.registeredBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own cases' });
    }

    caseData.blockchainCaseId = Number.isFinite(Number(blockchainCaseId)) ? Number(blockchainCaseId) : null;
    caseData.blockchainCaseTxHash = blockchainCaseTxHash || null;
    caseData.updatedAt = new Date();

    await caseData.save();

    res.json({ message: 'Blockchain case info updated', case: caseData });
  } catch (error) {
    console.error('Error updating blockchain case info:', error);
    res.status(500).json({ message: 'Failed to update blockchain case info', error: error.message });
  }
};

// Save case as draft
export const saveCaseAsDraft = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, description, caseNumber, location, priority, policeStation } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseData.registeredBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own cases' });
    }

    // Update case
    caseData.title = title;
    caseData.description = description;
    caseData.caseNumber = caseNumber;
    caseData.location = location;
    caseData.priority = priority;
    caseData.policeStation = policeStation;
    caseData.isDraft = true;
    caseData.status = 'DRAFT';
    caseData.updatedAt = new Date();

    await caseData.save();

    await logActivity(userId, user.role, 'CASE_DRAFTED', caseData._id, null, 'Case saved as draft');

    res.json({
      message: 'Case saved as draft',
      case: caseData
    });
  } catch (error) {
    console.error('Error saving case as draft:', error);
    res.status(500).json({ message: 'Failed to save case', error: error.message });
  }
};

// Submit case from draft
export const submitCaseFromDraft = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseData.registeredBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only submit your own cases' });
    }

    caseData.isDraft = false;
    caseData.status = 'REGISTERED';
    caseData.timeline.push({
      status: 'REGISTERED',
      timestamp: new Date(),
      performedBy: userId,
      notes: 'Case submitted from draft'
    });
    caseData.updatedAt = new Date();

    await caseData.save();

    await logActivity(userId, user.role, 'CASE_SUBMITTED', caseData._id, null, 'Case submitted from draft');

    res.json({
      message: 'Case submitted successfully',
      case: caseData
    });
  } catch (error) {
    console.error('Error submitting case:', error);
    res.status(500).json({ message: 'Failed to submit case', error: error.message });
  }
};

// Get case timeline
export const getCaseTimeline = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId).populate('timeline.performedBy', 'username role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json({
      caseId: caseData.caseId,
      timeline: caseData.timeline
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Failed to fetch timeline', error: error.message });
  }
};

// Request case transfer
export const requestCaseTransfer = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { toStation, reason } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseData.registeredBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only request transfer for your own cases' });
    }

    caseData.transferRequest = {
      requestedAt: new Date(),
      requestedBy: userId,
      fromStation: caseData.policeStation,
      toStation,
      reason,
      status: 'PENDING'
    };

    caseData.timeline.push({
      status: 'TRANSFER_REQUESTED',
      timestamp: new Date(),
      performedBy: userId,
      notes: `Transfer requested to ${toStation}`
    });

    await caseData.save();

    await logActivity(userId, user.role, 'TRANSFER_REQUESTED', caseData._id, null, `Transfer requested to ${toStation}`);

    res.json({
      message: 'Transfer request submitted',
      case: caseData
    });
  } catch (error) {
    console.error('Error requesting transfer:', error);
    res.status(500).json({ message: 'Failed to request transfer', error: error.message });
  }
};

// Approve case transfer (Admin only)
export const approveTransferRequest = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can approve transfers' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseData.transferRequest && caseData.transferRequest.status === 'PENDING') {
      caseData.transferRequest.status = 'APPROVED';
      caseData.transferRequest.approvedBy = userId;
      caseData.transferRequest.approvedAt = new Date();
      caseData.policeStation = caseData.transferRequest.toStation;

      caseData.timeline.push({
        status: 'TRANSFER_APPROVED',
        timestamp: new Date(),
        performedBy: userId,
        notes: `Transfer approved to ${caseData.transferRequest.toStation}`
      });

      await caseData.save();

      await logActivity(userId, user.role, 'TRANSFER_APPROVED', caseData._id);

      return res.json({
        message: 'Transfer approved',
        case: caseData
      });
    }

    res.status(400).json({ message: 'No pending transfer request for this case' });
  } catch (error) {
    console.error('Error approving transfer:', error);
    res.status(500).json({ message: 'Failed to approve transfer', error: error.message });
  }
};

// Get all cases
export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('registeredBy', 'username role')
      .populate('assignedForensic', 'username')
      .populate('assignedJudge', 'username')
      .populate('evidence')
      .sort({ createdAt: -1 });

    res.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Failed to fetch cases', error: error.message });
  }
};

// Get cases by role
export const getCasesByRole = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    let query = {};

    if (user.role === 'POLICE') {
      query.registeredBy = userId;
    } else if (user.role === 'FORENSIC') {
      query.assignedForensic = userId;
    } else if (user.role === 'JUDGE') {
      query.assignedJudge = userId;
    } else if (user.role === 'ADMIN') {
      query = {};
    }

    const cases = await Case.find(query)
      .populate('registeredBy', 'username role')
      .populate('assignedForensic', 'username')
      .populate('assignedJudge', 'username')
      .populate('evidence')
      .populate('investigationNotes')
      .populate('suspects')
      .populate('witnesses')
      .sort({ createdAt: -1 });

    res.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Failed to fetch cases', error: error.message });
  }
};

// Get case by ID
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId)
      .populate('registeredBy', 'username role email')
      .populate('assignedForensic', 'username')
      .populate('assignedJudge', 'username')
      .populate('evidence')
      .populate('investigationNotes')
      .populate('suspects')
      .populate('witnesses')
      .populate('timeline.performedBy', 'username role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ message: 'Failed to fetch case', error: error.message });
  }
};

// Update case status
export const updateCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findByIdAndUpdate(
      caseId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('registeredBy', 'username role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Add to timeline
    caseData.timeline.push({
      status,
      timestamp: new Date(),
      performedBy: userId,
      notes: `Status updated to ${status}`
    });

    await caseData.save();

    await logActivity(userId, user.role, 'CASE_STATUS_UPDATED', caseData._id, null, `Status changed to ${status}`);

    res.json({
      message: 'Case status updated',
      case: caseData
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ message: 'Failed to update case', error: error.message });
  }
};

// Assign forensic department
export const assignForensic = async (req, res) => {
  try {
    const { caseId, forensicUserId } = req.body;
    const userId = req.user.userId;

    // Verify user is ADMIN
    const user = await User.findById(userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can assign forensic' });
    }

    const caseData = await Case.findByIdAndUpdate(
      caseId,
      { assignedForensic: forensicUserId, status: 'IN_FORENSIC_ANALYSIS' },
      { new: true }
    ).populate('assignedForensic', 'username');

    // Add to timeline
    caseData.timeline.push({
      status: 'IN_FORENSIC_ANALYSIS',
      timestamp: new Date(),
      performedBy: userId,
      notes: 'Forensic analyst assigned'
    });

    await caseData.save();

    await logActivity(userId, user.role, 'FORENSIC_ASSIGNED', caseData._id);

    res.json({
      message: 'Forensic assigned',
      case: caseData
    });
  } catch (error) {
    console.error('Error assigning forensic:', error);
    res.status(500).json({ message: 'Failed to assign forensic', error: error.message });
  }
};

// Assign judge
export const assignJudge = async (req, res) => {
  try {
    const { caseId, judgeUserId } = req.body;
    const userId = req.user.userId;

    // Verify user is ADMIN
    const user = await User.findById(userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can assign judge' });
    }

    const caseData = await Case.findByIdAndUpdate(
      caseId,
      { assignedJudge: judgeUserId, status: 'HEARING' },
      { new: true }
    ).populate('assignedJudge', 'username');

    // Add to timeline
    caseData.timeline.push({
      status: 'HEARING',
      timestamp: new Date(),
      performedBy: userId,
      notes: 'Judge assigned for hearing'
    });

    await caseData.save();

    await logActivity(userId, user.role, 'JUDGE_ASSIGNED', caseData._id);

    res.json({
      message: 'Judge assigned',
      case: caseData
    });
  } catch (error) {
    console.error('Error assigning judge:', error);
    res.status(500).json({ message: 'Failed to assign judge', error: error.message });
  }
};

// Approve case (Admin only)
export const approveCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;

    // Verify user is ADMIN
    const user = await User.findById(userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can approve cases' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (!caseData.blockchainCaseId) {
      return res.status(400).json({ message: 'Case is not registered on blockchain' });
    }

    const { initBlockchain, approveCaseOnBlockchain } = await import('../utils/blockchainService.js');
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const contractAddress = process.env.SMART_CONTRACT_ADDRESS;

    if (!adminPrivateKey || !contractAddress) {
      return res.status(500).json({ message: 'Blockchain configuration missing' });
    }

    initBlockchain(contractAddress, 'sepolia', adminPrivateKey);
    const chainResult = await approveCaseOnBlockchain(caseData.blockchainCaseId, adminPrivateKey);

    if (!chainResult.success) {
      return res.status(500).json({ message: 'Blockchain approval failed', error: chainResult.error });
    }

    caseData.status = 'APPROVED';
    caseData.approvedBy = userId;
    caseData.blockchainApprovalTxHash = chainResult.transactionHash;
    caseData.timeline.push({
      status: 'APPROVED',
      timestamp: new Date(),
      performedBy: userId,
      notes: 'Case approved by admin'
    });
    caseData.updatedAt = new Date();

    await caseData.save();

    await logActivity(userId, user.role, 'CASE_APPROVED', caseData._id);

    res.json({
      message: 'Case approved',
      case: caseData
    });
  } catch (error) {
    console.error('Error approving case:', error);
    res.status(500).json({ message: 'Failed to approve case', error: error.message });
  }
};

// Submit verdict (Judge only)
export const submitVerdict = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { decision, summary, verdictHtml } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user.role !== 'JUDGE') {
      return res.status(403).json({ message: 'Only judge can submit verdict' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    caseData.verdictDecision = decision;
    caseData.verdictSummary = summary || null;
    caseData.verdictHtml = verdictHtml || null;
    caseData.verdictBy = userId;
    caseData.verdictAt = new Date();
    caseData.status = 'CLOSED';
    caseData.closedAt = new Date();
    caseData.timeline.push({
      status: 'VERDICT_GIVEN',
      timestamp: new Date(),
      performedBy: userId,
      notes: `Verdict: ${decision}`
    });
    caseData.updatedAt = new Date();

    await caseData.save();
    await logActivity(userId, user.role, 'VERDICT_SUBMITTED', caseData._id, null, `Verdict: ${decision}`);

    res.json({
      message: 'Verdict submitted',
      case: caseData
    });
  } catch (error) {
    console.error('Error submitting verdict:', error);
    res.status(500).json({ message: 'Failed to submit verdict', error: error.message });
  }
};

// Schedule hearing (Judge only)
export const scheduleHearing = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { date, time, notes } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user.role !== 'JUDGE') {
      return res.status(403).json({ message: 'Only judge can schedule hearings' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const scheduledFor = date ? new Date(`${date}T${time || '00:00'}`) : null;
    if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: 'Invalid hearing date/time' });
    }

    const hearing = {
      scheduledFor,
      time: time || '',
      notes: notes || '',
      createdBy: userId,
      createdAt: new Date()
    };

    caseData.hearingHistory.push(hearing);
    caseData.updatedAt = new Date();
    caseData.timeline.push({
      status: 'HEARING_SCHEDULED',
      timestamp: new Date(),
      performedBy: userId,
      notes: `Hearing scheduled for ${scheduledFor.toISOString()}`
    });

    await caseData.save();
    await logActivity(userId, user.role, 'HEARING_SCHEDULED', caseData._id, null, `Hearing on ${scheduledFor.toISOString()}`);

    res.status(201).json({
      message: 'Hearing scheduled',
      hearing
    });
  } catch (error) {
    console.error('Error scheduling hearing:', error);
    res.status(500).json({ message: 'Failed to schedule hearing', error: error.message });
  }
};

// Get hearing history
export const getHearings = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId)
      .populate('hearingHistory.createdBy', 'username role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json({ hearings: caseData.hearingHistory || [] });
  } catch (error) {
    console.error('Error fetching hearings:', error);
    res.status(500).json({ message: 'Failed to fetch hearings', error: error.message });
  }
};

export default router;
