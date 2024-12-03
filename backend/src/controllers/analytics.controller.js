import TestAnalytics from '../models/testAnalytics.model.js';
import Test from '../models/test.model.js';

export const getTestAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { userId, questionId, challengeId, type } = req.query;

    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        message: "Test not found",
        data: null
      });
    }

    // Build base query
    const query = { test: testId };

    // Add optional filters if they exist
    if (userId) query.user = userId;
    if (type) query.type = type;
    if (questionId) query.questionId = questionId;
    if (challengeId) query.challengeId = challengeId;

    // Get analytics data
    const analytics = await TestAnalytics.find(query)
      .populate('user', 'name email')
      .populate('test', 'title type')
      .sort({ 'metadata.timestamp': -1 });

    if (!analytics || analytics.length === 0) {
      return res.status(200).json({
        message: "No analytics data found",
        data: {
          summary: {
            overview: {
              totalParticipants: 0,
              totalSubmissions: 0,
              averageTimeSpent: 0
            },
            behaviorMetrics: {
              warnings: { total: 0, average: 0 },
              tabSwitches: { total: 0, average: 0 },
              copyPasteAttempts: { total: 0, average: 0 },
              focusLost: { total: 0, average: 0 }
            },
            performanceMetrics: {
              averageScore: 0,
              averageExecutionTime: 0,
              averageTestCasesPassed: 0
            }
          },
          details: []
        }
      });
    }

    // Calculate summary statistics
    const summary = {
      overview: {
        totalParticipants: new Set(analytics.map(a => a.user?._id?.toString())).size,
        totalSubmissions: analytics.length,
        averageTimeSpent: Math.round(
          analytics.reduce((acc, curr) => acc + (curr.behavior?.timeSpent || 0), 0) / analytics.length
        )
      },
      behaviorMetrics: {
        warnings: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior?.warnings || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior?.warnings || 0), 0) / analytics.length).toFixed(2))
        },
        tabSwitches: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior?.tabSwitches || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior?.tabSwitches || 0), 0) / analytics.length).toFixed(2))
        },
        copyPasteAttempts: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior?.copyPasteAttempts || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior?.copyPasteAttempts || 0), 0) / analytics.length).toFixed(2))
        },
        focusLost: {
          total: analytics.reduce((acc, curr) => acc + (curr.behavior?.focusLostCount || 0), 0),
          average: Number((analytics.reduce((acc, curr) => acc + (curr.behavior?.focusLostCount || 0), 0) / analytics.length).toFixed(2))
        }
      },
      performanceMetrics: {
        averageScore: Number((analytics.reduce((acc, curr) => acc + (curr.performance?.score || 0), 0) / analytics.length).toFixed(2)),
        averageExecutionTime: type === 'coding' ? 
          Number((analytics.reduce((acc, curr) => acc + (curr.performance?.executionTime || 0), 0) / analytics.length).toFixed(2)) : 
          null,
        averageTestCasesPassed: type === 'coding' ? 
          Number((analytics.reduce((acc, curr) => acc + (curr.performance?.testCasesPassed || 0), 0) / analytics.length).toFixed(2)) : 
          null
      }
    };

    // Prepare detailed analytics with null checks
    const details = analytics.map(entry => ({
      id: entry._id,
      user: entry.user ? {
        id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email
      } : null,
      type: entry.type,
      behavior: entry.behavior ? {
        timeSpent: entry.behavior.timeSpent || 0,
        warnings: entry.behavior.warnings || 0,
        tabSwitches: entry.behavior.tabSwitches || 0,
        copyPasteAttempts: entry.behavior.copyPasteAttempts || 0,
        focusLostCount: entry.behavior.focusLostCount || 0,
        submissionAttempts: entry.behavior.submissionAttempts || 0,
        errorCount: entry.behavior.errorCount || 0
      } : {},
      performance: entry.performance ? {
        score: entry.performance.score || 0,
        executionTime: entry.performance.executionTime || 0,
        memoryUsage: entry.performance.memoryUsage || 0,
        testCasesPassed: entry.performance.testCasesPassed || 0,
        totalTestCases: entry.performance.totalTestCases || 0
      } : {},
      metadata: entry.metadata ? {
        browser: entry.metadata.browser,
        os: entry.metadata.os,
        device: entry.metadata.device,
        screenResolution: entry.metadata.screenResolution,
        timestamp: entry.metadata.timestamp
      } : {}
    }));

    res.status(200).json({
      message: "Analytics retrieved successfully",
      data: {
        summary,
        details
      }
    });

  } catch (error) {
    console.error('Error in getTestAnalytics:', error);
    res.status(500).json({
      error: "Failed to retrieve analytics",
      details: error.message
    });
  }
};

export const postMCQAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionId, analyticsData } = req.body;

    // Validate test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Validate MCQ exists
    if (!questionId) {
      return res.status(400).json({ error: "questionId is required for MCQ analytics" });
    }

    const mcqExists = test.mcqs.some(mcq => mcq._id.toString() === questionId);
    if (!mcqExists) {
      return res.status(404).json({ error: "Question not found in test" });
    }

    // Create analytics entry
    const analytics = await TestAnalytics.create({
      test: testId,
      user: req.user._id,
      questionId,
      type: 'mcq',
      behavior: {
        warnings: analyticsData.warnings || 0,
        tabSwitches: analyticsData.tabSwitches || 0,
        copyPasteAttempts: analyticsData.copyPasteAttempts || 0,
        timeSpent: analyticsData.timeSpent,
        mouseMoves: analyticsData.mouseMoves || 0,
        keystrokes: analyticsData.keystrokes || 0,
        browserEvents: analyticsData.browserEvents || [],
        focusLostCount: analyticsData.focusLostCount || 0,
        submissionAttempts: analyticsData.submissionAttempts || 0,
        hintViews: analyticsData.hintViews || 0
      },
      performance: {
        score: analyticsData.score
      },
      metadata: {
        browser: analyticsData.browser,
        os: analyticsData.os,
        device: analyticsData.device,
        screenResolution: analyticsData.screenResolution,
        timestamp: new Date()
      }
    });

    await analytics.populate({
      path: 'questionId',
      select: 'question marks',
      model: 'Test.mcqs'
    });

    res.status(201).json({
      message: "MCQ analytics data recorded successfully",
      analytics: {
        ...analytics.toObject(),
        question: analytics.questionId
      }
    });

  } catch (error) {
    console.error('Error in postMCQAnalytics:', error);
    res.status(500).json({
      error: "Failed to record MCQ analytics",
      details: error.message
    });
  }
};

export const postCodingAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { challengeId, analyticsData } = req.body;

    // Validate test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Validate coding challenge exists
    if (!challengeId) {
      return res.status(400).json({ error: "challengeId is required for coding analytics" });
    }

    const challengeExists = test.codingChallenges.some(
      challenge => challenge._id.toString() === challengeId
    );
    if (!challengeExists) {
      return res.status(404).json({ error: "Coding challenge not found in test" });
    }

    // Create analytics entry
    const analytics = await TestAnalytics.create({
      test: testId,
      user: req.user._id,
      challengeId,
      type: 'coding',
      behavior: {
        warnings: analyticsData.warnings || 0,
        tabSwitches: analyticsData.tabSwitches || 0,
        copyPasteAttempts: analyticsData.copyPasteAttempts || 0,
        timeSpent: analyticsData.timeSpent,
        mouseMoves: analyticsData.mouseMoves || 0,
        keystrokes: analyticsData.keystrokes || 0,
        browserEvents: analyticsData.browserEvents || [],
        focusLostCount: analyticsData.focusLostCount || 0,
        submissionAttempts: analyticsData.submissionAttempts || 0,
        errorCount: analyticsData.errorCount || 0
      },
      performance: {
        executionTime: analyticsData.executionTime,
        memoryUsage: analyticsData.memoryUsage
      },
      metadata: {
        browser: analyticsData.browser,
        os: analyticsData.os,
        device: analyticsData.device,
        screenResolution: analyticsData.screenResolution,
        timestamp: new Date()
      }
    });

    await analytics.populate({
      path: 'challengeId',
      select: 'title marks',
      model: 'Test.codingChallenges'
    });

    res.status(201).json({
      message: "Coding analytics data recorded successfully",
      analytics: {
        ...analytics.toObject(),
        challenge: analytics.challengeId
      }
    });

  } catch (error) {
    console.error('Error in postCodingAnalytics:', error);
    res.status(500).json({
      error: "Failed to record coding analytics",
      details: error.message
    });
  }
};

export const postTestAnalytics = async (req, res) => {
  try {
    const { testId } = req.params;
    const { analyticsData } = req.body;
    
    // Ensure test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Get user ID from authenticated request
    const userId = req.user._id || req.user.id;  // Add fallback for different token formats
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Create new analytics document with proper defaults
    const analytics = new TestAnalytics({
      test: testId,
      user: userId,  // Ensure user ID is properly set
      type: 'test',
      behavior: {
        warnings: analyticsData.warnings || 0,
        tabSwitches: analyticsData.tabSwitches || 0,
        copyPasteAttempts: analyticsData.copyPasteAttempts || 0,
        timeSpent: analyticsData.timeSpent || 0,
        mouseMoves: analyticsData.mouseMoves || 0,
        keystrokes: analyticsData.keystrokes || 0,
        focusLostCount: analyticsData.focusLostCount || 0,
        submissionAttempts: analyticsData.submissionAttempts || 0
      },
      performance: {
        score: analyticsData.score || 0,
        executionTime: analyticsData.executionTime,
        memoryUsage: analyticsData.memoryUsage,
        testCasesPassed: analyticsData.testCasesPassed,
        totalTestCases: analyticsData.totalTestCases
      },
      metadata: {
        browser: analyticsData.browser,
        os: analyticsData.os,
        device: analyticsData.device,
        screenResolution: analyticsData.screenResolution,
        timestamp: new Date()
      }
    });

    await analytics.save();

    return res.status(200).json({
      success: true,
      message: 'Analytics saved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('Error in postTestAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save analytics',
      error: error.message
    });
  }
}; 