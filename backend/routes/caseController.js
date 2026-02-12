import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new case (Police Only)
export const createCase = async (req, res) => {
  try {
    const { title, description, caseNumber, location, priority } = req.body;
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
      priority: priority || 'MEDIUM',
      registeredBy: userId,
      status: 'REGISTERED'
    });

    await newCase.save();

    res.status(201).json({
      message: 'Case registered successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Case creation error:', error);
    res.status(500).json({ message: 'Failed to create case', error: error.message });
  }
};

// Get all cases
export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('registeredBy', 'username role')
      .populate('assignedForensic', 'username')
      .populate('assignedJudge', 'username')
      .populate('evidence');

    res.json(cases);
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
      // Admin can see all cases
      query = {};
    }

    const cases = await Case.find(query)
      .populate('registeredBy', 'username role')
      .populate('assignedForensic', 'username')
      .populate('assignedJudge', 'username')
      .populate('evidence');

    res.json(cases);
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
      .populate('evidence');

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

    const caseData = await Case.findByIdAndUpdate(
      caseId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('registeredBy', 'username role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

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

    const caseData = await Case.findByIdAndUpdate(
      caseId,
      { status: 'APPROVED', approvedBy: userId },
      { new: true }
    );

    res.json({
      message: 'Case approved',
      case: caseData
    });
  } catch (error) {
    console.error('Error approving case:', error);
    res.status(500).json({ message: 'Failed to approve case', error: error.message });
  }
};

export default router;
