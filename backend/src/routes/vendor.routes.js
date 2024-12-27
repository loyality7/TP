import express from "express";
import { auth } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { checkVendorApproval } from '../middleware/checkVendorApproval.js';
import {
  getVendorTests,
  getTestAnalytics,
  getTestCandidates,
  sendTestInvitations,
  getTestInvitations,
  getVendorProfile,
  updateVendorProfile,
  getVendorReports,
  exportTestResults,
  getVendorTest,
  getTestUsers,
  getUserSubmissions,
  getUserMCQSubmissions,
  getSpecificMCQSubmission,
  getUserCodingSubmissions,
  getSpecificCodingSubmission,
  getUserTestResults,
  getDashboardMetrics,
  getRecentActivity,
  getAnalyticsOverview,
  getPerformanceMetrics,
  getSkillsAnalytics,
  getTimeBasedMetrics,
  getCandidateDetails,
  getCandidateSubmissions,
  deleteVendorTest,
  updateTestStatus,
  deleteInvitation,
  getCandidatePerformance,
  getTestAccessSettings,
  updateTestAccessSettings,
  updateTestUserAccess,
  removeTestUserAccess,
  uploadUsersFromCSV,
  getVendorAllCandidates,
  getCandidateMetrics,
  getCandidateTestDetails
} from "../controllers/vendor.controller.js";
import { validateTestAccess } from '../middleware/validateTestAccess.js';
import { addTestUsers, uploadTestUsers, removeTestUsers } from '../controllers/testAccess.controller.js';
import { 
  getWalletBalance, 
  getWalletTransactions,
  createWalletOrder,
  verifyWalletPayment,
  deductTestUserBalance,
  debitTestFee 
} from '../controllers/vendorWallet.controller.js';
import { checkWalletBalance } from '../middleware/checkWalletBalance.js';
import Vendor from '../models/vendor.model.js';
import Test from "../models/test.model.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Vendor Dashboard
 *     description: Dashboard and metrics related endpoints
 *   - name: Vendor Profile
 *     description: Vendor profile management
 *   - name: Vendor Tests
 *     description: Test management and operations
 *   - name: Vendor Analytics
 *     description: Analytics and reporting endpoints
 *   - name: Test Access Management
 *     description: Managing user access to tests
 *   - name: Candidate Management
 *     description: Managing and viewing candidate data
 *   - name: Vendor Wallet
 *     description: Vendor wallet management endpoints
 */

/**
 * @swagger
 * components:
 *   responses:
 *     VendorNotApproved:
 *       description: Vendor account is not approved
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Vendor account is not approved yet. Please wait for admin approval."
 *               status:
 *                 type: string
 *                 example: "pending"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [credit, debit]
 *         amount:
 *           type: number
 *           description: Transaction amount in INR
 *         description:
 *           type: string
 *         testId:
 *           type: string
 *           format: uuid
 *         usersCount:
 *           type: number
 *         paymentId:
 *           type: string
 *         orderId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     WalletBalance:
 *       type: object
 *       properties:
 *         balance:
 *           type: number
 *           description: Current wallet balance in INR
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WalletTransaction'
 */

/**
 * @swagger
 * /api/vendor/dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Vendor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTests:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                     trend:
 *                       type: number
 *                     subtitle:
 *                       type: string
 *                 activeCandidates:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                     trend:
 *                       type: number
 *                     subtitle:
 *                       type: string
 *                 passRate:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                     trend:
 *                       type: number
 *                     subtitle:
 *                       type: string
 *                 newDiscussions:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                     trend:
 *                       type: number
 *                     subtitle:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/metrics", auth, checkRole(["vendor"]), checkVendorApproval, async (req, res) => {
  try {
    const vendorId = req.user._id;
    
    // Use Vendor model to fetch vendor-specific data
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    
    // Calculate metrics
    const metrics = {
      totalTests: {
        value: tests.length,
        trend: 0,
        subtitle: "Total tests created"
      },
      activeCandidates: {
        value: 0,
        trend: 0,
        subtitle: "Active candidates"
      },
      passRate: {
        value: 0,
        trend: 0,
        subtitle: "Overall pass rate"
      },
      newDiscussions: {
        value: 0,
        trend: 0,
        subtitle: "New discussions"
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/vendor/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Vendor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   candidateName:
 *                     type: string
 *                   candidateEmail:
 *                     type: string
 *                   testTitle:
 *                     type: string
 *                   score:
 *                     type: number
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/recent-activity", auth, checkRole(["vendor"]), getRecentActivity);

/**
 * @swagger
 * /api/vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               company: { type: string }
 *               phone: { type: string }
 */
router.get("/profile", auth, checkRole(["vendor"]), getVendorProfile);
router.put("/profile", auth, checkRole(["vendor"]), updateVendorProfile);

/**
 * @swagger
 * /api/vendor/tests:
 *   get:
 *     summary: Get all tests created by vendor (requires approved vendor status)
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 count:
 *                   type: number
 *                   description: Number of tests found
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Test ID
 *                       title:
 *                         type: string
 *                         description: Title of the test
 *       403:
 *         $ref: '#/components/responses/VendorNotApproved'
 */
router.get("/tests", auth, checkRole(["vendor"]), checkVendorApproval, getVendorTests);

/**
 * @swagger
 * /api/vendor/tests/{testId}:
 *   get:
 *     summary: Get a specific test owned by the vendor
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getVendorTest);

/**
 * @swagger
 * /api/vendor/tests/{testId}:
 *   delete:
 *     summary: Delete a specific test owned by the vendor
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.delete("/tests/:testId", auth, checkRole(["vendor"]), checkVendorApproval, deleteVendorTest);

/**
 * @swagger
 * /api/vendor/tests/{testId}/status:
 *   put:
 *     summary: Update the status of a specific test owned by the vendor
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Test status updated successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.put("/tests/:testId/status", auth, checkRole(["vendor"]), checkVendorApproval, updateTestStatus);

/**
 * @swagger
 * /api/vendor/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Retrieve analytics overview with optional period filtering
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *         description: Period for which to fetch analytics (defaults to 'all')
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [today, week, month, all]
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                 tests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of tests
 *                     active:
 *                       type: integer
 *                       description: Number of published tests
 *                     draft:
 *                       type: integer
 *                       description: Number of draft tests
 *                     archived:
 *                       type: integer
 *                       description: Number of archived tests
 *                 submissions:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of submissions in period
 *                     recent:
 *                       type: integer
 *                       description: Submissions in last 7 days
 *                     uniqueCandidates:
 *                       type: integer
 *                       description: Number of unique candidates
 *                     averageScore:
 *                       type: number
 *                       description: Average score of all submissions
 *                 performance:
 *                   type: object
 *                   properties:
 *                     bestPerformingTest:
 *                       type: object
 *                       properties:
 *                         testId:
 *                           type: string
 *                         title:
 *                           type: string
 *                         scores:
 *                           type: array
 *                           items:
 *                             type: number
 *                         attempts:
 *                           type: integer
 *                         averageScore:
 *                           type: number
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           candidateName:
 *                             type: string
 *                           testTitle:
 *                             type: string
 *                           score:
 *                             type: number
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                 trends:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                     weekly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           weekStart:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor or vendor is not approved
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch analytics overview
 *                 message:
 *                   type: string
 *                   example: Error message details
 */
router.get("/analytics/overview", auth, checkRole(["vendor"]), getAnalyticsOverview);

/**
 * @swagger
 * /api/vendor/analytics/performance:
 *   get:
 *     summary: Get performance metrics
 *     description: Retrieve detailed performance metrics with period filtering
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Time period for metrics (today, week, month, or all)
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [today, week, month, all]
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                 skills:
 *                   type: object
 *                   properties:
 *                     problemSolving:
 *                       $ref: '#/components/schemas/SkillMetric'
 *                     codeQuality:
 *                       $ref: '#/components/schemas/SkillMetric'
 *                     performance:
 *                       $ref: '#/components/schemas/SkillMetric'
 *                     security:
 *                       $ref: '#/components/schemas/SkillMetric'
 *                     bestPractices:
 *                       $ref: '#/components/schemas/SkillMetric'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 * 
 * components:
 *   schemas:
 *     SkillMetric:
 *       type: object
 *       properties:
 *         score:
 *           type: number
 *         level:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced, Expert]
 *         candidates:
 *           type: integer
 *         growth:
 *           type: number
 */
router.get("/analytics/performance", auth, checkRole(["vendor"]), getPerformanceMetrics);

/**
 * @swagger
 * /api/vendor/analytics/skills:
 *   get:
 *     summary: Get skills analytics
 *     description: Retrieve detailed skills analytics with period filtering
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Skills analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                 skills:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/SkillMetric'
 *                 distribution:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       beginner:
 *                         type: number
 *                       intermediate:
 *                         type: number
 *                       advanced:
 *                         type: number
 *                       expert:
 *                         type: number
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       problemSolving:
 *                         type: number
 *                       codeQuality:
 *                         type: number
 *                       performance:
 *                         type: number
 *                       security:
 *                         type: number
 *                       bestPractices:
 *                         type: number
 */
router.get("/analytics/skills", auth, checkRole(["vendor"]), getSkillsAnalytics);

/**
 * @swagger
 * /api/vendor/analytics/time-based:
 *   get:
 *     summary: Get time-based metrics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Time-based metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completionTimeDistribution:
 *                   type: object
 *                   properties:
 *                     short:
 *                       type: number
 *                     medium:
 *                       type: number
 *                     long:
 *                       type: number
 *                 averageCompletionTime:
 *                   type: number
 *                 timeOfDayDistribution:
 *                   type: object
 *                   properties:
 *                     morning:
 *                       type: number
 *                     afternoon:
 *                       type: number
 *                     evening:
 *                       type: number
 *                     night:
 *                       type: number
 *                 dayOfWeekDistribution:
 *                   type: object
 *                   properties:
 *                     Sunday:
 *                       type: number
 *                     Monday:
 *                       type: number
 *                     Tuesday:
 *                       type: number
 *                     Wednesday:
 *                       type: number
 *                     Thursday:
 *                       type: number
 *                     Friday:
 *                       type: number
 *                     Saturday:
 *                       type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.get("/analytics/time-based", auth, checkRole(["vendor"]), getTimeBasedMetrics);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates:
 *   get:
 *     summary: Get candidates who took a specific test
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   name: { type: string }
 *                   email: { type: string }
 *                   status: { type: string }
 *                   attempts: { type: number }
 */
router.get("/tests/:testId/candidates", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestCandidates);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates/{userId}:
 *   get:
 *     summary: Get detailed test information for a specific candidate
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the candidate
 *     responses:
 *       200:
 *         description: Candidate test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidateInfo:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Candidate's full name
 *                     email:
 *                       type: string
 *                       description: Candidate's email address
 *                     status:
 *                       type: string
 *                       enum: [not_started, in_progress, completed]
 *                       description: Current test status for the candidate
 *                 testDetails:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Test title
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: When the candidate started the test
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       description: When the candidate completed the test
 *                     duration:
 *                       type: number
 *                       description: Time spent on test in minutes
 *                     score:
 *                       type: number
 *                       description: Overall test score
 *                 performance:
 *                   type: object
 *                   properties:
 *                     mcqScore:
 *                       type: number
 *                       description: Score in MCQ section
 *                     codingScore:
 *                       type: number
 *                       description: Score in coding section
 *                     skillScores:
 *                       type: object
 *                       properties:
 *                         problemSolving:
 *                           type: number
 *                         codeQuality:
 *                           type: number
 *                         efficiency:
 *                           type: number
 *                     completionRate:
 *                       type: number
 *                       description: Percentage of test completed
 *                 behaviorMetrics:
 *                   type: object
 *                   properties:
 *                     tabSwitches:
 *                       type: number
 *                       description: Number of times candidate switched tabs
 *                     focusLost:
 *                       type: number
 *                       description: Number of times candidate lost focus
 *                     warnings:
 *                       type: number
 *                       description: Number of warnings issued
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor or lacks access to this test
 *       404:
 *         description: Test or candidate not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/tests/:testId/candidates/:userId",
  auth,
  checkRole(["vendor"]),
  checkVendorApproval,
  validateTestAccess,
  getCandidateTestDetails
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates/{userId}/submissions:
 *   get:
 *     summary: Get submissions of a specific candidate for a test
 *     tags: [Vendor Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   test:
 *                     type: string
 *                   score:
 *                     type: number
 *                   status:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */
router.get("/tests/:testId/candidates/:userId/submissions", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getCandidateSubmissions);

/**
 * @swagger
 * /api/vendor/invitations:
 *   post:
 *     summary: Send test invitations to candidates
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testId, candidates]
 *             properties:
 *               testId:
 *                 type: string
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email: { type: string }
 *                     name: { type: string }
 *               validUntil: { type: string, format: date-time }
 *               maxAttempts: { type: number }
 */
router.post("/invitations", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, sendTestInvitations);

/**
 * @swagger
 * /api/vendor/invitations/{testId}:
 *   get:
 *     summary: Get all invitations sent for a test
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 */
router.get("/invitations/:testId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestInvitations);

/**
 * @swagger
 * /api/vendor/invitations/{invitationId}:
 *   delete:
 *     summary: Delete a specific invitation
 *     tags: [Vendor Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       404:
 *         description: Invitation not found
 *       500:
 *         description: Internal server error
 */
router.delete("/invitations/:invitationId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, deleteInvitation);

/**
 * @swagger
 * /api/vendor/reports:
 *   get:
 *     summary: Get vendor reports
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testMetrics:
 *                   type: object
 *                   properties:
 *                     totalTests:
 *                       type: number
 *                       description: Total number of tests created in period
 *                     activeTests:
 *                       type: number
 *                       description: Number of active tests in period
 *                     completedTests:
 *                       type: number
 *                       description: Number of completed test attempts in period
 *                 candidateMetrics:
 *                   type: object
 *                   properties:
 *                     totalCandidates:
 *                       type: number
 *                       description: Total unique candidates in period
 *                     passedCandidates:
 *                       type: number
 *                       description: Number of candidates who passed
 *                     failedCandidates:
 *                       type: number
 *                       description: Number of candidates who failed
 *                 performanceMetrics:
 *                   type: object
 *                   properties:
 *                     averageScore:
 *                       type: number
 *                       description: Average score across all attempts
 *                     highestScore:
 *                       type: number
 *                       description: Highest score achieved
 *                     lowestScore:
 *                       type: number
 *                       description: Lowest score achieved
 *                 dailyPerformance:
 *                   type: array
 *                   description: Daily breakdown of test performance
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date of performance metrics
 *                       testId:
 *                         type: string
 *                         description: ID of the test
 *                       averageScore:
 *                         type: number
 *                         description: Average score for the day
 *                       attempts:
 *                         type: number
 *                         description: Number of attempts for the day
 *                       passRate:
 *                         type: number
 *                         description: Pass rate percentage for the day
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/reports", auth, checkRole(["vendor"]), checkVendorApproval, getVendorReports);

/**
 * @swagger
 * /api/vendor/reports/export:
 *   get:
 *     summary: Export test results with flexible filtering
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: testId
 *         schema:
 *           type: string
 *         description: Optional - Specific test ID to filter results
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional - Specific user ID to filter results
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv, excel]
 *         description: Export format type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, score, duration]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include
 *       - in: query
 *         name: template
 *         schema:
 *           type: string
 *           enum: [default, minimal, comprehensive]
 */
router.get("/reports/export", auth, checkRole(["vendor"]), checkVendorApproval, exportTestResults);

/**
 * @swagger
 * /api/vendor/tests/{testId}/analytics:
 *   get:
 *     summary: Get detailed analytics for a specific test
 *     tags: [Vendor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalAttempts: 
 *                       type: number
 *                     averageScore:
 *                       type: number
 *                     passRate:
 *                       type: number
 *                     averageDuration:
 *                       type: number
 *                 questionAnalytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       correctRate:
 *                         type: number
 *                       avgTimeSpent:
 *                         type: number
 */
router.get("/tests/:testId/analytics", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestAnalytics);


/**
 * @swagger
 * /api/vendor/analytics/candidate-performance:
 *   get:
 *     summary: Get candidate performance analytics for vendor's tests
 *     tags: [Vendor Analytics]
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
 *         name: testId
 *         schema:
 *           type: string
 *         description: Specific test filter (optional)
 *     responses:
 *       200:
 *         description: Candidate performance analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Vendor access required
 */
router.get('/analytics/candidate-performance', auth, checkRole(["vendor"]), checkVendorApproval, getCandidatePerformance);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users:
 *   get:
 *     summary: Get all users who attempted a specific test
 *     tags: [Vendor Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestUsers);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/submissions:
 *   get:
 *     summary: Get detailed submission information for a specific user
 *     tags: [Vendor Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission information retrieved successfully
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/submissions", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getUserSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/mcq:
 *   get:
 *     summary: Get all MCQ submissions for a user's test
 *     tags: [Vendor Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: MCQ submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: string
 *                     description: ID of the MCQ question
 *                   behavior:
 *                     type: object
 *                     properties:
 *                       warnings:
 *                         type: number
 *                         description: Number of warnings issued
 *                       tabSwitches:
 *                         type: number
 *                         description: Number of tab switches
 *                       timeSpent:
 *                         type: number
 *                         description: Time spent in seconds
 *                       focusLostCount:
 *                         type: number
 *                         description: Number of times focus was lost
 *                   performance:
 *                     type: object
 *                     properties:
 *                       score:
 *                         type: number
 *                         description: Score achieved for this question
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/mcq", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getUserMCQSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/mcq/{mcqId}:
 *   get:
 *     summary: Get a specific MCQ submission
 *     tags: [Vendor Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: path
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specific MCQ question
 *     responses:
 *       200:
 *         description: MCQ submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionId:
 *                   type: string
 *                 behavior:
 *                   type: object
 *                   properties:
 *                     warnings:
 *                       type: number
 *                     tabSwitches:
 *                       type: number
 *                     timeSpent:
 *                       type: number
 *                     focusLostCount:
 *                       type: number
 *                     browserEvents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     browser:
 *                       type: string
 *                     os:
 *                       type: string
 *                     device:
 *                       type: string
 *                     screenResolution:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: MCQ submission not found
 */
router.get("/tests/:testId/users/:userId/mcq/:mcqId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getSpecificMCQSubmission);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/coding:
 *   get:
 *     summary: Get all coding submissions for a user's test
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Coding submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   challengeId:
 *                     type: string
 *                   behavior:
 *                     type: object
 *                     properties:
 *                       timeSpent:
 *                         type: number
 *                       submissionAttempts:
 *                         type: number
 *                       errorCount:
 *                         type: number
 *                       hintViews:
 *                         type: number
 *                   performance:
 *                     type: object
 *                     properties:
 *                       executionTime:
 *                         type: number
 *                       memoryUsage:
 *                         type: number
 *                       testCasesPassed:
 *                         type: number
 *                       totalTestCases:
 *                         type: number
 *                       score:
 *                         type: number
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Test not found
 */
router.get("/tests/:testId/users/:userId/coding", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getUserCodingSubmissions);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/{userId}/coding/{challengeId}:
 *   get:
 *     summary: Get a specific coding submission
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specific coding challenge
 *     responses:
 *       200:
 *         description: Coding submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challengeId:
 *                   type: string
 *                 behavior:
 *                   type: object
 *                   properties:
 *                     timeSpent:
 *                       type: number
 *                     submissionAttempts:
 *                       type: number
 *                     errorCount:
 *                       type: number
 *                     hintViews:
 *                       type: number
 *                     browserEvents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     executionTime:
 *                       type: number
 *                     memoryUsage:
 *                       type: number
 *                     testCasesPassed:
 *                       type: number
 *                     totalTestCases:
 *                       type: number
 *                     score:
 *                       type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     browser:
 *                       type: string
 *                     os:
 *                       type: string
 *                     device:
 *                       type: string
 *                     screenResolution:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Test doesn't belong to vendor
 *       404:
 *         description: Coding submission not found
 */
router.get("/tests/:testId/users/:userId/coding/:challengeId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getSpecificCodingSubmission);

/**
 * @swagger
 * /api/vendor/tests/{testId}/access:
 *   get:
 *     summary: Get test access settings
 *     tags: [Vendor Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test access settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [public, private, domain-restricted, invitation-only]
 *                 allowedDomains:
 *                   type: array
 *                   items:
 *                     type: string
 *                 defaultValidUntil:
 *                   type: string
 *                   format: date-time
 *                 defaultMaxAttempts:
 *                   type: number
 *                 allowedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       validUntil:
 *                         type: string
 *                         format: date-time
 *                       maxAttempts:
 *                         type: number
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       404:
 *         description: Test not found or you don't have permission to view it
 *       500:
 *         description: Internal server error
 */
router.get("/tests/:testId/access", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestAccessSettings);

/**
 * @swagger
 * /api/vendor/tests/{testId}/access:
 *   put:
 *     summary: Update test access settings
 *     tags: [Vendor Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               accessType:
 *                 type: string
 *                 enum: [public, private, domain-restricted, invitation-only]
 *               allowedDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *               defaultValidUntil:
 *                 type: string
 *                 format: date-time
 *               defaultMaxAttempts:
 *                 type: number
 *     responses:
 *       200:
 *         description: Test access settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [public, private, domain-restricted, invitation-only]
 *                 allowedDomains:
 *                   type: array
 *                   items:
 *                     type: string
 *                 defaultValidUntil:
 *                   type: string
 *                   format: date-time
 *                 defaultMaxAttempts:
 *                   type: number
 *                 allowedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       validUntil:
 *                         type: string
 *                         format: date-time
 *                       maxAttempts:
 *                         type: number
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       404:
 *         description: Test not found or you don't have permission to modify it
 *       500:
 *         description: Internal server error
 */
router.put("/tests/:testId/access", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, updateTestAccessSettings);

/**
 * @swagger
 * /api/vendor/tests/{testId}/access/users/{userId}:
 *   put:
 *     summary: Update access settings for a specific user
 *     tags: [Vendor Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
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
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               maxAttempts:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, suspended, expired]
 *   delete:
 *     summary: Remove user access from test
 *     tags: [Vendor Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/tests/:testId/access/users/:userId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, updateTestUserAccess);
router.delete("/tests/:testId/access/users/:userId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, removeTestUserAccess);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/upload:
 *   post:
 *     summary: Add users to a test via CSV upload
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user data. Must follow the format - email,name
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               maxAttempts:
 *                 type: number
 *     responses:
 *       200:
 *         description: Users successfully uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users processed successfully"
 *                 addedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                 duplicateUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "existing@example.com"
 *                       name:
 *                         type: string
 *                         example: "Existing User"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                       example: 3
 *                     added:
 *                       type: number
 *                       example: 2
 *                     duplicates:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid file format. Please upload a CSV file."
 *                 error:
 *                   type: string
 *                   example: "ValidationError"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - User doesn't have permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You don't have permission to access this test"
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File size exceeds 5MB limit"
 *     description: |
 *       Upload a CSV file to add multiple users to a test.
 *       
 *       **CSV Format:**
 *       ```csv
 *       email,name
 *       john@example.com,John Doe
 *       jane@example.com,Jane Smith
 *       ```
 *       
 *       - The CSV file must have a header row
 *       - Required columns: email, name
 *       - Email must be a valid email format
 *       - Name should not be empty
 *       - Maximum file size: 5MB
 *       - Supported file types: .csv
 */
router.post("/tests/:testId/users/upload", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, uploadUsersFromCSV);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/add:
 *   post:
 *     summary: Add users to a test manually
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users]
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [email, name]
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *               maxAttempts:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Users processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users processed successfully"
 *                 addedUsers:
 *                   type: array
 *                   description: List of successfully added users
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "newuser@example.com"
 *                       name:
 *                         type: string
 *                         example: "New User"
 *                 duplicateUsers:
 *                   type: array
 *                   description: List of users that were already in the test
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                       example: 3
 *                     added:
 *                       type: number
 *                       example: 2
 *                     duplicates:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users array is required"
 *       409:
 *         description: All users already exist in the test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All users already exist in this test"
 *                 duplicateUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.post(
  "/tests/:testId/users/add",
  auth,
  checkRole(["vendor"]),
  checkVendorApproval,
  validateTestAccess,
  addTestUsers
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/users/remove:
 *   post:
 *     summary: Remove users from a test
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post(
  "/tests/:testId/users/remove",
  auth,
  checkRole(["vendor"]),
  checkVendorApproval,
  validateTestAccess,
  removeTestUsers
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/candidates/{userId}/results:
 *   get:
 *     summary: Get test results for a specific candidate
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test results retrieved successfully
 *       403:
 *         description: Not authorized to view these results
 *       404:
 *         description: Test or submission not found
 */
router.get(
  "/tests/:testId/candidates/:userId/results", 
  auth, 
  checkRole(["vendor"]), 
  checkVendorApproval,
  validateTestAccess, 
  getUserTestResults
);

/**
 * @swagger
 * /api/vendor/tests/{testId}/access:
 *   get:
 *     summary: Get test access settings and allowed users
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test access settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessType:
 *                   type: string
 *                   enum: [public, private, domain, invited]
 *                 allowedDomains:
 *                   type: array
 *                   items:
 *                     type: string
 *                 allowedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       validUntil:
 *                         type: string
 *                         format: date-time
 *                       maxAttempts:
 *                         type: number
 *   put:
 *     summary: Update test access settings
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               accessType:
 *                 type: string
 *                 enum: [public, private, domain, invited]
 *               allowedDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *               defaultValidUntil:
 *                 type: string
 *                 format: date-time
 *               defaultMaxAttempts:
 *                 type: number
 */
router.get("/tests/:testId/access", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, getTestAccessSettings);
router.put("/tests/:testId/access", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, updateTestAccessSettings);

/**
 * @swagger
 * /api/vendor/tests/{testId}/access/users/{userId}:
 *   put:
 *     summary: Update access settings for a specific user
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
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
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               maxAttempts:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, suspended, expired]
 *   delete:
 *     summary: Remove user access from test
 *     tags: [Test Access Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/tests/:testId/access/users/:userId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, updateTestUserAccess);
router.delete("/tests/:testId/access/users/:userId", auth, checkRole(["vendor"]), checkVendorApproval, validateTestAccess, removeTestUserAccess);

/**
 * @swagger
 * /api/vendor/wallet/balance:
 *   get:
 *     summary: Get vendor wallet balance and recent transactions
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: Current wallet balance
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get("/wallet/balance", auth, checkRole(["vendor"]), async (req, res) => {
  try {
    // Use Vendor model to ensure vendor exists
    const vendor = await Vendor.findOne({ email: req.user.email });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Fetch wallet balance using the vendor's email
    const wallet = await getWalletBalance(req.user.email);
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ 
      error: "Failed to fetch wallet balance",
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/vendor/wallet/transactions:
 *   get:
 *     summary: Get paginated wallet transactions
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentBalance:
 *                   type: number
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 */
router.get("/wallet/transactions", auth, checkRole(["vendor"]), getWalletTransactions);

/**
 * @swagger
 * /api/vendor/wallet/order:
 *   post:
 *     summary: Create a new wallet recharge order
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to add in INR
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                   example: "INR"
 */
router.post("/wallet/order", auth, checkRole(["vendor"]), createWalletOrder);

/**
 * @swagger
 * /api/vendor/wallet/verify:
 *   post:
 *     summary: Verify wallet payment and add balance
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_payment_id
 *               - razorpay_order_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and balance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type
 */
router.post("/wallet/verify", auth, checkRole(["vendor"]), verifyWalletPayment);

/**
 * @swagger
 * /api/vendor/wallet/deduct:
 *   post:
 *     summary: Deduct balance for test users
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testId:
 *                 type: string
 *               usersCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Balance deducted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.post("/wallet/deduct", auth, checkRole(["vendor"]), deductTestUserBalance);

/**
 * @swagger
 * /api/vendor/candidates:
 *   get:
 *     summary: Get all candidates across all vendor tests
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCandidates:
 *                   type: number
 *                   description: Total number of unique candidates
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Candidate ID
 *                       name:
 *                         type: string
 *                         description: Candidate name
 *                       email:
 *                         type: string
 *                         description: Candidate email
 *                       totalAttempts:
 *                         type: number
 *                         description: Total number of test attempts
 *                       testsAttempted:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: List of test titles attempted
 *                       lastAttempt:
 *                         type: string
 *                         format: date-time
 *                         description: Date of most recent attempt
 *                       averageScore:
 *                         type: number
 *                         description: Average score across all attempts
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a vendor
 *       500:
 *         description: Internal server error
 */
router.get("/candidates", auth, checkRole(["vendor"]), checkVendorApproval, getVendorAllCandidates);

/**
 * @swagger
 * /api/vendor/candidate-metrics:
 *   get:
 *     summary: Get detailed candidate metrics and status
 *     tags: [Candidate Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, in_progress, pending]
 *         description: Filter by submission status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by candidate name, test type, or status
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           default: "24h"
 *         description: Timeframe for active users calculation
 *     responses:
 *       200:
 *         description: Detailed candidate metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     activeTestTakers:
 *                       type: number
 *                     totalCandidates:
 *                       type: number
 *                     statusBreakdown:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: number
 *                         inProgress:
 *                           type: number
 *                         pending:
 *                           type: number
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateId:
 *                         type: string
 *                       candidateName:
 *                         type: string
 *                       registeredDate:
 *                         type: string
 *                         format: date-time
 *                       testType:
 *                         type: string
 *                       testPeriod:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date-time
 *                           end:
 *                             type: string
 *                             format: date-time
 *                       progress:
 *                         type: number
 *                       score:
 *                         type: number
 *                       timeSpent:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [completed, in_progress, pending]
 *                       lastActivity:
 *                         type: object
 *                         properties:
 *                           time:
 *                             type: string
 *                             format: date-time
 *                           type:
 *                             type: string
 */
router.get("/candidate-metrics", auth, checkRole(["vendor"]), checkVendorApproval, getCandidateMetrics);

/**
 * @swagger
 * /api/vendor/wallet/debit-test-fee:
 *   post:
 *     tags: [Vendor Wallet]
 *     summary: Debit test registration fee from vendor wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *                 required: true
 *               testId:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Amount debited successfully
 *       400:
 *         description: Insufficient balance
 *       404:
 *         description: Vendor not found
 */
router.post('/wallet/debit-test-fee', debitTestFee);



export default router; 
