import Test from '../models/test.model.js';
import mongoose from 'mongoose';

export const validateTestAccess = async (req, res, next) => {
  try {
    // Extract required parameters from request
    let testId = req.params.uuid || req.params.testId || req.body.testId;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const userRole = req.user.role;

    // Find test by UUID first, then fallback to ObjectId
    const test = await Test.findOne({
      $or: [
        { uuid: testId },
        { _id: mongoose.Types.ObjectId.isValid(testId) ? testId : null }
      ]
    });

    // Return 404 if test doesn't exist
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found",
        requiresRegistration: false 
      });
    }

    // For vendor routes, ensure the vendor owns the test
    if (userRole === 'vendor' && test.vendor.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: "You don't have permission to access this test",
        requiresRegistration: false 
      });
    }

    // Check if test is published (except for vendors and admins)
    const isAdmin = userRole === 'admin';
    const isVendor = test.vendor.toString() === userId.toString();
    
    if (!isAdmin && !isVendor && test.status !== 'published') {
      return res.status(403).json({ 
        error: "Test is not currently published",
        requiresRegistration: false 
      });
    }

    // Check access control
    const isPublicTest = test.accessControl?.type === 'public';
    const isPracticeTest = test.type === 'coding_challenge';
    const isAllowedUser = test.accessControl?.allowedUsers?.some(
      user => user.email === userEmail
    );

    // For adding users (vendor operations), check user limit
    if (isVendor && req.method === 'POST' && 
        (req.path.includes('/users/add') || req.path.includes('/users/upload'))) {
      
      // Check if there's a user limit and if it would be exceeded
      if (test.accessControl?.userLimit > 0) {
        const requestedUsers = req.body.users?.length || 1;
        const potentialTotal = (test.accessControl.currentUserCount || 0) + requestedUsers;
        
        if (potentialTotal > test.accessControl.userLimit) {
          return res.status(403).json({ 
            error: "Adding these users would exceed the test's user limit",
            currentCount: test.accessControl.currentUserCount || 0,
            limit: test.accessControl.userLimit,
            remainingSlots: test.accessControl.userLimit - (test.accessControl.currentUserCount || 0)
          });
        }
      }
    }

    // Allow access if user is admin, vendor, or allowed user
    if (!isAdmin && !isVendor && !isPublicTest && !isPracticeTest && !isAllowedUser) {
      return res.status(403).json({ 
        error: "Not authorized to access this test",
        requiresRegistration: false,
        details: {
          isAdmin,
          isVendor,
          isPublicTest,
          isPracticeTest,
          isAllowedUser,
          userEmail
        }
      });
    }

    // Ensure we use MongoDB _id for subsequent queries
    testId = test._id;
    
    // Store validated objects in request for use in subsequent middleware/routes
    req.test = test;
    next();
  } catch (error) {
    // Log and return any unexpected errors
    console.error('Test access validation error:', error);
    res.status(500).json({ 
      error: error.message,
      requiresRegistration: false 
    });
  }
}; 
