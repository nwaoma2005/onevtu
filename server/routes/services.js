const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Buy Airtime
router.post('/airtime', auth, async (req, res) => {
  try {
    const { network, phone, amount } = req.body;

    if (amount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is ₦50'
      });
    }

    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Generate unique reference
    const reference = `AIR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Deduct from wallet
    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    try {
      // Call ClubConnect API for airtime
      const response = await axios.post(
        `${process.env.CLUBCONNECT_BASE_URL}/topup`,
        {
          network: network.toLowerCase(),
          phone: phone,
          amount: amount,
          plan_type: 'VTU'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CLUBCONNECT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Create transaction record
      const transaction = await Transaction.create({
        user: req.userId,
        serviceType: 'airtime',
        network,
        recipient: phone,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: user.walletBalance,
        status: response.data.status === 'success' ? 'success' : 'failed',
        reference,
        apiResponse: response.data
      });

      if (response.data.status !== 'success') {
        // Refund if API fails
        user.walletBalance = previousBalance;
        await user.save();
        
        transaction.status = 'refunded';
        await transaction.save();

        return res.status(400).json({
          success: false,
          message: 'Transaction failed, wallet refunded',
          transaction
        });
      }

      res.json({
        success: true,
        message: 'Airtime purchase successful',
        transaction
      });

    } catch (apiError) {
      // API call failed - refund user
      user.walletBalance = previousBalance;
      await user.save();

      await Transaction.create({
        user: req.userId,
        serviceType: 'airtime',
        network,
        recipient: phone,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: previousBalance,
        status: 'failed',
        reference,
        apiResponse: { error: apiError.message }
      });

      return res.status(500).json({
        success: false,
        message: 'Transaction failed, wallet refunded',
        error: apiError.message
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Airtime purchase failed',
      error: error.message
    });
  }
});

// Get Data Plans
router.get('/data-plans/:network', auth, async (req, res) => {
  try {
    const { network } = req.params;

    // Call your data provider API to get plans
    // For now, returning mock data
    const mockPlans = {
      'MTN': [
        { id: '1', name: '500MB Daily', price: 150, validity: '1 Day', code: 'MTN-500MB-1D' },
        { id: '2', name: '1GB Daily', price: 300, validity: '1 Day', code: 'MTN-1GB-1D' },
        { id: '3', name: '2GB Weekly', price: 500, validity: '7 Days', code: 'MTN-2GB-7D' },
        { id: '4', name: '5GB Monthly', price: 1500, validity: '30 Days', code: 'MTN-5GB-30D' },
        { id: '5', name: '10GB Monthly', price: 2500, validity: '30 Days', code: 'MTN-10GB-30D' }
      ],
      'Airtel': [
        { id: '6', name: '750MB Daily', price: 200, validity: '1 Day', code: 'AIRTEL-750MB-1D' },
        { id: '7', name: '1.5GB Weekly', price: 450, validity: '7 Days', code: 'AIRTEL-1.5GB-7D' },
        { id: '8', name: '6GB Monthly', price: 1500, validity: '30 Days', code: 'AIRTEL-6GB-30D' }
      ],
      'Glo': [
        { id: '9', name: '1GB Daily', price: 250, validity: '1 Day', code: 'GLO-1GB-1D' },
        { id: '10', name: '3.5GB Weekly', price: 500, validity: '7 Days', code: 'GLO-3.5GB-7D' },
        { id: '11', name: '7.5GB Monthly', price: 1500, validity: '30 Days', code: 'GLO-7.5GB-30D' }
      ],
      '9mobile': [
        { id: '12', name: '1GB Daily', price: 300, validity: '1 Day', code: '9MOB-1GB-1D' },
        { id: '13', name: '2.5GB Weekly', price: 500, validity: '7 Days', code: '9MOB-2.5GB-7D' },
        { id: '14', name: '11.5GB Monthly', price: 2000, validity: '30 Days', code: '9MOB-11.5GB-30D' }
      ]
    };

    res.json({
      success: true,
      plans: mockPlans[network] || []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get data plans',
      error: error.message
    });
  }
});

// Buy Data
router.post('/data', auth, async (req, res) => {
  try {
    const { network, phone, planId, amount } = req.body;

    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    const reference = `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    try {
      // Call your data provider API
      // For now, simulating success
      const apiResponse = {
        status: 'success',
        message: 'Data purchase successful'
      };

      const transaction = await Transaction.create({
        user: req.userId,
        serviceType: 'data',
        network,
        recipient: phone,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: user.walletBalance,
        status: 'success',
        reference,
        apiResponse,
        metadata: { planId }
      });

      res.json({
        success: true,
        message: 'Data purchase successful',
        transaction
      });

    } catch (apiError) {
      user.walletBalance = previousBalance;
      await user.save();

      await Transaction.create({
        user: req.userId,
        serviceType: 'data',
        network,
        recipient: phone,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: previousBalance,
        status: 'failed',
        reference,
        apiResponse: { error: apiError.message }
      });

      return res.status(500).json({
        success: false,
        message: 'Transaction failed, wallet refunded'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Data purchase failed',
      error: error.message
    });
  }
});

// Get Cable Plans
router.get('/cable-plans/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;

    const mockPlans = {
      'dstv': [
        { id: 'c1', name: 'Padi', price: 2500, code: 'DSTV-PADI' },
        { id: 'c2', name: 'Yanga', price: 3500, code: 'DSTV-YANGA' },
        { id: 'c3', name: 'Confam', price: 6200, code: 'DSTV-CONFAM' }
      ],
      'gotv': [
        { id: 'c4', name: 'Smallie', price: 1300, code: 'GOTV-SMALLIE' },
        { id: 'c5', name: 'Jinja', price: 2700, code: 'GOTV-JINJA' },
        { id: 'c6', name: 'Jolli', price: 3950, code: 'GOTV-JOLLI' }
      ],
      'startimes': [
        { id: 'c7', name: 'Basic', price: 1200, code: 'STAR-BASIC' },
        { id: 'c8', name: 'Smart', price: 2500, code: 'STAR-SMART' },
        { id: 'c9', name: 'Super', price: 4900, code: 'STAR-SUPER' }
      ]
    };

    res.json({
      success: true,
      plans: mockPlans[provider] || []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cable plans',
      error: error.message
    });
  }
});

// Verify Smart Card
router.post('/verify-smartcard', auth, async (req, res) => {
  try {
    const { provider, smartCardNumber } = req.body;

    // Call cable TV API to verify
    // For now, returning mock data
    res.json({
      success: true,
      customer: {
        name: 'John Doe',
        status: 'Active'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// Pay Cable TV
router.post('/cable-tv', auth, async (req, res) => {
  try {
    const { provider, smartCardNumber, planId, amount } = req.body;

    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    const reference = `CABLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    try {
      // Call cable TV API
      const transaction = await Transaction.create({
        user: req.userId,
        serviceType: 'cable-tv',
        provider,
        recipient: smartCardNumber,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: user.walletBalance,
        status: 'success',
        reference,
        metadata: { planId }
      });

      res.json({
        success: true,
        message: 'Cable TV subscription successful',
        transaction
      });

    } catch (apiError) {
      user.walletBalance = previousBalance;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Transaction failed, wallet refunded'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cable TV payment failed',
      error: error.message
    });
  }
});

// Verify Meter
router.post('/verify-meter', auth, async (req, res) => {
  try {
    const { provider, meterNumber, meterType } = req.body;

    // Call electricity API to verify
    res.json({
      success: true,
      customer: {
        name: 'John Doe',
        address: '123 Main Street, Lagos'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// Pay Electricity
router.post('/electricity', auth, async (req, res) => {
  try {
    const { provider, meterNumber, meterType, amount } = req.body;

    if (amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is ₦1,000'
      });
    }

    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    const reference = `ELEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const previousBalance = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    try {
      // Call electricity API
      const transaction = await Transaction.create({
        user: req.userId,
        serviceType: 'electricity',
        provider,
        recipient: meterNumber,
        amount: parseFloat(amount),
        previousBalance,
        newBalance: user.walletBalance,
        status: 'success',
        reference,
        metadata: { meterType }
      });

      res.json({
        success: true,
        message: 'Electricity payment successful',
        transaction
      });

    } catch (apiError) {
      user.walletBalance = previousBalance;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Transaction failed, wallet refunded'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Electricity payment failed',
      error: error.message
    });
  }
});

module.exports = router;