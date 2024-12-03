import mongoose from 'mongoose';

const testCaseResultSchema = new mongoose.Schema({
  testCaseId: {
    type: String,
    required: true
  },
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  actualOutput: String,
  passed: {
    type: Boolean,
    default: false
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memory: {
    type: Number,
    default: 0
  },
  error: String
});

const submissionAttemptSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  testCaseResults: [testCaseResultSchema],
  executionDetails: {
    totalTestCases: {
      type: Number,
      default: 0
    },
    passedTestCases: {
      type: Number,
      default: 0
    },
    failedTestCases: {
      type: Number,
      default: 0
    },
    totalExecutionTime: {
      type: Number,
      default: 0
    },
    memory: {
      type: Number,
      default: 0
    },
    output: String,
    error: String
  },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'error', 'partial', 'passed'],
    default: 'pending'
  },
  marks: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    required: true
  }
});

const codingSubmissionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  submissions: [submissionAttemptSchema],
  bestScore: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now
  },
  metrics: {
    totalTestCases: {
      type: Number,
      default: 0
    },
    passedTestCases: {
      type: Number,
      default: 0
    },
    failedTestCases: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    averageExecutionTime: {
      type: Number,
      default: 0
    },
    averageMemoryUsed: {
      type: Number,
      default: 0
    },
    totalExecutionTime: {
      type: Number,
      default: 0
    },
    totalMemoryUse: {
      type: Number,
      default: 0
    }
  }
});

export const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema); 