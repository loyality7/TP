import mongoose from 'mongoose';

const testInvitationSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: String,
  token: {
    type: String,
    required: true,
    unique: true
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
    enum: ['pending', 'accepted', 'expired', 'completed'],
    default: 'pending'
  },
  lastAttemptAt: Date,
  shareableLink: String
}, {
  timestamps: true
});

// Add index for faster lookups
testInvitationSchema.index({ token: 1 });
testInvitationSchema.index({ email: 1, test: 1 });

const TestInvitation = mongoose.model('TestInvitation', testInvitationSchema);

export default TestInvitation; 