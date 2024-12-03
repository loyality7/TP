import mongoose from 'mongoose';

const testSessionSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String,
    language: String,
    ip: String
  },
  warnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('TestSession', testSessionSchema); 