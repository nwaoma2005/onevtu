const express = require('express');
const router = express.Router();
const axios = require('axios');
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

// Initialize Paystack Payment
router.post('/fund', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum funding amount is ₦100'
      });
    }

    const user = await User.findById(req.userId);
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize Paystack payment
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amount * 100, // Paystack uses kobo (multiply by 100)
        reference: reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
        metadata: {
          user_id: user._id.toString(),
          purpose: 'wallet-funding',
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: user.name
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone',
              value: user.phone
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: reference
      }
    });

  } catch (error) {
    console.error('Paystack Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: error.response?.data || error.message
    });
  }
});

// Manual wallet funding (for testing/admin)
router.post('/fund-manual', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum funding amount is ₦100'
      });
    }

    const user = await User.findById(req.userId);
    const previousBalance = user.walletBalance;
    
    user.walletBalance += parseFloat(amount);
    await user.save();

    const reference = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await Transaction.create({
      user: req.userId,
      serviceType: 'wallet-funding',
      recipient: user.email,
      amount: parseFloat(amount),
      previousBalance: previousBalance,
      newBalance: user.walletBalance,
      status: 'success',
      reference: reference,
      metadata: { type: 'manual_funding', method: 'instant' }
    });

    console.log(`✅ Manual funding: ₦${amount} added to ${user.email}`); // ✅ FIXED

    res.json({
      success: true,
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      amount_added: parseFloat(amount)
    });

  } catch (error) {
    console.error('Manual funding error:', error);
    res.status(500).json({
      success: false,
      message: 'Wallet funding failed',
      error: error.message
    });
  }
});

// Verify Paystack Payment
router.get('/verify-payment/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status === 'success') {
      const user = await User.findById(req.userId);
      const amount = parseFloat(paymentData.amount) / 100; // Convert from kobo to naira

      // Check if already credited (prevent double crediting)
      const existingTransaction = await Transaction.findOne({ 
        reference: reference,
        serviceType: 'wallet-funding'
      });

      if (existingTransaction) {
        return res.json({
          success: true,
          message: 'Payment already processed',
          balance: user.walletBalance
        });
      }

      // Credit user wallet
      const previousBalance = user.walletBalance;
      user.walletBalance += amount;
      await user.save();

      // Create transaction record
      await Transaction.create({
        user: req.userId,
        serviceType: 'wallet-funding',
        recipient: user.email,
        amount: amount,
        previousBalance: previousBalance,
        newBalance: user.walletBalance,
        status: 'success',
        reference: reference,
        apiResponse: paymentData,
        metadata: {
          type: 'funding',
          method: 'paystack',
          transaction_id: paymentData.id
        }
      });

      res.json({
        success: true,
        message: 'Wallet funded successfully',
        balance: user.walletBalance,
        amount_added: amount
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: paymentData.status
      });
    }

  } catch (error) {
    console.error('Verification Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
});

// Paystack Webhook (for automatic payment confirmation)
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = require('crypto')
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;

    // Handle successful payment
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const amount = parseFloat(event.data.amount) / 100;
      const userId = event.data.metadata.user_id;

      const user = await User.findById(userId);
      if (user) {
        // Check if already processed
        const existingTransaction = await Transaction.findOne({ 
          reference: reference,
          serviceType: 'wallet-funding'
        });

        if (!existingTransaction) {
          const previousBalance = user.walletBalance;
          user.walletBalance += amount;
          await user.save();

          await Transaction.create({
            user: userId,
            serviceType: 'wallet-funding',
            recipient: user.email,
            amount: amount,
            previousBalance: previousBalance,
            newBalance: user.walletBalance,
            status: 'success',
            reference: reference,
            apiResponse: event.data,
            metadata: { type: 'funding', method: 'paystack_webhook' }
          });
        }
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false });
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