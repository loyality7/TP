import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  duration: Number,
  proctoring: { type: Boolean, default: false },
  instructions: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.totalMarks;
      },
      message: 'Passing marks cannot be greater than total marks'
    }
  },
  timeLimit: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  mcqs: [{
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: [arr => arr.length >= 2, 'At least 2 options required'] },
    correctOptions: { 
      type: [Number], 
      required: true,
      validate: [
        {
          validator: function(arr) {
            return arr.length >= 1; // At least one correct answer
          },
          message: 'At least one correct option is required'
        },
        {
          validator: function(arr) {
            return arr.every(opt => opt < this.options.length); // Ensure correct options exist
          },
          message: 'Correct options must be valid indices of the options array'
        }
      ]
    },
    answerType: { 
      type: String, 
      enum: ['single', 'multiple'], 
      required: true 
    },
    marks: { type: Number, required: true },
    explanation: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
  }],
  codingChallenges: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    problemStatement: { type: String, required: true },
    constraints: { type: String, required: true },
    allowedLanguages: {
      type: [String],
      required: true,
      default: ['javascript', 'python', 'java'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one programming language must be allowed'
      }
    },
    languageImplementations: {
      type: Map,
      of: {
        visibleCode: String,
        invisibleCode: String
      },
      required: true
    },
    testCases: [{
      input: { type: String, required: true },
      output: { type: String, required: true },
      isVisible: { type: Boolean, default: true },
      explanation: String
    }],
    marks: { type: Number, required: true },
    timeLimit: { type: Number, required: true },
    memoryLimit: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [String]
  }],
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  sharingToken: String,
  publishedAt: Date,
  type: {
    type: String,
    enum: ['assessment', 'coding_challenge'],
    default: 'coding_challenge'
  },
  accessControl: {
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    userLimit: {
      type: Number,
      min: 0, 
      default: 0
    },
    allowedUsers: [{
      _id: false, // Disable automatic _id for subdocuments
      email: String,
      name: String,
      addedAt: Date
    }],
    allowedEmails: [{
      type: String,
      validate: {
        validator: function(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    }],
    currentUserCount: {
      type: Number,
      default: 0
    }
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster UUID lookups
testSchema.index({ uuid: 1 });

// Add validation to ensure userLimit is respected
testSchema.pre('save', function(next) {
  if (this.accessControl.type === 'private' && 
      this.accessControl.userLimit > 0 && 
      this.accessControl.allowedUsers.length > this.accessControl.userLimit) {
    next(new Error('Number of allowed users exceeds the user limit'));
  }
  this.accessControl.currentUserCount = this.accessControl.allowedUsers.length;
  next();
});

const Test = mongoose.model("Test", testSchema);
export default Test;
