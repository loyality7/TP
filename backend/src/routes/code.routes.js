import express from 'express';
import { executeCode } from '../controllers/code.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/code/execute:
 *   post:
 *     summary: Execute code with given input
 *     tags: [Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - code
 *             properties:
 *               language:
 *                 type: string
 *                 description: Programming language of the code
 *               code:
 *                 type: string
 *                 description: Source code to execute
 *               inputs:
 *                 type: string
 *                 description: Input for the program
 *     responses:
 *       200:
 *         description: Code executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 output:
 *                   type: string
 *                 error:
 *                   type: string
 *                 executionTime:
 *                   type: number
 *                 memory:
 *                   type: number
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/execute', executeCode);

export default router;
