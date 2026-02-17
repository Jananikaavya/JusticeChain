import express from 'express';
import {
  register,
  login,
  getAllUsers,
  approveUser,
  checkVerification
} from '../routes/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Admin
router.get('/users', getAllUsers);
router.post('/approve-user', approveUser);

// User
router.post('/check-verification', checkVerification);

export default router;
