import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  usersCount: Number,
  paymentId: String,
  orderId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0
  },
  transactions: [walletTransactionSchema]
});

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  company: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  settings: {
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    defaultTestSettings: {
      maxAttempts: { type: Number, default: 1 },
      validityDuration: { type: Number, default: 7 } // in days
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    validUntil: Date
  },
  wallet: {
    type: walletSchema,
    default: () => ({
      balance: 10, // Initial balance of 10 rupees
      transactions: [{
        type: 'credit',
        amount: 10,
        description: 'Welcome bonus',
        status: 'completed',
        createdAt: new Date()
      }]
    })
  }
}, { timestamps: true });

// Add some useful methods
vendorSchema.methods.isSubscriptionActive = function() {
  return !this.subscription.validUntil || this.subscription.validUntil > new Date();
};

vendorSchema.methods.isApproved = function() {
  return this.status === 'approved';
};

// Add method to check if vendor has sufficient balance
vendorSchema.methods.hasSufficientBalance = function(amount) {
  return this.wallet && this.wallet.balance >= amount;
};

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor; 