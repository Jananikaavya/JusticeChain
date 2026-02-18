import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendRoleIdEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

// Generate unique Role ID
const generateRoleId = (role) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const rolePrefix = role.toUpperCase().substring(0, 4);
  return `${rolePrefix}_${timestamp}_${random}`;
};

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { username, email, password, role, wallet } = req.body;

    if (!username || !email || !password || !role || !wallet) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    const normalizedRole = role.toUpperCase();
    const allowedRoles = ['POLICE', 'FORENSIC', 'JUDGE'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = generateRoleId(normalizedRole);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
      roleId,
      wallet,
      isVerified: false   // 🔒 important
    });

    await newUser.save();
    await sendRoleIdEmail(email, username, roleId, normalizedRole);

    res.status(201).json({
      message: 'Registered successfully. Waiting for admin approval.',
      user: {
        id: newUser._id,
        username,
        role: normalizedRole,
        isVerified: false
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { username, password, wallet } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid password' });

    user.wallet = wallet;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        wallet: user.wallet,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ADMIN: GET USERS ================= */
export const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ users });
};

/* ================= ADMIN APPROVE ================= */
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { initBlockchain, registerRoleOnBlockchain } = await import('../utils/blockchainService.js');

    initBlockchain(
      process.env.SMART_CONTRACT_ADDRESS,
      'sepolia',
      process.env.ADMIN_PRIVATE_KEY
    );

    const result = await registerRoleOnBlockchain(
      user.role,
      user.wallet,
      process.env.ADMIN_PRIVATE_KEY
    );

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    user.isVerified = true;
    await user.save();

    res.json({
      message: 'User approved and registered on blockchain',
      txHash: result.transactionHash
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= USER VERIFY ================= */
export const checkVerification = async (req, res) => {
  try {
    const { wallet, role } = req.body;
    const rpcUrl = process.env.INFURA_URL
      || (process.env.INFURA_API_KEY
        ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        : null);

    if (!rpcUrl || !process.env.SMART_CONTRACT_ADDRESS) {
      return res.json({
        verified: false,
        error: 'Blockchain configuration missing'
      });
    }

    const Web3 = (await import('web3')).default;
    const web3 = new Web3(rpcUrl);

    const abi = [
      'function police(address) view returns (bool)',
      'function forensic(address) view returns (bool)',
      'function judge(address) view returns (bool)'
    ];

    const contract = new web3.eth.Contract(
      abi,
      process.env.SMART_CONTRACT_ADDRESS
    );

    const map = {
      POLICE: 'police',
      FORENSIC: 'forensic',
      JUDGE: 'judge'
    };

    const method = map[String(role || '').toUpperCase()];
    if (!method) {
      return res.json({ verified: false, error: 'Invalid role' });
    }

    const verified = await contract.methods[method](wallet).call();
    res.json({ verified });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET CURRENT USER ================= */
export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: err.message });
  }
};
