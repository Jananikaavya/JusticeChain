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

    // Register role on blockchain (dynamically imported to handle missing web3)
    let blockchainStatus = { success: false, transactionHash: null, error: 'Not attempted' };
    try {
      const contractAddress = process.env.SMART_CONTRACT_ADDRESS || '0x3455F3f93bf486222880Bd64Ecd2B5b9F2FbD5aa';
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
      
      if (!adminPrivateKey) {
        blockchainStatus = { success: false, error: 'Admin private key not configured' };
        console.warn('⚠️ Admin private key missing. Wallet will need manual registration.');
      } else {
        // Dynamic import to avoid loading web3 until needed
        const { initBlockchain, registerRoleOnBlockchain } = await import('../utils/blockchainService.js');
        
        // Initialize blockchain service
        initBlockchain(contractAddress, 'sepolia', adminPrivateKey);
        
        // Register user role on-chain
        const blockchainResult = await registerRoleOnBlockchain(normalizedRole, wallet, adminPrivateKey);
        
        if (blockchainResult.success) {
          blockchainStatus = { 
            success: true, 
            transactionHash: blockchainResult.transactionHash,
            message: `✅ User ${username} registered on-chain`
          };
          console.log(`✅ User ${username} registered on-chain. TX: ${blockchainResult.transactionHash}`);
        } else {
          blockchainStatus = { 
            success: false, 
            error: blockchainResult.error,
            message: `Failed to register on-chain: ${blockchainResult.error}`
          };
          console.warn(`⚠️ On-chain registration failed for ${username}: ${blockchainResult.error}`);
        }
      }
    } catch (blockchainError) {
      blockchainStatus = { 
        success: false, 
        error: blockchainError.message,
        message: `Blockchain error: ${blockchainError.message}`
      };
      console.error('❌ Blockchain registration error:', blockchainError.message);
      // Don't fail the signup - user is still registered in database
    }

    // Send role ID via email
    await sendRoleIdEmail(email, username, roleId, normalizedRole);

    res.status(201).json({
      message: 'Registration successful! Check your email for Role ID.',
      blockchainStatus,
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

// Admin: Register user wallet on blockchain
export const registerUserOnBlockchain = async (req, res) => {
  try {
    const { walletAddress, role } = req.body;

    // Validation
    if (!walletAddress || !role) {
      return res.status(400).json({ message: 'Wallet address and role are required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address format' });
    }

    const normalizedRole = String(role).toUpperCase();
    const allowedRoles = new Set(['POLICE', 'FORENSIC', 'JUDGE']);
    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be POLICE, FORENSIC, or JUDGE' });
    }

    // Use env vars with fallbacks
    const contractAddress = process.env.SMART_CONTRACT_ADDRESS || '0x1e9Dd6b8743eD4b7d3965ef878db9C7B1e602801';
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!adminPrivateKey) {
      return res.status(400).json({ message: 'Admin private key not configured' });
    }

    console.log(`🔗 Registering ${normalizedRole} on contract: ${contractAddress}`);
    console.log(`👤 Wallet: ${walletAddress}`);

    // Import and initialize blockchain service
    const { initBlockchain, registerRoleOnBlockchain } = await import('../utils/blockchainService.js');
    
    initBlockchain(contractAddress, 'sepolia', adminPrivateKey);
    
    // Register user on-chain
    const result = await registerRoleOnBlockchain(normalizedRole, walletAddress, adminPrivateKey);

    if (!result.success) {
      console.error(`❌ Registration failed: ${result.error}`);
      return res.status(500).json({ 
        message: 'Failed to register user on blockchain',
        error: result.error 
      });
    }

    console.log(`✅ Successfully registered ${normalizedRole}: ${walletAddress}`);
    console.log(`📝 Transaction Hash: ${result.transactionHash}`);

    res.status(200).json({
      message: `User wallet registered as ${normalizedRole} on blockchain`,
      transactionHash: result.transactionHash,
      wallet: walletAddress,
      role: normalizedRole,
      contractAddress: contractAddress
    });
  } catch (error) {
    console.error('Blockchain registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user on blockchain',
      error: error.message 
    });
  }
};

// Instant verification - verify role on blockchain immediately
export const verifyRoleOnchain = async (req, res) => {
  try {
    const { walletAddress, role } = req.body;

    if (!walletAddress || !role) {
      return res.status(400).json({ message: 'Wallet address and role required' });
    }

    const contractAddress = process.env.SMART_CONTRACT_ADDRESS || '0x1e9Dd6b8743eD4b7d3965ef878db9C7B1e602801';
    const normalizedRole = String(role).toUpperCase();

    const Web3 = (await import('web3')).default;
    const web3 = new Web3('https://sepolia.infura.io/v3/59fdc70c62514158a761187b8c0988a7');

    // Simple ABI for role functions
    const roleABI = [
      'function police(address) view returns (bool)',
      'function forensic(address) view returns (bool)',
      'function judge(address) view returns (bool)',
      'function getUserRole(address) view returns (string)'
    ];

    const contract = new web3.eth.Contract(roleABI, contractAddress);

    const roleMethodMap = {
      POLICE: 'police',
      FORENSIC: 'forensic',
      JUDGE: 'judge'
    };

    const methodName = roleMethodMap[normalizedRole];
    if (!methodName) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if wallet has role
    const hasRole = await contract.methods[methodName](walletAddress).call();
    
    // Get user's role
    let userRole = 'NONE';
    try {
      userRole = await contract.methods.getUserRole(walletAddress).call();
    } catch (e) {
      console.warn('Could not fetch getUserRole, using fallback');
    }

    res.status(200).json({
      verified: hasRole,
      walletAddress,
      role: normalizedRole,
      userRole,
      message: hasRole 
        ? `✅ Wallet is registered as ${normalizedRole}` 
        : `❌ Wallet is NOT registered as ${normalizedRole}. Current role: ${userRole}`
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      message: 'Error verifying role',
      error: error.message
    });
  }
};

