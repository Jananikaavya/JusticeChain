import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['POLICE', 'FORENSIC', 'JUDGE', 'ADMIN'],
    required: true
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logoutAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
});

// Auto-expire sessions after 24 hours of inactivity
userSessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('UserSession', userSessionSchema);
