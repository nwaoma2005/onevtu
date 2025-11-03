const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// CORS Configuration - Allow all origins in production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature']
}));

// IMPORTANT: Raw body parser for Paystack webhook BEFORE express.json()
app.use('/api/transactions/paystack-webhook', express.raw({ type: 'application/json' }));

// Regular JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/services', require('./routes/services'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// TEMPORARY ADMIN MAKER - DELETE AFTER USE!
app.get('/make-admin-secret/:email', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ email: req.params.email });
    
    if (user) {
      user.role = 'admin';
      await user.save();
      res.json({ 
        success: true, 
        message: `✅ ${user.email} is now an admin!`,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'User not found. Please register first.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'OneVTU API is running',
    timestamp: new Date().toISOString(),
    paystack_configured: !!(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY)
  });
});

// Serve React Frontend (Production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Paystack: ${process.env.PAYSTACK_SECRET_KEY ? '✅ Configured' : '❌ Not Configured'}`);
});