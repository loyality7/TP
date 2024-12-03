import User from '../models/user.model.js';
import { parse } from 'csv-parse';
import { validateEmail } from '../utils/validation.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import SystemSettings from '../models/systemSettings.model.js';
import Vendor from '../models/vendor.model.js';
import Test from '../models/test.model.js';
import mongoose from 'mongoose';
import TestAccess from '../models/testAccess.model.js';
import { sendTestInvitation } from '../utils/email.js';

/**
 * Add users to a test manually
 */
export const addTestUsers = async (req, res) => {
  try {
    const { testId } = req.params;
    const { users, validUntil, maxAttempts = 1 } = req.body;
    const vendorId = req.user._id;

    console.log('Adding users for vendor:', vendorId);

    // First check if the vendor exists in users collection
    const vendorUser = await User.findOne({ 
      _id: vendorId,
      role: 'vendor'
    });

    if (!vendorUser) {
      return res.status(404).json({ 
        error: "Vendor user not found" 
      });
    }

    // Find or create vendor profile
    let vendor = await Vendor.findOne({
      $or: [
        { userId: vendorId },
        { email: vendorUser.email }
      ]
    });

    if (!vendor) {
      // Create new vendor profile if it doesn't exist
      vendor = await Vendor.create({
        userId: vendorId,
        email: vendorUser.email,
        name: vendorUser.name,
        company: vendorUser.company || 'Default Company',
        status: 'approved',
        wallet: {
          balance: 0,
          currency: 'USD'
        }
      });
      console.log('Created new vendor profile:', vendor._id);
    } else {
      console.log('Found existing vendor profile:', vendor._id);
    }

    // Get and validate test
    const test = await Test.findOne({ 
      _id: testId,
      vendor: vendorId 
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have access" 
      });
    }

    // Initialize access control if needed
    if (!test.accessControl) {
      test.accessControl = {
        type: 'private',
        allowedUsers: [],
        allowedEmails: [],
        currentUserCount: 0
      };
    }

    // Process users
    const results = [];
    const summary = { totalProcessed: users.length, added: 0, duplicates: 0, errors: 0 };

    for (const userData of users) {
      try {
        // Check for existing access
        const existingAccess = await TestAccess.findOne({
          test: testId,
          $or: [
            { 'userEmail': userData.email },
            { user: { $exists: true } }
          ]
        });

        if (existingAccess) {
          results.push({
            email: userData.email,
            status: 'duplicate',
            message: 'User already has access'
          });
          summary.duplicates++;
          continue;
        }

        // Create test access
        const testAccess = await TestAccess.create({
          test: testId,
          userEmail: userData.email,
          vendor: vendor._id,
          validUntil: new Date(validUntil),
          maxAttempts,
          status: 'active'
        });

        // Update test's access control
        if (!test.accessControl.allowedEmails.includes(userData.email)) {
          test.accessControl.allowedEmails.push(userData.email);
          test.accessControl.allowedUsers.push({
            email: userData.email,
            name: userData.name,
            addedAt: new Date()
          });
          test.accessControl.currentUserCount++;
        }

        results.push({
          email: userData.email,
          status: 'success',
          accessId: testAccess._id
        });
        summary.added++;

      } catch (error) {
        console.error(`Error processing user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          status: 'error',
          message: error.message
        });
        summary.errors++;
      }
    }

    // Save test changes
    test.markModified('accessControl');
    await test.save();

    // Before sending response, convert Buffer to proper user objects
    const sanitizedAllowedUsers = test.accessControl.allowedUsers.map(user => {
      if (user.buffer) {
        return {
          email: userData.email,
          name: userData.name,
          addedAt: new Date()
        };
      }
      return user;
    });

    res.json({
      message: "Users processed successfully",
      results,
      summary,
      accessControl: {
        type: test.accessControl.type,
        allowedUsers: sanitizedAllowedUsers,
        allowedEmails: test.accessControl.allowedEmails,
        currentUserCount: test.accessControl.currentUserCount
      }
    });

  } catch (error) {
    console.error('Error in addTestUsers:', error);
    res.status(500).json({
      error: "Failed to process users",
      details: error.message
    });
  }
};

/**
 * Add users to a test via CSV upload
 */
export const uploadTestUsers = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file;
    const test = req.test;
    const { validUntil, maxAttempts } = req.body;

    // Track emails to check for duplicates in CSV
    const seenEmails = new Set();
    const duplicateEmails = new Set();

    csv.parse(file.data, {
      columns: true,
      skip_empty_lines: true,
      on_record: (record) => {
        const email = record.email?.trim();
        if (seenEmails.has(email)) {
          duplicateEmails.add(email);
        }
        seenEmails.add(email);
        return record;
      }
    });

    if (duplicateEmails.size > 0) {
      return res.status(400).json({
        message: "Duplicate emails found in CSV",
        duplicateEmails: Array.from(duplicateEmails)
      });
    }

    // Parse CSV
    const results = await new Promise((resolve, reject) => {
      const results = {
        addedUsers: [],
        duplicateUsers: [],
        summary: {
          totalProcessed: 0,
          added: 0,
          duplicates: 0,
          invalid: 0
        }
      };

      csv.parse(file.data, {
        columns: true,
        skip_empty_lines: true
      })
        .on('data', async (row) => {
          results.summary.totalProcessed++;
          
          const email = row.email?.trim();
          const name = row.name?.trim();

          if (!email || !validateEmail(email)) {
            results.summary.invalid++;
            return;
          }

          // Check if user exists in database
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            if (!existingUser.availableTests?.includes(test._id)) {
              existingUser.availableTests = existingUser.availableTests || [];
              existingUser.availableTests.push(test._id);
              await existingUser.save();
            }
          }

          // Check for duplicate
          const isExistingUser = test.accessControl.allowedUsers?.some(
            userId => userId.toString() === email
          );

          if (isExistingUser) {
            results.duplicateUsers.push({ email, name });
            results.summary.duplicates++;
            return;
          }

          // Add new user
          if (!test.accessControl.allowedUsers) {
            test.accessControl.allowedUsers = [];
          }
          
          test.accessControl.allowedUsers.push(email);
          test.accessControl.currentUserCount++;
          
          results.addedUsers.push({ email, name });
          results.summary.added++;
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    // Update test settings if provided
    if (validUntil) {
      test.accessControl.validUntil = new Date(validUntil);
    }
    if (maxAttempts) {
      test.accessControl.maxAttempts = maxAttempts;
    }

    await test.save();

    if (results.summary.added === 0 && results.summary.duplicates > 0) {
      return res.status(409).json({
        message: "All users already exist in this test",
        duplicateUsers: results.duplicateUsers
      });
    }

    res.json({
      message: "CSV processed successfully",
      ...results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove users from a test
 */
export const removeTestUsers = async (req, res) => {
  try {
    const { emails } = req.body;
    const test = req.test;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: "Emails array is required" });
    }

    const results = {
      removedUsers: [],
      notFoundUsers: [],
      summary: {
        totalProcessed: emails.length,
        removed: 0,
        notFound: 0
      }
    };

    for (const email of emails) {
      // Check if user exists in allowed users
      const userIndex = test.accessControl.allowedUsers?.findIndex(
        userId => userId.toString() === email
      );

      if (userIndex === -1) {
        results.notFoundUsers.push(email);
        results.summary.notFound++;
        continue;
      }

      // Remove user
      test.accessControl.allowedUsers.splice(userIndex, 1);
      test.accessControl.currentUserCount--;
      
      results.removedUsers.push(email);
      results.summary.removed++;
    }

    await test.save();

    if (results.summary.removed === 0) {
      return res.status(404).json({
        message: "No users were found to remove",
        notFoundUsers: results.notFoundUsers
      });
    }

    res.json({
      message: "Users removed successfully",
      ...results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadUsersFromCSV = async (req, res) => {
  // ... implementation remains the same ...
}; 

// Add this new method to handle test completion and wallet deduction
export const handleTestCompletion = async (testId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const vendor = await Vendor.findById(test.vendor);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Get current price per user
    const settings = await SystemSettings.findOne();
    const pricePerUser = settings?.testPricing?.pricePerUser || 4.35; // Default price

    // Check if vendor has sufficient balance
    if (vendor.wallet.balance < pricePerUser) {
      throw new Error(`Insufficient wallet balance. Required: ₹${pricePerUser}, Available: ₹${vendor.wallet.balance}`);
    }

    // Deduct from vendor's wallet
    vendor.wallet.balance -= pricePerUser;
    
    // Prevent negative balance
    if (vendor.wallet.balance < 0) {
      throw new Error('Transaction would result in negative balance');
    }

    vendor.wallet.transactions.push({
      type: 'debit',
      amount: pricePerUser,
      description: `Test completion fee for user ${userId}`,
      testId: test._id,
      usersCount: 1,
      status: 'completed',
      createdAt: new Date()
    });

    await vendor.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      deducted: pricePerUser,
      remainingBalance: vendor.wallet.balance
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in handleTestCompletion:', error);
    throw error;
  } finally {
    session.endSession();
  }
}; 

// Handle test start - mark payment as non-refundable
export const handleTestStart = async (testId, userEmail) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // Find and update user's test status
    const userIndex = test.accessControl.allowedUsers.findIndex(
      user => user.email === userEmail
    );

    if (userIndex === -1) {
      throw new Error('User not found in test');
    }

    // Mark test as started and payment as non-refundable
    test.accessControl.allowedUsers[userIndex].testStarted = true;
    test.accessControl.allowedUsers[userIndex].paymentStatus = 'confirmed';
    await test.save({ session });

    // Update transaction to non-refundable
    await Vendor.updateOne(
      { 
        _id: test.vendor,
        'wallet.transactions': {
          $elemMatch: {
            testId: test._id,
            refundable: true
          }
        }
      },
      {
        $set: {
          'wallet.transactions.$.refundable': false
        }
      },
      { session }
    );

    await session.commitTransaction();
    return true;

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in handleTestStart:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

// Handle user removal and refund if test not started
export const removeTestUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { testId } = req.params;
    const { email } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Find user in test
    const userIndex = test.accessControl.allowedUsers.findIndex(
      user => user.email === email
    );

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found in test" });
    }

    const user = test.accessControl.allowedUsers[userIndex];

    // Check if test was started
    if (user.testStarted) {
      return res.status(400).json({
        error: "Cannot remove user and refund payment - test already started"
      });
    }

    // Process refund
    const vendor = await Vendor.findById(test.vendor);
    if (user.paymentStatus === 'deducted') {
      vendor.wallet.balance += user.paymentAmount;
      vendor.wallet.transactions.push({
        type: 'credit',
        amount: user.paymentAmount,
        description: `Refund for removed user ${email} from test`,
        testId: test._id,
        usersCount: 1,
        status: 'completed',
        createdAt: new Date()
      });
    }

    // Remove user from test
    test.accessControl.allowedUsers.splice(userIndex, 1);
    test.accessControl.currentUserCount--;

    await test.save({ session });
    await vendor.save({ session });
    await session.commitTransaction();

    res.json({
      message: "User removed and payment refunded successfully",
      refundAmount: user.paymentAmount,
      vendorBalance: vendor.wallet.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in removeTestUser:', error);
    res.status(500).json({
      error: "Failed to remove user and process refund",
      details: error.message
    });
  } finally {
    session.endSession();
  }
}; 