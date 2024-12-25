import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  submitMCQ, 
  submitCoding, 
  evaluateSubmission, 
  getUserSubmissions, 
  getTestSubmissions, 
  getTestMCQSubmissions, 
  getTestCodingSubmissions, 
  getChallengeSubmissions, 
  getMCQSubmissions, 
  getTestResults, 
  getSubmissionAttempts, 
  getSubmissionDetails, 
  updateSubmissionStatus, 
  getComprehensiveSubmission 
} from '../controllers/submission.controller.js';
import { validateSubmission } from '../middleware/validateSubmission.js';
import { validateTestAccess } from '../middleware/validateTestAccess.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MCQSubmission:
 *       type: object
 *       properties:
 *         testId:
 *           type: string
 *         userId:
 *           type: string
 *         questionId:
 *           type: string
 *         selectedOptions:
 *           type: array
 *           items:
 *             type: string
 *     CodingSubmission:
 *       type: object
 *       properties:
 *         testId:
 *           type: string
 *         userId:
 *           type: string
 *         challengeId:
 *           type: string
 *         code:
 *           type: string
 *         language:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, evaluated]
 *     OverallMetrics:
 *       type: object
 *       properties:
 *         testCases:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             passed:
 *               type: number
 *             failed:
 *               type: number
 *             successRate:
 *               type: string
 *         challenges:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             passed:
 *               type: number
 *             partial:
 *               type: number
 *             failed:
 *               type: number
 *             successRate:
 *               type: string
 *         performance:
 *           type: object
 *           properties:
 *             totalExecutionTime:
 *               type: string
 *             averageExecutionTime:
 *               type: string
 *             totalMemoryUsed:
 *               type: string
 *             averageMemoryUsed:
 *               type: string
 *         scoring:
 *           type: object
 *           properties:
 *             totalScore:
 *               type: number
 *             maxPossibleScore:
 *               type: number
 *             percentage:
 *               type: string
 *         timing:
 *           type: object
 *           properties:
 *             submissionTime:
 *               type: string
 *               format: date-time
 *             totalDuration:
 *               type: number
 */

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Test submission and evaluation endpoints
 */

/**
 * @swagger
 * /api/submissions/submit/mcq:
 *   post:
 *     summary: Submit multiple MCQ answers for a test
 *     tags: [Submissions]
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
 *               - submissions
 *             properties:
 *               testId:
 *                 type: string
 *               submissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedOptions
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOptions:
 *                       type: array
 *                       items:
 *                         type: number
 *     responses:
 *       201:
 *         description: MCQ submissions created successfully
 *       500:
 *         description: Error submitting MCQs
 */
router.post('/submit/mcq', auth, validateTestAccess, validateSubmission.mcq, submitMCQ);

/**
 * @swagger
 * /api/submissions/submit/coding:
 *   post:
 *     summary: Submit multiple coding challenge answers with test results
 *     tags: [Submissions]
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
 *               - submissions
 *             properties:
 *               testId:
 *                 type: string
 *               submissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - challengeId
 *                     - code
 *                     - language
 *                     - testCaseResults
 *                   properties:
 *                     challengeId:
 *                       type: string
 *                     code:
 *                       type: string
 *                     language:
 *                       type: string
 *                     testCaseResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                           expectedOutput:
 *                             type: string
 *                           actualOutput:
 *                             type: string
 *                           passed:
 *                             type: boolean
 *                           error:
 *                             type: string
 *                           executionTime:
 *                             type: number
 *                     executionTime:
 *                       type: number
 *                     memory:
 *                       type: number
 *                     output:
 *                       type: string
 *                     error:
 *                       type: string
 *     responses:
 *       201:
 *         description: Coding submissions created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissionId:
 *                   type: string
 *                 submission:
 *                   type: object
 *                 message:
 *                   type: string
 *       500:
 *         description: Error submitting code
 */
router.post('/submit/coding', auth, validateTestAccess, validateSubmission.coding, submitCoding);

/**
 * @swagger
 * /api/submissions/{id}/evaluate:
 *   post:
 *     summary: Evaluate a test submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID to evaluate
 *     responses:
 *       200:
 *         description: Submission evaluated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                     status:
 *                       type: string
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Submission not found
 */
router.post('/:id/evaluate', auth, checkRole(['admin', 'vendor']), evaluateSubmission);

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
 *     responses:
 *       200:
 *         description: List of user's submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mcq:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MCQSubmission'
 *                 coding:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CodingSubmission'
 *       500:
 *         description: Error fetching user submissions
 */
router.get('/user/:userId', auth, getUserSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}:
 *   get:
 *     summary: Get all submissions for a test
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     responses:
 *       200:
 *         description: List of test submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mcqSubmissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MCQSubmission'
 *                 codingSubmissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CodingSubmission'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */
router.get('/test/:testId', auth, checkRole(['admin', 'vendor']), getTestSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}/mcq:
 *   get:
 *     summary: Get all MCQ submissions for a test
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     responses:
 *       200:
 *         description: List of MCQ submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MCQSubmission'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */
router.get('/test/:testId/mcq', auth, checkRole(['admin', 'vendor']), getTestMCQSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}/coding:
 *   get:
 *     summary: Get all coding submissions for a test
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the test
 *     responses:
 *       200:
 *         description: List of coding submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CodingSubmission'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test not found
 */
router.get('/test/:testId/coding', auth, checkRole(['admin', 'vendor']), getTestCodingSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}/challenge/{challengeId}:
 *   get:
 *     summary: Get all submissions for a specific coding challenge
 *     tags: [Submissions]
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
 *     responses:
 *       200:
 *         description: List of submissions for the coding challenge
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CodingSubmission'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or challenge not found
 */
router.get('/test/:testId/challenge/:challengeId', auth, checkRole(['admin', 'vendor']), getChallengeSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}/mcq/{questionId}:
 *   get:
 *     summary: Get all submissions for a specific MCQ
 *     tags: [Submissions]
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the MCQ question
 *     responses:
 *       200:
 *         description: List of submissions for the MCQ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MCQSubmission'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Test or question not found
 */
router.get('/test/:testId/mcq/:questionId', auth, checkRole(['admin', 'vendor']), getMCQSubmissions);

/**
 * @swagger
 * /api/submissions/test/{testId}/results:
 *   get:
 *     summary: Get all submissions and results for a test
 *     tags: [Submissions]
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
 *         description: Test results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testId:
 *                   type: string
 *                 mcqSubmissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MCQSubmission'
 *                 codingSubmissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CodingSubmission'
 *                 totalSubmissions:
 *                   type: number
 *       500:
 *         description: Error retrieving test results
 */
router.get('/test/:testId/results', auth, checkRole(['admin', 'vendor']), getTestResults);

/**
 * @swagger
 * /api/submissions/test/{testId}/user/{userId}/attempts:
 *   get:
 *     summary: Get all submission attempts for a user's test
 *     tags: [Submissions]
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
 *         description: List of submission attempts
 */
router.get('/test/:testId/user/:userId/attempts', auth, getSubmissionAttempts);

/**
 * @swagger
 * /api/submissions/test/{testId}/user/{userId}/details:
 *   get:
 *     summary: Get detailed submission information for a specific user's test
 *     tags: [Submissions]
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
 *         description: Detailed submission information retrieved successfully
 *       403:
 *         description: Not authorized to access this data
 *       404:
 *         description: Submission not found
 */
router.get('/test/:testId/user/:userId/details', auth, getSubmissionDetails);

/**
 * @swagger
 * /api/submissions/update-status:
 *   post:
 *     summary: Update status for all submissions of a test
 *     tags: [Submissions]
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
 *               - status
 *             properties:
 *               testId:
 *                 type: string
 *                 description: ID of the test
 *               status:
 *                 type: string
 *                 enum: [in_progress, mcq_completed, coding_completed, completed]
 *                 description: New status to set for all submissions of this test
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     testId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     updatedCount:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or missing required fields
 *       500:
 *         description: Server error while updating status
 */
router.post('/update-status', auth, updateSubmissionStatus);

/**
 * @swagger
 * /api/submissions/comprehensive/{testId}/{userId}:
 *   get:
 *     summary: Get comprehensive submission details including MCQs and coding challenges
 *     tags: [Submissions]
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
 *         description: Comprehensive submission details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissionId:
 *                       type: string
 *                     testId:
 *                       type: string
 *                     testTitle:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     status:
 *                       type: string
 *                       enum: [in_progress, mcq_completed, coding_completed, completed]
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: number
 *                       description: Duration in seconds
 *                     scores:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         mcq:
 *                           type: number
 *                         coding:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                         passed:
 *                           type: boolean
 *                     mcq:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: boolean
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         totalScore:
 *                           type: number
 *                         answers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               questionId:
 *                                 type: string
 *                               question:
 *                                 type: string
 *                               selectedOptions:
 *                                 type: array
 *                                 items:
 *                                   type: number
 *                               correctOptions:
 *                                 type: array
 *                                 items:
 *                                   type: number
 *                               isCorrect:
 *                                 type: boolean
 *                               marks:
 *                                 type: number
 *                               maxMarks:
 *                                 type: number
 *                               explanation:
 *                                 type: string
 *                     coding:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: boolean
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         totalScore:
 *                           type: number
 *                         challenges:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               challengeId:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               difficulty:
 *                                 type: string
 *                               submissions:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     submittedAt:
 *                                       type: string
 *                                       format: date-time
 *                                     code:
 *                                       type: string
 *                                     language:
 *                                       type: string
 *                                     status:
 *                                       type: string
 *                                     executionTime:
 *                                       type: number
 *                                     memory:
 *                                       type: number
 *                                     output:
 *                                       type: string
 *                                     error:
 *                                       type: string
 *                                     marks:
 *                                       type: number
 *                                     testCaseResults:
 *                                       type: array
 *                                       items:
 *                                         type: object
 *                                         properties:
 *                                           input:
 *                                             type: string
 *                                           expectedOutput:
 *                                             type: string
 *                                           actualOutput:
 *                                             type: string
 *                                           passed:
 *                                             type: boolean
 *                                           error:
 *                                             type: string
 *                               bestScore:
 *                                 type: number
 *       400:
 *         description: Invalid test ID or user ID format
 *       403:
 *         description: Not authorized to access this submission
 *       404:
 *         description: Test or submission not found
 *       500:
 *         description: Server error while fetching submission details
 */
router.get('/comprehensive/:testId/:userId', auth, getComprehensiveSubmission);

export default router; 
