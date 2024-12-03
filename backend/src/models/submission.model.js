import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  test: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Test", 
    required: true 
  },
  status: {
    type: String,
    enum: ['in_progress', 'mcq_completed', 'coding_completed', 'completed'],
    default: 'in_progress'
  },
  version: { 
    type: Number, 
    default: 1 
  },
  // MCQ Section
  mcqSubmission: {
    version: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    submittedAt: Date,
    totalScore: { type: Number, default: 0 },
    answers: [{
      questionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
      },
      selectedOptions: [Number],
      marks: { type: Number, default: 0 },
      isCorrect: { type: Boolean, default: false },
      timeTaken: Number // in seconds
    }]
  },
  // Coding Section
  codingSubmission: {
    version: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    submittedAt: Date,
    totalScore: { type: Number, default: 0 },
    challenges: [{
      challengeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
      },
      submissions: [{
        code: { type: String, required: true },
        language: { 
          type: String, 
          required: true 
        },
        submittedAt: { type: Date, default: Date.now },
        marks: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['pending', 'evaluated', 'error', 'partial', 'passed'],
          default: 'pending'
        },
        executionTime: { type: Number },
        memory: { type: Number },
        output: String,
        error: String,
        testCaseResults: [{
          input: String,
          expectedOutput: String,
          actualOutput: String,
          passed: { type: Boolean, default: false },
          executionTime: Number,
          error: String,
          memory: Number
        }]
      }]
    }]
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  totalScore: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for better query performance
submissionSchema.index({ user: 1, test: 1 });
submissionSchema.index({ test: 1, status: 1 });

// Make sure this method works correctly
submissionSchema.statics.getNextVersion = async function(testId, userId) {
  const lastSubmission = await this.findOne({ 
    test: testId, 
    user: userId 
  })
  .sort({ version: -1 })
  .select('version');
  
  return lastSubmission ? (lastSubmission.version + 1) : 1;
};

// Add a new method to check if a submission exists
submissionSchema.statics.findExistingSubmission = async function(testId, userId) {
  return await this.findOne({ 
    test: testId, 
    user: userId,
    status: { $ne: 'completed' }  // Only find incomplete submissions
  });
};

export default mongoose.model("Submission", submissionSchema);
