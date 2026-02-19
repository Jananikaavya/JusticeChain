import express from 'express';
import {
  register,
  login,
  getAllUsers,
  approveUser,
  checkVerification,
  getMe,
  logout,
  getActiveSessions
} from '../routes/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/user/me', getMe);

// Admin
router.get('/users', getAllUsers);
router.post('/approve-user', approveUser);
router.get('/active-sessions', authenticateToken, getActiveSessions); // 📊 Get active user sessions for admin monitoring

// User
router.post('/check-verification', checkVerification);

export default router;
