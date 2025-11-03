const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const axios = require('axios');

// Get all transactions for a user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, status, serviceType } = req.query;

    const query = { user: req.userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

// Get single transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message
    });
  }
});

// Download transaction receipt
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('user', 'name email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate simple text receipt
    const receipt = `
======================================
        ONEVTU RECEIPT
======================================

Transaction ID: ${transaction._id}
Reference: ${transaction.reference}
Date: ${new Date(transaction.createdAt).toLocaleString()}

--------------------------------------
Customer Details
--------------------------------------
Name: ${transaction.user.name}
Email: ${transaction.user.email}
Phone: ${transaction.user.phone}

--------------------------------------
Transaction Details
--------------------------------------
Service: ${transaction.serviceType.toUpperCase()}
${transaction.network ? `Network: ${transaction.network}` : ''}
${transaction.provider ? `Provider: ${transaction.provider}` : ''}
Recipient: ${transaction.recipient}
Amount: ₦${transaction.amount.toLocaleString()}
Status: ${transaction.status.toUpperCase()}

--------------------------------------
Balance Information
--------------------------------------
Previous Balance: ₦${transaction.previousBalance?.toLocaleString() || 'N/A'}
New Balance: ₦${transaction.newBalance?.toLocaleString() || 'N/A'}

======================================
    Thank you for using OneVTU!
       www.onevtu.com
======================================
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${transaction.reference}.txt"`);
    res.send(receipt);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download receipt',
      error: error.message
    });
  }
});

// Initialize Paystack payment
router.post('/initialize-payment', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₦100'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique reference
    const reference = `FUND_${Date.now()}_${user._id}`;

    // Create pending transaction
    const transaction = await Transaction.create({
      user: req.userId,
      serviceType: 'wallet-funding',
      amount: Number(amount),
      reference: reference,
      status: 'pending',
      previousBalance: Number(user.balance),
      newBalance: Number(user.balance),
      recipient: user.email,
      network: 'Paystack',
      metadata: {
        paymentMethod: 'paystack',
        description: 'Wallet Funding'
      }
    });

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amount * 100, // Paystack uses kobo
        reference: reference,
        callback_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&reference=${reference}`,
        metadata: {
          userId: user._id.toString(),
          transactionId: transaction._id.toString(),
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: user.name
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorization_url: paystackResponse.data.data.authorization_url,
        access_code: paystackResponse.data.data.access_code,
        reference: reference
      }
    });

  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.response?.data?.message || error.message
    });
  }
});

// Paystack Webhook
router.post('/paystack-webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const event = req.body;

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference, amount } = event.data;

      // Find transaction
      const transaction = await Transaction.findOne({ reference });
      
      if (!transaction) {
        console.error('Transaction not found:', reference);
        return res.status(200).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check if already processed
      if (transaction.status === 'success') {
        console.log('Transaction already processed:', reference);
        return res.status(200).json({
          success: true,
          message: 'Transaction already processed'
        });
      }

      // Find user
      const user = await User.findById(transaction.user);
      if (!user) {
        console.error('User not found:', transaction.user);
        return res.status(200).json({
          success: false,
          message: 'User not found'
        });
      }

      // Convert amount from kobo to naira
      const amountInNaira = Number(amount) / 100;

      // Update user balance
      user.balance = Number(user.balance) + amountInNaira;
      await user.save();

      // Update transaction
      transaction.status = 'success';
      transaction.newBalance = Number(user.balance);
      transaction.completedAt = new Date();
      await transaction.save();

      console.log(`✅ Payment successful: ${reference}, User: ${user.email}, Amount: ₦${amountInNaira}, New Balance: ₦${user.balance}`);
    }

    // Respond to Paystack
    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Verify payment manually
router.get('/verify-payment/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = paystackResponse.data;

    if (data.status === 'success') {
      // Find transaction
      const transaction = await Transaction.findOne({ reference, user: req.userId });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // If already processed
      if (transaction.status === 'success') {
        return res.json({
          success: true,
          message: 'Payment already verified',
          transaction,
          newBalance: transaction.newBalance
        });
      }

      // Update user balance
      const user = await User.findById(req.userId);
      const amountInNaira = Number(data.amount) / 100;
      
      user.balance = Number(user.balance) + amountInNaira;
      await user.save();

      // Update transaction
      transaction.status = 'success';
      transaction.newBalance = Number(user.balance);
      transaction.completedAt = new Date();
      await transaction.save();

      console.log(`✅ Payment verified: ${reference}, Amount: ₦${amountInNaira}, New Balance: ₦${user.balance}`);

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        transaction,
        newBalance: user.balance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
        status: data.status
      });
    }

  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;