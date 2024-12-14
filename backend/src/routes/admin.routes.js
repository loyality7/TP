import express from 'express';
import { isAdmin } from '../middleware/auth.middleware.js';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import User from '../models/user.model.js';
import Vendor from '../models/vendor.model.js';
import Test from '../models/test.model.js';
import TestResult from '../models/testResult.model.js';
import bcrypt from 'bcryptjs';
import SystemSettings from '../models/systemSettings.model.js';
import { adminAddFunds } from '../controllers/vendorWallet.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     VendorStatus:
 *       type: string
 *       enum: [pending, approved, rejected]
 *       default: pending
 *     VendorResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/VendorStatus'
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         approvedBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *     VendorCreateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Vendor created successfully"
 *         vendor:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "65738a8c987bd547265a1234"
 *             name:
 *               type: string
 *               example: "Innovation Testing Corp"
 *             username:
 *               type: string
 *               example: "innovatest"
 *             email:
 *               type: string
 *               example: "contact@innovatest.com"
 *             role:
 *               type: string
 *               example: "vendor"
 *             company:
 *               type: string
 *               example: "Innovation Testing Corporation"
 *             phone:
 *               type: string
 *               example: "+1-555-987-6543"
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                   example: "456 Innovation Drive"
 *                 city:
 *                   type: string
 *                   example: "Austin"
 *                 state:
 *                   type: string
 *                   example: "Texas"
 *                 country:
 *                   type: string
 *                   example: "USA"
 *                 zipCode:
 *                   type: string
 *                   example: "73301"
 *             settings:
 *               type: object
 *               properties:
 *                 notificationPreferences:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                       example: true
 *                     sms:
 *                       type: boolean
 *                       example: true
 *                 defaultTestSettings:
 *                   type: object
 *                   properties:
 *                     maxAttempts:
 *                       type: number
 *                       example: 5
 *                     validityDuration:
 *                       type: number
 *                       example: 45
 *             subscription:
 *               type: object
 *               properties:
 *                 plan:
 *                   type: string
 *                   example: "premium"
 *                 validUntil:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-12-31T23:59:59.999Z"
 *             status:
 *               type: string
 *               example: "pending"
 *             isActive:
 *               type: boolean
 *               example: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-11-15T08:30:00.000Z"
 *         temporaryPassword:
 *           type: string
 *           example: "Vendor@x1y2z3"
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', isAdmin, async (req, res) => {
  try {
    // Always exclude vendors from users list
    const query = { role: { $ne: 'vendor' } };  // Exclude vendors by default

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Add summary information (excluding vendor counts)
    res.json({
      users,
      count: users.length,
      roleSummary: {
        total: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors:
 *   get:
 *     summary: Get all vendors (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/vendors', isAdmin, async (req, res) => {
  try {
    // Query users with vendor role
    const vendorUsers = await User.find({ role: 'vendor' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get all vendor emails
    const vendorEmails = vendorUsers.map(user => user.email);

    // Get vendor statuses from Vendor collection
    const vendorStatuses = await Vendor.find({
      email: { $in: vendorEmails }
    }).select('email status approvedAt approvedBy rejectedAt rejectedBy rejectionReason');

    // Map vendor statuses to users
    const vendors = vendorUsers.map(user => {
      const vendorInfo = vendorStatuses.find(v => v.email === user.email);
      return {
        ...user.toObject(),
        status: vendorInfo?.status || 'pending',
        approvedAt: vendorInfo?.approvedAt,
        approvedBy: vendorInfo?.approvedBy,
        rejectedAt: vendorInfo?.rejectedAt,
        rejectedBy: vendorInfo?.rejectedBy,
        rejectionReason: vendorInfo?.rejectionReason
      };
    });

    // Add a message if no vendors found
    if (!vendors.length) {
      return res.status(200).json({
        message: "No vendors found in the system",
        vendors: [],
        count: 0,
        statusSummary: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        }
      });
    }

    // Return vendors with count and status summary
    res.json({
      vendors,
      count: vendors.length,
      statusSummary: {
        total: vendors.length,
        pending: vendors.filter(v => !v.status || v.status === 'pending').length,
        approved: vendors.filter(v => v.status === 'approved').length,
        rejected: vendors.filter(v => v.status === 'rejected').length
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ 
      message: "Error fetching vendors", 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/roles:
 *   post:
 *     summary: Create new role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/roles', isAdmin, async (req, res) => {
  try {
    // Implement role creation logic here
    res.status(201).json({ message: "Role created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   get:
 *     summary: Get all permissions (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/permissions', isAdmin, async (req, res) => {
  try {
    // Implement permissions listing logic here
    const permissions = [
      'manage_users',
      'manage_vendors',
      'manage_roles',
      'view_reports',
      // Add more permissions as needed
    ];
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   put:
 *     summary: Update user details (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               email:
 *                 type: string
 */
router.put('/users/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: req.body },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/approve/{vendorId}:
 *   post:
 *     summary: Approve vendor application (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/vendors/approve/:vendorId', isAdmin, async (req, res) => {
  try {
    // First find the vendor user account
    const vendorUser = await User.findById(req.params.vendorId);
    if (!vendorUser) {
      return res.status(404).json({ message: 'Vendor user not found' });
    }

    console.log('Found vendor user:', vendorUser);

    // Check if vendor record exists
    let vendor = await Vendor.findOne({ 
      $or: [
        { _id: vendorUser._id },
        { email: vendorUser.email }
      ] 
    });

    console.log('Existing vendor record:', vendor);

    if (!vendor) {
      // Create new vendor record with the SAME ID as the user
      vendor = new Vendor({
        _id: vendorUser._id, // Important: Use the same ID
        name: vendorUser.name,
        email: vendorUser.email,
        company: vendorUser.company || vendorUser.name,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user._id,
        settings: {
          notificationPreferences: {
            email: true,
            sms: false
          },
          defaultTestSettings: {
            maxAttempts: 1,
            validityDuration: 7
          }
        },
        subscription: {
          plan: 'free'
        },
        wallet: {
          balance: 10,
          transactions: [{
            type: 'credit',
            amount: 10,
            description: 'Welcome bonus',
            status: 'completed',
            createdAt: new Date()
          }]
        }
      });

      console.log('Creating new vendor profile:', vendor);
      await vendor.save();
    } else {
      // Update existing vendor
      vendor.status = 'approved';
      vendor.approvedAt = new Date();
      vendor.approvedBy = req.user._id;
      await vendor.save();
    }

    // Update user role and status
    await User.findByIdAndUpdate(
      vendorUser._id,
      { 
        $set: { 
          role: 'vendor',
          isActive: true,
          isApproved: true
        } 
      }
    );

    console.log('Final vendor profile:', vendor);

    res.json(vendor);
  } catch (error) {
    console.error('Vendor approval error:', error);
    res.status(500).json({ 
      message: 'Error approving vendor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/admin/vendors/reject/{vendorId}:
 *   post:
 *     summary: Reject vendor application (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 required: true
 */
router.post('/vendors/reject/:vendorId', isAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { 
        $set: { 
          status: 'rejected', 
          rejectedAt: new Date(),
          rejectedBy: req.user._id,
          rejectionReason
        } 
      },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/system/settings:
 *   get:
 *     summary: Get system settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/system/settings', isAdmin, async (req, res) => {
  try {
    // Implement getting system settings
    const settings = {
      maintenance_mode: false,
      user_registration_enabled: true,
      vendor_applications_open: true,
      system_version: '1.0.0',
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/system/settings:
 *   put:
 *     summary: Update system settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenance_mode:
 *                 type: boolean
 *               user_registration_enabled:
 *                 type: boolean
 *               vendor_applications_open:
 *                 type: boolean
 */
router.put('/system/settings', isAdmin, async (req, res) => {
  try {
    // Implement updating system settings
    const settings = {
      ...req.body,
      last_updated: new Date(),
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/tests:
 *   get:
 *     summary: Get all tests (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tests
 */
router.get('/tests', isAdmin, async (req, res) => {
  try {
    const tests = await Test.find({}).populate('vendor', 'name email');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/tests:
 *   get:
 *     summary: Get all tests for a specific vendor (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/vendors/:vendorId/tests', isAdmin, async (req, res) => {
  try {
    const tests = await Test.find({ vendor: req.params.vendorId });
    if (!tests.length) {
      return res.status(404).json({ message: 'No tests found for this vendor' });
    }
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/tests:
 *   get:
 *     summary: Get all test results for a specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/users/:userId/tests', isAdmin, async (req, res) => {
  try {
    const testResults = await TestResult.find({ user: req.params.userId })
      .populate('test', 'title description')
      .populate('user', 'name email');
    if (!testResults.length) {
      return res.status(404).json({ message: 'No test results found for this user' });
    }
    res.json(testResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/metrics/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/metrics/dashboard', isAdmin, async (req, res) => {
  try {
    // Time ranges
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Basic counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalVendors = await Vendor.countDocuments();
    const pendingVendors = await Vendor.countDocuments({ status: 'pending' });
    const totalTests = await Test.countDocuments();
    const totalTestResults = await TestResult.countDocuments();

    // User-related metrics
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    const userGrowthRate = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    // User engagement metrics
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Modified test metrics
    const testResults = await TestResult.find({});
    const attemptedTests = await TestResult.countDocuments({ 
      status: { $in: ['in_progress', 'completed'] } 
    });

    const testPerformanceByCategory = await Test.aggregate([
      {
        $lookup: {
          from: 'testresults',
          localField: '_id',
          foreignField: 'test',
          as: 'results'
        }
      },
      {
        $group: {
          _id: "$category",
          averageScore: { $avg: { $avg: "$results.score" } },
          totalAttempts: { $sum: { $size: "$results" } },
          inProgressAttempts: {
            $sum: {
              $size: {
                $filter: {
                  input: "$results",
                  as: "result",
                  cond: { $eq: ["$$result.status", "in_progress"] }
                }
              }
            }
          }
        }
      }
    ]);

    const hourlyTestActivity = await TestResult.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Vendor metrics
    const vendorApprovalRate = await Vendor.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$approvedAt" } },
          approved: { 
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    const vendorsByIndustry = await Vendor.aggregate([
      {
        $group: {
          _id: "$industry",
          count: { $sum: 1 }
        }
      }
    ]);

    // Test result analysis
    const testResultTrends = await TestResult.aggregate([
      {
        $group: {
          _id: { 
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
          },
          averageScore: { $avg: "$score" },
          totalAttempts: { $sum: 1 },
          passRate: {
            $avg: { $cond: [{ $gte: ["$score", 70] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalVendors,
        totalTests,
        totalTestResults,
        pendingVendors,
        attemptedTests,
        inProgressTests: attemptedTests - totalTestResults,
      },
      userMetrics: {
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthRate,
        usersByRole,
        activeUsersPercentage: (activeUsers / totalUsers) * 100,
        inactiveUsers: totalUsers - activeUsers,
      },
      vendorMetrics: {
        approvalRate: vendorApprovalRate,
        industryDistribution: vendorsByIndustry,
        averageApprovalTime: "72 hours", // You can calculate this based on actual data
        topVendorsByTests: await Test.aggregate([
          { $group: { _id: "$vendor", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
      },
      testMetrics: {
        performanceByCategory: testPerformanceByCategory,
        hourlyActivity: hourlyTestActivity,
        resultTrends: testResultTrends,
        popularTests: await Test.aggregate([
          {
            $lookup: {
              from: 'testresults',
              localField: '_id',
              foreignField: 'test',
              as: 'attempts'
            }
          },
          {
            $project: {
              title: 1,
              attemptCount: { $size: "$attempts" },
              inProgressCount: {
                $size: {
                  $filter: {
                    input: "$attempts",
                    as: "attempt",
                    cond: { $eq: ["$$attempt.status", "in_progress"] }
                  }
                }
              },
              averageScore: { $avg: "$attempts.score" }
            }
          },
          { $sort: { attemptCount: -1 } },
          { $limit: 5 }
        ]),
      },
      engagementMetrics: {
        averageTestsPerUser: totalTestResults / activeUsers,
        completionRate: await TestResult.aggregate([
          {
            $group: {
              _id: null,
              completed: { 
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
              },
              total: { $sum: 1 }
            }
          }
        ]),
        userRetentionRate: "78%", // You can calculate this based on return users
      },
      timeBasedMetrics: {
        peakTestingHours: hourlyTestActivity,
        weeklyActivity: await TestResult.aggregate([
          {
            $group: {
              _id: { $dayOfWeek: "$createdAt" },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        monthlyTrends: testResultTrends,
      },
      systemHealth: {
        status: 'healthy',
        lastUpdated: new Date(),
        version: '1.0.0',
        averageResponseTime: '250ms',
        uptime: '99.9%',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/analytics/candidate-performance:
 *   get:
 *     summary: Get candidate performance analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *         description: Time period for analytics
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Test category filter
 *     responses:
 *       200:
 *         description: Candidate performance analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/analytics/candidate-performance', isAdmin, async (req, res) => {
  try {
    const { timeframe = 'month', category } = req.query;
    
    // Calculate date range based on timeframe
    const getDateRange = () => {
      const now = new Date();
      switch (timeframe) {
        case 'week':
          return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case 'year':
          return new Date(now - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0); // Beginning of time for 'all'
      }
    };

    const dateFilter = { createdAt: { $gte: getDateRange() } };
    const categoryFilter = category ? { category } : {};

    // Aggregate test results with various metrics
    const performanceMetrics = await TestResult.aggregate([
      {
        $match: dateFilter
      },
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      {
        $unwind: '$testDetails'
      },
      {
        $match: categoryFilter
      },
      {
        $group: {
          _id: null,
          totalCandidates: { $addToSet: '$user' },
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
          totalAttempts: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $gte: ['$score', 70] }, 1, 0] }
          },
          scoreDistribution: {
            $push: '$score'
          },
          timeDistribution: {
            $push: '$duration'
          },
          categoryPerformance: {
            $push: {
              category: '$testDetails.category',
              score: '$score'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalCandidates: { $size: '$totalCandidates' },
          averageScore: { $round: ['$averageScore', 2] },
          highestScore: 1,
          lowestScore: 1,
          totalAttempts: 1,
          passRate: {
            $multiply: [
              { $divide: ['$passCount', '$totalAttempts'] },
              100
            ]
          },
          scoreDistribution: 1,
          timeDistribution: 1,
          categoryPerformance: 1
        }
      }
    ]);

    // Get performance trends over time
    const performanceTrends = await TestResult.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          averageScore: { $avg: '$score' },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Calculate skill gap analysis
    const skillGapAnalysis = await Test.aggregate([
      {
        $lookup: {
          from: 'testresults',
          localField: '_id',
          foreignField: 'test',
          as: 'results'
        }
      },
      {
        $unwind: '$results'
      },
      {
        $match: {
          'results.createdAt': { $gte: getDateRange() }
        }
      },
      {
        $group: {
          _id: '$category',
          averageScore: { $avg: '$results.score' },
          expectedScore: { $first: '$passingScore' },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          skillGap: {
            $subtract: ['$expectedScore', '$averageScore']
          },
          averageScore: 1,
          totalAttempts: 1
        }
      }
    ]);

    res.json({
      summary: performanceMetrics[0] || {
        totalCandidates: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalAttempts: 0,
        passRate: 0
      },
      trends: {
        performanceOverTime: performanceTrends,
        skillGapAnalysis
      },
      timeframe,
      category: category || 'all',
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/create:
 *   post:
 *     summary: Create a new vendor (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - username
 *               - company
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   notificationPreferences:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                       sms:
 *                         type: boolean
 *                   defaultTestSettings:
 *                     type: object
 *                     properties:
 *                       maxAttempts:
 *                         type: number
 *                       validityDuration:
 *                         type: number
 *               subscription:
 *                 type: object
 *                 properties:
 *                   plan:
 *                     type: string
 *                     enum: [free, basic, premium]
 *                   validUntil:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorCreateResponse'
 *             example:
 *               message: "Vendor created successfully"
 *               vendor:
 *                 _id: "65738a8c987bd547265a1234"
 *                 name: "Innovation Testing Corp"
 *                 username: "innovatest"
 *                 email: "contact@innovatest.com"
 *                 role: "vendor"
 *                 company: "Innovation Testing Corporation"
 *                 phone: "+1-555-987-6543"
 *                 address:
 *                   street: "456 Innovation Drive"
 *                   city: "Austin"
 *                   state: "Texas"
 *                   country: "USA"
 *                   zipCode: "73301"
 *                 settings:
 *                   notificationPreferences:
 *                     email: true
 *                     sms: true
 *                   defaultTestSettings:
 *                     maxAttempts: 5
 *                     validityDuration: 45
 *                 subscription:
 *                   plan: "premium"
 *                   validUntil: "2025-12-31T23:59:59.999Z"
 *                 status: "pending"
 *                 isActive: true
 *                 createdAt: "2024-11-15T08:30:00.000Z"
 *               temporaryPassword: "Vendor@x1y2z3"
 *       400:
 *         description: Bad request - Email already exists or invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/vendors/create', isAdmin, async (req, res) => {
  try {
    // First check if a user/vendor with this email already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === req.body.email ? 
          'Email already registered' : 
          'Username already taken' 
      });
    }

    // Create a password for the vendor
    const defaultPassword = 'Vendor@' + Math.random().toString(36).slice(-8);

    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create the user with vendor role
    const newVendor = new User({
      name: req.body.name,
      username: req.body.username || req.body.email.split('@')[0], // Use email prefix as username if not provided
      email: req.body.email,
      password: hashedPassword,
      role: 'vendor',
      company: req.body.company,
      phone: req.body.phone,
      address: req.body.address,
      settings: req.body.settings,
      subscription: req.body.subscription,
      status: 'pending', // Default status for new vendors
      createdAt: new Date(),
      isActive: true
    });

    // Save the vendor
    await newVendor.save();

    // Remove password from response
    const vendorResponse = newVendor.toObject();
    delete vendorResponse.password;

    // Send response with the temporary password
    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: vendorResponse,
      temporaryPassword: defaultPassword // In production, you'd want to send this via email
    });

  } catch (error) {
    console.error('Vendor creation error:', error);
    res.status(500).json({ 
      message: 'Error creating vendor', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}:
 *   get:
 *     summary: Get vendor details by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/vendors/:vendorId', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId)
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}:
 *   put:
 *     summary: Update vendor details (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   notificationPreferences:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                       sms:
 *                         type: boolean
 *                   defaultTestSettings:
 *                     type: object
 *                     properties:
 *                       maxAttempts:
 *                         type: number
 *                       validityDuration:
 *                         type: number
 */
router.put('/vendors/:vendorId', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/subscription:
 *   put:
 *     summary: Update vendor subscription (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - validUntil
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, basic, premium]
 *               validUntil:
 *                 type: string
 *                 format: date-time
 */
router.put('/vendors/:vendorId/subscription', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { $set: { subscription: req.body } },
      { new: true }
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/settings:
 *   put:
 *     summary: Update vendor settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *               defaultTestSettings:
 *                 type: object
 *                 properties:
 *                   maxAttempts:
 *                     type: number
 *                   validityDuration:
 *                     type: number
 */
router.put('/vendors/:vendorId/settings', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { $set: { settings: req.body } },
      { new: true }
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}:
 *   delete:
 *     summary: Delete vendor (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/vendors/:vendorId', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/pending:
 *   get:
 *     summary: Get all pending vendor applications (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending vendor applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VendorResponse'
 *                 count:
 *                   type: number
 */
router.get('/vendors/pending', isAdmin, async (req, res) => {
  try {
    const pendingVendors = await Vendor.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      vendors: pendingVendors,
      count: pendingVendors.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/approve/{vendorId}:
 *   post:
 *     summary: Approve a vendor application (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorResponse'
 */
router.post('/vendors/approve/:vendorId', isAdmin, async (req, res) => {
  try {
    // First find the vendor user account
    const vendorUser = await User.findById(req.params.vendorId);
    if (!vendorUser) {
      return res.status(404).json({ message: 'Vendor user not found' });
    }

    console.log('Found vendor user:', vendorUser);

    // Check if vendor record exists
    let vendor = await Vendor.findOne({ 
      $or: [
        { _id: vendorUser._id },
        { email: vendorUser.email }
      ] 
    });

    console.log('Existing vendor record:', vendor);

    if (!vendor) {
      // Create new vendor record with the SAME ID as the user
      vendor = new Vendor({
        _id: vendorUser._id, // Important: Use the same ID
        name: vendorUser.name,
        email: vendorUser.email,
        company: vendorUser.company || vendorUser.name,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user._id,
        settings: {
          notificationPreferences: {
            email: true,
            sms: false
          },
          defaultTestSettings: {
            maxAttempts: 1,
            validityDuration: 7
          }
        },
        subscription: {
          plan: 'free'
        },
        wallet: {
          balance: 10,
          transactions: [{
            type: 'credit',
            amount: 10,
            description: 'Welcome bonus',
            status: 'completed',
            createdAt: new Date()
          }]
        }
      });

      console.log('Creating new vendor profile:', vendor);
      await vendor.save();
    } else {
      // Update existing vendor
      vendor.status = 'approved';
      vendor.approvedAt = new Date();
      vendor.approvedBy = req.user._id;
      await vendor.save();
    }

    // Update user role and status
    await User.findByIdAndUpdate(
      vendorUser._id,
      { 
        $set: { 
          role: 'vendor',
          isActive: true,
          isApproved: true
        } 
      }
    );

    console.log('Final vendor profile:', vendor);

    res.json(vendor);
  } catch (error) {
    console.error('Vendor approval error:', error);
    res.status(500).json({ 
      message: 'Error approving vendor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/admin/vendors/reject/{vendorId}:
 *   post:
 *     summary: Reject a vendor application (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorResponse'
 */
router.post('/vendors/reject/:vendorId', isAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Find the vendor
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if vendor is already approved or rejected
    if (vendor.status === 'rejected') {
      return res.status(400).json({ message: 'Vendor is already rejected' });
    }
    if (vendor.status === 'approved') {
      return res.status(400).json({ message: 'Cannot reject an approved vendor' });
    }

    // Update vendor status
    vendor.status = 'rejected';
    vendor.rejectedAt = new Date();
    vendor.rejectedBy = req.user._id;
    vendor.rejectionReason = rejectionReason;
    vendor.approvedAt = null;
    vendor.approvedBy = null;

    await vendor.save();

    // Update associated user account
    await User.findOneAndUpdate(
      { email: vendor.email },
      { 
        $set: { 
          isApproved: false
        } 
      }
    );

    // Populate rejector details
    await vendor.populate('rejectedBy', 'name email');

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/status/{status}:
 *   get:
 *     summary: Get vendors by status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of vendors filtered by status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VendorResponse'
 *                 count:
 *                   type: number
 */
router.get('/vendors/status/:status', isAdmin, async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vendors = await Vendor.find({ status })
      .select('-password')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      vendors,
      count: vendors.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/reset-status:
 *   post:
 *     summary: Reset vendor status to pending (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor status reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorResponse'
 */
router.post('/vendors/:vendorId/reset-status', isAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Reset status and clear approval/rejection data
    vendor.status = 'pending';
    vendor.approvedAt = null;
    vendor.approvedBy = null;
    vendor.rejectedAt = null;
    vendor.rejectedBy = null;
    vendor.rejectionReason = null;

    await vendor.save();

    // Update associated user account
    await User.findOneAndUpdate(
      { email: vendor.email },
      { 
        $set: { 
          isApproved: false
        } 
      }
    );

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/settings/test-pricing:
 *   get:
 *     summary: Get current test pricing settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current test pricing settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pricePerUser:
 *                   type: number
 *                   description: Price per user per test in INR
 *                 lastUpdatedAt:
 *                   type: string
 *                   format: date-time
 *                 lastUpdatedBy:
 *                   type: string
 *                   description: Admin ID who last updated the pricing
 *   put:
 *     summary: Update test pricing settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricePerUser
 *             properties:
 *               pricePerUser:
 *                 type: number
 *                 description: New price per user per test in INR
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pricePerUser:
 *                   type: number
 *                 lastUpdatedAt:
 *                   type: string
 *                   format: date-time
 *                 lastUpdatedBy:
 *                   type: string
 */
router.put('/settings/test-pricing', isAdmin, async (req, res) => {
  try {
    const { pricePerUser } = req.body;
    
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { 
        $set: {
          'testPricing.pricePerUser': pricePerUser,
          'testPricing.lastUpdatedAt': new Date(),
          'testPricing.lastUpdatedBy': req.user._id
        }
      },
      { new: true, upsert: true }
    );

    res.json(settings.testPricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/vendor/wallet/add-funds:
 *   post:
 *     summary: Add funds to vendor wallet (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - amount
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: ID of the vendor
 *               amount:
 *                 type: number
 *                 description: Amount to add in INR
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *     responses:
 *       200:
 *         description: Funds added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 addedAmount:
 *                   type: number
 *                 newBalance:
 *                   type: number
 *                 transaction:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.post(
  "/vendor/wallet/add-funds",
  auth,
  checkRole(["admin"]),
  adminAddFunds
);

export default router; 