import mongoose from 'mongoose';

const testRegistrationSchema = new mongoose.Schema({
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
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'completed', 'expired'],
    default: 'registered'
  },
  registrationType: {
    type: String,
    enum: ['assessment', 'coding_challenge'],
    required: true
  },
  testType: {
    type: String,
    enum: ['assessment', 'coding_challenge'],
    required: true
  },
  accessType: {
    type: String,
    enum: ['public', 'private'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
testRegistrationSchema.index({ test: 1, user: 1 }, { unique: true });

const TestRegistration = mongoose.model('TestRegistration', testRegistrationSchema);
export default TestRegistration; 
