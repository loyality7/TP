import Test from '../models/test.model.js';
import Submission from '../models/submission.model.js';

export const getSkillsAnalytics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { period = 'all' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate;

    switch(period.toLowerCase()) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Get submissions
    const submissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed',
      createdAt: { $gte: startDate }
    }).populate('codingSubmission');

    // Extract and calculate skill scores
    const skillScores = {
      problemSolving: [],
      codeQuality: [],
      performance: [],
      security: [],
      bestPractices: []
    };

    submissions.forEach(submission => {
      if (submission.codingSubmission) {
        skillScores.problemSolving.push(submission.codingSubmission.problemSolvingScore || 0);
        skillScores.codeQuality.push(submission.codingSubmission.codeQualityScore || 0);
        skillScores.performance.push(submission.codingSubmission.performanceScore || 0);
        skillScores.security.push(submission.codingSubmission.securityScore || 0);
        skillScores.bestPractices.push(submission.codingSubmission.bestPracticesScore || 0);
      }
    });

    // Calculate averages
    const result = {};
    for (const [skill, scores] of Object.entries(skillScores)) {
      result[skill] = scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
        : 0;
    }

    res.json(result);

  } catch (error) {
    console.error('Error in getSkillsAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
}; 