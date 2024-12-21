import Test from "../models/test.model.js";
import User from "../models/user.model.js";
import TestResult from "../models/testResult.model.js";
import Certificate from "../models/certificate.model.js";
import PracticeTest from "../models/practiceTest.model.js";
import TestRegistration from "../models/testRegistration.model.js";
import PracticeTestResult from "../models/practiceTestResult.model.js";
import Submission from "../models/submission.model.js";
import { CertificateGenerator } from '../utils/certificateGenerator.js';

// Helper function to check profile completeness
const checkProfileCompleteness = (user) => {
  const requiredFields = ['name', 'email', 'phone', 'education', 'experience'];
  const missingFields = requiredFields.filter(field => {
    if (field === 'education' || field === 'experience') {
      return !user[field] || user[field].length === 0;
    }
    return !user[field];
  });
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

// Test Access Controllers
export const getAvailableTests = async (req, res) => {
  try {
    // Get user's profile and check completeness
    const user = await User.findById(req.user._id);
    const profileStatus = checkProfileCompleteness(user);

    // Get user's existing registrations
    const userRegistrations = await TestRegistration.find({ 
      user: req.user._id 
    });

    // Find all eligible tests
    const tests = await Test.find({
      $or: [
        { 'accessControl.type': 'public' },
        { 
          'accessControl.type': 'private',
          'accessControl.allowedUsers': req.user._id 
        }
      ],
      status: 'published'
    }).populate('vendor', 'name email');

    // Enhance test data with registration status
    const enhancedTests = tests.map(test => {
      const registration = userRegistrations.find(reg => 
        reg.test.toString() === test._id.toString()
      );

      return {
        ...test.toObject(),
        registrationStatus: registration ? registration.status : 'not_registered',
        profileComplete: profileStatus.isComplete,
        missingFields: profileStatus.missingFields
      };
    });

    res.json(enhancedTests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerForTest = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Check profile completeness first
    const user = await User.findById(req.user._id);
    const { isComplete, missingFields } = checkProfileCompleteness(user);

    if (!isComplete) {
      return res.status(400).json({ 
        error: "Profile incomplete", 
        missingFields,
        requiresProfile: true
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check if test is accessible to user
    if (test.accessControl.type === 'private' && 
        !test.accessControl.allowedUsers.includes(req.user._id)) {
      return res.status(403).json({ error: "You don't have access to this test" });
    }

    // Check existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: testId,
      user: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ error: "Already registered for this test" });
    }

    // Create registration
    const registration = await TestRegistration.create({
      test: testId,
      user: req.user._id,
      registeredAt: new Date(),
      status: 'registered'
    });

    res.status(201).json({
      message: "Successfully registered for test",
      registration
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestInstructions = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .select('title instructions duration rules requirements');
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Profile Management Controllers
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'phone', 'education', 'experience'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { skills } },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('test', 'title category');
    
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Results Controllers
export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.query;
    
    if (testId) {
      const submission = await Submission.findOne({ 
        test: testId,
        user: req.user._id 
      })
        .populate({
          path: 'test',
          select: 'title totalMarks passingMarks mcqs codingChallenges',
          populate: [{
            path: 'codingChallenges.testCases',
            select: 'input expectedOutput isHidden'
          }, {
            path: 'mcqs',
            select: 'question options correctOptions marks'
          }]
        })
        .sort({ createdAt: -1 });

      if (!submission) {
        return res.status(404).json({ message: 'Test result not found' });
      }

      // Detailed response with question-wise breakdown
      const detailedResult = {
        testId: submission.test._id,
        title: submission.test.title,
        startTime: submission.startTime,
        endTime: submission.endTime,
        summary: {
          mcqScore: submission.mcqSubmission?.totalScore || 0,
          codingScore: submission.codingSubmission?.totalScore || 0,
          totalScore: submission.totalScore,
          maxScore: submission.test.totalMarks,
          passingScore: submission.test.passingMarks,
          status: submission.totalScore >= submission.test.passingMarks ? 'passed' : 'failed',
          timeTaken: (new Date(submission.endTime) - new Date(submission.startTime)) / 1000 / 60
        },
        mcq: {
          total: submission.mcqSubmission?.answers?.length || 0,
          correct: submission.mcqSubmission?.answers?.filter(a => a.isCorrect)?.length || 0,
          score: submission.mcqSubmission?.totalScore || 0,
          questions: submission.mcqSubmission?.answers?.map(answer => {
            const question = submission.test.mcqs?.find(q => 
              q._id.toString() === answer.questionId.toString()
            );
            return {
              questionId: answer.questionId,
              question: question?.question,
              options: question?.options,
              selectedOptions: answer.selectedOptions,
              correctOptions: question?.correctOptions,
              isCorrect: answer.isCorrect,
              marks: answer.marks,
              maxMarks: question?.marks,
              timeTaken: answer.timeTaken,
              explanation: question?.explanation
            };
          }) || []
        },
        coding: {
          total: submission.codingSubmission?.challenges?.length || 0,
          completed: submission.codingSubmission?.challenges?.filter(c => 
            c.submissions?.some(s => s.status === 'passed')
          )?.length || 0,
          score: submission.codingSubmission?.totalScore || 0,
          challenges: submission.codingSubmission?.challenges?.map(challenge => {
            const challengeDetails = submission.test.codingChallenges.find(
              c => c._id.toString() === challenge.challengeId.toString()
            );
            const latestSubmission = challenge.submissions[challenge.submissions.length - 1];
            return {
              challengeId: challenge.challengeId,
              title: challengeDetails?.title,
              description: challengeDetails?.description,
              code: latestSubmission?.code,
              language: latestSubmission?.language,
              status: latestSubmission?.status,
              marks: latestSubmission?.marks,
              maxMarks: challengeDetails?.marks,
              testCases: {
                sample: challengeDetails?.testCases
                  ?.filter(tc => !tc.isHidden)
                  ?.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                  })) || [],
                results: latestSubmission?.testCaseResults?.map(tc => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: tc.actualOutput,
                  passed: tc.passed,
                  executionTime: tc.executionTime,
                  memory: tc.memory,
                  error: tc.error
                })) || []
              },
              executionMetrics: {
                totalTime: latestSubmission?.executionTime,
                memory: latestSubmission?.memory,
                output: latestSubmission?.output,
                error: latestSubmission?.error
              }
            };
          })
        }
      };

      return res.json(detailedResult);
    }

    // Modified query for all submissions to ensure consistent sorting
    const submissions = await Submission.find({ user: req.user._id })
      .populate('test', 'title totalMarks passingMarks uuid')
      .sort({ 
        createdAt: -1,  // Primary sort by creation date
        startTime: -1   // Secondary sort by test start time
      });

    const summaryResults = submissions.map(submission => ({
      testId: submission.test._id,
      uuid: submission.test.uuid,
      title: submission.test.title,
      startTime: submission.startTime,
      endTime: submission.endTime,
      mcqScore: submission.mcqSubmission?.totalScore || 0,
      codingScore: submission.codingSubmission?.totalScore || 0,
      totalScore: submission.totalScore,
      maxScore: submission.test.totalMarks,
      passingScore: submission.test.passingMarks,
      status: submission.status,
      attemptedAt: submission.createdAt
    }));

    res.json(summaryResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    // Find the test submission with populated test data
    const submission = await Submission.findOne({
      test: testId,
      user: userId,
      status: 'completed'
    }).populate({
      path: 'test',
      select: 'title totalMarks passingMarks'
    });

    if (!submission) {
      return res.status(404).json({ message: "Test submission not found" });
    }

    if (!submission.test) {
      return res.status(404).json({ message: "Test details not found" });
    }

    // Determine certificate type based on score
    const isPassing = submission.totalScore >= submission.test.passingMarks;
    const certificateType = isPassing ? 'ACHIEVEMENT' : 'PARTICIPATION';

    // Find or create certificate
    let certificate = await Certificate.findOne({ 
      test: testId, 
      user: userId 
    });
    
    if (!certificate) {
      certificate = await Certificate.create({
        user: userId,
        test: testId,
        score: submission.totalScore,
        type: certificateType,
        issueDate: new Date()
      });
    } else {
      // Update certificate type if score has changed
      certificate.type = certificateType;
      certificate.score = submission.totalScore;
      await certificate.save();
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare certificate data
    const certificateData = {
      userName: user.name,
      testTitle: submission.test.title,
      score: submission.totalScore,
      totalMarks: submission.test.totalMarks,
      completedDate: certificate.issueDate,
      certificateId: certificate.certificateNumber,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateNumber}`,
      certificateType,
      passingScore: submission.test.passingMarks,
      isPassing
    };

    // Generate PDF
    const generator = new CertificateGenerator();
    const doc = await generator.generateCertificate(certificateData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificateType.toLowerCase()}-${certificate.certificateNumber}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ 
      message: "Error generating certificate", 
      error: error.message 
    });
  }
};

export const getProgressReport = async (req, res) => {
  try {
    const results = await TestResult.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$test.category",
          averageScore: { $avg: "$score" },
          testsCompleted: { $sum: 1 },
          bestScore: { $max: "$score" }
        }
      }
    ]);

    const timeline = await TestResult.find({ user: req.user._id })
      .sort('-completedAt')
      .limit(10)
      .populate('test', 'title');

    res.json({
      categoryProgress: results,
      recentActivity: timeline,
      totalTests: await TestResult.countDocuments({ user: req.user._id }),
      averageScore: results.reduce((acc, curr) => acc + curr.averageScore, 0) / results.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Practice Area Controllers
export const getPracticeTests = async (req, res) => {
  try {
    const practiceTests = await PracticeTest.find({
      isActive: true
    }).sort({ difficulty: 1, category: 1 });

    res.json(practiceTests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSampleQuestions = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const query = { isSample: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Test.aggregate([
      { $unwind: "$mcqs" },
      { $match: query },
      { $sample: { size: 10 } },
      {
        $project: {
          question: "$mcqs.question",
          options: "$mcqs.options",
          difficulty: "$mcqs.difficulty",
          category: 1
        }
      }
    ]);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPerformanceHistory = async (req, res) => {
  try {
    const history = await TestResult.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            month: { $month: "$completedAt" },
            year: { $year: "$completedAt" }
          },
          averageScore: { $avg: "$score" },
          testsCompleted: { $sum: 1 },
          categories: { $addToSet: "$test.category" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name email phone education experience skills')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSamplePracticeQuestions = async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    const query = { isSample: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questions = await PracticeTest.aggregate([
      { $match: query },
      { $unwind: "$questions" },
      { $sample: { size: parseInt(limit) } },
      {
        $project: {
          question: "$questions.question",
          options: "$questions.options",
          difficulty: "$questions.difficulty",
          category: 1
        }
      }
    ]);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      education,
      experience,
      skills,
      skillLevels // Array of { skill: string, level: 'beginner'|'intermediate'|'expert' }
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Create or update user profile
    const userProfile = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          email,
          phone,
          education,
          experience,
          skills,
          skillLevels
        }
      },
      { new: true, upsert: true }
    ).select('-password');

    res.status(201).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPracticeHistory = async (req, res) => {
  try {
    const history = await PracticeTestResult.find({
      user: req.user._id
    })
    .populate('practiceTest', 'title category difficulty')
    .sort({ completedAt: -1 });

    res.json(history.map(result => ({
      testId: result.practiceTest._id,
      title: result.practiceTest.title,
      category: result.practiceTest.category,
      difficulty: result.practiceTest.difficulty,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      completedAt: result.completedAt,
      timeSpent: result.timeSpent
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get all submissions for this user (any status)
    const submissions = await Submission.find({ 
      user: userId 
    })
    .populate({
      path: 'test',
      select: 'title description duration totalMarks type category difficulty vendor createdAt updatedAt',
      populate: {
        path: 'vendor',
        select: 'name email'
      }
    })
    .sort({ 
      createdAt: -1,
      startTime: -1 
    })
    .lean();

    // Get upcoming tests (registered but not completed)
    const upcomingTests = await TestRegistration.find({
      user: userId,
      status: 'registered',
      testDate: { $gt: new Date() }
    }).populate('test', 'title startTime duration');

    // Calculate this month's submissions
    const thisMonthSubmissions = submissions.filter(s => 
      new Date(s.submittedAt || s.createdAt) >= firstDayOfMonth
    );

    // Calculate coding-specific metrics
    const codingSubmissions = submissions.filter(s => 
      s.codingSubmission && s.codingSubmission.challenges
    );

    const codingSuccessRate = codingSubmissions.length > 0
      ? (codingSubmissions.filter(s => 
          s.codingSubmission.challenges.some(c => 
            c.submissions?.some(sub => sub.status === 'passed')
          )
        ).length / codingSubmissions.length * 100).toFixed(1)
      : 0;

    // Calculate overall metrics
    const totalTestsTaken = submissions.length;
    const scores = submissions.filter(s => s.totalScore != null)
      .map(s => s.totalScore);
    const averageScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 0;

    // Calculate MCQ and Coding performance
    const mcqScores = submissions
      .filter(s => s.mcqSubmission?.totalScore != null)
      .map(s => s.mcqSubmission.totalScore);
    const codingScores = submissions
      .filter(s => s.codingSubmission?.totalScore != null)
      .map(s => s.codingSubmission.totalScore);

    const mcqPerformance = mcqScores.length > 0
      ? (mcqScores.reduce((a, b) => a + b, 0) / mcqScores.length).toFixed(1)
      : 0;
    const codingPerformance = codingScores.length > 0
      ? (codingScores.reduce((a, b) => a + b, 0) / codingScores.length).toFixed(1)
      : 0;

    // Calculate performance metrics by category
    const performanceMetrics = submissions.reduce((metrics, submission) => {
      // Add null check for test and category
      const category = submission?.test?.category;
      if (!category) return metrics; // Skip if no category

      if (!metrics[category]) {
        metrics[category] = { count: 0, totalScore: 0, passedCount: 0 };
      }
      metrics[category].count += 1;
      if (submission.totalScore != null) {
        metrics[category].totalScore += submission.totalScore;
        if (submission.status === 'passed') {
          metrics[category].passedCount += 1;
        }
      }
      return metrics;
    }, {});

    // If no metrics were collected, provide default categories
    if (Object.keys(performanceMetrics).length === 0) {
      performanceMetrics['General'] = {
        count: 0,
        totalScore: 0,
        passedCount: 0,
        avgScore: 0,
        successRate: 0
      };
    }

    // Convert totals to averages
    Object.keys(performanceMetrics).forEach(category => {
      const metrics = performanceMetrics[category];
      metrics.avgScore = metrics.count > 0 
        ? (metrics.totalScore / metrics.count).toFixed(1)
        : 0;
      metrics.successRate = metrics.count > 0
        ? ((metrics.passedCount / metrics.count) * 100).toFixed(1)
        : 0;
      delete metrics.totalScore;
      delete metrics.passedCount;
    });

    res.json({
      overview: {
        totalTestsTaken,
        upcomingTests: upcomingTests.length,
        averageScore: parseFloat(averageScore),
        lastTestScore: scores[0] || 0,
        mcqPerformance: parseFloat(mcqPerformance),
        codingPerformance: parseFloat(codingPerformance),
        successRate: parseFloat(codingSuccessRate),
        thisMonthTests: thisMonthSubmissions.length,
        improvement: ((averageScore - (scores[scores.length - 1] || 0)) / (scores[scores.length - 1] || 1) * 100).toFixed(1)
      },
      recentTests: submissions.slice(0, 5),
      upcomingSchedule: upcomingTests.map(reg => ({
        testId: reg.test._id,
        title: reg.test.title,
        startTime: reg.testDate,
        duration: reg.test.duration
      })),
      performanceMetrics
    });

  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ 
      error: "Failed to fetch dashboard data",
      details: error.message 
    });
  }
};

// Helper function to determine badge level
const getBadgeLevel = (score) => {
  if (score >= 90) return 'Expert';
  if (score >= 80) return 'Advanced';
  if (score >= 70) return 'Intermediate';
  return 'Beginner';
}; 