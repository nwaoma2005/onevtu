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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/services', require('./routes/services'));
app.use('/api/transactions', require('./routes/transactions'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'OneVTU API is running',
    timestamp: new Date().toISOString()
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
});
// After your existing routes
app.use('/api/admin', require('./routes/admin'));