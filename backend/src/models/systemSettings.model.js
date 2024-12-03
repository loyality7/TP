import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  testPricing: {
    pricePerUser: { 
      type: Number, 
      default: 4.35  // ₹4.35 per user per test
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings; 