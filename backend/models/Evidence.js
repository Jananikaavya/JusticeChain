import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  type: {
    type: String,
    enum: ['DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'DIGITAL', 'PHYSICAL', 'OTHER'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String
  },
  ipfsHash: {
    type: String,
    required: true
  },
  pinataUrl: {
    type: String,
    required: true
  },
  pinataIpfsGatewayUrl: {
    type: String
  },
  blockchainHash: {
    type: String,
    default: null
  },
  smartContractAddress: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['UPLOADED', 'PENDING_ANALYSIS', 'ANALYZING', 'ANALYSIS_COMPLETE', 'VERIFIED', 'IMMUTABLE'],
    default: 'UPLOADED'
  },
  analysisStatus: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'REJECTED'],
    default: 'PENDING'
  },
  analyzedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  analysisReport: {
    type: String,
    default: null
  },
  analysisNotes: {
    type: String,
    default: null
  },
  analysisIpfsHash: {
    type: String,
    default: null
  },
  evidenceChain: [{
    action: String,
    performedBy: mongoose.Schema.Types.ObjectId,
    timestamp: Date,
    details: String
  }],
  isImmutable: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Evidence', evidenceSchema);
