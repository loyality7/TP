export const generateTestAnalysis = async (req, res) => {
  try {
    const testId = req.params.testId;
    const results = await TestResult.find({ test: testId })
      .populate('user', 'name email')
      .populate('test', 'title');
      
    const analysis = {
      totalAttempts: results.length,
      averageScore: results.reduce((acc, r) => acc + r.totalScore, 0) / results.length,
      mcqAnalysis: analyzeMCQResponses(results),
      codingAnalysis: analyzeCodingResponses(results),
      timeAnalysis: analyzeTimeTaken(results)
    };
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 