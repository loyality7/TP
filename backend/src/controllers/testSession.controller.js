import Test from '../models/test.model.js';
import TestSession from '../models/testSession.model.js';
import mongoose from 'mongoose';

// Test Status Enum
const TEST_STATUS = {
  NOT_STARTED: 'not_started',
  STARTED: 'started',
  IN_MCQ: 'in_mcq',
  IN_CODING: 'in_coding',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

// Session Status Enum
const SESSION_STATUS = {
  CREATED: 'created',      // Initial state when session is created
  STARTED: 'started',      // User has started the test
  IN_PROGRESS: 'in_progress', // Actively taking test
  PAUSED: 'paused',        // Test temporarily paused
  COMPLETED: 'completed',  // Test submitted successfully
  EXPIRED: 'expired',      // Time ran out
  TERMINATED: 'terminated' // Ended due to violation/error
};

// Validate session middleware
export const validateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ 
        error: "Invalid session ID format"
      });
    }

    const session = await TestSession.findOne({
      _id: sessionId,
      userId: req.user._id
    }).populate('testId');

    if (!session) {
      return res.status(404).json({ 
        error: "Session not found",
        message: "Test session does not exist or you don't have access" 
      });
    }

    // Check if test exists and is active
    if (!session.testId || !session.testId.isActive) {
      session.status = SESSION_STATUS.TERMINATED;
      await session.save();
      return res.status(400).json({
        error: "Test not available",
        message: "The test is no longer active or has been removed"
      });
    }

    // Check session status
    if (![SESSION_STATUS.STARTED, SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.PAUSED].includes(session.status)) {
      return res.status(400).json({
        error: "Invalid session status",
        message: `Test session is ${session.status}`,
        status: session.status
      });
    }

    // Check session expiration
    const now = new Date();
    if (now > session.expiresAt) {
      session.status = SESSION_STATUS.EXPIRED;
      session.testStatus = TEST_STATUS.EXPIRED;
      await session.save();
      
      return res.status(400).json({
        error: "Session expired",
        message: "Test session has expired",
        status: SESSION_STATUS.EXPIRED
      });
    }

    // Check test duration
    const testStartTime = session.startTime || session.createdAt;
    const elapsedTime = now - testStartTime;
    const maxDuration = session.testId.duration * 60 * 1000; // Convert minutes to milliseconds

    if (elapsedTime > maxDuration) {
      session.status = 'expired';
      await session.save();
      
      return res.status(400).json({
        error: "Test time exceeded",
        message: "Maximum test duration exceeded",
        status: 'expired'
      });
    }

    // Add session to request for use in next middleware
    req.testSession = session;
    next();

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: "Session validation failed",
      message: error.message
    });
  }
};

// Get session status with test progress
export const getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await TestSession.findOne({
      _id: sessionId,
      userId: req.user._id
    }).select('status testStatus startTime expiresAt progress currentSection');

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    const remainingTime = Math.max(0, session.expiresAt - now);

    res.json({
      session: {
        id: session._id,
        sessionStatus: session.status,
        testStatus: session.testStatus,
        startTime: session.startTime,
        expiresAt: session.expiresAt,
        remainingTime,
        currentSection: session.currentSection,
        progress: session.progress
      }
    });

  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      error: "Failed to get session status",
      message: error.message
    });
  }
};

// Update session and test status
export const updateProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, currentSection, testStatus } = req.body;

    const session = req.testSession;

    // Update test status if provided
    if (testStatus && Object.values(TEST_STATUS).includes(testStatus)) {
      session.testStatus = testStatus;
    }

    // Update session status based on test status
    if (testStatus === TEST_STATUS.IN_MCQ || testStatus === TEST_STATUS.IN_CODING) {
      session.status = SESSION_STATUS.IN_PROGRESS;
    }

    session.progress = {
      ...session.progress,
      answers,
      currentSection,
      lastUpdated: new Date()
    };

    await session.save();

    res.json({
      message: "Progress updated successfully",
      sessionStatus: session.status,
      testStatus: session.testStatus,
      lastSaved: session.progress.lastUpdated
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      error: "Failed to update progress",
      message: error.message
    });
  }
};

// End test session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { submissionType } = req.body;

    const session = req.testSession;

    session.status = SESSION_STATUS.COMPLETED;
    session.testStatus = TEST_STATUS.COMPLETED;
    session.endTime = new Date();
    session.submissionType = submissionType;

    await session.save();

    res.json({
      message: "Test completed successfully",
      sessionStatus: session.status,
      testStatus: session.testStatus,
      endTime: session.endTime
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      error: "Failed to end session",
      message: error.message
    });
  }
};

export const createSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { testId } = req.params;
    const userId = req.user._id;
    const { deviceInfo } = req.body;

    // 1. Check for existing active session
    const existingSession = await TestSession.findOne({
      testId,
      userId,
      status: { $in: ['active', 'paused'] },
      expiresAt: { $gt: new Date() }
    });

    if (existingSession) {
      return res.status(400).json({
        error: "Active session exists",
        session: existingSession,
        message: "Please complete or end your existing session"
      });
    }

    // 2. Get test details for duration
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // 3. Calculate session expiration
    const startTime = new Date();
    const expiresAt = new Date(startTime.getTime() + (test.duration * 60 * 1000));

    // 4. Create new session with strict time limits
    const newSession = new TestSession({
      testId,
      userId,
      startTime,
      expiresAt,
      maxDuration: test.duration * 60, // in seconds
      status: 'active',
      deviceInfo,
      progress: {
        mcqAnswers: {},
        codingAnswers: {},
        currentSection: 'mcq',
        lastActivity: startTime
      },
      analytics: {
        browserEvents: [],
        warnings: 0,
        violations: []
      }
    });

    await newSession.save({ session });
    await session.commitTransaction();

    res.json({
      message: "Session created successfully",
      session: {
        id: newSession._id,
        startTime,
        expiresAt,
        maxDuration: test.duration * 60,
        status: 'active'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      error: "Failed to create session",
      details: error.message
    });
  } finally {
    session.endSession();
  }
};

export const validateTestSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const testSession = await TestSession.findOne({
      _id: sessionId,
      userId,
      status: { $in: ['active', 'paused'] }
    });

    if (!testSession) {
      return res.status(404).json({
        error: "Session not found or expired",
        shouldRedirect: true,
        redirectUrl: `/test/shared/${testSession.testId}`
      });
    }

    // Check if session has expired
    if (new Date() > testSession.expiresAt) {
      testSession.status = 'expired';
      await testSession.save();
      
      return res.status(400).json({
        error: "Session has expired",
        shouldRedirect: true,
        redirectUrl: `/test/shared/${testSession.testId}`
      });
    }

    // Validate session state
    const validationResult = await validateSession(testSession);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: validationResult.error,
        shouldRedirect: true,
        redirectUrl: `/test/shared/${testSession.testId}`
      });
    }

    res.json({
      isValid: true,
      session: {
        id: testSession._id,
        startTime: testSession.startTime,
        expiresAt: testSession.expiresAt,
        status: testSession.status,
        progress: testSession.progress
      }
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to validate session",
      details: error.message
    });
  }
};

// Cleanup expired sessions (can be called via cron job)
export const cleanupExpiredSessions = async () => {
  try {
    const result = await TestSession.updateMany(
      {
        status: { $in: ['active', 'paused'] },
        expiresAt: { $lt: new Date() }
      },
      {
        $set: { status: 'expired' }
      }
    );

    return {
      message: "Cleanup completed",
      sessionsExpired: result.modifiedCount
    };
  } catch (error) {
    console.error('Session cleanup error:', error);
    throw error;
  }
}; 