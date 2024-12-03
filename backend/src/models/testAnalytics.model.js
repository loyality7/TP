import mongoose from 'mongoose';

const testAnalyticsSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['mcq', 'coding', 'test'],
    required: true
  },
  behavior: {
    warnings: {
      type: Number,
      default: 0
    },
    tabSwitches: {
      type: Number,
      default: 0
    },
    copyPasteAttempts: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    mouseMoves: {
      type: Number,
      default: 0
    },
    keystrokes: {
      type: Number,
      default: 0
    },
    focusLostCount: {
      type: Number,
      default: 0
    },
    submissionAttempts: {
      type: Number,
      default: 0
    }
  },
  performance: {
    score: {
      type: Number,
      default: 0
    },
    executionTime: Number,
    memoryUsage: Number,
    testCasesPassed: Number,
    totalTestCases: Number
  },
  metadata: {
    browser: String,
    os: String,
    device: String,
    screenResolution: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
testAnalyticsSchema.index({ 
  test: 1, 
  user: 1, 
  type: 1 
});

export default mongoose.model('TestAnalytics', testAnalyticsSchema); 