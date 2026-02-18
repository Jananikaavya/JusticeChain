import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const ADMIN_WALLET = '0x7f1F93f7d1F58AC2644A28b74bd3063123C25CdD';

/* ================= GET ALL USERS ================= */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (either ADMIN role or admin wallet)
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.wallet?.toLowerCase() === ADMIN_WALLET.toLowerCase();
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET AUDIT LOGS ================= */
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.wallet?.toLowerCase() === ADMIN_WALLET.toLowerCase();
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'username role');
    
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= APPROVE USER (Blockchain Registration) ================= */
router.post('/approve-user', authenticateToken, async (req, res) => {
  // Check if user is admin
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.wallet?.toLowerCase() === ADMIN_WALLET.toLowerCase();
  if (!isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

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

    // Log the action
    try {
      await ActivityLog.create({
        action: 'APPROVE_USER',
        details: `Approved user ${user.username} (${user.role})`,
        ipAddress: req.ip,
        performedBy: req.user?.id || null
      });
    } catch (logError) {
      console.warn('Warning: Could not create activity log:', logError.message);
    }

    res.json({
      message: 'User approved and registered on blockchain',
      txHash: result.transactionHash,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: true
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= SUSPEND USER ================= */
router.put('/users/:id/suspend', authenticateToken, async (req, res) => {
  // Check if user is admin
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.wallet?.toLowerCase() === ADMIN_WALLET.toLowerCase();
  if (!isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    try {
      await ActivityLog.create({
        action: user.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        details: `${user.isSuspended ? 'Suspended' : 'Unsuspended'} user ${user.username}`,
        ipAddress: req.ip,
        performedBy: req.user?.id || null
      });
    } catch (logError) {
      console.warn('Warning: Could not create activity log:', logError.message);
    }

    res.json({ 
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`,
      user: {
        id: user._id,
        username: user.username,
        isSuspended: user.isSuspended
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= SYSTEM HEALTH ================= */
router.get('/health', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isSuspended: { $ne: true } });
    
    res.json({
      status: 'healthy',
      database: 'connected',
      users: { total: totalUsers, active: activeUsers },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= SYSTEM STATUS ================= */
router.get('/status', async (req, res) => {
  try {
    res.json({
      service: 'JusticeChain Admin',
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
