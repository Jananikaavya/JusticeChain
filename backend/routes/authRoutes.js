import express from 'express';
import {
  register,
  login,
  getAllUsers,
  approveUser,
  checkVerification,
  getMe
} from '../routes/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user/me', getMe);

// Admin
router.get('/users', getAllUsers);
router.post('/approve-user', approveUser);

// User
router.post('/check-verification', checkVerification);

export default router;
