import './config/env.js';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { authenticateToken } from './middleware/authMiddleware.js';

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
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: '🔗 Justice Chain Backend is running',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cases: '/api/cases',
      evidence: '/api/evidence',
      admin: '/api/admin'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'JusticeChain Backend',
    time: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/evidence', authenticateToken, evidenceRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// 404 Handler - Must be last
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.path} is not defined`,
    availableEndpoints: {
      root: '/',
      health: '/health',
      auth: '/api/auth/register, /api/auth/login',
      cases: '/api/cases',
      evidence: '/api/evidence',
      admin: '/api/admin/users, /api/admin/audit-logs'
    }
  });
});

export { app, connectDB };
