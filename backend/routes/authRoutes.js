import express from 'express';
import { register, login, getUserById, getAllUsers, registerUserOnBlockchain, verifyRoleOnchain } from './authController.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/user/:id', getUserById);
router.get('/users', getAllUsers);
router.post('/register-on-blockchain', registerUserOnBlockchain);
router.post('/verify-role-onchain', verifyRoleOnchain);

export default router;
