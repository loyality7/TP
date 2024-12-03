import SystemSettings from '../models/systemSettings.model.js';
import Vendor from '../models/vendor.model.js';
import Test from '../models/test.model.js';

export const checkTestBalance = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    const vendor = await Vendor.findById(test.vendor);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Get current price per user
    const settings = await SystemSettings.findOne();
    const pricePerUser = settings?.testPricing?.pricePerUser || 4.35;

    // Check if vendor has sufficient balance
    if (vendor.wallet.balance < pricePerUser) {
      return res.status(403).json({
        error: "Insufficient wallet balance",
        required: pricePerUser,
        current: vendor.wallet.balance,
        shortfall: pricePerUser - vendor.wallet.balance
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkTestBalance:', error);
    res.status(500).json({
      error: "Failed to verify test balance",
      message: error.message
    });
  }
}; 