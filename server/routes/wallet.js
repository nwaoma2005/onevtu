const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('walletBalance');
    
    res.json({
      success: true,
      balance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: error.message
    });
  }
});

// Fund wallet
router.post('/fund', auth, async (req, res) => {
  try {
    const { amount, paymentReference } = req.body;

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum funding amount is ₦100'
      });
    }

    // In production, verify payment with Paystack here
    // For now, we'll simulate success
    
    const user = await User.findById(req.userId);
    user.walletBalance += parseFloat(amount);
    await user.save();

    // Create wallet history transaction
    await Transaction.create({
      user: req.userId,
      serviceType: 'wallet-funding',
      recipient: user.email,
      amount: parseFloat(amount),
      previousBalance: user.walletBalance - parseFloat(amount),
      newBalance: user.walletBalance,
      status: 'success',
      reference: paymentReference || `FUND-${Date.now()}`,
      metadata: {
        type: 'funding',
        method: 'paystack'
      }
    });

    res.json({
      success: true,
      message: 'Wallet funded successfully',
      balance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Wallet funding failed',
      error: error.message
    });
  }
});

// Get wallet history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const transactions = await Transaction.find({
      user: req.userId,
      serviceType: 'wallet-funding'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet history',
      error: error.message
    });
  }
});

module.exports = router;