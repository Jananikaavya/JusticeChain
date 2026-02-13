import mongoose from 'mongoose';

const investigationNoteSchema = new mongoose.Schema({
  noteId: {
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  noteHash: {
    type: String,
    default: null
  },
  ipfsHash: {
    type: String,
    default: null
  },
  tags: [String],
  isConfidential: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('InvestigationNote', investigationNoteSchema);
