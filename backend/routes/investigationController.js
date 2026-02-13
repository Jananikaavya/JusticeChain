import InvestigationNote from '../models/InvestigationNote.js';
import Suspect from '../models/Suspect.js';
import Witness from '../models/Witness.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import crypto from 'crypto';

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

// Generate hash for data
const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// ===== INVESTIGATION NOTES =====
export const addInvestigationNote = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, content, tags, isConfidential } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const noteId = `NOTE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const noteHash = generateHash({ title, content, userId, timestamp: new Date() });

    const note = await InvestigationNote.create({
      noteId,
      caseId,
      createdBy: userId,
      title,
      content,
      tags: tags || [],
      isConfidential: isConfidential || false,
      noteHash
    });

    caseData.investigationNotes.push(note._id);
    await caseData.save();

    await logActivity(userId, user.role, 'INVESTIGATION_NOTE_ADDED', caseData._id, noteId, title);

    res.status(201).json({
      message: 'Investigation note added',
      note
    });
  } catch (error) {
    console.error('Error adding investigation note:', error);
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
};

export const getInvestigationNotes = async (req, res) => {
  try {
    const { caseId } = req.params;

    const notes = await InvestigationNote.find({ caseId })
      .populate('createdBy', 'username role email')
      .sort({ createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

export const updateInvestigationNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const note = await InvestigationNote.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own notes' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.tags = tags || note.tags;
    note.noteHash = generateHash({ title: note.title, content: note.content, userId, timestamp: new Date() });
    note.updatedAt = new Date();

    await note.save();

    await logActivity(userId, user.role, 'INVESTIGATION_NOTE_UPDATED', note.caseId, noteId, title);

    res.json({ message: 'Note updated', note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

// ===== SUSPECTS =====
export const addSuspect = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { name, age, gender, address, phone, email, idType, idNumber, status, description, motiveDetails, priorCriminalHistory } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const suspectId = `SUSPECT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const suspectHash = generateHash({ name, age, idNumber, userId, timestamp: new Date() });

    const suspect = await Suspect.create({
      suspectId,
      caseId,
      name,
      age,
      gender,
      address,
      phone,
      email,
      idType,
      idNumber,
      status: status || 'UNDER_WATCH',
      description,
      motiveDetails,
      priorCriminalHistory: priorCriminalHistory || [],
      addedBy: userId,
      suspectHash
    });

    caseData.suspects.push(suspect._id);
    await caseData.save();

    await logActivity(userId, user.role, 'SUSPECT_ADDED', caseData._id, suspectId, `Suspect: ${name}`);

    res.status(201).json({
      message: 'Suspect added',
      suspect
    });
  } catch (error) {
    console.error('Error adding suspect:', error);
    res.status(500).json({ message: 'Failed to add suspect', error: error.message });
  }
};

export const getSuspects = async (req, res) => {
  try {
    const { caseId } = req.params;

    const suspects = await Suspect.find({ caseId })
      .populate('addedBy', 'username role')
      .sort({ createdAt: -1 });

    res.json({ suspects });
  } catch (error) {
    console.error('Error fetching suspects:', error);
    res.status(500).json({ message: 'Failed to fetch suspects', error: error.message });
  }
};

export const updateSuspectStatus = async (req, res) => {
  try {
    const { suspectId } = req.params;
    const { status, arrestDate, releaseDate } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const suspect = await Suspect.findByIdAndUpdate(
      suspectId,
      {
        status,
        arrestDate: status === 'ARRESTED' ? arrestDate || new Date() : null,
        releaseDate: status === 'RELEASED' ? releaseDate : null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!suspect) {
      return res.status(404).json({ message: 'Suspect not found' });
    }

    await logActivity(userId, user.role, 'SUSPECT_STATUS_UPDATED', suspect.caseId, suspectId, `Status: ${status}`);

    res.json({ message: 'Suspect status updated', suspect });
  } catch (error) {
    console.error('Error updating suspect:', error);
    res.status(500).json({ message: 'Failed to update suspect', error: error.message });
  }
};

// ===== WITNESSES =====
export const addWitness = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { name, age, gender, address, phone, email, idType, idNumber, statement, reliability, documentUrl } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const witnessId = `WITNESS_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const statementHash = generateHash({ statement, userId, timestamp: new Date() });

    const witness = await Witness.create({
      witnessId,
      caseId,
      name,
      age,
      gender,
      address,
      phone,
      email,
      idType,
      idNumber,
      statement,
      statementHash,
      reliability: reliability || 'MEDIUM',
      documentUrl,
      addedBy: userId,
      statementDate: new Date()
    });

    caseData.witnesses.push(witness._id);
    await caseData.save();

    await logActivity(userId, user.role, 'WITNESS_ADDED', caseData._id, witnessId, `Witness: ${name}`);

    res.status(201).json({
      message: 'Witness added',
      witness
    });
  } catch (error) {
    console.error('Error adding witness:', error);
    res.status(500).json({ message: 'Failed to add witness', error: error.message });
  }
};

export const getWitnesses = async (req, res) => {
  try {
    const { caseId } = req.params;

    const witnesses = await Witness.find({ caseId })
      .populate('addedBy', 'username role')
      .sort({ createdAt: -1 });

    res.json({ witnesses });
  } catch (error) {
    console.error('Error fetching witnesses:', error);
    res.status(500).json({ message: 'Failed to fetch witnesses', error: error.message });
  }
};

export const updateWitnessReliability = async (req, res) => {
  try {
    const { witnessId } = req.params;
    const { reliability } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const witness = await Witness.findByIdAndUpdate(
      witnessId,
      { reliability, updatedAt: new Date() },
      { new: true }
    );

    if (!witness) {
      return res.status(404).json({ message: 'Witness not found' });
    }

    await logActivity(userId, user.role, 'WITNESS_RELIABILITY_UPDATED', witness.caseId, witnessId, `Reliability: ${reliability}`);

    res.json({ message: 'Witness reliability updated', witness });
  } catch (error) {
    console.error('Error updating witness:', error);
    res.status(500).json({ message: 'Failed to update witness', error: error.message });
  }
};

// ===== ACTIVITY LOGS =====
export const getActivityLogs = async (req, res) => {
  try {
    const { caseId } = req.params;

    const logs = await ActivityLog.find({ relatedCaseId: caseId })
      .populate('performedBy', 'username email')
      .sort({ timestamp: -1 });

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
};

export const getUserActivityLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    const logs = await ActivityLog.find({ performedBy: userId })
      .populate('relatedCaseId', 'caseId title')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
};
