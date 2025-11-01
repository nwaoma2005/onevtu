const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

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

module.exports = router;