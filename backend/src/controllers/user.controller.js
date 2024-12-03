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
    
    // Base query to find submissions for the user
    const query = {
      user: req.user._id,
      status: 'completed'
    };

    if (testId) {
      query.test = testId;
      // Detailed report for specific test
      const submission = await Submission.findOne(query)
        .populate('test', 'title totalMarks passingMarks mcqs codingChallenges')
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
            const question = submission.test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
            return {
              questionId: answer.questionId,
              question: question?.question,
              selectedOptions: answer.selectedOptions,
              correctOptions: question?.correctOptions,
              isCorrect: answer.isCorrect,
              marks: answer.marks,
              maxMarks: question?.marks,
              timeTaken: answer.timeTaken
            };
          })
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
              code: latestSubmission?.code,
              language: latestSubmission?.language,
              status: latestSubmission?.status,
              marks: latestSubmission?.marks,
              maxMarks: challengeDetails?.marks,
              testCases: latestSubmission?.testCaseResults?.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.actualOutput,
                passed: tc.passed,
                executionTime: tc.executionTime,
                memory: tc.memory
              })),
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

    // Summary report for all tests
    const submissions = await Submission.find(query)
      .populate('test', 'title totalMarks passingMarks')
      .sort({ createdAt: -1 });

    const summaryResults = submissions.map(submission => ({
      testId: submission.test._id,
      title: submission.test.title,
      startTime: submission.startTime,
      endTime: submission.endTime,
      mcqScore: submission.mcqSubmission?.totalScore || 0,
      codingScore: submission.codingSubmission?.totalScore || 0,
      totalScore: submission.totalScore,
      maxScore: submission.test.totalMarks,
      passingScore: submission.test.passingMarks,
      status: submission.totalScore >= submission.test.passingMarks ? 'passed' : 'failed',
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