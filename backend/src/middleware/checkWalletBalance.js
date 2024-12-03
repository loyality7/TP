import SystemSettings from '../models/systemSettings.model.js';
import Vendor from '../models/vendor.model.js';

export const checkWalletBalance = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { users } = req.body;
    
    // Skip balance check if no users are being added
    if (!users || !users.length) {
      return next();
    }

    // Get current price per user
    const settings = await SystemSettings.findOne();
    if (!settings?.testPricing?.pricePerUser) {
      return res.status(500).json({
        error: "Test pricing not configured",
        message: "Please contact administrator"
      });
    }

    const pricePerUser = settings.testPricing.pricePerUser;
    const totalAmount = pricePerUser * users.length;

    // Check vendor balance
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        error: "Vendor not found"
      });
    }

    if (!vendor.hasSufficientBalance(totalAmount)) {
      return res.status(403).json({
        error: "Insufficient wallet balance",
        required: totalAmount,
        current: vendor.wallet.balance,
        pricePerUser,
        usersCount: users.length,
        shortfall: totalAmount - vendor.wallet.balance
      });
    }

    // Add calculated amounts to request for later use
    req.walletInfo = {
      pricePerUser,
      totalAmount,
      currentBalance: vendor.wallet.balance
    };

    next();
  } catch (error) {
    console.error('Error in checkWalletBalance:', error);
    res.status(500).json({
      error: "Failed to verify wallet balance",
      message: error.message
    });
  }
}; 