import express from "express";
import { 
  createTest, 
  getTests, 
  getTestById, 
  updateTest, 
  deleteTest,
  addMCQs,
  updateMCQ,
  deleteMCQ,
  addCodingChallenges,
  updateCodingChallenge,
  deleteCodingChallenge,
  publishTest,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  startTestSession,
  endTestSession,
  shareTest,
  verifyTestInvitation,
  getTestByUuid,
  acceptTestInvitation,
  sendTestInvitations,
  getTestInvitations,
  updateCodingChallenges,
  updateTestAccess,
  addAllowedUsers,
  removeAllowedUsers,
  getPublicTests,
  updateTestVisibility,
  updateSessionStatus,
  getUserSubmissions,
  verifyTestByUuid,
  checkTestRegistration,
  getTestIdByUuid,
  getFeaturedPublicTests,
  getPublicTestCategories,
  registerForTest,
  validateSession,
  parseTestUuid
} from "../controllers/test.controller.js";
import { auth } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import TestResult from '../models/testResult.model.js';
import TestSession from '../models/testSession.model.js';
import Test from '../models/test.model.js';
import User from '../models/user.model.js';
import { validateTestAccess } from '../middleware/validateTestAccess.js';
import { validateProfile } from '../middleware/validateProfile.js';
import jwt from 'jsonwebtoken';
import TestRegistration from '../models/testRegistration.model.js';
import { 
  getTestAnalytics, 
  postMCQAnalytics, 
  postCodingAnalytics 
} from '../controllers/analytics.controller.js';

import { updateTestType } from '../controllers/test.controller.js';
import { LANGUAGE_NAMES } from '../constants/languages.js';
import mongoose from 'mongoose';
import Submission from '../models/submission.model.js';
import { checkTestBalance } from '../middleware/checkTestBalance.js';
import SystemSettings from '../models/systemSettings.model.js';
import Vendor from '../models/vendor.model.js';


const router = express.Router();

// Public routes MUST be defined BEFORE the auth middleware
router.post("/verify/:uuid", auth, async (req, res) => {
  try {
    // Find test and populate vendor
    const test = await Test.findOne({ uuid: req.params.uuid }).populate('vendor');
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get current price per user from system settings
    const settings = await SystemSettings.findOne();
    const pricePerUser = settings?.testPricing?.pricePerUser || 4.35;

    // Get vendor's current balance
    const vendor = await Vendor.findById(test.vendor._id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Check if vendor has sufficient balance
    const hasBalance = vendor.wallet.balance >= pricePerUser;

    res.json({
      message: "Test verified successfully",
      test: {
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        totalMarks: test.totalMarks,
        status: test.status,
        vendor: {
          name: vendor.name,
          email: vendor.email,
          hasBalance
        }
      }
    });

  } catch (error) {
    console.error('Error in verifyTest:', error);
    res.status(500).json({ 
      error: "Failed to verify test",
      message: error.message 
    });
  }
});

// Protected routes below this line
router.use(auth);

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests based on user role
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title: 
 *                     type: string
 *                     example: "JavaScript Fundamentals Test"
 *                   description: 
 *                     type: string
 *                     example: "A comprehensive test covering JavaScript basics including variables, functions, and objects"
 *                   duration: 
 *                     type: number
 *                     example: 60
 *                     description: Duration in minutes
 *                   vendor: 
 *                     type: object
 *                     example: {
 *                       _id: "507f1f77bcf86cd799439011",
 *                       name: "Tech Academy",
 *                       email: "admin@techacademy.com"
 *                     }
 *                   status: 
 *                     type: string
 *                     example: "published"
 *                     enum: [draft, published]
 *                   mcqs: 
 *                     type: array
 *                     example: [{
 *                       question: "What is JavaScript?",
 *                       options: ["Programming Language", "Markup Language", "Database", "Operating System"],
 *                       correctOptions: [0],
 *                       marks: 5
 *                     }]
 *                   codingChallenges: 
 *                     type: array
 *                     example: [{
 *                       title: "FizzBuzz",
 *                       description: "Write a program that prints numbers from 1 to n",
 *                       marks: 10,
 *                       difficulty: "easy"
 *                     }]
 */
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    
    // If admin, show all tests
    if (req.user.role === 'admin') {
      query = {};
    }
    // If vendor, show only their tests
    else if (req.user.role === 'vendor') {
      query = { vendor: req.user._id };
    }
    // If regular user, show public tests and assigned tests
    else {
      query = {
        $or: [
          { 'accessControl.type': 'public' },
          { type: 'coding_challenge' },
          { 'accessControl.allowedUsers': req.user._id }
        ]
      };
    }

    const tests = await Test.find(query)
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      message: 'Error fetching tests', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test by ID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *       400:
 *         description: Invalid test ID format
 *       403:
 *         description: Not authorized to access this test
 *       404:
 *         description: Test not found
 */
router.get("/:id", auth, getTestById);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - difficulty
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               proctoring:
 *                 type: boolean
 *               instructions:
 *                 type: string
 *               mcqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctOptions:
 *                       type: array
 *                       items:
 *                         type: number
 *                     marks:
 *                       type: number
 *               codingChallenges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                     - problemStatement
 *                     - constraints
 *                     - allowedLanguages
 *                     - languageImplementations
 *                     - marks
 *                     - timeLimit
 *                     - memoryLimit
 *                     - difficulty
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     problemStatement:
 *                       type: string
 *                     constraints:
 *                       type: string
 *                     allowedLanguages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     languageImplementations:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         required:
 *                           - visibleCode
 *                           - invisibleCode
 *                         properties:
 *                           visibleCode:
 *                             type: string
 *                           invisibleCode:
 *                             type: string
 *                     testCases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                           output:
 *                             type: string
 *                           isVisible:
 *                             type: boolean
 *                           explanation:
 *                             type: string
 *                     marks:
 *                       type: number
 *                     timeLimit:
 *                       type: number
 *                     memoryLimit:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [draft, published]
 *                 mcqs:
 *                   type: array
 *                 codingChallenges:
 *                   type: array
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to create tests
 */
router.post("/", auth, checkRole(["vendor", "admin"]), createTest);

/**
 * @swagger
 * /api/tests/{testId}/mcqs:
 *   post:
 *     summary: Add MCQs to an existing test
 *     tags: [Tests]
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
 *             type: array
 *             items:
 *               type: object
 *               example: {
 *                 question: "What is the output of console.log(typeof null)?",
 *                 options: ["null", "undefined", "object", "string"],
 *                 correctOptions: [2],
 *                 answerType: "single",
 *                 marks: 5,
 *                 difficulty: "medium",
 *                 explanation: "In JavaScript, typeof null returns 'object' due to a historical bug"
 *               }
 *     responses:
 *       200:
 *         description: MCQs added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mcqs:
 *                   type: array
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Test not found
 */
router.post("/:testId/mcqs", auth, checkRole(["vendor", "admin"]), addMCQs);

/**
 * @swagger
 * /api/tests/{testId}/mcq/{mcqId}:
 *   put:
 *     summary: Update a specific MCQ in a test
 *     tags: [Tests]
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
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the MCQ to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: Updated question text
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of answer options
 *               correctOptions:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of indices of correct answers
 *               answerType:
 *                 type: string
 *                 enum: [single, multiple]
 *                 description: Type of answer selection
 *               marks:
 *                 type: number
 *                 description: Points for this question
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Difficulty level
 *     responses:
 *       200:
 *         description: MCQ updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or MCQ not found
 */
router.put("/:testId/mcq/:mcqId", auth, checkRole(["vendor", "admin"]), updateMCQ);

/**
 * @swagger
 * /api/tests/{testId}/mcq/{mcqId}:
 *   delete:
 *     summary: Delete MCQ from test
 *     tags: [Tests]
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
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the MCQ to delete
 *     responses:
 *       200:
 *         description: MCQ deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or MCQ not found
 */
router.delete("/:testId/mcq/:mcqId", auth, checkRole(["vendor", "admin"]), deleteMCQ);

/**
 * @swagger
 * /api/tests/{testId}/coding-challenges:
 *   post:
 *     summary: Add coding challenges to an existing test
 *     tags: [Tests]
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
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - title
 *                 - description
 *                 - constraints
 *                 - language
 *                 - marks
 *                 - timeLimit
 *                 - memoryLimit
 *                 - difficulty
 *                 - testCases
 *               properties:
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 constraints:
 *                   type: string
 *                 language:
 *                   type: string
 *                 allowedLanguages:
 *                   type: array
 *                   items:
 *                     type: string
 *                 marks:
 *                   type: number
 *                 timeLimit:
 *                   type: number
 *                 memoryLimit:
 *                   type: number
 *                 difficulty:
 *                   type: string
 *                   enum: [easy, medium, hard]
 *                 testCases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - input
 *                       - output
 *                     properties:
 *                       input:
 *                         type: string
 *                       output:
 *                         type: string
 *                       hidden:
 *                         type: boolean
 *                       explanation:
 *                         type: string
 *     responses:
 *       200:
 *         description: Coding challenges added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 codingChallenges:
 *                   type: array
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Test not found
 */
router.post("/:testId/coding-challenges", auth, checkRole(["vendor", "admin"]), addCodingChallenges);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}:
 *   put:
 *     summary: Update a coding challenge
 *     tags: [Tests]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               problemStatement:
 *                 type: string
 *               constraints:
 *                 type: string
 *               allowedLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *               languageImplementations:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   required:
 *                     - visibleCode
 *                     - invisibleCode
 *                   properties:
 *                     visibleCode:
 *                       type: string
 *                     invisibleCode:
 *                       type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     isVisible:
 *                       type: boolean
 *                     explanation:
 *                       type: string
 *     responses:
 *       200:
 *         description: Coding challenge updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or challenge not found
 */
router.put("/:testId/coding/:challengeId", auth, checkRole(["vendor", "admin"]), updateCodingChallenge);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}:
 *   delete:
 *     summary: Delete coding challenge from test
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge to delete
 *     responses:
 *       200:
 *         description: Coding challenge deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or coding challenge not found
 */
router.delete("/:testId/coding/:challengeId", auth, checkRole(["vendor", "admin"]), deleteCodingChallenge);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase:
 *   post:
 *     summary: Add test case to coding challenge
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input, output]
 *             properties:
 *               input: { type: string }
 *               output: { type: string }
 *               hidden: { type: boolean }
 *               explanation: { type: string }
 *     responses:
 *       201:
 *         description: Test case added successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or coding challenge not found
 */
router.post("/:testId/coding/:challengeId/testcase", auth, checkRole(["vendor", "admin"]), addTestCase);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase/{testCaseId}:
 *   put:
 *     summary: Update test case
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test case
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input: { type: string }
 *               output: { type: string }
 *               hidden: { type: boolean }
 *               explanation: { type: string }
 *     responses:
 *       200:
 *         description: Test case updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test, coding challenge, or test case not found
 */
router.put("/:testId/coding/:challengeId/testcase/:testCaseId", auth, checkRole(["vendor", "admin"]), updateTestCase);

/**
 * @swagger
 * /api/tests/{testId}/coding/{challengeId}/testcase/{testCaseId}:
 *   delete:
 *     summary: Delete test case
 *     tags: [Tests]
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
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coding challenge
 *       - in: path
 *         name: testCaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test case
 *     responses:
 *       200:
 *         description: Test case deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test, coding challenge, or test case not found
 */
router.delete("/:testId/coding/:challengeId/testcase/:testCaseId", auth, checkRole(["vendor", "admin"]), deleteTestCase);

/**
 * @swagger
 * /api/tests/{testId}/publish:
 *   post:
 *     summary: Publish a test (validates all required fields)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         description: MongoDB ID of the test to publish
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test published successfully"
 *                 test:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     title: { type: string }
 *                     publishedAt: { type: string }
 *                     sharingToken: { type: string }
 *                 shareableLink:
 *                   type: string
 *                   example: "http://yourfrontend.com/test/take/123?token=abc..."
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */
router.post("/:testId/publish", auth, checkRole(["vendor", "admin"]), publishTest);

// Basic CRUD operations
router.get("/", auth, getTests);
router.get("/:id", auth, getTestById);
router.put("/:id", auth, checkRole(["vendor", "admin"]), updateTest);
router.delete("/:id", auth, checkRole(["vendor", "admin"]), deleteTest);

// Test Session Management
router.post("/sessions/start", auth, startTestSession);
router.post("/sessions/:sessionId/end", auth, endTestSession);
router.post("/sessions/:sessionId/status", auth, updateSessionStatus);

// Test Sharing
router.post("/:id/share", auth, shareTest);
router.post("/invitations/verify", verifyTestInvitation);
router.post("/invitations/accept", auth, acceptTestInvitation);
router.post("/:testId/invitations", auth, checkRole(["vendor", "admin"]), sendTestInvitations);
router.get("/:testId/invitations", auth, checkRole(["vendor", "admin"]), getTestInvitations);

/**
 * @swagger
 * /api/tests/{uuid}/take:
 *   get:
 *     summary: Get test details for taking the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 */
router.get("/:uuid/take", auth, async (req, res) => {
  try {
    const test = await Test.findOne({ uuid: req.params.uuid })
      .populate('mcqs')
      .populate('codingChallenges');
    
    if (!test) {
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    // Transform coding challenges to use language names instead of IDs
    const transformedCodingChallenges = test.codingChallenges.map(challenge => {
      // Convert to plain object to remove Mongoose document methods
      const transformedChallenge = JSON.parse(JSON.stringify(challenge));
      
      // Convert language IDs to names in allowedLanguages array
      transformedChallenge.allowedLanguages = challenge.allowedLanguages.map(langId => 
        LANGUAGE_NAMES[langId] || langId
      );

      // Convert language IDs to names in languageImplementations object
      const newImplementations = {};
      // Handle Mongoose Map structure
      const implementations = challenge.languageImplementations instanceof Map ? 
        Object.fromEntries(challenge.languageImplementations) : 
        challenge.languageImplementations;

      Object.entries(implementations).forEach(([langId, impl]) => {
        const languageName = LANGUAGE_NAMES[langId] || langId;
        // Preserve the implementation structure including _id
        newImplementations[languageName] = {
          visibleCode: impl.visibleCode,
          invisibleCode: impl.invisibleCode,
          _id: impl._id
        };
      });
      transformedChallenge.languageImplementations = newImplementations;

      return transformedChallenge;
    });

    res.json({
      message: "Test loaded successfully",
      data: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        mcqs: test.mcqs,
        codingChallenges: transformedCodingChallenges
      }
    });

  } catch (error) {
    console.error('Error in getTestByUuid:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      uuid: req.params.uuid
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update an existing test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Test title
 *               description:
 *                 type: string
 *                 description: Test description
 *               duration:
 *                 type: number
 *                 description: Test duration in minutes
 *               proctoring:
 *                 type: boolean
 *                 description: Whether proctoring is enabled
 *               instructions:
 *                 type: string
 *                 description: Test instructions
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 description: Test status
 *               mcqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       required: true
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       required: true
 *                     correctOptions:
 *                       type: array
 *                       items:
 *                         type: number
 *                       required: true
 *                     answerType:
 *                       type: string
 *                       enum: [single, multiple]
 *                       required: true
 *                     marks:
 *                       type: number
 *                       required: true
 *                     explanation:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                       required: true
 *               codingChallenges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       required: true
 *                     description:
 *                       type: string
 *                       required: true
 *                     constraints:
 *                       type: string
 *                       required: true
 *                     language:
 *                       type: string
 *                       required: true
 *                     marks:
 *                       type: number
 *                       required: true
 *                     timeLimit:
 *                       type: number
 *                       required: true
 *                     memoryLimit:
 *                       type: number
 *                       required: true
 *                     sampleCode:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                       required: true
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     testCases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                             required: true
 *                           output:
 *                             type: string
 *                             required: true
 *                           hidden:
 *                             type: boolean
 *                           explanation:
 *                             type: string
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       400:
 *         description: Validation error or invalid test ID
 *       403:
 *         description: Not authorized to update this test
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/sessions/start:
 *   post:
 *     summary: Start a new test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *             properties:
 *               testId:
 *                 type: string
 *                 description: ID of the test to start
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   browser:
 *                     type: string
 *                   os:
 *                     type: string
 *                   screenResolution:
 *                     type: string
 *     responses:
 *       201:
 *         description: Test session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     test:
 *                       type: string
 *                     user:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [started, in_progress, completed, terminated]
 *       400:
 *         description: Invalid request or test already in progress
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/sessions/{sessionId}/end:
 *   post:
 *     summary: End a test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test session to end
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: object
 *                 description: User's answers for the test
 *               submissionType:
 *                 type: string
 *                 enum: [manual, auto]
 *                 description: Whether the submission was manual or automatic (timeout)
 *     responses:
 *       200:
 *         description: Test session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [completed, terminated]
 *                     submissionType:
 *                       type: string
 *                     score:
 *                       type: number
 *       400:
 *         description: Invalid request or session already ended
 *       403:
 *         description: Not authorized to end this session
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/tests/sessions/{sessionId}/status:
 *   post:
 *     summary: Update test session status
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, paused, resumed, terminated]
 *                 description: New status for the session
 *               reason:
 *                 type: string
 *                 description: Reason for status change (especially for termination)
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When the status change occurred
 *     responses:
 *       200:
 *         description: Session status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     statusHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           reason:
 *                             type: string
 *       400:
 *         description: Invalid status or request
 *       403:
 *         description: Not authorized to update this session
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/tests/{id}/share:
 *   post:
 *     summary: Share a test with others via email
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emails]
 *             properties:
 *               emails:
 *                 type: array
 *                 items: { type: string }
 *               validUntil: { type: string, format: date-time }
 *               maxAttempts: { type: number }
 *     responses:
 *       200:
 *         description: Test shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email: { type: string }
 *                       shareableLink: { type: string }
 *                       validUntil: { type: string, format: date-time }
 *                       maxAttempts: { type: number }
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */

/**
 * @swagger
 * /api/tests/invitations/verify:
 *   post:
 *     summary: Verify a test invitation
 *     tags: [Tests]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Invitation verified successfully
 *       400:
 *         description: Invalid token
 */

router.patch(
  '/:testId/coding-challenges',
  auth,
  checkRole(['vendor', 'admin']),
  updateCodingChallenges
);

router.post(
  '/:testId/publish',
  auth,
  checkRole(['vendor', 'admin']),
  publishTest
);

// When a user starts a test
router.post('/tests/:testId/start', auth, validateTestAccess, async (req, res) => {
  try {
    // Check if test exists
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create test session
    const testSession = await TestSession.create({
      test: test._id,
      user: user._id,
      startTime: new Date(),
      status: 'started',
      deviceInfo: req.body.deviceInfo || {}
    });

    res.status(201).json({
      message: 'Test session started successfully',
      session: testSession
    });

  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ message: error.message });
  }
});

// When user submits answers
router.post('/tests/:testId/submit', auth, validateTestAccess, async (req, res) => {
  try {
    // Find active test session
    const session = await TestSession.findOne({
      test: req.params.testId,
      user: req.user._id,
      status: 'started'
    });

    if (!session) {
      return res.status(404).json({ message: 'No active test session found' });
    }

    // Update session status
    session.status = 'completed';
    session.endTime = new Date();
    session.answers = req.body.answers;
    await session.save();

    // Get test details for scoring
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Calculate score (implement your scoring logic here)
    const score = calculateScore(req.body.answers, test);

    // Update user's test results
    await TestResult.create({
      test: test._id,
      user: req.user._id,
      session: session._id,
      score,
      answers: req.body.answers,
      completedAt: new Date()
    });

    res.json({
      message: 'Test submitted successfully',
      score,
      session: session._id
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update session status
router.post('/sessions/:sessionId/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const session = await TestSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify user has permission to update this session
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    // Update session status
    session.status = status;
    session.reason = reason;
    session.timestamp = new Date();
    await session.save();

    res.json({
      message: 'Session status updated successfully',
      session: session._id
    });

  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Access control routes
router.put(
  "/:testId/access",
  auth,
  checkRole(["vendor", "admin"]),
  updateTestAccess
);

router.post(
  "/:testId/allowed-users",
  auth,
  checkRole(["vendor", "admin"]),
  addAllowedUsers
);

router.delete(
  "/:testId/allowed-users",
  auth,
  checkRole(["vendor", "admin"]),
  removeAllowedUsers
);

/**
 * @swagger
 * /api/tests/register/{uuid}:
 *   post:
 *     summary: Register for a test using UUID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test to register for
 *     responses:
 *       201:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully registered for test
 *                 registration:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Registration ID
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
 *                       description: Registration timestamp
 *                     status:
 *                       type: string
 *                       enum: [registered, completed, expired]
 *                       description: Registration status
 *       400:
 *         description: Bad request or already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are already registered for this test
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Forbidden - User not authorized to take test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not authorized to access this test
 *                 requiresRegistration:
 *                   type: boolean
 *                   example: false
 *                 details:
 *                   type: object
 *                   properties:
 *                     isAdmin:
 *                       type: boolean
 *                     isVendor:
 *                       type: boolean
 *                     isPublicTest:
 *                       type: boolean
 *                     isPracticeTest:
 *                       type: boolean
 *                     isAllowedUser:
 *                       type: boolean
 *                     userEmail:
 *                       type: string
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Test not found
 *                 requiresRegistration:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error registering for test
 *                 error:
 *                   type: string
 */
router.post("/register/:uuid", auth, validateTestAccess, registerForTest);

/**
 * @swagger
 * /api/tests/public:
 *   get:
 *     tags: [Tests]
 *     summary: Get all public tests
 *     description: Retrieve all public and published tests with optional filters
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
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assessment, coding_challenge]
 *         description: Filter by test type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of public tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       totalMarks:
 *                         type: number
 *                       type:
 *                         type: string
 *                       vendor:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     limit:
 *                       type: number
 */
router.get("/public", getPublicTests);
router.get("/public/featured", getFeaturedPublicTests);
router.get("/public/categories", getPublicTestCategories);

/**
 * @swagger
 * /api/tests/{testId}/visibility:
 *   patch:
 *     summary: Update test visibility and type
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visibility]
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [public, private, coding_challenge]
 *                 description: New visibility setting for the test
 *     responses:
 *       200:
 *         description: Test visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 visibility:
 *                   type: string
 *                   enum: [public, private, practice]
 *                 type:
 *                   type: string
 *                   enum: [assessment, practice]
 *       400:
 *         description: Invalid visibility type
 *       403:
 *         description: Not authorized to change test visibility
 *       404:
 *         description: Test not found
 */
router.patch(
  "/:testId/visibility",
  auth,
  checkRole(["vendor", "admin"]),
  updateTestVisibility
);

/**
 * @swagger
 * /api/tests/{testId}/register:
 *   post:
 *     summary: Register for a test/hackathon
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test to register for
 *     responses:
 *       201:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 registration:
 *                   type: object
 *                   properties:
 *                     test:
 *                       type: string
 *                     user:
 *                       type: string
 *                     registeredAt:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Already registered or test not available
 *       404:
 *         description: Test not found
 */
router.post(
  "/:testId/register",
  auth,
  validateProfile,
  registerForTest
);

/**
 * @swagger
 * /api/submissions/user/{userId}:
 *   get:
 *     summary: Get all submissions for a user
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User's test submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mcq:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId: { type: string }
 *                       testTitle: { type: string }
 *                       type: { type: string }
 *                       category: { type: string }
 *                       difficulty: { type: string }
 *                       score: { type: number }
 *                       totalMarks: { type: number }
 *                       passingMarks: { type: number }
 *                       status: { type: string }
 *                       submittedAt: { type: string }
 *                       answers: { type: array }
 *                 coding:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId: { type: string }
 *                       testTitle: { type: string }
 *                       type: { type: string }
 *                       category: { type: string }
 *                       difficulty: { type: string }
 *                       score: { type: number }
 *                       totalMarks: { type: number }
 *                       passingMarks: { type: number }
 *                       status: { type: string }
 *                       submittedAt: { type: string }
 *                       solutions: { type: array }
 */
router.get('/submissions/user/:userId', auth, getUserSubmissions);

// Public route for verifying test by UUID
router.post("/verify/:uuid", verifyTestByUuid);

// Then add the auth middleware for protected routes
router.use(auth);

/**
 * @swagger
 * /api/tests/verify/{uuid}:
 *   post:
 *     summary: Verify a test by UUID (Public endpoint)
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Access token for private tests (optional)
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     type:
 *                       type: string
 *                     category:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     totalMarks:
 *                       type: number
 *                     vendor:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Test not found
 *       403:
 *         description: Invalid access token or test not available
 */
router.post("/verify/:uuid", verifyTestByUuid);

/**
 * @swagger
 * /api/tests/register/{uuid}:
 *   post:
 *     summary: Register for a test using UUID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test to register for
 *     responses:
 *       201:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully registered for test
 *                 registration:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Registration ID
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
 *                       description: Registration timestamp
 *                     status:
 *                       type: string
 *                       enum: [registered, completed, expired]
 *                       description: Registration status
 *       400:
 *         description: Bad request or already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are already registered for this test
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Forbidden - User not authorized to take test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not authorized to access this test
 *                 requiresRegistration:
 *                   type: boolean
 *                   example: false
 *                 details:
 *                   type: object
 *                   properties:
 *                     isAdmin:
 *                       type: boolean
 *                     isVendor:
 *                       type: boolean
 *                     isPublicTest:
 *                       type: boolean
 *                     isPracticeTest:
 *                       type: boolean
 *                     isAllowedUser:
 *                       type: boolean
 *                     userEmail:
 *                       type: string
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Test not found
 *                 requiresRegistration:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error registering for test
 *                 error:
 *                   type: string
 */
router.post("/register/:uuid", auth, validateTestAccess, registerForTest);

/**
 * @swagger
 * /api/tests/{uuid}/take:
 *   get:
 *     summary: Get test details for taking the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     totalMarks:
 *                       type: number
 *                     mcqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                           marks:
 *                             type: number
 *                     codingChallenges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           problemStatement:
 *                             type: string
 *                           constraints:
 *                             type: string
 *                           marks:
 *                             type: number
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Not authorized to take this test
 *       404:
 *         description: Test not found
 */
router.get("/:uuid/take", auth, getTestByUuid);

/**
 * @swagger
 * /api/tests/{uuid}/check-registration:
 *   post:
 *     summary: Check if user can register for a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: User can register for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canRegister:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: User cannot register for test
 *       404:
 *         description: Test not found
 */
router.post("/:uuid/check-registration", auth, async (req, res) => {
  try {
    const test = await Test.findOne({ uuid: req.params.uuid });
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Get user's latest session for this test
    const lastSession = await TestSession.findOne({
      test: test._id,
      user: req.user._id
    }).sort({ startTime: -1 });

    // Check if user has access
    const canAccess = test.accessControl.type === 'public' || 
                     test.type === 'coding_challenge' ||
                     test.accessControl.allowedUsers.some(u => u.email === req.user.email);

    // Check registration status
    const isRegistered = await TestRegistration.exists({
      test: test._id,
      user: req.user._id
    });

    // Format last session data if it exists
    const formattedLastSession = lastSession ? {
      id: lastSession._id,
      status: lastSession.status === 'completed' ? 'completed' : 
              (new Date(lastSession.startTime) < new Date(Date.now() - test.duration * 60000) ? 
               'expired' : lastSession.status),
      startTime: lastSession.startTime
    } : null;

    res.json({
      canAccess,
      requiresRegistration: test.type !== 'coding_challenge',
      isRegistered: !!isRegistered,
      message: canAccess ? 
        (isRegistered ? "You are registered for this test" : "You can register for this test") :
        "You do not have access to this test",
      test: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        type: test.type,
        accessControl: {
          type: test.accessControl.type,
          allowedUsers: test.accessControl.allowedUsers.map(u => ({
            email: u.email,
            name: u.name
          }))
        }
      },
      lastSession: formattedLastSession
    });

  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/tests/parse/{uuid}:
 *   get:
 *     summary: Get test ID from UUID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test ID retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     uuid:
 *                       type: string
 *                     title:
 *                       type: string
 *       404:
 *         description: Test not found
 */
router.get("/parse/:uuid", getTestIdByUuid);

/**
 * @swagger
 * /api/tests/{uuid}/session:
 *   post:
 *     summary: Create or resume a test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   userAgent: 
 *                     type: string
 *                   platform:
 *                     type: string
 *                   screenResolution:
 *                     type: string
 *                   language:
 *                     type: string
 *     responses:
 *       201:
 *         description: Session created successfully
 *       200:
 *         description: Existing session found
 *       404:
 *         description: Test not found
 */
router.post("/:uuid/session", auth, startTestSession);

/**
 * @swagger
 * /api/tests/{uuid}/session/{sessionId}/end:
 *   post:
 *     summary: End a test session
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.post("/:uuid/session/:sessionId/end", auth, endTestSession);

router.get('/tests/:uuid/session/:sessionId/validate', auth, validateSession);

router.get("/analytics/:testId", auth, getTestAnalytics);
router.post("/analytics/:testId/mcq", auth, postMCQAnalytics);
router.post("/analytics/:testId/coding", auth, postCodingAnalytics);

/**
 * @swagger
 * /api/tests/analytics/{testId}:
 *   get:
 *     summary: Get analytics data for a test with optional filters
 *     tags: [Test Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mcq, coding]
 *         description: Filter by challenge type
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Analytics retrieved successfully"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalParticipants:
 *                       type: number
 *                       example: 50
 *                     averageTimeSpent:
 *                       type: number
 *                       example: 120
 *                       description: Average time in seconds
 *                     warningStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 25
 *                         average:
 *                           type: number
 *                           example: 0.5
 *                     performanceStats:
 *                       type: object
 *                       properties:
 *                         averageScore:
 *                           type: number
 *                           example: 85.5
 *                         averageTestCasesPassed:
 *                           type: number
 *                           example: 4.2
 */

/**
 * @swagger
 * /api/tests/analytics/{testId}/mcq:
 *   post:
 *     summary: Record analytics data for an MCQ question
 *     tags: [Test Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - analyticsData
 *             properties:
 *               questionId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               analyticsData:
 *                 type: object
 *                 properties:
 *                   timeSpent:
 *                     type: number
 *                     example: 45
 *                     description: Time spent in seconds
 *                   warnings:
 *                     type: number
 *                     example: 0
 *                   tabSwitches:
 *                     type: number
 *                     example: 1
 *                   copyPasteAttempts:
 *                     type: number
 *                     example: 0
 *                   mouseMoves:
 *                     type: number
 *                     example: 23
 *                   keystrokes:
 *                     type: number
 *                     example: 15
 *                   focusLostCount:
 *                     type: number
 *                     example: 1
 *                   submissionAttempts:
 *                     type: number
 *                     example: 1
 *                   score:
 *                     type: number
 *                     example: 5
 *                   browser:
 *                     type: string
 *                     example: "Chrome 96.0.4664"
 *                   os:
 *                     type: string
 *                     example: "Windows 10"
 *                   device:
 *                     type: string
 *                     example: "Desktop"
 *                   screenResolution:
 *                     type: string
 *                     example: "1920x1080"
 */

/**
 * @swagger
 * /api/tests/analytics/{testId}/coding:
 *   post:
 *     summary: Record analytics data for a coding challenge
 *     tags: [Test Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengeId
 *               - analyticsData
 *             properties:
 *               challengeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               analyticsData:
 *                 type: object
 *                 properties:
 *                   timeSpent:
 *                     type: number
 *                     example: 300
 *                     description: Time spent in seconds
 *                   warnings:
 *                     type: number
 *                     example: 0
 *                   tabSwitches:
 *                     type: number
 *                     example: 2
 *                   copyPasteAttempts:
 *                     type: number
 *                     example: 1
 *                   mouseMoves:
 *                     type: number
 *                     example: 150
 *                   keystrokes:
 *                     type: number
 *                     example: 500
 *                   focusLostCount:
 *                     type: number
 *                     example: 3
 *                   submissionAttempts:
 *                     type: number
 *                     example: 2
 *                   errorCount:
 *                     type: number
 *                     example: 3
 *                   executionTime:
 *                     type: number
 *                     example: 0.45
 *                     description: Execution time in seconds
 *                   memoryUsage:
 *                     type: number
 *                     example: 5242880
 *                     description: Memory usage in bytes
 *                   testCasesPassed:
 *                     type: number
 *                     example: 8
 *                   totalTestCases:
 *                     type: number
 *                     example: 10
 *                   score:
 *                     type: number
 *                     example: 80
 *                   browser:
 *                     type: string
 *                     example: "Chrome 96.0.4664"
 *                   os:
 *                     type: string
 *                     example: "Windows 10"
 *                   device:
 *                     type: string
 *                     example: "Desktop"
 *                   screenResolution:
 *                     type: string
 *                     example: "1920x1080"
 */

/**
 * @swagger
 * /api/tests/{testId}/type:
 *   patch:
 *     summary: Update test type (assessment/coding_challenge)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [assessment, coding_challenge]
 *                 description: New type for the test
 *     responses:
 *       200:
 *         description: Test type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test type updated successfully
 *                 test:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     title:
 *                       type: string
 *                       example: Sample Test
 *                     type:
 *                       type: string
 *                       enum: [assessment, coding_challenge]
 *                     status:
 *                       type: string
 *                       enum: [draft, published, archived]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid test type provided
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Forbidden - User not authorized to update this test
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error while updating test type
 */
router.patch('/:testId/type', auth, validateTestAccess, updateTestType);

// Add this route handler
router.get('/submissions/test/:testId/mcq', auth, async (req, res) => {
  try {
    const { testId } = req.params;

    // Validate testId format
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ 
        error: "Invalid test ID format" 
      });
    }

    // Find all MCQ submissions for this test
    const submissions = await Submission.find({
      test: testId,
      type: 'mcq'
    })
    .populate('user', 'name email')
    .sort({ submittedAt: -1 });

    // Transform submissions to include only necessary data
    const transformedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      user: {
        _id: sub.user._id,
        name: sub.user.name,
        email: sub.user.email
      },
      score: sub.score,
      totalMarks: sub.totalMarks,
      answers: sub.answers,
      submittedAt: sub.submittedAt,
      status: sub.status
    }));

    res.json(transformedSubmissions);

  } catch (error) {
    console.error('Error fetching MCQ submissions:', error);
    res.status(500).json({ 
      error: "Failed to fetch MCQ submissions",
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tests/parse-uuid/{uuid}:
 *   get:
 *     summary: Parse test UUID to get test ID and vendor ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the test
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     testId:
 *                       type: string
 *                     vendorId:
 *                       type: string
 *                     uuid:
 *                       type: string
 *                     title:
 *                       type: string
 *                     vendor:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       404:
 *         description: Test not found
 */
router.get("/parse-uuid/:uuid", parseTestUuid);


export default router;
