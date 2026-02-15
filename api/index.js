import '../backend/config/env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../backend/routes/authRoutes.js';
import caseRoutes from '../backend/routes/caseRoutes.js';
import evidenceRoutes from '../backend/routes/evidenceRoutes.js';
import { authenticateToken } from '../backend/middleware/authMiddleware.js';

const app = express();

const parseOrigins = (value) =>
  (value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN || process.env.FRONTEND_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'JusticeChain Backend',
    time: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/evidence', authenticateToken, evidenceRoutes);

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    throw error;
  }
};

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
