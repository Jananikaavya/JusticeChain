import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendRoleIdEmail } from '../utils/emailService.js';
import { initBlockchain, registerRoleOnBlockchain } from '../utils/blockchainService.js';
import dotenv from 'dotenv';

// Build trigger: 2026-02-17T19:40:00Z - Force Vercel rebuild with web3

dotenv.config();

// Generate unique Role ID
const generateRoleId = (role) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const rolePrefix = role.toUpperCase().substring(0, 4);
  return `${rolePrefix}_${timestamp}_${random}`;
};

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, role, wallet } = req.body;

    // Validation
    if (!username || !email || !password || !role || !wallet) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    const normalizedRole = String(role).toUpperCase();
    const allowedRoles = new Set(['POLICE', 'FORENSIC', 'JUDGE']);
    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role selection' });
    }

    // Check if username already exists (email can be reused)
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Role ID
    const roleId = generateRoleId(normalizedRole);

    // Create new user with wallet
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
      roleId,
      wallet
    });

    await newUser.save();

    // Register role on blockchain
    try {
      const contractAddress = process.env.SMART_CONTRACT_ADDRESS;
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
      
      if (!contractAddress || !adminPrivateKey) {
        console.warn('⚠️ Blockchain config missing. Skipping on-chain registration.');
      } else {
        // Initialize blockchain service
        initBlockchain(contractAddress, 'sepolia', adminPrivateKey);
        
        // Register user role on-chain
        const blockchainResult = await registerRoleOnBlockchain(normalizedRole, wallet, adminPrivateKey);
        
        if (blockchainResult.success) {
          console.log(`✅ User ${username} registered on-chain. TX: ${blockchainResult.transactionHash}`);
        } else {
          console.warn(`⚠️ On-chain registration failed for ${username}: ${blockchainResult.error}`);
        }
      }
    } catch (blockchainError) {
      console.error('❌ Blockchain registration error:', blockchainError.message);
      // Don't fail the signup - user is still registered in database
    }

    // Send role ID via email
    await sendRoleIdEmail(email, username, roleId, normalizedRole);

    res.status(201).json({
      message: 'Registration successful! Check your email for Role ID.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        roleId: newUser.roleId,
        wallet: newUser.wallet
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password, wallet } = req.body;

    // Validation
    if (!username || !password || !wallet) {
      return res.status(400).json({ message: 'Username, password, and wallet are required' });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Update wallet address
    user.wallet = wallet;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};
