import express from "express";
import { auth } from "../middleware/auth.js";
import { 
  getAvailableTests,
  registerForTest,
  updateProfile,
  updateSkills,
  getCertificates,
  getTestResults,
  downloadCertificate,
  getProgressReport,
  getPerformanceHistory,
  getProfile,
  createProfile,
  getPracticeHistory
} from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management and profile endpoints
 * 
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user's skills
 *     Certificate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         testId:
 *           type: string
 *         title:
 *           type: string
 *         issueDate:
 *           type: string
 *           format: date-time
 *         expiryDate:
 *           type: string
 *           format: date-time
 *     ProgressReport:
 *       type: object
 *       properties:
 *         completedTests:
 *           type: number
 *         averageScore:
 *           type: number
 *         skillProgress:
 *           type: object
 *           additionalProperties:
 *             type: number
 *     Test:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The test ID
 *         title:
 *           type: string
 *           description: Test title
 *         description:
 *           type: string
 *           description: Test description
 *         duration:
 *           type: number
 *           description: Test duration in minutes
 *         totalMarks:
 *           type: number
 *           description: Total marks for the test
 *         type:
 *           type: string
 *           enum: [assessment, practice]
 *           description: Type of test
 *         category:
 *           type: string
 *           description: Test category
 *         difficulty:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: Difficulty level
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           description: Test status
 *         vendor:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TestResult:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         test:
 *           $ref: '#/components/schemas/Test'
 *         user:
 *           type: string
 *         score:
 *           type: number
 *         status:
 *           type: string
 *           enum: [passed, failed]
 *         completedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get user profile
 *     description: Retrieves the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *               example:
 *                 id: "67349eb6b7b2a2b32bb5b4b9"
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", auth, getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   post:
 *     tags: [User]
 *     summary: Create or update user profile
 *     description: Creates or updates a complete user profile including skill levels
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     degree:
 *                       type: string
 *                     institution:
 *                       type: string
 *                     year:
 *                       type: string
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     company:
 *                       type: string
 *                     years:
 *                       type: number
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the skill
 *                     level:
 *                       type: string
 *                       enum: [beginner, intermediate, expert]
 *                       description: Proficiency level in the skill
 *           example:
 *             name: "John Doe"
 *             email: "john@example.com"
 *             phone: "+1234567890"
 *             education: [
 *               {
 *                 degree: "Bachelor's in Computer Science",
 *                 institution: "University Name",
 *                 year: "2020"
 *               }
 *             ]
 *             experience: [
 *               {
 *                 title: "Software Developer",
 *                 company: "Tech Corp",
 *                 years: 2
 *               }
 *             ]
 *             skills: [
 *               { name: "JavaScript", level: "expert" },
 *               { name: "Python", level: "intermediate" },
 *               { name: "React", level: "beginner" }
 *             ]
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/profile", auth, createProfile);

/**
 * @swagger
 * /api/user/skills:
 *   put:
 *     tags: [User]
 *     summary: Update user skills
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Skills updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/skills", auth, updateSkills);

/**
 * @swagger
 * /api/user/certificates:
 *   get:
 *     tags: [User]
 *     summary: Get user certificates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user certificates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 */
router.get("/certificates", auth, getCertificates);

/**
 * @swagger
 * /api/user/progress:
 *   get:
 *     tags: [User]
 *     summary: Get user progress report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgressReport'
 *       401:
 *         description: Unauthorized
 */
router.get("/progress", auth, getProgressReport);

/**
 * @swagger
 * /api/user/tests/available:
 *   get:
 *     tags: [User]
 *     summary: Get all available tests with registration status
 *     description: Retrieves a list of all tests available for the user to take, along with their registration status and profile completion status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available tests with registration info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Test'
 *                   - type: object
 *                     properties:
 *                       registrationStatus:
 *                         type: string
 *                         enum: [not_registered, registered, completed]
 *                       profileComplete:
 *                         type: boolean
 *                       missingFields:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get("/tests/available", auth, getAvailableTests);

/**
 * @swagger
 * /api/user/tests/{testId}/register:
 *   post:
 *     tags: [User]
 *     summary: Register for a specific test
 *     description: Registers the user for a specific test and returns registration details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test to register for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional preferred date for test
 *     responses:
 *       200:
 *         description: Successfully registered for test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registrationId:
 *                   type: string
 *                 testDate:
 *                   type: string
 *                   format: date-time
 *                 expiryDate:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Test not found
 *       409:
 *         description: Already registered for this test
 */
router.post("/tests/:testId/register", auth, registerForTest);

/**
 * @swagger
 * /api/user/tests/results:
 *   get:
 *     tags: [User]
 *     summary: Get user's test results
 *     description: Retrieves test results summary or detailed results for a specific test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: testId
 *         schema:
 *           type: string
 *         description: Optional specific test ID for detailed results
 *     responses:
 *       200:
 *         description: Test results
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 # Summary view (without testId)
 *                 - type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       mcqScore:
 *                         type: number
 *                       codingScore:
 *                         type: number
 *                       totalScore:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [passed, failed]
 *                       attemptedAt:
 *                         type: string
 *                         format: date-time
 *                 # Detailed view (with testId)
 *                 - type: object
 *                   properties:
 *                     testId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [in_progress, mcq_completed, coding_completed, completed]
 *                     mcqSection:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: boolean
 *                         totalScore:
 *                           type: number
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         questions:
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
 *                               timeTaken:
 *                                 type: number
 *                     codingSection:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: boolean
 *                         totalScore:
 *                           type: number
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
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
 *                               bestScore:
 *                                 type: number
 *                               maxScore:
 *                                 type: number
 *                               attempts:
 *                                 type: number
 *                               submissions:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     submissionId:
 *                                       type: string
 *                                     code:
 *                                       type: string
 *                                     language:
 *                                       type: string
 *                                     status:
 *                                       type: string
 *                                       enum: [pending, evaluated, error, partial, passed]
 *                                     marks:
 *                                       type: number
 *                                     maxMarks:
 *                                       type: number
 *                                     executionTime:
 *                                       type: number
 *                                     memory:
 *                                       type: number
 *                                     submittedAt:
 *                                       type: string
 *                                       format: date-time
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
 *                                           executionTime:
 *                                             type: number
 *                                           memory:
 *                                             type: number
 *                                           error:
 *                                             type: string
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: number
 *                         correctAnswers:
 *                           type: number
 *                         totalChallenges:
 *                           type: number
 *                         solvedChallenges:
 *                           type: number
 *                         averageExecutionTime:
 *                           type: number
 *                         averageMemoryUsage:
 *                           type: number
 *                     totalScore:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     percentile:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Test result not found
 */
router.get("/tests/results", auth, getTestResults);

/**
 * @swagger
 * /api/user/tests/practice/history:
 *   get:
 *     tags: [User]
 *     summary: Get performance history
 *     description: Retrieves user's practice test performance history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance history data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAttempts:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestResult'
 *       401:
 *         description: Unauthorized
 */
router.get("/practice/history", auth, getPerformanceHistory);

/**
 * @swagger
 * /api/user/certificates/{testId}/download:
 *   get:
 *     tags: [Certificates]
 *     summary: Download a specific certificate
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
 *         description: Certificate file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Certificate not found
 */
router.get("/certificates/:testId/download", auth, downloadCertificate);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     tags: [User]
 *     summary: Update user profile
 *     description: Updates an existing user profile
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
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     degree:
 *                       type: string
 *                     institution:
 *                       type: string
 *                     year:
 *                       type: string
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     company:
 *                       type: string
 *                     years:
 *                       type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put("/profile", auth, updateProfile);

/**
 * @swagger
 * /api/user/practice/history:
 *   get:
 *     tags: [User]
 *     summary: Get practice test history
 *     description: Retrieves the user's practice test history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Practice test history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId:
 *                         type: string
 *                       score:
 *                         type: number
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/practice/history", auth, getPracticeHistory);

export default router; 