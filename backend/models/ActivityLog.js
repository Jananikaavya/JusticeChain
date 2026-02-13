import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByRole: String,
  action: {
    type: String,
    enum: [
      'CASE_CREATED',
      'CASE_DRAFTED',
      'CASE_SUBMITTED',
      'CASE_APPROVED',
      'EVIDENCE_UPLOADED',
      'EVIDENCE_VERIFIED',
      'EVIDENCE_LOCKED',
      'NOTE_ADDED',
      'SUSPECT_ADDED',
      'WITNESS_ADDED',
      'TRANSFER_REQUESTED',
      'FORENSIC_REQUESTED',
      'HEARING_REQUESTED'
    ],
    required: true
  },
  relatedCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  relatedResourceId: String, // Evidence ID, Note ID, etc
  description: String,
  metadata: {},
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('ActivityLog', activityLogSchema);
