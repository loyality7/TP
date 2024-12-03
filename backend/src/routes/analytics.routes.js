import express from 'express';
import { postTestAnalytics, getTestAnalytics } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/test/{testId}:
 *   post:
 *     summary: Record analytics data for an entire test session
 *     tags: [Analytics]
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
 *               - analyticsData
 *             properties:
 *               analyticsData:
 *                 type: object
 *                 properties:
 *                   warnings:
 *                     type: number
 *                     description: Number of warnings issued during the test
 *                   tabSwitches:
 *                     type: number
 *                     description: Number of tab switches during the test
 *                   copyPasteAttempts:
 *                     type: number
 *                     description: Number of copy-paste attempts
 *                   timeSpent:
 *                     type: number
 *                     description: Time spent in seconds
 *                   mouseMoves:
 *                     type: number
 *                     description: Number of mouse movements
 *                   keystrokes:
 *                     type: number
 *                     description: Number of keystrokes
 *                   browserEvents:
 *                     type: array
 *                     items:
 *                       type: object
 *                   focusLostCount:
 *                     type: number
 *                     description: Number of times focus was lost
 *                   submissionAttempts:
 *                     type: number
 *                     description: Number of submission attempts
 *                   score:
 *                     type: number
 *                     description: Final test score
 *                   browser:
 *                     type: string
 *                     description: Browser information
 *                   os:
 *                     type: string
 *                     description: Operating system information
 *                   device:
 *                     type: string
 *                     description: Device information
 *                   screenResolution:
 *                     type: string
 *                     description: Screen resolution
 *     responses:
 *       201:
 *         description: Analytics data recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 analytics:
 *                   type: object
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
router.post('/test/:testId', authenticateToken, postTestAnalytics);

/**
 * @swagger
 * /api/analytics/test/{testId}:
 *   get:
 *     summary: Get analytics data for a test
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test (UUID or MongoDB ID)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional filter by user ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Optional filter by question ID
 *       - in: query
 *         name: challengeId
 *         schema:
 *           type: string
 *         description: Optional filter by challenge ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mcq, coding]
 *         description: Optional filter by analytics type
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     details:
 *                       type: array
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
router.get('/test/:testId', authenticateToken, getTestAnalytics);

export default router; 