const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authorization failed' 
    });
  }
};

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = search 
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get single user details
router.get('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user's recent transactions
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      user,
      recentTransactions: transactions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Credit user wallet (Admin only)
router.post('/credit-wallet', auth, isAdmin, async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    if (!userId || !amount || amount < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and valid amount required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const previousBalance = user.walletBalance;
    user.walletBalance += parseFloat(amount);
    await user.save();

    const admin = await User.findById(req.userId);
    const reference = `ADMIN-${Date.now()}`;

    await Transaction.create({
      user: userId,
      serviceType: 'wallet-funding',
      recipient: user.email,
      amount: parseFloat(amount),
      previousBalance: previousBalance,
      newBalance: user.walletBalance,
      status: 'success',
      reference: reference,
      metadata: { 
        type: 'admin_credit', 
        admin: req.userId,
        adminName: admin.name,
        note: note || 'Admin credit'
      }
    });

    console.log(`✅ Admin ${admin.name} credited ₦${amount} to ${user.email}`);

    res.json({
      success: true,
      message: `₦${amount} credited to ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Credit wallet error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Debit user wallet (Admin only)
router.post('/debit-wallet', auth, isAdmin, async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    if (!userId || !amount || amount < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and valid amount required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    const admin = await User.findById(req.userId);
    const reference = `ADMIN-DEBIT-${Date.now()}`;

    await Transaction.create({
      user: userId,
      serviceType: 'wallet-debit',
      recipient: user.email,
      amount: parseFloat(amount),
      previousBalance: previousBalance,
      newBalance: user.walletBalance,
      status: 'success',
      reference: reference,
      metadata: { 
        type: 'admin_debit', 
        admin: req.userId,
        adminName: admin.name,
        note: note || 'Admin debit'
      }
    });

    console.log(`✅ Admin ${admin.name} debited ₦${amount} from ${user.email}`);

    res.json({
      success: true,
      message: `₦${amount} debited from ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentTransactions = await Transaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all transactions
router.get('/transactions', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, serviceType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    const transactions = await Transaction.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;