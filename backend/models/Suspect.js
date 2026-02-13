import mongoose from 'mongoose';

const suspectSchema = new mongoose.Schema({
  suspectId: {
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
  idType: String, // Aadhar, PAN, etc
  idNumber: String,
  status: {
    type: String,
    enum: ['UNDER_WATCH', 'ARRESTED', 'RELEASED', 'CONVICTED'],
    default: 'UNDER_WATCH'
  },
  arrestDate: Date,
  releaseDate: Date,
  photo: String,
  photoIpfsHash: String,
  description: String,
  motiveDetails: String,
  priorCriminalHistory: [String],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  suspectHash: {
    type: String,
    default: null
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

export default mongoose.model('Suspect', suspectSchema);
