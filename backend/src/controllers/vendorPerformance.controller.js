export const getPerformanceMetrics = async (req, res) => {
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
      default: // 'all'
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
    }

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Get submissions for current and previous periods
    const currentSubmissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed',
      createdAt: { $gte: startDate }
    }).populate('codingSubmission');

    const previousSubmissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed',
      createdAt: { $gte: startDate, $lt: startDate }
    }).populate('codingSubmission');

    // Calculate skill metrics
    const skillMetrics = {
      problemSolving: computeSkillMetrics(currentSubmissions, previousSubmissions, 'problemSolving'),
      codeQuality: computeSkillMetrics(currentSubmissions, previousSubmissions, 'codeQuality'),
      performance: computeSkillMetrics(currentSubmissions, previousSubmissions, 'performance'),
      security: computeSkillMetrics(currentSubmissions, previousSubmissions, 'security'),
      bestPractices: computeSkillMetrics(currentSubmissions, previousSubmissions, 'bestPractices')
    };

    // Calculate overall metrics
    const overallMetrics = {
      totalCandidates: new Set(currentSubmissions.map(s => s.user.toString())).size,
      averageScore: computeAverageScore(currentSubmissions.map(s => s.totalScore || 0)),
      passRate: computePassRate(currentSubmissions),
      averageCompletionTime: computeAverageDuration(currentSubmissions.map(s => s.duration || 0))
    };

    res.json({
      period: {
        type: period.toLowerCase(),
        startDate,
        endDate: new Date()
      },
      skills: skillMetrics,
      overall: overallMetrics,
      trends: {
        monthly: computeMonthlyTrends(currentSubmissions),
        skillGrowth: computeSkillGrowthTrends(currentSubmissions, previousSubmissions)
      }
    });

  } catch (error) {
    console.error('Error in getPerformanceMetrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      message: error.message 
    });
  }
};

// Helper functions with unique names
const computeSkillMetrics = (currentSubmissions, previousSubmissions, skillType) => {
  const currentScores = extractSkillScores(currentSubmissions, skillType);
  const previousScores = extractSkillScores(previousSubmissions, skillType);

  const currentAvg = computeAverageScore(currentScores);
  const previousAvg = computeAverageScore(previousScores);

  return {
    score: currentAvg,
    level: getSkillLevel(currentAvg),
    candidates: new Set(currentSubmissions.map(s => s.user.toString())).size,
    growth: computeGrowthRate(currentAvg, previousAvg)
  };
};

const extractSkillScores = (submissions, skillType) => {
  return submissions.map(submission => {
    const codingSubmission = submission.codingSubmission;
    if (!codingSubmission) return 0;

    switch(skillType) {
      case 'problemSolving':
        return codingSubmission.problemSolvingScore || 0;
      case 'codeQuality':
        return codingSubmission.codeQualityScore || 0;
      case 'performance':
        return codingSubmission.performanceScore || 0;
      case 'security':
        return codingSubmission.securityScore || 0;
      case 'bestPractices':
        return codingSubmission.bestPracticesScore || 0;
      default:
        return 0;
    }
  });
};

const getSkillLevel = (score) => {
  if (score >= 90) return 'Expert';
  if (score >= 80) return 'Advanced';
  if (score >= 70) return 'Intermediate';
  return 'Beginner';
};

const computeGrowthRate = (current, previous) => {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const computeAverageDuration = (times) => {
  if (!times.length) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
};

const computePassRate = (submissions) => {
  if (!submissions.length) return 0;
  const passed = submissions.filter(s => (s.totalScore || 0) >= (s.test?.passingMarks || 70)).length;
  return Math.round((passed / submissions.length) * 100);
};

const computeMonthlyTrends = (submissions) => {
  const monthlyData = {};
  const months = 12;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    monthlyData[monthKey] = {
      submissions: 0,
      averageScore: 0,
      scores: []
    };
  }

  submissions.forEach(sub => {
    const monthKey = sub.createdAt.toISOString().slice(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].submissions++;
      monthlyData[monthKey].scores.push(sub.totalScore || 0);
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    submissions: data.submissions,
    averageScore: computeAverageScore(data.scores)
  }));
};

const computeSkillGrowthTrends = (currentSubmissions, previousSubmissions) => {
  const skills = ['problemSolving', 'codeQuality', 'performance', 'security', 'bestPractices'];
  
  return skills.reduce((acc, skill) => {
    const current = computeAverageScore(extractSkillScores(currentSubmissions, skill));
    const previous = computeAverageScore(extractSkillScores(previousSubmissions, skill));
    
    acc[skill] = {
      current,
      previous,
      growth: computeGrowthRate(current, previous)
    };
    
    return acc;
  }, {});
};

const computeAverageScore = (numbers) => {
  if (!numbers.length) return 0;
  return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
}; 