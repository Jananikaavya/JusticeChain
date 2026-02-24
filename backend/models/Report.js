import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['MANUAL', 'UPLOADED'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // For manual reports
  observations: String,
  analysis: String,
  conclusion: String,
  findings: [String],
  recommendations: [String],
  
  // For uploaded reports
  fileName: String,
  fileSize: Number,
  mimeType: String,
  ipfsHash: String,
  pinataUrl: String,
  sha256Hash: String,
  blockchainTxHash: String,
  
  // Report metadata
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  tags: [String],
  attachments: [{
    name: String,
    ipfsHash: String,
    pinataUrl: String,
    mimeType: String
  }],
  
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: String,
  reviewedAt: Date,
  
  // Evidence reference
  relatedEvidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date
}, { timestamps: true });

// Index for queries
reportSchema.index({ caseId: 1, createdBy: 1 });
reportSchema.index({ caseId: 1, status: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', reportSchema);
