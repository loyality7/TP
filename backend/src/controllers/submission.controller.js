import Test from "../models/test.model.js";
import { CodingSubmission } from '../models/codingSubmission.model.js';
import { MCQSubmission } from '../models/mcqSubmission.model.js';
import Submission from '../models/submission.model.js';
import TestRegistration from '../models/testRegistration.model.js';
import mongoose from 'mongoose';

// Add this helper function at the top
const getTestWithAnswers = async (testId) => {
  const test = await Test.findById(testId)
    .select('mcqs')
    .lean();
   
  if (!test) {
    throw new Error('Test not found');
  }
   
  return test;
};

// Add this helper function at the top
const validateTestAccess = async (testId, userId, userRole) => {
  const test = await Test.findById(testId)
    .populate('vendor')
    .populate('accessControl.allowedUsers');
  
  if (!test) {
    return { valid: false, message: 'Test not found' };
  }

  const isAdmin = userRole === 'admin';
  const isVendor = test.vendor._id.toString() === userId.toString();
  const isPublic = test.accessControl.type === 'public';
  const isPractice = test.type === 'coding_challenge';
  const isAllowedUser = test.accessControl.allowedUsers?.some(
    user => user._id.toString() === userId.toString()
  );

  if (isAdmin || isVendor || isPublic || isPractice || isAllowedUser) {
    return { valid: true, test };
  }

  return { valid: false, message: 'Not authorized to access this test' };
};

// Add this helper function to calculate marks
const calculateMarks = (testCaseResults) => {
  if (!testCaseResults || testCaseResults.length === 0) return 0;
  
  const passedTests = testCaseResults.filter(tc => tc.passed).length;
  const totalTests = testCaseResults.length;
  
  // Each test case is worth equal points
  const marksPerTest = 100 / totalTests;
  return Math.round(passedTests * marksPerTest);
};

// Submit MCQ answer
export const submitMCQ = async (req, res) => {
  try {
    const { testId, submissions } = req.body;
    const userId = req.user._id;

    // Get or create submission with proper version
    let submission = await Submission.findExistingSubmission(testId, userId);
    
    if (!submission) {
      // If no existing submission, create new one with next version
      const nextVersion = await Submission.getNextVersion(testId, userId);
      submission = new Submission({
        user: userId,
        test: testId,
        version: nextVersion,
        status: 'in_progress',
        mcqSubmission: {
          version: nextVersion,
          completed: false,
          answers: []
        }
      });
    }

    // Update MCQ submission
    submission.mcqSubmission.answers = submissions.map(sub => ({
      questionId: sub.questionId,
      selectedOptions: sub.selectedOptions,
      // ... other fields
    }));
    
    submission.mcqSubmission.completed = true;
    submission.mcqSubmission.submittedAt = new Date();
    submission.status = 'mcq_completed';

    await submission.save();

    res.status(201).json({
      message: 'MCQ submission successful',
      submissionId: submission._id,
      version: submission.version
    });

  } catch (error) {
    console.error('Error in submitMCQ:', error);
    res.status(500).json({ error: 'Failed to submit MCQ answers' });
  }
};

// Helper function to compare arrays
const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
};

// Submit coding challenges
export const submitCoding = async (req, res) => {
  try {
    const { testId, submissions } = req.body;
    
    // Find existing submission - include 'coding_completed' status
    let submission = await Submission.findOne({
      test: testId,
      user: req.user._id,
      status: { $in: ['in_progress', 'mcq_completed', 'coding_completed'] }
    });

    if (!submission) {
      submission = new Submission({
        test: testId,
        user: req.user._id,
        status: 'in_progress',
        codingSubmission: {
          challenges: [],
          completed: false
        }
      });
    }

    // Initialize codingSubmission if it doesn't exist
    if (!submission.codingSubmission) {
      submission.codingSubmission = {
        challenges: [],
        completed: false
      };
    }

    // Process each coding challenge submission
    for (const sub of submissions) {
      const challengeIndex = submission.codingSubmission.challenges.findIndex(
        c => c.challengeId.toString() === sub.challengeId
      );

      const newSubmissionData = {
        code: sub.code,
        language: sub.language,
        submittedAt: new Date(),
        testCaseResults: sub.testCaseResults,
        executionTime: sub.executionTime,
        memory: sub.memory,
        output: sub.output,
        error: sub.error,
        status: sub.testCaseResults.every(tc => tc.passed) ? 'passed' : 'partial',
        marks: calculateMarks(sub.testCaseResults)
      };

      if (challengeIndex === -1) {
        // Add new challenge
        submission.codingSubmission.challenges.push({
          challengeId: sub.challengeId,
          submissions: [newSubmissionData]
        });
      } else {
        // Update existing challenge
        submission.codingSubmission.challenges[challengeIndex].submissions.push(newSubmissionData);
      }
    }

    // Check if all coding challenges are completed
    const test = await Test.findById(testId);
    const totalCodingChallenges = test.codingChallenges.length;
    const submittedChallenges = new Set(
      submission.codingSubmission.challenges.map(c => c.challengeId.toString())
    );
    
    submission.codingSubmission.completed = submittedChallenges.size === totalCodingChallenges;

    // Update submission status based on completion
    if (submission.mcqSubmission?.completed && submission.codingSubmission.completed) {
      submission.status = 'completed';
      submission.endTime = new Date();
    } else if (submission.codingSubmission.completed) {
      submission.status = 'coding_completed';
    }

    // Save the submission
    await submission.save();
    
    res.status(201).json({
      submissionId: submission._id,
      submission,
      message: "Coding submissions created successfully",
      status: submission.status,
      codingCompleted: submission.codingSubmission.completed,
      version: submission.version
    });

  } catch (error) {
    console.error('Error in submitCoding:', error);
    res.status(500).json({ 
      error: error.message || 'Error submitting coding answers' 
    });
  }
};

// Evaluate submission
export const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate('test')
      .populate('user');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Evaluate coding submissions
    for (const challenge of submission.codingSubmission.challenges) {
      for (const sub of challenge.submissions) {
        if (sub.status === 'pending') {
          // Add your evaluation logic here
          sub.status = 'evaluated';
          // Update marks based on evaluation
        }
      }
    }

    // Update total scores
    submission.codingSubmission.totalScore = submission.codingSubmission.challenges.reduce(
      (sum, challenge) => {
        const bestSubmission = challenge.submissions.reduce(
          (best, sub) => Math.max(best, sub.marks),
          0
        );
        return sum + bestSubmission;
      },
      0
    );

    submission.totalScore = submission.mcqSubmission.totalScore + 
      submission.codingSubmission.totalScore;

    // Create a TestResult record
    const testResult = new TestResult({
      user: submission.user._id,
      test: submission.test._id,
      mcqAnswers: submission.mcqSubmission.answers,
      codingAnswers: submission.codingSubmission.challenges.map(challenge => ({
        challengeId: challenge.challengeId,
        code: challenge.submissions[challenge.submissions.length - 1].code,
        language: challenge.submissions[challenge.submissions.length - 1].language,
        testCaseResults: [], // Add test case results from your evaluation
        marksObtained: challenge.submissions[challenge.submissions.length - 1].marks || 0
      })),
      totalScore: submission.totalScore,
      mcqScore: submission.mcqSubmission.totalScore,
      codingScore: submission.codingSubmission.totalScore,
      status: 'evaluated'
    });

    await Promise.all([
      submission.save(),
      testResult.save()
    ]);

    res.status(200).json({ submission, testResult });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating submission', error: error.message });
  }
};

// Get user submissions
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Authorization check:
    // 1. Admin can see all submissions
    // 2. Users can see their own submissions
    // 3. Vendors can see submissions for their tests
    const isAdmin = req.user.role === 'admin';
    const isOwnSubmissions = req.user._id.toString() === userId;
    const isVendor = req.user.role === 'vendor';

    if (!isAdmin && !isOwnSubmissions && !isVendor) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    // Base query
    let query = { user: userId };

    // If vendor, only show submissions for their tests
    if (isVendor && !isAdmin && !isOwnSubmissions) {
      const vendorTests = await Test.find({ vendor: req.user._id }).select('_id');
      const testIds = vendorTests.map(test => test._id);
      query.test = { $in: testIds };
    }

    // Update the populate to include MCQ questions with correct options
    const submissions = await Submission.find(query)
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks vendor mcqs',
        populate: [
          {
            path: 'vendor',
            select: 'name email'
          },
          {
            path: 'mcqs',
            select: 'question options correctOptions marks'
          }
        ]
      })
      .sort({ submittedAt: -1 })
      .lean();

    // Filter submissions based on vendor access
    const filteredSubmissions = isVendor ? 
      submissions.filter(sub => sub.test?.vendor?._id.toString() === req.user._id.toString()) :
      submissions;

    // Transform the response with corrected array comparison
    const transformedSubmissions = {
      mcq: filteredSubmissions
        .filter(sub => sub.mcqSubmission?.answers?.length > 0)
        .map(sub => ({
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.mcqSubmission?.totalScore,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          submittedAt: sub.mcqSubmission?.submittedAt,
          answers: sub.mcqSubmission?.answers.map(answer => {
            const question = sub.test?.mcqs?.find(q => q._id.toString() === answer.questionId.toString());
            const correctOptions = question?.correctOptions || [];
            const selectedOptions = answer.selectedOptions || [];
            
            // Sort both arrays before comparison
            const isCorrect = Array.isArray(correctOptions) && 
              Array.isArray(selectedOptions) &&
              correctOptions.length === selectedOptions.length &&
              [...correctOptions].sort().every((opt, idx) => opt === [...selectedOptions].sort()[idx]);

            return {
              ...answer,
              question: question?.question,
              options: question?.options,
              correctOptions: question?.correctOptions,
              maxMarks: question?.marks,
              isCorrect
            };
          }),
          vendor: {
            id: sub.test?.vendor?._id,
            name: sub.test?.vendor?.name,
            email: sub.test?.vendor?.email
          }
        })),
      coding: filteredSubmissions
        .filter(sub => sub.codingSubmission?.challenges?.length > 0)
        .map(sub => ({
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.codingSubmission?.totalScore,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          submittedAt: sub.codingSubmission?.submittedAt,
          solutions: sub.codingSubmission?.challenges,
          vendor: {
            id: sub.test?.vendor?._id,
            name: sub.test?.vendor?.name,
            email: sub.test?.vendor?.email
          }
        }))
    };

    res.json({
      success: true,
      data: transformedSubmissions,
      meta: {
        totalSubmissions: filteredSubmissions.length,
        mcqCount: transformedSubmissions.mcq.length,
        codingCount: transformedSubmissions.coding.length
      }
    });

  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch submissions',
      message: error.message 
    });
  }
};

// Get test submissions
export const getTestSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Validate testId
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid test ID' 
      });
    }

    // Get test details with correct answers
    const test = await Test.findById(testId)
      .select('mcqs codingChallenges')
      .lean();
    
    if (!test) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found' 
      });
    }

    // Get all submissions for this test with proper population
    const submissions = await Submission.find({ 
      test: testId,
      status: { $in: ['completed', 'mcq_completed', 'coding_completed'] }
    })
    .populate('user', 'name email')
    .lean();

    // Process MCQ submissions with null checks
    const mcqSubmissions = submissions
      .filter(sub => sub?.mcqSubmission?.completed)
      .map(sub => {
        if (!sub?.user?._id) return null; // Skip if user data is missing

        // Calculate answers and their correctness
        const answers = (sub.mcqSubmission?.answers || []).map(answer => {
          const question = test.mcqs?.find(q => 
            q?._id?.toString() === answer?.questionId?.toString()
          );
          
          if (!question) return null;

          const correctOptions = question.correctOptions || [];
          const selectedOptions = answer.selectedOptions || [];
          
          const isCorrect = Array.isArray(correctOptions) && 
            Array.isArray(selectedOptions) &&
            correctOptions.length === selectedOptions.length &&
            [...correctOptions].sort().every((opt, idx) => 
              opt === [...selectedOptions].sort()[idx]
            );

          return {
            questionId: answer.questionId,
            selectedOptions: selectedOptions,
            isCorrect: isCorrect,
            marks: isCorrect ? (question.marks || 0) : 0
          };
        }).filter(Boolean); // Remove null answers

        // Calculate total score
        const totalScore = answers.reduce((sum, answer) => sum + (answer.marks || 0), 0);

        return {
          submissionId: sub._id,
          userId: sub.user._id,
          userName: sub.user.name || 'Unknown User',
          userEmail: sub.user.email || 'No Email',
          answers,
          totalScore,
          submittedAt: sub.mcqSubmission.submittedAt
        };
      }).filter(Boolean); // Remove null submissions

    // Process coding submissions with null checks
    const codingSubmissions = submissions
      .filter(sub => sub?.codingSubmission?.completed)
      .map(sub => {
        if (!sub?.user?._id) return null;

        const challenges = (sub.codingSubmission?.challenges || []).map(challenge => ({
          challengeId: challenge.challengeId,
          submissions: challenge.submissions?.map(submission => ({
            code: submission.code || '',
            language: submission.language || 'unknown',
            status: submission.status || 'unknown',
            marks: submission.marks || 0,
            testCaseResults: submission.testCaseResults || [],
            executionTime: submission.executionTime || 0,
            memory: submission.memory || 0
          })) || [],
          bestScore: Math.max(...(challenge.submissions || []).map(s => s.marks || 0), 0)
        }));

        return {
          submissionId: sub._id,
          userId: sub.user._id,
          userName: sub.user.name || 'Unknown User',
          userEmail: sub.user.email || 'No Email',
          challenges,
          totalScore: challenges.reduce((sum, c) => sum + c.bestScore, 0),
          submittedAt: sub.codingSubmission.submittedAt
        };
      }).filter(Boolean);

    res.json({
      success: true,
      data: {
        mcq: mcqSubmissions,
        coding: codingSubmissions,
        summary: {
          totalSubmissions: submissions.length,
          mcqSubmissions: mcqSubmissions.length,
          codingSubmissions: codingSubmissions.length,
          averageScore: submissions.length > 0 
            ? Math.round(submissions.reduce((sum, sub) => 
                sum + ((sub.mcqSubmission?.totalScore || 0) + 
                      (sub.codingSubmission?.totalScore || 0)), 0) / submissions.length) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error in getTestSubmissions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve submissions',
      details: error.message 
    });
  }
};

// Get test MCQ submissions
export const getTestMCQSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Get test details for correct answers
    const test = await Test.findById(testId)
      .select('mcqs')
      .lean();

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const submissions = await Submission.find({ 
      test: testId,
      'mcqSubmission.completed': true 
    })
    .populate('user', 'name email')
    .lean();

    const mcqSubmissions = submissions.map(sub => {
      // Calculate answers and their correctness
      const answers = sub.mcqSubmission.answers.map(answer => {
        const question = test.mcqs?.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        const correctOptions = question?.correctOptions || [];
        const selectedOptions = answer.selectedOptions || [];
        
        const isCorrect = Array.isArray(correctOptions) && 
          Array.isArray(selectedOptions) &&
          correctOptions.length === selectedOptions.length &&
          [...correctOptions].sort().every((opt, idx) => 
            opt === [...selectedOptions].sort()[idx]
          );

        return {
          ...answer,
          isCorrect,
          marks: isCorrect ? (question?.marks || 0) : 0
        };
      });

      // Calculate total score by summing up marks from correct answers
      const totalScore = answers.reduce((sum, answer) => sum + answer.marks, 0);

      return {
        testId: sub.test,
        userId: sub.user._id,
        userName: sub.user.name,
        userEmail: sub.user.email,
        answers,
        totalScore,
        submittedAt: sub.mcqSubmission.submittedAt
      };
    });

    res.status(200).json(mcqSubmissions);
  } catch (error) {
    console.error('Error in getTestMCQSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching MCQ submissions', 
      error: error.message 
    });
  }
};

// Get test coding submissions
export const getTestCodingSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const submissions = await Submission.find({ 
      test: testId,
      'codingSubmission.completed': true 
    })
    .populate('user', 'name email')
    .lean();

    const codingSubmissions = submissions.map(sub => ({
      testId: sub.test,
      userId: sub.user._id,
      userName: sub.user.name,
      userEmail: sub.user.email,
      challenges: sub.codingSubmission.challenges,
      totalScore: sub.codingSubmission.totalScore,
      submittedAt: sub.codingSubmission.submittedAt
    }));

    res.status(200).json(codingSubmissions);
  } catch (error) {
    console.error('Error in getTestCodingSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching coding submissions', 
      error: error.message 
    });
  }
};

// Get challenge submissions
export const getChallengeSubmissions = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const submissions = await CodingSubmission.find({ challengeId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge submissions', error: error.message });
  }
};

// Get MCQ submissions
export const getMCQSubmissions = async (req, res) => {
  try {
    const { questionId } = req.params;
    const submissions = await MCQSubmission.find({ questionId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching MCQ submissions', error: error.message });
  }
};

// Get test results
export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;
    
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ 
        message: 'Invalid test ID format'
      });
    }

    // Get test details for correct answers
    const test = await Test.findById(testId)
      .select('mcqs')
      .lean();

    // Get all completed submissions for this test
    const submissions = await Submission.find({ 
      test: testId,
      status: 'completed'
    })
    .populate('user', 'name email')
    .lean();

    // Transform submissions with corrected array comparison
    const results = submissions.map(sub => ({
      candidateId: sub.user._id,
      candidateName: sub.user.name,
      email: sub.user.email,
      mcqScore: sub.mcqSubmission?.totalScore || 0,
      codingScore: sub.codingSubmission?.totalScore || 0,
      totalScore: sub.totalScore || 0,
      submittedAt: sub.endTime || sub.updatedAt,
      status: sub.status,
      duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / (1000 * 60)) : null,
      details: {
        mcqAnswers: sub.mcqSubmission?.answers?.map(answer => {
          const question = test.mcqs?.find(q => 
            q._id.toString() === answer.questionId.toString()
          );
          const correctOptions = question?.correctOptions || [];
          const selectedOptions = answer.selectedOptions || [];
          
          // Updated array comparison logic
          const isCorrect = Array.isArray(correctOptions) && 
            Array.isArray(selectedOptions) &&
            correctOptions.length === selectedOptions.length &&
            [...correctOptions].sort().every((opt, idx) => 
              opt === [...selectedOptions].sort()[idx]
            );

          return {
            questionId: answer.questionId,
            selectedAnswer: answer.selectedOptions,
            isCorrect: isCorrect,
            marks: isCorrect ? (question?.marks || 0) : 0,
            maxMarks: question?.marks || 0
          };
        }) || [],
        codingChallenges: sub.codingSubmission?.challenges?.map(challenge => ({
          challengeId: challenge.challengeId,
          submissions: challenge.submissions.map(submission => ({
            code: submission.code,
            language: submission.language,
            status: submission.status,
            executionTime: submission.executionTime,
            memory: submission.memory,
            testCaseResults: submission.testCaseResults,
            marks: submission.marks
          })),
          bestScore: Math.max(...(challenge.submissions.map(s => s.marks || 0)), 0)
        })) || []
      }
    }));

    // Calculate percentages for scores
    results.forEach(result => {
      // Convert absolute scores to percentages if they aren't already
      if (result.mcqScore > 100) {
        const totalMCQMarks = result.details.mcqAnswers.reduce((sum, q) => sum + q.maxMarks, 0);
        result.mcqScore = totalMCQMarks > 0 
          ? Math.round((result.mcqScore / totalMCQMarks) * 100) 
          : 0;
      }

      if (result.codingScore > 100) {
        const totalCodingMarks = result.details.codingChallenges.reduce(
          (sum, c) => sum + Math.max(...c.submissions.map(s => s.marks || 0)), 
          0
        );
        result.codingScore = totalCodingMarks > 0 
          ? Math.round((result.codingScore / totalCodingMarks) * 100) 
          : 0;
      }

      // Ensure total score is also a percentage
      result.totalScore = Math.round((result.mcqScore + result.codingScore) / 2);
    });

    res.status(200).json({
      testId,
      submissions: results,
      totalSubmissions: results.length,
      summary: {
        averageScore: results.length > 0 
          ? Math.round(results.reduce((sum, sub) => sum + sub.totalScore, 0) / results.length) 
          : 0,
        totalCandidates: results.length,
        completedSubmissions: results.length,
        mcqStats: {
          average: results.length > 0 
            ? Math.round(results.reduce((sum, sub) => sum + sub.mcqScore, 0) / results.length) 
            : 0,
          highest: Math.max(...results.map(sub => sub.mcqScore), 0),
          lowest: Math.min(...results.map(sub => sub.mcqScore), 0)
        },
        codingStats: {
          average: results.length > 0 
            ? Math.round(results.reduce((sum, sub) => sum + sub.codingScore, 0) / results.length) 
            : 0,
          highest: Math.max(...results.map(sub => sub.codingScore), 0),
          lowest: Math.min(...results.map(sub => sub.codingScore), 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve test results',
      details: error.message 
    });
  }
};

// Add new route handler for getting submission attempts
export const getSubmissionAttempts = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify access rights
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to access these submissions' });
    }

    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .sort({ version: 1 })
    .select('version mcqSubmission.totalScore codingSubmission.totalScore totalScore status startTime endTime')
    .lean();

    const attempts = submissions.map(sub => ({
      version: sub.version,
      status: sub.status,
      mcqScore: sub.mcqSubmission?.totalScore || 0,
      codingScore: sub.codingSubmission?.totalScore || 0,
      totalScore: sub.totalScore,
      startTime: sub.startTime,
      endTime: sub.endTime,
      duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / 1000) : null // duration in seconds
    }));

    res.json({
      totalAttempts: attempts.length,
      attempts,
      bestScore: Math.max(...attempts.map(a => a.totalScore)),
      averageScore: Math.round(attempts.reduce((sum, a) => sum + a.totalScore, 0) / attempts.length)
    });

  } catch (error) {
    console.error('Error in getSubmissionAttempts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submission attempts',
      message: error.message 
    });
  }
};

// Add this new controller function
export const getSubmissionDetails = async (req, res) => {
  try {
    const { testId, userId } = req.params;
    
    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isOwnSubmission = req.user._id.toString() === userId;
    const isVendor = req.user.role === 'vendor';
    
    if (!isAdmin && !isOwnSubmission && !isVendor) {
      return res.status(403).json({ 
        error: 'Not authorized to access this submission' 
      });
    }

    // Get the submission with populated references
    const submission = await Submission.findOne({
      test: testId,
      user: userId,
      status: { $in: ['completed', 'mcq_completed', 'coding_completed'] }
    })
    .populate('user', 'name email')
    .populate('test', 'title type category difficulty totalMarks passingMarks timeLimit')
    .lean();

    if (!submission) {
      return res.status(404).json({ 
        error: 'No submission found for this test and user' 
      });
    }

    // Transform the data into a detailed response
    const response = {
      submissionId: submission._id,
      user: {
        id: submission.user._id,
        name: submission.user.name,
        email: submission.user.email
      },
      test: {
        id: submission.test._id,
        title: submission.test.title,
        type: submission.test.type,
        category: submission.test.category,
        difficulty: submission.test.difficulty
      },
      status: submission.status,
      startTime: submission.startTime,
      endTime: submission.endTime,
      duration: submission.endTime ? 
        Math.round((submission.endTime - submission.startTime) / 1000) : null,
      scores: {
        total: submission.totalScore,
        mcq: submission.mcqSubmission?.totalScore || 0,
        coding: submission.codingSubmission?.totalScore || 0,
        percentage: Math.round((submission.totalScore / submission.test.totalMarks) * 100),
        passed: submission.totalScore >= submission.test.passingMarks
      },
      mcq: submission.mcqSubmission ? {
        completed: submission.mcqSubmission.completed,
        submittedAt: submission.mcqSubmission.submittedAt,
        answers: submission.mcqSubmission.answers.map(answer => ({
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          isCorrect: answer.isCorrect,
          marksObtained: answer.marksObtained,
          maxMarks: answer.maxMarks
        }))
      } : null,
      coding: submission.codingSubmission ? {
        completed: submission.codingSubmission.completed,
        submittedAt: submission.codingSubmission.submittedAt,
        challenges: submission.codingSubmission.challenges.map(challenge => ({
          challengeId: challenge.challengeId,
          attempts: challenge.submissions.length,
          bestScore: Math.max(...challenge.submissions.map(s => s.marks || 0), 0),
          submissions: challenge.submissions.map(sub => ({
            submittedAt: sub.submittedAt,
            language: sub.language,
            status: sub.status,
            marks: sub.marks,
            executionTime: sub.executionTime,
            memory: sub.memory,
            testCasesPassed: sub.testCaseResults.filter(tc => tc.passed).length,
            totalTestCases: sub.testCaseResults.length,
            successRate: `${Math.round((sub.testCaseResults.filter(tc => tc.passed).length / sub.testCaseResults.length) * 100)}%`
          }))
        }))
      } : null
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getSubmissionDetails:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submission details',
      message: error.message 
    });
  }
};

// Add this new controller function
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { testId, status } = req.body;

    // Validate required fields
    if (!testId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'testId and status are required'
      });
    }

    // Validate status
    const validStatuses = ['in_progress', 'mcq_completed', 'coding_completed', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update all submissions for this test
    const result = await Submission.updateMany(
      { test: testId },
      { 
        $set: { 
          status,
          ...(status === 'completed' ? { endTime: new Date() } : {})
        }
      }
    );

    res.json({
      success: true,
      data: {
        testId,
        status,
        updatedCount: result.modifiedCount,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error in updateSubmissionStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update submission status',
      message: error.message
    });
  }
};

// Get comprehensive test submission details
export const getComprehensiveSubmission = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID or user ID format'
      });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isOwnSubmission = req.user._id.toString() === userId;
    const isVendor = req.user.role === 'vendor';

    if (!isAdmin && !isOwnSubmission && !isVendor) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this submission'
      });
    }

    // Get test details with MCQs and coding challenges
    const test = await Test.findById(testId)
      .populate('mcqs')
      .populate('codingChallenges')
      .lean();

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Get submission details
    const submission = await Submission.findOne({
      test: testId,
      user: userId
    })
    .populate('user', 'name email')
    .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found'
      });
    }

    // Process MCQ submissions
    const mcqDetails = submission.mcqSubmission ? {
      completed: submission.mcqSubmission.completed,
      submittedAt: submission.mcqSubmission.submittedAt,
      totalScore: submission.mcqSubmission.totalScore,
      answers: submission.mcqSubmission.answers.map(answer => {
        const question = test.mcqs.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        
        const correctOptions = question?.correctOptions || [];
        const selectedOptions = answer.selectedOptions || [];
        
        const isCorrect = Array.isArray(correctOptions) && 
          Array.isArray(selectedOptions) &&
          correctOptions.length === selectedOptions.length &&
          [...correctOptions].sort().every((opt, idx) => 
            opt === [...selectedOptions].sort()[idx]
          );

        return {
          questionId: answer.questionId,
          question: question?.question,
          selectedOptions: answer.selectedOptions,
          correctOptions: question?.correctOptions,
          isCorrect,
          marks: isCorrect ? question?.marks : 0,
          maxMarks: question?.marks,
          explanation: question?.explanation
        };
      })
    } : null;

    // Process coding submissions
    const codingDetails = submission.codingSubmission ? {
      completed: submission.codingSubmission.completed,
      submittedAt: submission.codingSubmission.submittedAt,
      totalScore: submission.codingSubmission.totalScore,
      challenges: submission.codingSubmission.challenges.map(challenge => {
        const challengeDetails = test.codingChallenges.find(c => 
          c._id.toString() === challenge.challengeId.toString()
        );

        return {
          challengeId: challenge.challengeId,
          title: challengeDetails?.title,
          description: challengeDetails?.description,
          difficulty: challengeDetails?.difficulty,
          submissions: challenge.submissions.map(sub => ({
            submittedAt: sub.submittedAt,
            code: sub.code,
            language: sub.language,
            status: sub.status,
            executionTime: sub.executionTime,
            memory: sub.memory,
            output: sub.output,
            error: sub.error,
            marks: sub.marks,
            testCaseResults: sub.testCaseResults.map(tc => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: tc.actualOutput,
              passed: tc.passed,
              error: tc.error
            }))
          })),
          bestScore: Math.max(...challenge.submissions.map(s => s.marks || 0), 0)
        };
      })
    } : null;

    res.json({
      success: true,
      data: {
        submissionId: submission._id,
        testId: test._id,
        testTitle: test.title,
        user: {
          id: submission.user._id,
          name: submission.user.name,
          email: submission.user.email
        },
        status: submission.status,
        startTime: submission.startTime,
        endTime: submission.endTime,
        duration: submission.endTime ? 
          Math.round((submission.endTime - submission.startTime) / 1000) : null,
        scores: {
          total: submission.totalScore,
          mcq: mcqDetails?.totalScore || 0,
          coding: codingDetails?.totalScore || 0,
          percentage: Math.round((submission.totalScore / test.totalMarks) * 100),
          passed: submission.totalScore >= test.passingMarks
        },
        mcq: mcqDetails,
        coding: codingDetails
      }
    });

  } catch (error) {
    console.error('Error in getComprehensiveSubmission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission details',
      message: error.message
    });
  }
}; 