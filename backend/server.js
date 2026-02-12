import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import { testEmailConfig } from './utils/emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/justice-chain';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test email config
const testEmail = async () => {
  const isValid = await testEmailConfig();
  if (!isValid) {
    console.warn('⚠️ Email configuration may not be properly set up. Check your .env file.');
  }
};

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Justice Chain Backend running on http://localhost:${PORT}`);
  await connectDB();
  await testEmail();
});
