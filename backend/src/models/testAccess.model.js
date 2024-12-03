import mongoose from 'mongoose';

const testAccessSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  attemptsUsed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  testStatus: {
    type: String,
    enum: ['not_started', 'started', 'in_mcq', 'in_coding', 'completed', 'expired'],
    default: 'not_started'
  },
  sessionStatus: {
    type: String,
    enum: ['created', 'started', 'in_progress', 'paused', 'completed', 'expired', 'terminated'],
    default: 'created'
  },
  lastAccessedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for quick lookups
testAccessSchema.index({ test: 1, user: 1 }, { unique: true });
testAccessSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

const TestAccess = mongoose.model('TestAccess', testAccessSchema);

export default TestAccess; 