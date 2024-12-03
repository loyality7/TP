import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  mcqAnswers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedOptions: {
      type: [Number],
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    marksObtained: {
      type: Number,
      required: true
    }
  }],
  codingAnswers: [{
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    testCaseResults: [{
      testCaseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      passed: {
        type: Boolean,
        required: true
      },
      output: String,
      error: String,
      executionTime: Number,
      memoryUsed: Number
    }],
    marksObtained: {
      type: Number,
      required: true
    }
  }],
  totalScore: {
    type: Number,
    required: true
  },
  mcqScore: {
    type: Number,
    required: true
  },
  codingScore: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'submitted', 'evaluated'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

const TestResult = mongoose.model('TestResult', testResultSchema);

export default TestResult; 