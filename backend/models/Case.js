import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  caseNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['REGISTERED', 'PENDING_APPROVAL', 'APPROVED', 'IN_FORENSIC_ANALYSIS', 'ANALYSIS_COMPLETE', 'HEARING', 'CLOSED'],
    default: 'REGISTERED'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedForensic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedJudge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  }],
  smartContractAddress: {
    type: String,
    default: null
  },
  blockchainHash: {
    type: String,
    default: null
  },
  caseDescription: {
    type: String
  },
  location: {
    type: String
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Case', caseSchema);
