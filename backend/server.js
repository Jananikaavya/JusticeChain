// MUST be first line
import './config/env.js';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';

import { authenticateToken } from './middleware/authMiddleware.js';
import { testEmailConfig } from './utils/emailService.js';
import { testPinataConnection } from './utils/pinataService.js';
import { runEvidenceIntegritySweep } from './routes/evidenceController.js';

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- Middleware -------------------- */
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

/* -------------------- MongoDB -------------------- */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/* -------------------- Health -------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "JusticeChain Backend",
    time: new Date()
  });
});

/* -------------------- Routes -------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/evidence', authenticateToken, evidenceRoutes);

/* -------------------- Boot -------------------- */
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log(`🚀 Justice Chain running on http://localhost:${PORT}`);

    await connectDB();

    const emailOK = await testEmailConfig();
    if (emailOK) console.log('✅ Email service verified');
    else console.warn('⚠️ Email service failed');

    const pinataOK = await testPinataConnection();
    if (pinataOK) console.log('✅ Pinata connected');
    else console.warn('⚠️ Pinata not connected');

    const intervalMs = Number(process.env.EVIDENCE_MONITOR_INTERVAL_MS || 300000);
    setInterval(runEvidenceIntegritySweep, intervalMs);
  });
};

startServer();

