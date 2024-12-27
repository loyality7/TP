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

// Helper function for MCQ comparison
const checkMCQAnswer = (correctOptions, selectedOptions) => {
  return Array.isArray(correctOptions) && 
    Array.isArray(selectedOptions) &&
    correctOptions.length === selectedOptions.length &&
    [...correctOptions].sort().every((opt, idx) => 
      opt === [...selectedOptions].sort()[idx]
    );
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
      // Get submission with populated test data and include codingSubmission
      const submission = await Submission.findOne({ 
        test: testId,
        user: req.user._id 
      })
      .populate({
        path: 'test',
        select: 'title totalMarks passingMarks mcqs codingChallenges uuid',
        populate: [
          {
            path: 'mcqs',
            select: 'question options correctOptions marks explanation'
          },
          {
            path: 'codingChallenges',
            select: 'title description testCases marks'
          }
        ]
      })
      .populate('codingSubmission')  // Add this line to populate coding submission
      .lean();

      // Add debug logging
      console.log('Coding submission:', submission?.codingSubmission);
      console.log('Coding challenges:', submission?.test?.codingChallenges);

      if (!submission) {
        return res.status(404).json({ message: 'Test result not found' });
      }

      // Map MCQ answers with selected options and calculate scores correctly
      const mcqAnswers = (submission.mcqSubmission?.answers || []).map(answer => {
        const question = submission.test.mcqs.find(q => 
          q._id.toString() === answer.questionId.toString()
        );

        const isCorrect = checkMCQAnswer(
          question?.correctOptions || [],
          answer.selectedOptions || []
        );

        const marks = isCorrect ? (question?.marks || 0) : 0;

        return {
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions || [],
          marks,
          isCorrect,
          _id: answer._id,
          question: question?.question,
          options: question?.options,
          correctOptions: question?.correctOptions,
          maxMarks: question?.marks,
          explanation: question?.explanation
        };
      });

      // Calculate MCQ summary with proper scoring
      const mcqSummary = {
        total: submission.test.mcqs?.length || 0,
        correct: mcqAnswers.filter(a => a.isCorrect).length,
        score: mcqAnswers.reduce((total, answer) => total + answer.marks, 0),
        questions: mcqAnswers
      };

      // Calculate coding scores properly
      const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
        const maxMarks = submission.test.codingChallenges.find(
          c => c._id.toString() === challenge.challengeId.toString()
        )?.marks || 0;
        
        // Get the latest submission that passed
        const passedSubmission = challenge.submissions?.find(s => s.status === 'passed');
        return total + (passedSubmission ? maxMarks : 0);
      }, 0) || 0;

      const detailedResult = {
        testId: submission.test._id,
        title: submission.test.title,
        startTime: submission.startTime,
        summary: {
          mcqScore: mcqSummary.score,
          codingScore,
          totalScore: mcqSummary.score + codingScore,
          maxScore: submission.test.totalMarks,
          passingScore: submission.test.passingMarks,
          status: submission.status,
          timeTaken: submission.endTime ? 
            Math.round((new Date(submission.endTime) - new Date(submission.startTime)) / 1000) : null
        },
        mcq: mcqSummary,
        coding: {
          total: submission.test.codingChallenges?.length || 0,
          completed: submission.codingSubmission?.challenges?.filter(c => 
            c.submissions?.some(s => s.status === 'passed')
          )?.length || 0,
          score: codingScore,
          challenges: submission.test.codingChallenges?.map(challenge => {
            // Find the matching submission for this challenge
            const submittedChallenge = submission.codingSubmission?.challenges?.find(
              c => c.challengeId.toString() === challenge._id.toString()
            );

            // Get the latest submission if it exists
            const latestSubmission = submittedChallenge?.submissions?.[
              submittedChallenge.submissions.length - 1
            ];

            return {
              challengeId: challenge._id,
              title: challenge.title,
              description: challenge.description,
              code: latestSubmission?.code || '',
              language: latestSubmission?.language || 'javascript',
              status: latestSubmission?.status || 'pending',
              marks: latestSubmission?.marks || 0,
              maxMarks: challenge.marks,
              testCases: {
                sample: challenge.testCases?.filter(tc => tc.isSample) || [],
                results: latestSubmission?.testCaseResults || []
              },
              executionMetrics: {
                totalTime: latestSubmission?.executionTime || 0,
                memory: latestSubmission?.memory || 0,
                output: latestSubmission?.output || '',
                error: latestSubmission?.error || null
              },
              submissions: submittedChallenge?.submissions?.map(sub => ({
                submittedAt: sub.submittedAt,
                status: sub.status,
                marks: sub.marks,
                code: sub.code,
                language: sub.language,
                testCasesPassed: sub.testCaseResults?.filter(tc => tc.passed)?.length || 0,
                totalTestCases: sub.testCaseResults?.length || 0
              })) || []
            };
          }) || []
        }
      };

      return res.json(detailedResult);
    }

    // Modified query for all submissions with proper score calculations
    const submissions = await Submission.find({ 
      user: req.user._id 
    })
    .populate({
      path: 'test',
      select: 'title description duration totalMarks passingMarks type category difficulty vendor mcqs codingChallenges uuid',
      populate: {
        path: 'vendor',
        select: 'name email'
      }
    })
    .populate('codingSubmission')  // Add this to get coding submission data
    .sort({ 
      createdAt: -1,
      startTime: -1 
    })
    .lean();

    const validSubmissions = submissions
      .filter(sub => sub.test && Object.keys(sub.test).length > 0)
      .map(submission => {
        // Calculate MCQ score
        const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
          const question = submission.test.mcqs?.find(q => 
            q._id.toString() === answer.questionId.toString()
          );
          
          const isCorrect = checkMCQAnswer(
            question?.correctOptions || [],
            answer.selectedOptions || []
          );

          return total + (isCorrect ? (question?.marks || 0) : 0);
        }, 0) || 0;

        // Calculate coding score
        const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
          const maxMarks = submission.test.codingChallenges?.find(
            c => c._id.toString() === challenge.challengeId.toString()
          )?.marks || 0;
          
          const passedSubmission = challenge.submissions?.find(s => s.status === 'passed');
          return total + (passedSubmission ? maxMarks : 0);
        }, 0) || 0;

        const totalScore = mcqScore + codingScore;

        return {
          testId: submission.test._id,
          uuid: submission.test.uuid || null,
          title: submission.test.title,
          startTime: submission.startTime,
          endTime: submission.endTime,
          mcqScore,
          codingScore,
          totalScore,
          maxScore: submission.test.totalMarks,
          passingScore: submission.test.passingMarks,
          status: submission.status || 
            (totalScore >= submission.test.passingMarks ? 'passed' : 'failed'),
          attemptedAt: submission.createdAt,
          completionStatus: submission.completionStatus || 'completed'
        };
      });

    res.json({
      count: validSubmissions.length,
      results: validSubmissions
    });

  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ 
      error: 'Failed to fetch test results',
      details: error.message 
    });
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

    // Get all submissions with populated test data including MCQs and coding challenges
    const submissions = await Submission.find({ 
      user: userId 
    })
    .populate({
      path: 'test',
      select: 'title description duration totalMarks passingMarks type category difficulty vendor mcqs codingChallenges',
      populate: [
        {
          path: 'mcqs',
          select: 'question options correctOptions marks'
        },
        {
          path: 'codingChallenges',
          select: 'title description testCases marks'
        },
        {
          path: 'vendor',
          select: 'name email'
        }
      ]
    })
    .populate('codingSubmission')
    .sort({ 
      createdAt: -1,
      startTime: -1 
    })
    .lean();

    // Filter and map submissions with proper score calculations
    const validSubmissions = submissions
      .filter(sub => sub.test && Object.keys(sub.test).length > 0)
      .map(submission => {
        // Calculate MCQ scores
        const mcqAnswers = (submission.mcqSubmission?.answers || []).map(answer => {
          const question = submission.test.mcqs.find(q => 
            q._id.toString() === answer.questionId.toString()
          );
          
          const isCorrect = checkMCQAnswer(
            question?.correctOptions || [],
            answer.selectedOptions || []
          );

          return {
            ...answer,
            marks: isCorrect ? (question?.marks || 0) : 0,
            maxMarks: question?.marks || 0
          };
        });

        const mcqScore = mcqAnswers.reduce((total, answer) => total + answer.marks, 0);

        // Calculate coding scores
        const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
          const maxMarks = submission.test.codingChallenges.find(
            c => c._id.toString() === challenge.challengeId.toString()
          )?.marks || 0;
          
          const passedSubmission = challenge.submissions?.find(s => s.status === 'passed');
          return total + (passedSubmission ? maxMarks : 0);
        }, 0) || 0;

        const totalScore = mcqScore + codingScore;

        return {
          testId: submission.test._id,
          uuid: submission.test.uuid,
          title: submission.test.title,
          startTime: submission.startTime,
          endTime: submission.endTime,
          mcqScore,
          codingScore,
          totalScore,
          maxScore: submission.test.totalMarks,
          passingScore: submission.test.passingMarks,
          status: totalScore >= submission.test.passingMarks ? 'passed' : 'failed',
          attemptedAt: submission.createdAt,
          completionStatus: submission.completionStatus || 'completed',
          category: submission.test.category,
          progress: {
            mcqCompleted: submission.mcqSubmission?.completed || false,
            codingCompleted: submission.codingSubmission?.completed || false,
            totalMCQs: submission.test.mcqs?.length || 0,
            answeredMCQs: submission.mcqSubmission?.answers?.length || 0,
            totalCodingChallenges: submission.test.codingChallenges?.length || 0,
            completedChallenges: (submission.codingSubmission?.challenges || [])
              .filter(c => c.submissions?.some(s => s.status === 'passed'))
              .length
          }
        };
      });

    // Calculate performance metrics
    const performanceByCategory = Object.entries(
      validSubmissions.reduce((acc, sub) => {
        const category = sub.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { count: 0, totalScore: 0, passed: 0, maxPossibleScore: 0 };
        }
        acc[category].count++;
        acc[category].totalScore += sub.totalScore;
        acc[category].maxPossibleScore += sub.maxScore;
        if (sub.status === 'passed') acc[category].passed++;
        return acc;
      }, {})
    ).reduce((acc, [category, data]) => {
      acc[category] = {
        count: data.count,
        avgScore: Math.round((data.totalScore / data.maxPossibleScore * 100) * 10) / 10,
        passRate: Math.round((data.passed / data.count) * 100)
      };
      return acc;
    }, {});

    // Calculate MCQ and Coding specific performance with proper null checks
    const mcqPerformance = validSubmissions.reduce((acc, sub) => {
      if (sub.test && Array.isArray(sub.test.mcqs)) {
        acc.totalScore += (sub.mcqScore || 0);
        acc.maxScore += (sub.test.mcqs.length || 0) * 
          ((sub.test.mcqs[0]?.marks || 0));
        acc.count++;
      }
      return acc;
    }, { totalScore: 0, maxScore: 0, count: 0 });

    const codingPerformance = validSubmissions.reduce((acc, sub) => {
      if (sub.test && Array.isArray(sub.test.codingChallenges)) {
        acc.totalScore += (sub.codingScore || 0);
        acc.maxScore += (sub.test.codingChallenges.length || 0) * 
          ((sub.test.codingChallenges[0]?.marks || 0));
        acc.count++;
      }
      return acc;
    }, { totalScore: 0, maxScore: 0, count: 0 });

    // Calculate improvement (compare last 5 tests with previous 5)
    const last5Tests = validSubmissions.slice(0, 5);
    const previous5Tests = validSubmissions.slice(5, 10);
    
    const last5Avg = last5Tests.length ? 
      last5Tests.reduce((acc, sub) => acc + (sub.totalScore / sub.maxScore * 100), 0) / last5Tests.length : 0;
    const previous5Avg = previous5Tests.length ? 
      previous5Tests.reduce((acc, sub) => acc + (sub.totalScore / sub.maxScore * 100), 0) / previous5Tests.length : 0;
    
    const improvement = previous5Avg ? ((last5Avg - previous5Avg) / previous5Avg) * 100 : 0;

    const response = {
      overview: {
        totalTestsTaken: validSubmissions.length,
        upcomingTests: 0,
        completedTests: validSubmissions.filter(sub => sub.completionStatus === 'completed').length,
        thisMonthTests: validSubmissions.filter(sub => 
          new Date(sub.endTime || sub.attemptedAt) >= firstDayOfMonth
        ).length,
        averageScore: validSubmissions.length > 0
          ? Math.round(validSubmissions.reduce((acc, sub) => 
              acc + ((sub.totalScore || 0) / (sub.maxScore || 1) * 100), 0) / validSubmissions.length * 10) / 10
          : 0,
        lastTestScore: validSubmissions.length > 0
          ? Math.round(((validSubmissions[0].totalScore || 0) / (validSubmissions[0].maxScore || 1) * 100) * 10) / 10
          : 0,
        mcqPerformance: mcqPerformance.count > 0 ? 
          Math.round((mcqPerformance.totalScore / mcqPerformance.maxScore) * 1000) / 10 : 0,
        codingPerformance: codingPerformance.count > 0 ? 
          Math.round((codingPerformance.totalScore / codingPerformance.maxScore) * 1000) / 10 : 0,
        successRate: validSubmissions.length ? 
          Math.round((validSubmissions.filter(sub => sub.status === 'passed').length / validSubmissions.length) * 1000) / 10 : 0,
        improvement: Math.round(improvement * 10) / 10,
        codingTestsTaken: validSubmissions.filter(sub => 
          sub.test && Array.isArray(sub.test.codingChallenges) && 
          sub.test.codingChallenges.length > 0
        ).length
      },
      recentTests: validSubmissions.slice(0, 5).map(test => ({
        ...test,
        badge: getBadgeLevel(test.totalScore / test.maxScore * 100)
      })),
      performanceByCategory,
      upcomingSchedule: []
    };

    res.json(response);

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