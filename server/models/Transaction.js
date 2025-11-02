const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['airtime', 'data', 'cable-tv', 'electricity', 'wallet-funding'],
    required: true
  },
  network: String,
  provider: String,
  recipient: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousBalance: Number,
  newBalance: Number,
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    required: true
  },
  apiResponse: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);