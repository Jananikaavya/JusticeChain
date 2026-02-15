import mongoose from 'mongoose';

const chainOfCustodySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['UPLOADED', 'ACCESSED', 'VERIFIED', 'LOCKED', 'TRANSFERRED', 'TAMPER_DETECTED']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByRole: String,
  timestamp: { type: Date, default: Date.now },
  details: String,
  hash: String
}, { _id: false });

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
  sha256Hash: {
    type: String,
    default: null
  },
  blockchainTxHash: {
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
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: mongoose.Schema.Types.ObjectId,
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: mongoose.Schema.Types.ObjectId,
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
  chainOfCustody: [chainOfCustodySchema],
  geoLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  ipfsVerified: {
    type: Boolean,
    default: false
  },
  ipfsVerifiedAt: Date,
  tamperDetectedAt: {
    type: Date,
    default: null
  },
  tamperAlertedAt: {
    type: Date,
    default: null
  },
  tamperReason: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Evidence', evidenceSchema);
