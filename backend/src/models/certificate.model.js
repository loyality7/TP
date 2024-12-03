import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const certificateSchema = new mongoose.Schema({
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
  certificateNumber: {
    type: String,
    unique: true,
    default: () => nanoid(10).toUpperCase()
  },
  score: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['ACHIEVEMENT', 'PARTICIPATION'],
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster certificate lookup
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ user: 1, test: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate; 