import Test from "../models/test.model.js";
import { CodingSubmission } from '../models/codingSubmission.model.js';
import { MCQSubmission } from '../models/mcqSubmission.model.js';
import Submission from '../models/submission.model.js';
import TestRegistration from '../models/testRegistration.model.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

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

// Get user submissions with proper coding details
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isOwnSubmissions = req.user._id.toString() === userId;
    const isVendor = req.user.role === 'vendor';

    if (!isAdmin && !isOwnSubmissions && !isVendor) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Base query
    let query = { user: userId };
    if (isVendor && !isAdmin && !isOwnSubmissions) {
      const vendorTests = await Test.find({ vendor: req.user._id }).select('_id');
      query.test = { $in: vendorTests.map(test => test._id) };
    }

    // Update the populate to include detailed test and submission data
    const submissions = await Submission.find(query)
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks vendor codingChallenges mcqs timeLimit',
        populate: [
          { path: 'vendor', select: 'name email' },
          { 
            path: 'codingChallenges', 
            select: 'title description testCases marks difficulty'
          },
          {
            path: 'mcqs',
            select: 'question options correctOptions marks'
          }
        ]
      })
      .sort({ submittedAt: -1 })
      .lean();

    const transformedSubmissions = {
      coding: submissions
        .filter(sub => sub.codingSubmission?.challenges?.length > 0)
        .map(sub => ({
          submissionId: sub._id,
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.codingSubmission?.totalScore || 0,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          startTime: sub.startTime,
          endTime: sub.endTime,
          duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / 1000) : null,
          submittedAt: sub.codingSubmission?.submittedAt,
          challenges: (sub.codingSubmission?.challenges || []).map(challenge => {
            const challengeDetails = sub.test.codingChallenges.find(
              c => c._id.toString() === challenge.challengeId.toString()
            );
            
            return {
              challengeId: challenge.challengeId,
              challengeTitle: challengeDetails?.title || 'Unknown Challenge',
              difficulty: challengeDetails?.difficulty,
              maxMarks: challengeDetails?.marks || 0,
              submissions: (challenge.submissions || []).map(submission => ({
                submittedAt: submission.submittedAt,
                language: submission.language,
                status: submission.status,
                marks: submission.marks,
                code: submission.code,
                executionTime: submission.executionTime,
                memory: submission.memory,
                output: submission.output,
                error: submission.error,
                testCaseResults: submission.testCaseResults?.map(tc => ({
                  passed: tc.passed,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: tc.actualOutput,
                  error: tc.error
                })),
                testCasesPassed: submission.testCaseResults?.filter(tc => tc.passed).length || 0,
                totalTestCases: submission.testCaseResults?.length || 0
              })),
              bestScore: Math.max(...(challenge.submissions || []).map(s => s.marks || 0), 0),
              totalAttempts: challenge.submissions?.length || 0
            };
          })
        })),
      mcq: submissions
        .filter(sub => sub.mcqSubmission?.answers?.length > 0)
        .map(sub => ({
          submissionId: sub._id,
          testId: sub.test?._id,
          testTitle: sub.test?.title,
          type: sub.test?.type,
          category: sub.test?.category,
          difficulty: sub.test?.difficulty,
          score: sub.mcqSubmission?.totalScore || 0,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          startTime: sub.startTime,
          endTime: sub.endTime,
          duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / 1000) : null,
          submittedAt: sub.mcqSubmission?.submittedAt,
          totalQuestions: sub.test.mcqs?.length || 0,
          correctAnswers: (sub.mcqSubmission?.answers || []).filter(answer => {
            const question = sub.test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
            return arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
          }).length,
          answers: (sub.mcqSubmission?.answers || []).map(answer => {
            const question = sub.test.mcqs.find(
              q => q._id.toString() === answer.questionId.toString()
            );
            
            const isCorrect = arraysEqual(
              question?.correctOptions || [],
              answer.selectedOptions || []
            );

            return {
              questionId: answer.questionId,
              question: question?.question,
              selectedOptions: answer.selectedOptions || [],
              correctOptions: question?.correctOptions || [],
              options: question?.options || [],
              explanation: question?.explanation,
              isCorrect,
              marks: isCorrect ? (question?.marks || 0) : 0,
              maxMarks: question?.marks || 0,
              submittedAt: answer.submittedAt || sub.mcqSubmission?.submittedAt,
              timeSpent: answer.timeSpent,
              category: question?.category,
              difficulty: question?.difficulty,
              topics: question?.topics || [],
              questionType: question?.type || 'single',
              feedback: answer.feedback
            };
          }),
          summary: {
            totalQuestions: sub.test.mcqs?.length || 0,
            attemptedQuestions: sub.mcqSubmission?.answers?.length || 0,
            correctAnswers: (sub.mcqSubmission?.answers || []).filter(answer => {
              const question = sub.test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length,
            incorrectAnswers: (sub.mcqSubmission?.answers || []).filter(answer => {
              const question = sub.test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return !arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length,
            skippedQuestions: (sub.test.mcqs?.length || 0) - (sub.mcqSubmission?.answers?.length || 0),
            accuracy: Math.round(((sub.mcqSubmission?.answers || []).filter(answer => {
              const question = sub.test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length / (sub.mcqSubmission?.answers?.length || 1)) * 100),
            averageTimePerQuestion: Math.round(
              (sub.mcqSubmission?.answers || []).reduce((sum, ans) => sum + (ans.timeSpent || 0), 0) / 
              (sub.mcqSubmission?.answers?.length || 1)
            )
          }
        }))
    };

    // Calculate summary statistics
    const summary = {
      totalSubmissions: submissions.length,
      mcqSubmissions: transformedSubmissions.mcq.length,
      codingSubmissions: transformedSubmissions.coding.length,
      averageScore: submissions.length > 0 
        ? Math.round(submissions.reduce((sum, sub) => 
            sum + ((sub.mcqSubmission?.totalScore || 0) + 
                  (sub.codingSubmission?.totalScore || 0)), 0) / submissions.length)
        : 0,
      testsPassed: submissions.filter(sub => 
        (sub.totalScore || 0) >= (sub.test?.passingMarks || 0)
      ).length
    };

    res.json({
      success: true,
      data: transformedSubmissions,
      summary
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

// Get test results with detailed coding information
export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.query;
    
    if (testId) {
      // Get all submissions for this test
      const submissions = await Submission.find({ 
        test: testId
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
      .populate('user', 'name email') // Add user population
      .populate('codingSubmission.submissions') // Add coding submission population
      .lean();

      // Transform submissions to include both MCQ and coding data
      const transformedSubmissions = {
        mcq: [], 
        coding: []
      };

      submissions.forEach(sub => {
        // Add MCQ submission if exists
        if (sub.mcqSubmission) {
          transformedSubmissions.mcq.push({
            submissionId: sub._id,
            userId: sub.user._id,
            userName: sub.user.name,
            userEmail: sub.user.email,
            answers: sub.mcqSubmission.answers,
            totalScore: sub.mcqSubmission.totalScore,
            submittedAt: sub.mcqSubmission.submittedAt
          });
        }

        // Add coding submission if exists
        if (sub.codingSubmission && sub.codingSubmission.submissions) {
          transformedSubmissions.coding.push({
            submissionId: sub._id,
            userId: sub.user._id,
            userName: sub.user.name,
            userEmail: sub.user.email,
            submissions: sub.codingSubmission.submissions,
            totalScore: sub.codingSubmission.totalScore,
            submittedAt: sub.codingSubmission.submittedAt
          });
        }
      });

      // Calculate summary
      const summary = {
        totalSubmissions: submissions.length,
        mcqSubmissions: transformedSubmissions.mcq.length,
        codingSubmissions: transformedSubmissions.coding.length,
        averageScore: submissions.length > 0 
          ? Math.round(submissions.reduce((sum, sub) => 
              sum + ((sub.mcqSubmission?.totalScore || 0) + 
                    (sub.codingSubmission?.totalScore || 0)), 0) / submissions.length)
          : 0
      };

      return res.json({
        success: true,
        data: transformedSubmissions,
        summary
      });
    }

    // ... rest of the code for getting all submissions ...
  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ error: 'Failed to retrieve test results' });
  }
};

// Get challenge-specific submissions
export const getChallengeSubmissions = async (req, res) => {
  try {
    const { testId, challengeId } = req.params;

    const submissions = await Submission.find({
      test: testId,
      'codingSubmission.challenges.challengeId': challengeId
    })
    .populate('user', 'name email')
    .lean();

    const challengeSubmissions = submissions.map(sub => {
      const challenge = sub.codingSubmission.challenges.find(
        c => c.challengeId.toString() === challengeId
      );
      
      return {
        userId: sub.user._id,
        userName: sub.user.name,
        userEmail: sub.user.email,
        submissions: challenge.submissions.map(submission => ({
          submittedAt: submission.submittedAt,
          language: submission.language,
          code: submission.code,
          status: submission.status,
          executionTime: submission.executionTime,
          memory: submission.memory,
          testCaseResults: submission.testCaseResults,
          marks: submission.marks
        })),
        bestScore: Math.max(...challenge.submissions.map(s => s.marks || 0), 0),
        totalAttempts: challenge.submissions.length
      };
    });

    res.json({
      success: true,
      data: challengeSubmissions,
      meta: {
        totalUsers: challengeSubmissions.length,
        averageScore: challengeSubmissions.length > 0
          ? Math.round(challengeSubmissions.reduce((sum, sub) => sum + sub.bestScore, 0) / challengeSubmissions.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Error in getChallengeSubmissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenge submissions' });
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

    // Get test details with populated fields
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

    // Get all submissions for this test with proper population
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .populate({
        path: 'test',
        select: 'title type category difficulty totalMarks passingMarks mcqs codingChallenges timeLimit',
        populate: [
          { 
            path: 'codingChallenges', 
            select: 'title description testCases marks difficulty'
          },
          {
            path: 'mcqs',
            select: 'question options correctOptions marks'
          }
        ]
      })
      .lean();

    const transformedSubmissions = {
      coding: submissions
        .filter(sub => sub.codingSubmission?.challenges?.length > 0)
        .map(sub => ({
          submissionId: sub._id,
          userId: sub.user._id,
          userName: sub.user.name,
          userEmail: sub.user.email,
          testId: sub.test._id,
          testTitle: sub.test.title,
          type: sub.test.type,
          category: sub.test.category,
          difficulty: sub.test.difficulty,
          score: sub.codingSubmission?.totalScore || 0,
          totalMarks: sub.test?.totalMarks,
          passingMarks: sub.test?.passingMarks,
          status: sub.status,
          startTime: sub.startTime,
          endTime: sub.endTime,
          duration: sub.endTime ? Math.round((sub.endTime - sub.startTime) / 1000) : null,
          challenges: (sub.codingSubmission?.challenges || []).map(challenge => {
            const challengeDetails = sub.test.codingChallenges.find(
              c => c._id.toString() === challenge.challengeId.toString()
            );
            
            return {
              challengeId: challenge.challengeId,
              challengeTitle: challengeDetails?.title || 'Unknown Challenge',
              difficulty: challengeDetails?.difficulty,
              maxMarks: challengeDetails?.marks || 0,
              submissions: (challenge.submissions || []).map(submission => ({
                submittedAt: submission.submittedAt,
                language: submission.language,
                status: submission.status,
                marks: submission.marks,
                code: submission.code,
                executionTime: submission.executionTime,
                memory: submission.memory,
                output: submission.output,
                error: submission.error,
                testCaseResults: submission.testCaseResults?.map(tc => ({
                  passed: tc.passed,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: tc.actualOutput,
                  error: tc.error
                })),
                testCasesPassed: submission.testCaseResults?.filter(tc => tc.passed).length || 0,
                totalTestCases: submission.testCaseResults?.length || 0
              })),
              bestScore: Math.max(...(challenge.submissions || []).map(s => s.marks || 0), 0),
              totalAttempts: challenge.submissions?.length || 0
            };
          })
        })),
      mcq: submissions
        .filter(sub => sub.mcqSubmission?.answers?.length > 0)
        .map(sub => ({
          submissionId: sub._id,
          userId: sub.user._id,
          userName: sub.user.name,
          userEmail: sub.user.email,
          answers: (sub.mcqSubmission?.answers || []).map(answer => {
            const question = test.mcqs.find(
              q => q._id.toString() === answer.questionId.toString()
            );
            
            const isCorrect = arraysEqual(
              question?.correctOptions || [],
              answer.selectedOptions || []
            );

            return {
              questionId: answer.questionId,
              question: question?.question,
              selectedOptions: answer.selectedOptions || [],
              correctOptions: question?.correctOptions || [],
              options: question?.options || [],
              explanation: question?.explanation,
              isCorrect,
              marks: isCorrect ? (question?.marks || 0) : 0,
              maxMarks: question?.marks || 0
            };
          }),
          totalScore: sub.mcqSubmission?.totalScore || 0,
          submittedAt: sub.mcqSubmission?.submittedAt,
          summary: {
            totalQuestions: test.mcqs?.length || 0,
            attemptedQuestions: sub.mcqSubmission?.answers?.length || 0,
            correctAnswers: (sub.mcqSubmission?.answers || []).filter(answer => {
              const question = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length,
            incorrectAnswers: (sub.mcqSubmission?.answers || []).filter(answer => {
              const question = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return !arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length,
            accuracy: Math.round(((sub.mcqSubmission?.answers || []).filter(answer => {
              const question = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
              return arraysEqual(question?.correctOptions || [], answer.selectedOptions || []);
            }).length / (sub.mcqSubmission?.answers?.length || 1)) * 100)
          }
        }))
    };

    // Calculate summary statistics
    const summary = {
      totalSubmissions: submissions.length,
      mcqSubmissions: transformedSubmissions.mcq.length,
      codingSubmissions: transformedSubmissions.coding.length,
      averageScore: submissions.length > 0 
        ? Math.round(submissions.reduce((sum, sub) => 
            sum + ((sub.mcqSubmission?.totalScore || 0) + 
                  (sub.codingSubmission?.totalScore || 0)), 0) / submissions.length)
        : 0,
      testsPassed: submissions.filter(sub => 
        (sub.totalScore || 0) >= (test.passingMarks || 0)
      ).length
    };

    res.json({
      success: true,
      data: transformedSubmissions,
      summary
    });

  } catch (error) {
    console.error('Error in getTestSubmissions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch test submissions',
      message: error.message 
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

// Generate detailed Excel report for test submissions
export const generateTestReport = async (req, res) => {
  try {
    const { testId } = req.params;

    // Get test details
    const test = await Test.findById(testId)
      .populate('mcqs')
      .populate('codingChallenges')
      .lean();

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    // Get submissions
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email organization batch')
      .lean();

    const workbook = new ExcelJS.Workbook();
    
    // 1. OVERVIEW SHEET
    const overviewSheet = workbook.addWorksheet('Overview', {
      properties: { tabColor: { argb: '4472C4' } }
    });

    // Title
    overviewSheet.mergeCells('A1:F1');
    const titleCell = overviewSheet.getCell('A1');
    titleCell.value = `Test Report: ${test.title}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    titleCell.alignment = { horizontal: 'center' };

    // Test Statistics
    const testStats = [
      ['Test Details', ''],
      ['Total Participants', submissions.length],
      ['MCQ Questions', test.mcqs.length],
      ['Coding Challenges', test.codingChallenges.length],
      ['Total Marks', test.totalMarks],
      ['Passing Marks', test.passingMarks],
      ['Average Score', calculateAverageScore(submissions)],
      ['Pass Rate', `${calculatePassRate(submissions, test.passingMarks)}%`]
    ];

    testStats.forEach((row, idx) => {
      overviewSheet.addRow(row);
      if (idx === 0) {
        overviewSheet.lastRow.font = { bold: true };
        overviewSheet.lastRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
      }
    });

    // 2. PARTICIPANTS SHEET
    const participantsSheet = workbook.addWorksheet('Participants', {
      properties: { tabColor: { argb: '70AD47' } }
    });

    const headers = [
      'Name', 'Email', 'Organization', 'Batch',
      'MCQ Score', 'MCQ %', 'Coding Score', 'Coding %',
      'Total Score', 'Overall %', 'Time Taken', 'Status'
    ];

    participantsSheet.addRow(headers);
    styleHeader(participantsSheet.getRow(1));

    // Add participant data
    submissions.forEach(sub => {
      const mcqScore = sub.mcqSubmission?.totalScore || 0;
      const codingScore = sub.codingSubmission?.totalScore || 0;
      const totalScore = mcqScore + codingScore;
      const mcqPercent = calculatePercentage(mcqScore, getTotalMCQMarks(test.mcqs));
      const codingPercent = calculatePercentage(codingScore, getTotalCodingMarks(test.codingChallenges));
      const overallPercent = calculatePercentage(totalScore, test.totalMarks);

      const row = participantsSheet.addRow([
        sub.user.name,
        sub.user.email,
        sub.user.organization || 'N/A',
        sub.user.batch || 'N/A',
        mcqScore,
        `${mcqPercent}%`,
        codingScore,
        `${codingPercent}%`,
        totalScore,
        `${overallPercent}%`,
        calculateTimeTaken(sub.startTime, sub.endTime),
        totalScore >= test.passingMarks ? 'PASS' : 'FAIL'
      ]);

      stylePerformanceRow(row, overallPercent);
    });

    // 3. MCQ ANALYSIS
    const mcqSheet = workbook.addWorksheet('MCQ Analysis', {
      properties: { tabColor: { argb: 'ED7D31' } }
    });

    mcqSheet.addRow(['MCQ Performance Analysis']);
    styleHeader(mcqSheet.getRow(1));

    mcqSheet.addRow(['Question', 'Total Attempts', 'Correct Attempts', 'Accuracy']);
    styleHeader(mcqSheet.getRow(2));

    test.mcqs.forEach((mcq, idx) => {
      const stats = calculateQuestionStats(submissions, mcq._id);
      mcqSheet.addRow([
        `Q${idx + 1}`,
        stats.totalAttempts,
        stats.correctAttempts,
        `${stats.accuracy}%`
      ]);
    });

    // 4. CODING ANALYSIS
    const codingSheet = workbook.addWorksheet('Coding Analysis', {
      properties: { tabColor: { argb: '5B9BD5' } }
    });

    codingSheet.addRow(['Coding Challenge Analysis']);
    styleHeader(codingSheet.getRow(1));

    codingSheet.addRow([
      'Challenge',
      'Total Attempts',
      'Successful Attempts',
      'Success Rate',
      'Avg Execution Time',
      'Most Used Language'
    ]);
    styleHeader(codingSheet.getRow(2));

    test.codingChallenges.forEach(challenge => {
      const stats = calculateChallengeStats(submissions, challenge._id);
      codingSheet.addRow([
        challenge.title,
        stats.totalAttempts,
        stats.successfulAttempts,
        `${stats.successRate}%`,
        `${stats.avgExecutionTime}ms`,
        stats.mostUsedLanguage
      ]);
    });

    // Auto-fit columns
    [overviewSheet, participantsSheet, mcqSheet, codingSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          maxLength = Math.max(maxLength, columnLength);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=test-report-${test.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`
    );

    await workbook.xlsx.write(res);

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Excel report',
      message: error.message
    });
  }
};

// Helper functions
function calculateQuestionStats(submissions, questionId) {
  let totalAttempts = 0;
  let correctAttempts = 0;

  submissions.forEach(sub => {
    const answer = sub.mcqSubmission?.answers?.find(
      a => a.questionId.toString() === questionId.toString()
    );
    if (answer) {
      totalAttempts++;
      if (answer.isCorrect) correctAttempts++;
    }
  });

  return {
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
  };
}

function calculateChallengeStats(submissions, challengeId) {
  let totalAttempts = 0;
  let successfulAttempts = 0;
  let totalExecutionTime = 0;
  const languages = {};

  submissions.forEach(sub => {
    const challenge = sub.codingSubmission?.challenges?.find(
      c => c.challengeId.toString() === challengeId.toString()
    );

    if (challenge?.submissions?.length > 0) {
      challenge.submissions.forEach(submission => {
        totalAttempts++;
        if (submission.status === 'passed') successfulAttempts++;
        if (submission.executionTime) totalExecutionTime += submission.executionTime;
        if (submission.language) {
          languages[submission.language] = (languages[submission.language] || 0) + 1;
        }
      });
    }
  });

  return {
    totalAttempts,
    successfulAttempts,
    successRate: totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0,
    avgExecutionTime: totalAttempts > 0 ? Math.round(totalExecutionTime / totalAttempts) : 0,
    mostUsedLanguage: Object.entries(languages).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
  };
}

// Other helper functions remain the same

function calculatePercentage(value, total) {
  return Math.round((value / total) * 100);
}

function calculateTimeTaken(startTime, endTime) {
  if (!startTime || !endTime) return 'N/A';
  const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
}

function calculateAverageScore(submissions) {
  if (!submissions.length) return 0;
  const totalScore = submissions.reduce((sum, sub) => 
    sum + (sub.mcqSubmission?.totalScore || 0) + (sub.codingSubmission?.totalScore || 0), 0);
  return Math.round(totalScore / submissions.length);
}

function calculatePassRate(submissions, passingMarks) {
  if (!submissions.length) return 0;
  const passed = submissions.filter(sub => 
    (sub.mcqSubmission?.totalScore || 0) + (sub.codingSubmission?.totalScore || 0) >= passingMarks
  ).length;
  return Math.round((passed / submissions.length) * 100);
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };
  row.alignment = { horizontal: 'center' };
}

function stylePerformanceRow(row, percentage) {
  const color = 
    percentage >= 80 ? '92D050' :  // Green
    percentage >= 60 ? 'FFEB84' :  // Yellow
    percentage >= 40 ? 'FFC000' :  // Orange
    'FF9999';                      // Red

  row.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
  });
}

// Add these statistics calculation functions

function calculateMCQStatistics(submissions, mcqs) {
  const stats = {
    totalAttempts: 0,
    averageScore: 0,
    questionStats: mcqs.map(q => ({
      questionId: q._id,
      question: q.question,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0
    }))
  };

  submissions.forEach(sub => {
    if (sub.mcqSubmission?.answers?.length > 0) {
      stats.totalAttempts++;
      
      sub.mcqSubmission.answers.forEach(answer => {
        const questionStat = stats.questionStats.find(
          qs => qs.questionId.toString() === answer.questionId.toString()
        );
        if (questionStat) {
          questionStat.totalAttempts++;
          if (answer.isCorrect) {
            questionStat.correctAttempts++;
          }
        }
      });
    }
  });

  // Calculate accuracies
  stats.questionStats.forEach(qs => {
    qs.accuracy = qs.totalAttempts > 0 
      ? Math.round((qs.correctAttempts / qs.totalAttempts) * 100) 
      : 0;
  });

  // Calculate average score
  stats.averageScore = stats.totalAttempts > 0
    ? Math.round(stats.questionStats.reduce((sum, qs) => sum + qs.accuracy, 0) / stats.questionStats.length)
    : 0;

  return stats;
}

function calculateCodingStatistics(submissions, challenges) {
  const stats = {
    totalAttempts: 0,
    averageScore: 0,
    challengeStats: challenges.map(c => ({
      challengeId: c._id,
      title: c.title,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageExecutionTime: 0,
      successRate: 0,
      languages: {}
    }))
  };

  submissions.forEach(sub => {
    if (sub.codingSubmission?.challenges?.length > 0) {
      stats.totalAttempts++;
      
      sub.codingSubmission.challenges.forEach(challenge => {
        const challengeStat = stats.challengeStats.find(
          cs => cs.challengeId.toString() === challenge.challengeId.toString()
        );
        
        if (challengeStat) {
          challengeStat.totalAttempts += challenge.submissions?.length || 0;
          
          challenge.submissions?.forEach(submission => {
            // Track languages used
            challengeStat.languages[submission.language] = 
              (challengeStat.languages[submission.language] || 0) + 1;

            // Track successful submissions
            if (submission.status === 'passed') {
              challengeStat.successfulAttempts++;
            }

            // Track execution time
            if (submission.executionTime) {
              challengeStat.averageExecutionTime += submission.executionTime;
            }
          });
        }
      });
    }
  });

  // Calculate statistics
  stats.challengeStats.forEach(cs => {
    cs.successRate = cs.totalAttempts > 0
      ? Math.round((cs.successfulAttempts / cs.totalAttempts) * 100)
      : 0;
    
    cs.averageExecutionTime = cs.totalAttempts > 0
      ? Math.round(cs.averageExecutionTime / cs.totalAttempts)
      : 0;

    // Get most used language
    cs.mostUsedLanguage = Object.entries(cs.languages)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  });

  // Calculate overall average score
  stats.averageScore = stats.challengeStats.length > 0
    ? Math.round(stats.challengeStats.reduce((sum, cs) => sum + cs.successRate, 0) / stats.challengeStats.length)
    : 0;

  return stats;
}

// Add chart creation functions
function createMCQChart(worksheet, stats, startRow) {
  const chartData = [
    ['Question', 'Accuracy %'],
    ...stats.questionStats.map(qs => [
      `Q${stats.questionStats.indexOf(qs) + 1}`,
      qs.accuracy
    ])
  ];

  // Add data for chart
  const dataRange = worksheet.getCell(startRow, 1).address;
  chartData.forEach((row, i) => {
    worksheet.getRow(startRow + i).values = row;
  });

  // Create chart
  const chart = worksheet.workbook.addChart({
    type: 'column',
    title: { text: 'MCQ Question Accuracy' },
    legend: { position: 'right' },
    series: [{
      name: 'Accuracy',
      categories: `=${worksheet.name}!$A$${startRow + 1}:$A$${startRow + stats.questionStats.length}`,
      values: `=${worksheet.name}!$B$${startRow + 1}:$B$${startRow + stats.questionStats.length}`
    }]
  });

  // Add chart to worksheet
  worksheet.addChart(chart, `A${startRow + stats.questionStats.length + 2}`);
}

function createCodingChart(worksheet, stats, startRow) {
  const chartData = [
    ['Challenge', 'Success Rate %'],
    ...stats.challengeStats.map(cs => [
      cs.title,
      cs.successRate
    ])
  ];

  // Add data for chart
  chartData.forEach((row, i) => {
    worksheet.getRow(startRow + i).values = row;
  });

  // Create chart
  const chart = worksheet.workbook.addChart({
    type: 'column',
    title: { text: 'Coding Challenge Success Rate' },
    legend: { position: 'right' },
    series: [{
      name: 'Success Rate',
      categories: `=${worksheet.name}!$A$${startRow + 1}:$A$${startRow + stats.challengeStats.length}`,
      values: `=${worksheet.name}!$B$${startRow + 1}:$B$${startRow + stats.challengeStats.length}`
    }]
  });

  // Add chart to worksheet
  worksheet.addChart(chart, `A${startRow + stats.challengeStats.length + 2}`);
} 