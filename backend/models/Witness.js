import mongoose from 'mongoose';

const witnessSchema = new mongoose.Schema({
  witnessId: {
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
  name: {
    type: String,
    required: true
  },
  age: Number,
  gender: String,
  address: String,
  phone: String,
  email: String,
  idType: String,
  idNumber: String,
  statement: {
    type: String,
    required: true
  },
  statementHash: {
    type: String,
    default: null
  },
  statementIpfsHash: {
    type: String,
    default: null
  },
  documentUrl: String,
  documentIpfsHash: String,
  statementDate: {
    type: Date,
    default: Date.now
  },
  reliability: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

export default mongoose.model('Witness', witnessSchema);
