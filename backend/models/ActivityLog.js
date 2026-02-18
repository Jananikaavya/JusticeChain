import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    unique: true,
    sparse: true,
    default: () => new Date().getTime().toString()
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
      'TAMPER_DETECTED',
      'NOTE_ADDED',
      'SUSPECT_ADDED',
      'WITNESS_ADDED',
      'TRANSFER_REQUESTED',
      'FORENSIC_REQUESTED',
      'HEARING_REQUESTED',
      'APPROVE_USER',
      'SUSPEND_USER',
      'UNSUSPEND_USER',
      'LOGIN',
      'LOGOUT'
    ],
    required: true
  },
  relatedCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  relatedResourceId: String,
  description: String,
  details: String,
  metadata: {},
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('ActivityLog', activityLogSchema);
