import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Vendor from '../models/vendor.model.js';
import SystemSettings from '../models/systemSettings.model.js';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890', 
  key_secret: process.env.RAZORPAY_KEY_SECRET || '1234567890abcdef1234567890abcdef'
});

const INITIAL_BALANCE = 10; // Initial balance in rupees

// Initialize wallet for new vendor
export const initializeWallet = async (vendorId) => {
  try {
    console.log('Initializing wallet for vendor:', vendorId);
    
    // Use findOneAndUpdate to avoid race conditions
    const vendor = await Vendor.findOneAndUpdate(
      { _id: vendorId, 'wallet.balance': { $exists: false } },
      {
        $setOnInsert: {
          wallet: {
            balance: INITIAL_BALANCE,
            transactions: [{
              type: 'credit',
              amount: INITIAL_BALANCE,
              description: 'Welcome bonus',
              status: 'completed',
              createdAt: new Date()
            }]
          }
        }
      },
      { 
        new: true, 
        upsert: false, 
        runValidators: true
      }
    );
    
    console.log('Initialization result:', vendor ? 'Success' : 'Not found');
    return vendor?.wallet;
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw error;
  }
};

// Get wallet balance and transactions
export const getWalletBalance = async (userIdentifier) => {
  try {
    let query;
    
    // Check if userIdentifier is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      query = { _id: userIdentifier };
    } else {
      // If not a valid ObjectId, assume it's an email
      query = { email: userIdentifier };
    }

    const vendor = await Vendor.findOne(query).select('wallet email name');

    if (!vendor) {
      throw new Error(`Vendor not found with identifier: ${userIdentifier}`);
    }

    // Format the response
    return {
      balance: vendor.wallet?.balance || 0,
      transactions: (vendor.wallet?.transactions || [])
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50)
        .map(t => ({
          ...t.toObject(),
          vendorName: vendor.name,
          vendorEmail: vendor.email
        }))
    };
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    throw new Error(error.message);
  }
};

// Get paginated wallet transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userIdentifier = req.user.email || req.user._id;

    let query;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      query = { _id: userIdentifier };
    } else {
      query = { email: userIdentifier };
    }

    const vendor = await Vendor.findOne(query);
    
    if (!vendor) {
      return res.status(404).json({ 
        error: "Vendor not found",
        details: `No vendor found with identifier: ${userIdentifier}`
      });
    }

    const transactions = (vendor.wallet?.transactions || [])
      .sort((a, b) => b.createdAt - a.createdAt);

    const totalTransactions = transactions.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedTransactions = transactions
      .slice(startIndex, endIndex)
      .map(t => ({
        ...t.toObject(),
        vendorName: vendor.name,
        vendorEmail: vendor.email
      }));

    res.json({
      currentBalance: vendor.wallet?.balance || 0,
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / parseInt(limit)),
        totalTransactions,
        hasMore: endIndex < totalTransactions,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getWalletTransactions:', error);
    res.status(500).json({ 
      error: "Failed to fetch wallet transactions",
      details: error.message 
    });
  }
};

// Create wallet order
export const createWalletOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userIdentifier = req.user.email || req.user._id;
    
    if (!amount || amount < 1) {
      return res.status(400).json({
        error: "Invalid amount. Minimum recharge amount is ₹1"
      });
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      query = { _id: userIdentifier };
    } else {
      query = { email: userIdentifier };
    }

    const vendor = await Vendor.findOne(query);
    
    if (!vendor) {
      return res.status(404).json({
        error: "Vendor not found",
        details: `No vendor found with identifier: ${userIdentifier}`
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `wallet_${vendor._id}_${Date.now()}`
    });

    res.json({
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      vendor: {
        name: vendor.name,
        email: vendor.email
      }
    });
  } catch (error) {
    console.error('Error in createWalletOrder:', error);
    res.status(500).json({
      error: "Failed to create wallet order",
      details: error.message
    });
  }
};

// Verify wallet payment
export const verifyWalletPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userIdentifier = req.user.email || req.user._id;
    
    let query;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      query = { _id: userIdentifier };
    } else {
      query = { email: userIdentifier };
    }

    const vendor = await Vendor.findOne(query);
    
    if (!vendor) {
      return res.status(404).json({
        error: "Vendor not found",
        details: `No vendor found with identifier: ${userIdentifier}`
      });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        error: "Invalid payment signature"
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountInRupees = payment.amount / 100;

    // Update vendor wallet
    vendor.wallet.balance += amountInRupees;
    vendor.wallet.transactions.push({
      type: 'credit',
      amount: amountInRupees,
      description: 'Wallet recharge',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed',
      createdAt: new Date()
    });

    await vendor.save();

    res.json({
      success: true,
      balance: vendor.wallet.balance,
      transaction: vendor.wallet.transactions[vendor.wallet.transactions.length - 1],
      vendor: {
        name: vendor.name,
        email: vendor.email
      }
    });
  } catch (error) {
    console.error('Error in verifyWalletPayment:', error);
    res.status(500).json({
      error: "Failed to verify payment",
      details: error.message
    });
  }
};

// Deduct balance for test users
export const deductTestUserBalance = async (req, res) => {
  try {
    const { testId, usersCount } = req.body;
    const vendorId = req.user._id;

    // Get current price per user
    const settings = await SystemSettings.findOne();
    const pricePerUser = settings.testPricing.pricePerUser;
    const totalAmount = pricePerUser * usersCount;

    // Check vendor balance
    const vendor = await Vendor.findById(vendorId);
    if (!vendor.hasSufficientBalance(totalAmount)) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: totalAmount,
        current: vendor.wallet.balance
      });
    }

    // Deduct balance
    vendor.wallet.balance -= totalAmount;
    vendor.wallet.transactions.push({
      type: 'debit',
      amount: totalAmount,
      description: `Test user access fee for ${usersCount} users`,
      testId,
      usersCount,
      status: 'completed'
    });

    await vendor.save();

    res.json({
      success: true,
      deducted: totalAmount,
      remainingBalance: vendor.wallet.balance,
      transaction: vendor.wallet.transactions[vendor.wallet.transactions.length - 1]
    });
  } catch (error) {
    console.error('Error deducting test user balance:', error);
    res.status(500).json({ error: error.message });
  }
};
  