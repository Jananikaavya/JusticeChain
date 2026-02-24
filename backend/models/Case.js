import mongoose from 'mongoose';

const caseTimelineSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
}, { _id: false });

const transferRequestSchema = new mongoose.Schema({
  requestedAt: { type: Date, default: Date.now },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromStation: String,
  toStation: String,
  reason: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, { _id: false });

const hearingSchema = new mongoose.Schema({
  scheduledFor: { type: Date, required: true },
  time: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

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
    enum: ['DRAFT', 'REGISTERED', 'PENDING_APPROVAL', 'APPROVED', 'IN_FORENSIC_ANALYSIS', 'ANALYSIS_COMPLETE', 'HEARING', 'CLOSED'],
    default: 'REGISTERED'
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  policeStation: String,
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
  investigationNotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestigationNote'
  }],
  suspects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suspect'
  }],
  witnesses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Witness'
  }],
  timeline: {
    type: [caseTimelineSchema],
    default: []
  },
  transferRequest: transferRequestSchema,
  hearingHistory: [hearingSchema],
  verdictDecision: {
    type: String,
    default: null
  },
  verdictSummary: {
    type: String,
    default: null
  },
  verdictHtml: {
    type: String,
    default: null
  },
  verdictBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verdictAt: {
    type: Date,
    default: null
  },
  smartContractAddress: {
    type: String,
    default: null
  },
  blockchainHash: {
    type: String,
    default: null
  },
  blockchainCaseId: {
    type: Number,
    default: null
  },
  blockchainCaseTxHash: {
    type: String,
    default: null
  },
  blockchainApprovalTxHash: {
    type: String,
    default: null
  },
  policeIdentityHash: {
    type: String,
    default: null
  },
  caseDescription: {
    type: String
  },
  location: {
    type: String
  },
  latitude: Number,
  longitude: Number,
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
