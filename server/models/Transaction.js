const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: [
      'airtime',
      'data',
      'cable-tv',
      'electricity',
      'wallet-funding',
      'wallet-debit'
    ],
    required: true
  },
  network: {
    type: String,
    // For airtime/data: MTN, GLO, AIRTEL, 9MOBILE
  },
  provider: {
    type: String,
    // For cable/electricity: DSTV, GOTV, STARTIMES, EKEDC, IKEDC, etc.
  },
  recipient: {
    type: String,
    required: true
    // Phone number, meter number, smartcard number, or email
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  newBalance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    // Store raw API response for debugging
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Additional info: admin actions, notes, gateway details, etc.
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ serviceType: 1 });
transactionSchema.index({ reference: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `₦${this.amount.toLocaleString()}`;
});

// Method to check if transaction is successful
transactionSchema.methods.isSuccessful = function() {
  return this.status === 'success';
};

// Method to check if transaction is pending
transactionSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get successful transactions total
transactionSchema.statics.getTotalRevenue = async function() {
  const result = await this.aggregate([
    { $match: { status: 'success' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0]?.total || 0;
};

module.exports = mongoose.model('Transaction', transactionSchema);