import Test from "../models/test.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import Vendor from "../models/vendor.model.js";
import Submission from "../models/submission.model.js";
import User from "../models/user.model.js";
import TestDiscussion from "../models/testDiscussion.model.js";
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import xlsx from 'xlsx';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import mongoose from 'mongoose';
import SystemSettings from "../models/systemSettings.model.js";
import TestRegistration from "../models/testRegistration.model.js";
import { formatTimeSpent } from '../utils/timeFormatters.js';


export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    
    // Get all submissions for vendor's tests
    const testIds = tests.map(test => test._id);
    const submissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed'
    })
    .populate('user', 'name email')
    .populate('test', 'title')
    .sort('-updatedAt');

    // Calculate test distribution by difficulty
    const testDistribution = tests.reduce((acc, test) => {
      const difficulty = test.difficulty?.toLowerCase() || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    });

    // Calculate unique candidates
    const uniqueCandidates = new Set(submissions.map(s => s.user._id.toString()));

    // Get pending invitations count
    const pendingInvitations = await TestInvitation.countDocuments({
      vendor: vendorId,
      status: 'pending'
    });

    // Format response
    const dashboard = {
      overview: {
        totalTests: tests.length,
        activeTests: tests.filter(t => t.status === 'published').length,
        totalCandidates: uniqueCandidates.size,
        pendingInvitations
      },
      performance: {
        averageScore: calculateTestAverage(submissions.map(s => s.totalScore)),
        passRate: calculateTestPassRate(submissions),
        totalAttempts: submissions.length
      },
      testDistribution,
      recentActivity: submissions.slice(0, 5).map(submission => ({
        candidateName: submission.user.name,
        candidateEmail: submission.user.email,
        testTitle: submission.test.title,
        score: submission.totalScore,
        completedAt: submission.updatedAt
      }))
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Error in getVendorDashboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
};

export const getVendorTests = async (req, res) => {
  try {
    // Get tests directly using the user ID from auth
    const tests = await Test.find({ 
      vendor: req.user._id
    })
    .select('title description difficulty duration status createdAt updatedAt totalMarks passingMarks category')
    .sort({ createdAt: -1 });

    // Return formatted response
    res.json({
      message: 'Tests retrieved successfully',
      count: tests.length,
      tests: tests.map(test => ({
        _id: test._id,
        title: test.title,
        description: test.description,
        difficulty: test.difficulty,
        duration: test.duration,
        status: test.status,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        category: test.category,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error in getVendorTests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tests',
      message: error.message 
    });
  }
};

export const getTestAnalytics = async (req, res) => {
  try {
    const tests = await Test.find({ vendor: req.user._id });
    const submissions = await Submission.find({ 
      test: { $in: tests.map(t => t._id) } 
    }).populate('user').populate('test');

    // Enhanced analytics object
    const analytics = {
      testMetrics: {
        totalTests: tests.length,
        activeTests: tests.filter(t => t.status === 'published').length,
        draftTests: tests.filter(t => t.status === 'draft').length,
        archivedTests: tests.filter(t => t.status === 'archived').length,
        testsByDifficulty: {
          easy: tests.filter(t => t.difficulty === 'easy').length,
          medium: tests.filter(t => t.difficulty === 'medium').length,
          hard: tests.filter(t => t.difficulty === 'hard').length
        },
        testsByCategory: tests.reduce((acc, test) => {
          acc[test.category] = (acc[test.category] || 0) + 1;
          return acc;
        }, {})
      },

      submissionMetrics: {
        total: submissions.length,
        completed: submissions.filter(s => s.status === 'completed').length,
        inProgress: submissions.filter(s => s.status === 'in_progress').length,
        mcqCompleted: submissions.filter(s => s.status === 'mcq_completed').length,
        codingCompleted: submissions.filter(s => s.status === 'coding_completed').length,
        averageCompletionTime: calculateAverageCompletionTime(submissions),
        submissionsByTest: calculateSubmissionsByTest(submissions)
      },

      performanceMetrics: {
        totalCandidates: new Set(submissions.map(s => s.user._id.toString())).size,
        averageScore: calculateTestAverage(submissions.map(s => s.totalScore)),
        highestScore: Math.max(...submissions.map(s => s.totalScore || 0), 0),
        lowestScore: Math.min(...submissions.filter(s => s.totalScore).map(s => s.totalScore), 100),
        passRate: calculateTestPassRate(submissions),
        scoreDistribution: calculateScoreDistribution(submissions)
      },

      timeBasedMetrics: {
        dailySubmissions: calculateDailySubmissions(submissions),
        peakSubmissionHours: calculatePeakHours(submissions),
        averageTestDuration: calculateAverageTestDuration(tests),
        completionTimeDistribution: calculateCompletionTimeDistribution(submissions)
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    // Get all submissions for this test with populated user data
    const submissions = await Submission.find({
      test: testId
    })
    .populate('user', 'name email')
    .populate('mcqSubmission')
    .populate('codingSubmission')
    .sort({ submittedAt: -1 });

    // Calculate and format results
    const results = await Promise.all(submissions.map(async (submission) => {
      // Calculate MCQ score
      const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
        if (answer.isCorrect) {
          const mcq = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
          return total + (mcq?.marks || 0);
        }
        return total;
      }, 0) || 0;

      // Calculate coding score
      const codingScore = submission.codingSubmission?.answers?.reduce((total, answer) => {
        const challenge = test.codingChallenges.find(
          c => c._id.toString() === answer.challengeId.toString()
        );
        const maxMarks = challenge?.marks || 0;
        return total + (answer.score * maxMarks / 100); // Convert percentage to actual marks
      }, 0) || 0;

      // Calculate total score
      const totalScore = mcqScore + codingScore;

      return {
        candidateId: submission.user._id,
        candidateName: submission.user.name,
        email: submission.user.email,
        score: Math.round(totalScore), // Round to nearest integer
        mcqScore: Math.round(mcqScore),
        codingScore: Math.round(codingScore),
        submittedAt: submission.submittedAt,
        status: submission.status,
        completionTime: submission.duration,
        details: {
          mcqAnswers: submission.mcqSubmission?.answers?.length || 0,
          codingChallenges: submission.codingSubmission?.answers?.length || 0,
          totalMcqQuestions: test.mcqs.length,
          totalCodingChallenges: test.codingChallenges.length,
          passingScore: test.passingMarks,
          result: totalScore >= test.passingMarks ? 'PASS' : 'FAIL'
        },
        lastActivity: submission.updatedAt
      };
    }));

    res.json(results);

  } catch (error) {
    console.error('Error in getTestResults:', error);
    res.status(500).json({ 
      error: "Failed to fetch test results",
      details: error.message 
    });
  }
};

export const getTestCandidates = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    }).populate('mcqs codingChallenges');

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all submissions for this test with populated user data
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .populate('mcqSubmission')
      .populate('codingSubmission')
      .sort('-updatedAt');

    // Group submissions by user and get their latest attempt
    const candidates = submissions.reduce((acc, submission) => {
      const userId = submission.user?._id?.toString();
      
      // Skip if user data is missing
      if (!userId || !submission.user) return acc;

      // Calculate MCQ score
      const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
        const question = test.mcqs.find(q => 
          q._id.toString() === answer.questionId.toString()
        );
        const isCorrect = Array.isArray(question?.correctOptions) && 
          Array.isArray(answer.selectedOptions) &&
          question.correctOptions.length === answer.selectedOptions.length &&
          [...question.correctOptions].sort().every((opt, idx) => 
            opt === [...answer.selectedOptions].sort()[idx]
          );
        return total + (isCorrect ? (question?.marks || 0) : 0);
      }, 0) || 0;

      // Calculate coding score
      const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
        const maxMarks = test.codingChallenges.find(
          c => c._id.toString() === challenge.challengeId.toString()
        )?.marks || 0;
        const passedSubmission = challenge.submissions?.find(s => s.status === 'passed');
        return total + (passedSubmission ? maxMarks : 0);
      }, 0) || 0;

      // Calculate total score
      const totalScore = mcqScore + codingScore;

      // Calculate max possible scores
      const maxMcqScore = test.mcqs.reduce((total, mcq) => total + (mcq.marks || 0), 0);
      const maxCodingScore = test.codingChallenges.reduce((total, challenge) => total + (challenge.marks || 0), 0);
      const maxTotalScore = maxMcqScore + maxCodingScore;

      const existingCandidate = acc.find(c => c._id.toString() === userId);

      if (existingCandidate) {
        existingCandidate.attempts++;
        if (submission.updatedAt > existingCandidate.lastAttempt) {
          existingCandidate.status = submission.status;
          existingCandidate.lastAttempt = submission.updatedAt;
          existingCandidate.scores = {
            mcq: {
              score: mcqScore,
              maxScore: maxMcqScore,
              percentage: Math.round((mcqScore / maxMcqScore) * 100)
            },
            coding: {
              score: codingScore,
              maxScore: maxCodingScore,
              percentage: Math.round((codingScore / maxCodingScore) * 100)
            },
            total: {
              score: totalScore,
              maxScore: maxTotalScore,
              percentage: Math.round((totalScore / maxTotalScore) * 100)
            }
          };
        }
      } else {
        acc.push({
          _id: userId,
          name: submission.user.name,
          email: submission.user.email,
          status: submission.status,
          scores: {
            mcq: {
              score: mcqScore,
              maxScore: maxMcqScore,
              percentage: Math.round((mcqScore / maxMcqScore) * 100)
            },
            coding: {
              score: codingScore,
              maxScore: maxCodingScore,
              percentage: Math.round((codingScore / maxCodingScore) * 100)
            },
            total: {
              score: totalScore,
              maxScore: maxTotalScore,
              percentage: Math.round((totalScore / maxTotalScore) * 100)
            }
          },
          attempts: 1,
          lastAttempt: submission.updatedAt
        });
      }
      return acc;
    }, []);

    // Calculate test statistics
    const testStats = {
      totalCandidates: candidates.length,
      averageScores: {
        mcq: Math.round(candidates.reduce((sum, c) => sum + c.scores.mcq.percentage, 0) / candidates.length) || 0,
        coding: Math.round(candidates.reduce((sum, c) => sum + c.scores.coding.percentage, 0) / candidates.length) || 0,
        total: Math.round(candidates.reduce((sum, c) => sum + c.scores.total.percentage, 0) / candidates.length) || 0
      },
      highestScores: {
        mcq: Math.max(...candidates.map(c => c.scores.mcq.score), 0),
        coding: Math.max(...candidates.map(c => c.scores.coding.score), 0),
        total: Math.max(...candidates.map(c => c.scores.total.score), 0)
      },
      maxPossibleScores: candidates[0]?.scores.total.maxScore ? {
        mcq: candidates[0].scores.mcq.maxScore,
        coding: candidates[0].scores.coding.maxScore,
        total: candidates[0].scores.total.maxScore
      } : { mcq: 0, coding: 0, total: 0 }
    };

    res.json({
      testId: test._id,
      testTitle: test.title,
      stats: testStats,
      totalCandidates: candidates.length,
      candidates: candidates.map(c => ({
        ...c,
        result: c.scores.total.percentage >= (test.passingMarks || 70) ? 'PASS' : 'FAIL'
      }))
    });

  } catch (error) {
    console.error('Error in getTestCandidates:', error);
    res.status(500).json({ 
      error: "Failed to fetch test candidates",
      details: error.message 
    });
  }
};

export const sendTestInvitations = async (req, res) => {
  try {
    const { testId, candidates, validUntil, maxAttempts } = req.body;
    
    const invitations = await Promise.all(
      candidates.map(async (candidate) => {
        const invitation = await TestInvitation.create({
          test: testId,
          email: candidate.email,
          name: candidate.name,
          validUntil,
          maxAttempts,
          vendor: req.user._id
        });
        
        // TODO: Send email to candidate
        
        return invitation;
      })
    );
    
    res.status(201).json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestInvitations = async (req, res) => {
  try {
    const invitations = await TestInvitation.find({
      test: req.params.testId,
      vendor: req.user._id
    }).sort({ createdAt: -1 });
    
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.user._id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get test metrics
    const [totalTests, activeTests, completedTests] = await Promise.all([
      Test.countDocuments({ 
        vendor: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }),
      Test.countDocuments({ 
        vendor: req.user._id,
        status: 'published',
        createdAt: { $gte: start, $lte: end }
      }),
      TestResult.countDocuments({
        'test.vendor': req.user._id,
        completedAt: { $gte: start, $lte: end }
      })
    ]);

    // Get candidate metrics
    const candidateMetrics = await TestResult.aggregate([
      {
        $match: {
          'test.vendor': req.user._id,
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalCandidates: { $addToSet: '$user' },
          passedCandidates: {
            $sum: { $cond: [{ $gte: ['$totalScore', 70] }, 1, 0] }
          },
          failedCandidates: {
            $sum: { $cond: [{ $lt: ['$totalScore', 70] }, 1, 0] }
          },
          totalScore: { $sum: '$totalScore' },
          highestScore: { $max: '$totalScore' },
          lowestScore: { $min: '$totalScore' }
        }
      }
    ]);

    // Get test performance over time
    const dailyPerformance = await TestResult.aggregate([
      {
        $match: {
          'test.vendor': req.user._id,
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            testId: '$test._id'
          },
          avgScore: { $avg: '$totalScore' },
          attempts: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $gte: ['$totalScore', 70] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    const metrics = candidateMetrics[0] || {
      totalCandidates: [],
      passedCandidates: 0,
      failedCandidates: 0,
      totalScore: 0,
      highestScore: 0,
      lowestScore: 0
    };

    const report = {
      testMetrics: {
        totalTests,
        activeTests,
        completedTests
      },
      candidateMetrics: {
        totalCandidates: metrics.totalCandidates.length,
        passedCandidates: metrics.passedCandidates,
        failedCandidates: metrics.failedCandidates
      },
      performanceMetrics: {
        averageScore: metrics.totalScore / (metrics.passedCandidates + metrics.failedCandidates) || 0,
        highestScore: metrics.highestScore,
        lowestScore: metrics.lowestScore
      },
      dailyPerformance: dailyPerformance.map(day => ({
        date: day._id.date,
        testId: day._id.testId,
        averageScore: Math.round(day.avgScore * 10) / 10,
        attempts: day.attempts,
        passRate: Math.round((day.passCount / day.attempts) * 100)
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportTestResults = async (req, res) => {
  try {
    const { format, testId, userId, startDate, endDate, sortBy, template } = req.query;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    }).populate('mcqs codingChallenges');

    if (!test) {
      return res.status(404).json({ 
        error: 'Test not found or you do not have permission to export it' 
      });
    }

    // Build query
    const query = {
      test: testId,
      status: 'completed'
    };

    if (userId) {
      query.user = userId;
    }

    if (startDate) {
      query.submittedAt = { $gte: new Date(startDate) };
    }

    if (endDate) {
      query.submittedAt = { ...query.submittedAt, $lte: new Date(endDate) };
    }

    // Get all submissions for this test
    const submissions = await Submission.find(query)
      .populate('user', 'name email')
      .populate('mcqSubmission')
      .populate('codingSubmission')
      .sort(sortBy || '-submittedAt');

    if (submissions.length === 0) {
      // Handle empty results case
      switch (format) {
        case 'pdf': {
          const doc = new PDFDocument();
          res.header('Content-Type', 'application/pdf');
          res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.pdf`);
          
          doc.pipe(res);

          // Add content to PDF
          doc.fontSize(20).text('Test Results Report', { align: 'center' });
          doc.moveDown();
          doc.fontSize(16).text(`Test: ${test.title}`);
          doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
          doc.moveDown();

          // Test Information
          doc.fontSize(14).text('Test Information');
          doc.fontSize(12)
            .text(`Total Questions: ${test.mcqs?.length || 0} MCQs, ${test.codingChallenges?.length || 0} Coding Challenges`)
            .text(`Duration: ${test.duration} minutes`)
            .text(`Passing Score: ${test.passingMarks}%`)
            .text(`Status: ${test.status}`);
          doc.moveDown();

          // No Results Message
          doc.fontSize(14).text('No Submissions Yet', { align: 'center' });
          doc.fontSize(12).text('There are currently no completed submissions for this test.', { align: 'center' });
          
          doc.end();
          return;
        }
        case 'csv':
          res.header('Content-Type', 'text/csv');
          res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.csv`);
          return res.send('Test Title,Candidate Name,Email,Score,Status,Completion Time\n');
        
        case 'excel': {
          const wb = xlsx.utils.book_new();
          const ws = xlsx.utils.json_to_sheet([{
            testTitle: test.title,
            note: 'No submissions yet'
          }]);
          xlsx.utils.book_append_sheet(wb, ws, 'Test Results');
          res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.xlsx`);
          return res.send(xlsx.write(wb, { type: 'buffer' }));
        }
      }
    }

    const exportData = submissions.map(submission => ({
      testTitle: test.title,
      candidateName: submission.user.name,
      candidateEmail: submission.user.email,
      score: submission.totalScore || 0,
      mcqScore: calculateMCQScore(submission.mcqSubmission, test),
      codingScore: calculateCodingScore(submission.codingSubmission, test),
      status: (submission.totalScore || 0) >= test.passingMarks ? 'PASS' : 'FAIL',
      completedAt: submission.submittedAt?.toLocaleString() || 'N/A',
      duration: formatDuration(submission.duration),
      questionsAttempted: (
        (submission.mcqSubmission?.answers?.length || 0) + 
        (submission.codingSubmission?.answers?.length || 0)
      ),
      totalQuestions: (test.mcqs?.length || 0) + (test.codingChallenges?.length || 0)
    }));

    switch (format) {
      case 'pdf': {
        const doc = new PDFDocument({ margin: 50 });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        // Title and Header
        doc.fontSize(20).text('Test Results Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Test: ${test.title}`);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        // Test Information
        doc.fontSize(14).text('Test Information');
        doc.fontSize(12)
          .text(`Total Questions: ${test.mcqs?.length || 0} MCQs, ${test.codingChallenges?.length || 0} Coding Challenges`)
          .text(`Duration: ${test.duration} minutes`)
          .text(`Passing Score: ${test.passingMarks}%`)
          .text(`Status: ${test.status}`);
        doc.moveDown();

        // Summary Statistics
        doc.fontSize(14).text('Summary');
        doc.fontSize(12)
          .text(`Total Submissions: ${submissions.length}`)
          .text(`Average Score: ${calculateTestAverage(submissions.map(s => s.totalScore))}%`)
          .text(`Pass Rate: ${calculateTestPassRate(submissions, test.passingMarks)}%`)
          .text(`Highest Score: ${Math.max(...submissions.map(s => s.totalScore || 0))}%`)
          .text(`Lowest Score: ${Math.min(...submissions.map(s => s.totalScore || 0))}%`);
        doc.moveDown();

        // Results Table
        doc.fontSize(14).text('Detailed Results');
        doc.moveDown();

        // Table headers
        const columns = [
          { id: 'name', header: 'Candidate', width: 150 },
          { id: 'score', header: 'Score', width: 70 },
          { id: 'status', header: 'Status', width: 70 },
          { id: 'time', header: 'Completion Time', width: 200 }
        ];

        let y = doc.y;
        let currentPage = 1;

        // Draw headers
        columns.forEach((col, i) => {
          let x = 50;
          columns.slice(0, i).forEach(prevCol => x += prevCol.width);
          doc.fontSize(10).text(col.header, x, y);
        });

        y += 20;

        // Draw rows
        exportData.forEach((result, index) => {
          // Check if we need a new page
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
            currentPage++;

            // Redraw headers on new page
            columns.forEach((col, i) => {
              let x = 50;
              columns.slice(0, i).forEach(prevCol => x += prevCol.width);
              doc.fontSize(10).text(col.header, x, y);
            });
            y += 20;
          }

          // Draw row data
          doc.fontSize(10);
          let x = 50;
          
          doc.text(result.candidateName, x, y);
          x += columns[0].width;
          
          doc.text(`${result.score}%`, x, y);
          x += columns[1].width;
          
          doc.text(result.status, x, y);
          x += columns[2].width;
          
          doc.text(result.completedAt, x, y);

          y += 20;
        });

        // Add page numbers
        let pages = currentPage;
        for (let i = 1; i <= pages; i++) {
          doc.switchToPage(i - 1);
          doc.fontSize(8).text(
            `Page ${i} of ${pages}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();
        return;
      }

      case 'csv': {
        const fields = [
          'testTitle',
          'candidateName',
          'candidateEmail',
          'score',
          'mcqScore',
          'codingScore',
          'status',
          'completedAt',
          'duration',
          'questionsAttempted',
          'totalQuestions'
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        res.header('Content-Type', 'text/csv');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
      }

      case 'excel': {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(exportData);
        xlsx.utils.book_append_sheet(wb, ws, 'Test Results');
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`test-results-${test.title}-${new Date().toISOString().split('T')[0]}.xlsx`);
        return res.send(xlsx.write(wb, { type: 'buffer' }));
      }

      default:
        return res.status(400).json({ error: 'Invalid export format' });
    }

  } catch (error) {
    console.error('Error in exportTestResults:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Helper functions with more specific names
const calculateMCQScore = (mcqSubmission, test) => {
  if (!mcqSubmission?.answers) return 0;
  return mcqSubmission.answers.reduce((total, answer) => {
    const question = test.mcqs.find(q => q._id.toString() === answer.questionId.toString());
    if (answer.isCorrect && question) {
      return total + (question.marks || 0);
    }
    return total;
  }, 0);
};

const calculateCodingScore = (codingSubmission, test) => {
  if (!codingSubmission?.answers) return 0;
  return codingSubmission.answers.reduce((total, answer) => {
    const challenge = test.codingChallenges.find(
      c => c._id.toString() === answer.challengeId.toString()
    );
    const maxMarks = challenge?.marks || 0;
    return total + (answer.score * maxMarks / 100); // Convert percentage to actual marks
  }, 0);
};

const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const calculateTestAverage = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + (b || 0), 0) / arr.length);
};

const calculateTestPassRate = (submissions, passingMarks) => {
  if (!submissions || submissions.length === 0) return 0;
  const passed = submissions.filter(s => (s.totalScore || 0) >= (passingMarks || 70)).length;
  return Math.round((passed / submissions.length) * 100);
};

export const getTestAccessSettings = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    res.json(test.accessControl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTestAccessSettings = async (req, res) => {
  try {
    const { testId } = req.params;
    const { accessType, allowedDomains, defaultValidUntil, defaultMaxAttempts } = req.body;

    const test = await Test.findOneAndUpdate(
      {
        _id: testId,
        vendor: req.user._id
      },
      {
        'accessControl.type': accessType,
        'accessControl.allowedDomains': allowedDomains,
        'accessControl.defaultValidUntil': defaultValidUntil,
        'accessControl.defaultMaxAttempts': defaultMaxAttempts
      },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to modify it" 
      });
    }

    res.json(test.accessControl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTestUserAccess = async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const { validUntil, maxAttempts, status } = req.body;

    const test = await Test.findOneAndUpdate(
      {
        _id: testId,
        vendor: req.user._id,
        'accessControl.allowedUsers.userId': userId
      },
      {
        $set: {
          'accessControl.allowedUsers.$.validUntil': validUntil,
          'accessControl.allowedUsers.$.maxAttempts': maxAttempts,
          'accessControl.allowedUsers.$.status': status
        }
      },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ 
        error: "Test or user access not found" 
      });
    }

    const userAccess = test.accessControl.allowedUsers.find(
      user => user.userId.toString() === userId
    );
    res.json(userAccess);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeTestUserAccess = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    const test = await Test.findOneAndUpdate(
      {
        _id: testId,
        vendor: req.user._id
      },
      {
        $pull: {
          'accessControl.allowedUsers': { userId }
        }
      },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to modify it" 
      });
    }

    // Also remove any pending invitations
    await TestInvitation.deleteMany({
      test: testId,
      user: userId
    });

    res.json({ 
      message: 'User access removed successfully',
      userId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .populate('mcqs')
      .populate('codingChallenges')
      .populate('vendor', 'name email company');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Format the response
    const response = {
      id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      timeLimit: test.timeLimit,
      status: test.status,
      category: test.category,
      difficulty: test.difficulty,
      proctoring: test.proctoring,
      instructions: test.instructions,
      vendor: {
        id: test.vendor._id,
        name: test.vendor.name,
        email: test.vendor.email,
        company: test.vendor.company
      },
      questions: {
        mcqs: test.mcqs.map(mcq => ({
          id: mcq._id,
          question: mcq.question,
          marks: mcq.marks,
          type: 'mcq'
        })),
        codingChallenges: test.codingChallenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          marks: challenge.marks,
          type: 'coding'
        }))
      },
      accessControl: test.accessControl,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getVendorTest:', error);
    res.status(500).json({ 
      error: error.message || 'Error retrieving test details'
    });
  }
};

export const debugVendorTests = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const allTests = await Test.find({});
    const vendorTests = await Test.find({ vendor: vendorId });
    
    res.json({
      vendorId: vendorId,
      totalTests: allTests.length,
      vendorTests: vendorTests.length,
      tests: vendorTests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestUsers = async (req, res) => {
  try {
    const { testId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all users who attempted this test
    const submissions = await Submission.find({ test: testId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const users = submissions.map(submission => ({
      userId: submission.user._id,
      name: submission.user.name,
      email: submission.user.email,
      lastAttempt: submission.updatedAt
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get all submissions for this user on this test
    const submissions = await Submission.find({ test: testId, user: userId })
      .populate('user', 'name email')
      .sort('-updatedAt');

    const userSubmissions = submissions.map(submission => ({
      submissionId: submission._id,
      score: submission.totalScore,
      status: submission.status,
      submittedAt: submission.updatedAt,
      details: {
        mcqAnswers: submission.mcqSubmission?.answers || [],
        codingChallenges: submission.codingSubmission?.challenges || []
      }
    }));

    res.json(userSubmissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserTestAnalytics = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    // Get submission details
    const submission = await Submission.findOne({ 
      test: testId,
      user: userId 
    })
    .populate('user', 'name email')
    .populate('test', 'title duration passingMarks');

    if (!submission) {
      return res.status(404).json({ error: "No submission found for this user" });
    }

    // Get MCQ analytics
    const mcqAnalytics = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'mcq'
    }).sort('questionId');

    // Get coding analytics
    const codingAnalytics = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'coding'
    }).sort('challengeId');

    const analytics = {
      overview: {
        candidateName: submission.user.name,
        candidateEmail: submission.user.email,
        testTitle: submission.test.title,
        status: submission.status,
        startTime: submission.startTime,
        endTime: submission.endTime,
        duration: submission.endTime ? 
          (new Date(submission.endTime) - new Date(submission.startTime)) / 1000 : null,
        totalScore: submission.totalScore,
        passingMarks: submission.test.passingMarks,
        result: submission.totalScore >= submission.test.passingMarks ? 'PASS' : 'FAIL'
      },

      mcqPerformance: {
        score: submission.mcqSubmission?.totalScore || 0,
        questionsAttempted: mcqAnalytics.length,
        details: mcqAnalytics.map(q => ({
          questionId: q.questionId,
          timeSpent: q.behavior.timeSpent,
          warnings: q.behavior.warnings,
          tabSwitches: q.behavior.tabSwitches,
          focusLostCount: q.behavior.focusLostCount,
          score: q.performance.score,
          browserEvents: q.behavior.browserEvents
        }))
      },

      codingPerformance: {
        score: submission.codingSubmission?.totalScore || 0,
        challengesAttempted: codingAnalytics.length,
        details: codingAnalytics.map(c => ({
          challengeId: c.challengeId,
          timeSpent: c.behavior.timeSpent,
          executionTime: c.performance.executionTime,
          memoryUsage: c.performance.memoryUsage,
          testCasesPassed: c.performance.testCasesPassed,
          totalTestCases: c.performance.totalTestCases,
          score: c.performance.score,
          submissionAttempts: c.behavior.submissionAttempts,
          errorCount: c.behavior.errorCount,
          hintViews: c.behavior.hintViews
        }))
      },

      behaviorMetrics: {
        totalWarnings: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.warnings || 0), 0
        ),
        totalTabSwitches: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.tabSwitches || 0), 0
        ),
        totalCopyPasteAttempts: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.copyPasteAttempts || 0), 0
        ),
        focusLostEvents: [...mcqAnalytics, ...codingAnalytics].reduce(
          (sum, a) => sum + (a.behavior.focusLostCount || 0), 0
        )
      },

      systemInfo: mcqAnalytics[0]?.metadata || codingAnalytics[0]?.metadata || {}
    };

    res.json(analytics);

  } catch (error) {
    console.error('Error in getUserTestAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for analytics
const calculateArrayAverage = (array) => {
  if (!array || array.length === 0) return 0;
  return array.reduce((sum, value) => sum + value, 0) / array.length;
};

const calculatePassRate = (submissions, passingMarks) => {
  if (!submissions || submissions.length === 0) return 0;
  const passed = submissions.filter(s => (s.totalScore || 0) >= (passingMarks || 70)).length;
  return Math.round((passed / submissions.length) * 100);
};

// Get all MCQ submissions for a user's test
export const getUserMCQSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const mcqSubmissions = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'mcq'
    })
    .sort('questionId')
    .select('-__v');

    res.json(mcqSubmissions);

  } catch (error) {
    console.error('Error in getUserMCQSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific MCQ submission
export const getSpecificMCQSubmission = async (req, res) => {
  try {
    const { testId, userId, mcqId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const mcqSubmission = await TestAnalytics.findOne({
      test: testId,
      user: userId,
      type: 'mcq',
      questionId: mcqId
    }).select('-__v');

    if (!mcqSubmission) {
      return res.status(404).json({ error: "MCQ submission not found" });
    }

    res.json(mcqSubmission);

  } catch (error) {
    console.error('Error in getSpecificMCQSubmission:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all coding submissions for a user's test
export const getUserCodingSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const codingSubmissions = await TestAnalytics.find({
      test: testId,
      user: userId,
      type: 'coding'
    })
    .sort('challengeId')
    .select('-__v');

    res.json(codingSubmissions);

  } catch (error) {
    console.error('Error in getUserCodingSubmissions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific coding submission
export const getSpecificCodingSubmission = async (req, res) => {
  try {
    const { testId, userId, challengeId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you do not have permission to view it" 
      });
    }

    const codingSubmission = await TestAnalytics.findOne({
      test: testId,
      user: userId,
      type: 'coding',
      challengeId: challengeId
    }).select('-__v');

    if (!codingSubmission) {
      return res.status(404).json({ error: "Coding submission not found" });
    }

    res.json(codingSubmission);

  } catch (error) {
    console.error('Error in getSpecificCodingSubmission:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addUsersToTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { users, validUntil, maxAttempts } = req.body;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to modify it" 
      });
    }

    // Create test invitations for each user
    const invitations = await Promise.all(
      users.map(async (user) => {
        const invitation = await TestInvitation.create({
          test: testId,
          email: user.email,
          name: user.name,
          validUntil: new Date(validUntil),
          maxAttempts,
          vendor: req.user._id,
          status: 'pending'
        });
        
        // TODO: Send email notification to user
        
        return invitation;
      })
    );

    // Update test's access control list
    await Test.findByIdAndUpdate(testId, {
      $addToSet: {
        'accessControl.allowedUsers': users.map(user => ({
          email: user.email,
          name: user.name
        }))
      }
    });

    res.status(201).json({
      message: 'Users added successfully',
      invitations
    });

  } catch (error) {
    console.error('Error in addUsersToTest:', error);
    res.status(500).json({ 
      error: 'Failed to add users to test',
      message: error.message 
    });
  }
};

// Get test results for a specific user
export const getUserTestResults = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    const submission = await Submission.findOne({
      test: testId,
      user: userId
    })
    .populate('user', 'name email')
    .populate('test', 'title passingMarks totalMarks mcqs codingChallenges')
    .populate({
      path: 'codingSubmission',
      populate: {
        path: 'answers',
        model: 'CodingSubmission'
      }
    })
    .populate('mcqSubmission');

    if (!submission) {
      return res.status(404).json({ error: "No submission found for this user" });
    }

    // Calculate MCQ details with correct marking scheme
    const mcqDetails = submission.mcqSubmission?.answers?.map(answer => {
      const question = submission.test.mcqs.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      // Initialize scoring variables
      let isCorrect = false;
      let marks = 0;
      const maxMarks = question?.marks || 0;

      if (question.answerType === 'single') {
        // For single answer questions
        if (answer.selectedOptions.length === 1) {
          if (question.correctOptions.length === 1 && 
              answer.selectedOptions[0] === question.correctOptions[0]) {
            // Give full marks if there's only one correct option and user selected it
            marks = maxMarks;
            isCorrect = true;
          } else if (question.correctOptions.includes(answer.selectedOptions[0])) {
            // Give 2 marks if selected option is one of multiple correct options
            marks = 2;
            isCorrect = true;
          }
        }
      } else {
        // For multiple answer questions
        const correctSelectedCount = answer.selectedOptions.filter(opt => 
          question.correctOptions.includes(opt)
        ).length;

        if (correctSelectedCount > 0) {
          if (correctSelectedCount === question.correctOptions.length && 
              answer.selectedOptions.length === question.correctOptions.length) {
            // Give full marks if all correct options are selected
            marks = maxMarks;
            isCorrect = true;
          } else {
            // Give 2 marks if at least one correct option is selected
            marks = 2;
            isCorrect = true;
          }
        }
      }

      return {
        questionId: answer.questionId,
        question: question?.question,
        selectedOptions: answer.selectedOptions,
        correctOptions: question?.correctOptions,
        isCorrect: isCorrect,
        marks: marks,
        maxMarks: maxMarks,
        timeTaken: answer.timeTaken,
        submittedAt: answer.submittedAt,
        answerType: question?.answerType,
        partiallyCorrect: marks > 0 && marks < maxMarks
      };
    }) || [];

    // Calculate coding details with proper population
    const codingDetails = submission.codingSubmission?.answers?.map(answer => {
      const challenge = submission.test.codingChallenges.find(c => 
        c._id.toString() === answer.challengeId.toString()
      );
      
      return {
        challengeId: answer.challengeId,
        title: challenge?.title,
        code: answer.code,
        language: answer.language,
        score: answer.score,
        maxMarks: challenge?.marks || 0,
        earnedMarks: ((answer.score * challenge?.marks) / 100) || 0,
        testCases: answer.testCases?.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.actualOutput,
          passed: tc.passed,
          error: tc.error
        })) || [],
        submittedAt: answer.submittedAt,
        executionTime: answer.executionTime,
        memory: answer.memory,
        status: answer.status
      };
    }) || [];

    // Calculate scores
    const mcqScore = mcqDetails.reduce((total, mcq) => total + (mcq.marks || 0), 0);
    const codingScore = codingDetails.reduce((total, c) => total + c.earnedMarks, 0);

    const totalScore = mcqScore + codingScore;
    const percentage = Math.round((totalScore / submission.test.totalMarks) * 100);

    // Format response
    const result = {
      candidateInfo: {
        candidateId: submission.user._id,
        candidateName: submission.user.name,
        email: submission.user.email
      },
      testInfo: {
        testId: submission.test._id,
        testTitle: submission.test.title,
        totalMarks: submission.test.totalMarks,
        passingMarks: submission.test.passingMarks,
        duration: submission.test.timeLimit
      },
      submissionInfo: {
        submissionId: submission._id,
        startedAt: submission.createdAt,
        submittedAt: submission.submittedAt,
        status: submission.status,
        completionTime: submission.duration,
        warnings: submission.warnings || 0,
        proctoringSessions: submission.proctoringSessions || []
      },
      scores: {
        totalScore: Math.round(totalScore),
        mcqScore: Math.round(mcqScore),
        codingScore: Math.round(codingScore),
        percentage,
        result: totalScore >= submission.test.passingMarks ? 'PASS' : 'FAIL'
      },
      mcqSection: {
        totalQuestions: submission.test.mcqs.length,
        attemptedQuestions: mcqDetails.length,
        correctAnswers: mcqDetails.filter(m => m.isCorrect).length,
        wrongAnswers: mcqDetails.filter(m => !m.isCorrect).length,
        detailedAnswers: mcqDetails
      },
      codingSection: {
        totalChallenges: submission.test.codingChallenges.length,
        attemptedChallenges: codingDetails.length,
        detailedAnswers: codingDetails,
        totalScore: Math.round(codingScore)
      }
    };

    res.json(result);

  } catch (error) {
    console.error('Error in getUserTestResults:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dashboard Metrics Controller
export const getDashboardMetrics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Get submissions within different time periods
    const recentSubmissions = await Submission.find({
      test: { $in: testIds },
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('test');

    const lastWeekSubmissions = await Submission.find({
      test: { $in: testIds },
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate metrics
    const metrics = {
      totalTests: {
        value: tests.length,
        trend: calculateTrend(tests, 'createdAt'),
        subtitle: "Total active assessments",
        details: {
          active: tests.filter(t => t.status === 'published').length,
          draft: tests.filter(t => t.status === 'draft').length,
          archived: tests.filter(t => t.status === 'archived').length,
          byDifficulty: {
            beginner: tests.filter(t => t.difficulty === 'beginner').length,
            intermediate: tests.filter(t => t.difficulty === 'intermediate').length,
            advanced: tests.filter(t => t.difficulty === 'advanced').length
          }
        }
      },
      activeCandidates: {
        value: new Set(recentSubmissions.map(s => s.user.toString())).size,
        trend: calculateUserTrend(recentSubmissions),
        subtitle: "In last 30 days",
        details: {
          total: new Set(recentSubmissions.map(s => s.user.toString())).size,
          thisWeek: new Set(lastWeekSubmissions.map(s => s.user.toString())).size,
          activeTests: new Set(recentSubmissions.map(s => s.test._id.toString())).size,
          averageAttemptsPerUser: calculateAverageAttemptsPerUser(recentSubmissions)
        }
      },
      passRate: {
        value: calculatePassRate(recentSubmissions),
        trend: calculatePassRateTrend(recentSubmissions, lastWeekSubmissions),
        subtitle: "Average success rate",
        details: {
          overall: calculatePassRate(recentSubmissions),
          byDifficulty: calculatePassRateByDifficulty(recentSubmissions),
          byTest: calculatePassRateByTest(recentSubmissions),
          averageScore: calculateAverageScore(recentSubmissions)
        }
      },
      newDiscussions: {
        value: 0, // Placeholder until discussions are implemented
        trend: 0,
        subtitle: "New this week",
        details: {
          total: 0,
          resolved: 0,
          pending: 0,
          byPriority: {
            high: 0,
            medium: 0,
            low: 0
          }
        }
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics',
      message: error.message 
    });
  }
};

// Helper functions for trend calculations
const calculateTrend = (items, dateField) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentItems = items.filter(item => new Date(item[dateField]) >= thirtyDaysAgo);
  return Math.round((recentItems.length / Math.max(items.length, 1)) * 100 - 100);
};

const calculateUserTrend = (submissions) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  
  const recentUsers = new Set(
    submissions
      .filter(s => new Date(s.createdAt) >= fifteenDaysAgo)
      .map(s => s.user.toString())
  ).size;
  
  const previousUsers = new Set(
    submissions
      .filter(s => new Date(s.createdAt) >= thirtyDaysAgo && new Date(s.createdAt) < fifteenDaysAgo)
      .map(s => s.user.toString())
  ).size;
  
  return previousUsers === 0 ? 0 : Math.round((recentUsers - previousUsers) / previousUsers * 100);
};

const calculatePassRateByDifficulty = (submissions) => {
  const difficultyGroups = groupBy(submissions, s => s.test.difficulty);
  return Object.fromEntries(
    Object.entries(difficultyGroups).map(([difficulty, subs]) => [
      difficulty,
      calculateTestPassRate(subs, subs[0]?.test.passingMarks)
    ])
  );  
};

const calculatePassRateByTest = (submissions) => {
  const testGroups = groupBy(submissions, s => s.test._id.toString());
  return Object.fromEntries(
    Object.entries(testGroups).map(([testId, subs]) => [
      testId,
      {
        title: subs[0].test.title,
        passRate: calculateTestPassRate(subs, subs[0]?.test.passingMarks),
        attempts: subs.length
      }
    ])
  );
};

const calculateAverageAttemptsPerUser = (submissions) => {
  const userAttempts = groupBy(submissions, s => s.user.toString());
  const attemptCounts = Object.values(userAttempts).map(subs => subs.length);
  return Math.round(calculateTestAverage(attemptCounts) * 10) / 10;
};

// Utility functions
const groupBy = (array, keyFn) => {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

// Skills Analytics Controller
export const getSkillsAnalytics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    const submissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed'
    });

    const skillsData = {
      problemSolving: calculateSkillScore(submissions, 'problemSolving'),
      codeQuality: calculateSkillScore(submissions, 'codeQuality'),
      performance: calculateSkillScore(submissions, 'performance'),
      security: calculateSkillScore(submissions, 'security'),
      bestPractices: calculateSkillScore(submissions, 'bestPractices')
    };

    res.json(skillsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Time-based Metrics Controller
export const getTimeBasedMetrics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const submissions = await Submission.find({
      vendor: vendorId,
      status: 'completed'
    });

    const timeMetrics = {
      completionTimeDistribution: calculateCompletionTimeDistribution(submissions),
      averageCompletionTime: calculateAverageTestDuration(submissions),
      timeOfDayDistribution: calculateTimeOfDayDistribution(submissions),
      dayOfWeekDistribution: calculateDayOfWeekDistribution(submissions)
    };

    res.json(timeMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Verify invitation belongs to vendor
    const invitation = await TestInvitation.findOne({
      _id: invitationId,
      vendor: req.user._id
    });

    if (!invitation) {
      return res.status(404).json({ 
        error: "Invitation not found or you don't have permission to delete it" 
      });
    }

    // Delete the invitation
    await TestInvitation.findByIdAndDelete(invitationId);

    res.json({ 
      message: 'Invitation deleted successfully',
      invitationId 
    });

  } catch (error) {
    console.error('Error in deleteInvitation:', error);
    res.status(500).json({ 
      error: 'Failed to delete invitation',
      message: error.message 
    });
  }
};

export const deleteVendorTest = async (req, res) => {
  try {
    const { testId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to delete it" 
      });
    }

    // Delete all related data
    await Promise.all([
      // Delete test invitations
      TestInvitation.deleteMany({ test: testId }),
      
      // Delete test submissions
      Submission.deleteMany({ test: testId }),
      
      // Delete test results
      TestResult.deleteMany({ test: testId }),
      
      // Delete the test itself
      Test.findByIdAndDelete(testId)
    ]);

    res.json({ 
      message: 'Test and all related data deleted successfully',
      testId 
    });

  } catch (error) {
    console.error('Error in deleteVendorTest:', error);
    res.status(500).json({ 
      error: 'Failed to delete test',
      message: error.message 
    });
  }
};

export const getAnalyticsOverview = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { period = 'all' } = req.query;
    
    // Calculate date ranges based on period
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
        startDate = new Date(0); // Beginning of time for 'all'
    }

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Get submissions based on period
    const submissions = await Submission.find({
      test: { $in: testIds },
      status: 'completed',
      createdAt: { $gte: startDate }
    })
    .populate('user', 'name email')
    .populate('test', 'title passingMarks');

    // Calculate recent submissions (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const recentSubmissions = submissions.filter(s => s.createdAt >= sevenDaysAgo);

    // Calculate overview metrics
    const overview = {
      period: {
        type: period.toLowerCase(),
        startDate,
        endDate: new Date()
      },
      tests: {
        total: tests.length,
        active: tests.filter(t => t.status === 'published').length,
        draft: tests.filter(t => t.status === 'draft').length,
        archived: tests.filter(t => t.status === 'archived').length
      },
      submissions: {
        total: submissions.length,
        recent: recentSubmissions.length,
        uniqueCandidates: new Set(submissions.map(s => s.user._id.toString())).size,
        averageScore: calculateTestAverage(submissions.map(s => s.totalScore || 0))
      },
      performance: {
        bestPerformingTest: getBestPerformingTest(submissions),
        recentActivity: submissions
          .slice(0, 5)
          .map(s => ({
            candidateName: s.user.name,
            testTitle: s.test.title,
            score: s.totalScore,
            completedAt: s.createdAt
          }))
      },
      trends: {
        daily: calculateDailySubmissionTrends(submissions, period),
        weekly: calculateWeeklySubmissionTrends(submissions, period)
      }
    };

    res.json(overview);
  } catch (error) {
    console.error('Error in getAnalyticsOverview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics overview',
      message: error.message 
    });
  }
};

// Helper functions
const getBestPerformingTest = (submissions) => {
  if (!submissions.length) return null;

  const testPerformance = {};
  
  submissions.forEach(submission => {
    const testId = submission.test._id.toString();
    if (!testPerformance[testId]) {
      testPerformance[testId] = {
        testId,
        title: submission.test.title,
        scores: [],
        attempts: 0
      };
    }
    testPerformance[testId].scores.push(submission.totalScore || 0);
    testPerformance[testId].attempts++;
  });

  const testStats = Object.values(testPerformance).map(test => ({
    ...test,
    averageScore: calculateTestAverage(test.scores)
  }));

  return testStats.sort((a, b) => b.averageScore - a.averageScore)[0] || null;
};

const calculateDailySubmissionTrends = (submissions, period) => {
  const dailyData = {};
  let days;

  switch(period.toLowerCase()) {
    case 'today':
      days = 1;
      break;
    case 'week':
      days = 7;
      break;
    case 'month':
      days = 30;
      break;
    default:
      days = 30;
  }

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }

  submissions.forEach(sub => {
    const dateStr = sub.createdAt.toISOString().split('T')[0];
    if (dailyData[dateStr] !== undefined) {
      dailyData[dateStr]++;
    }
  });

  return Object.entries(dailyData)
    .map(([date, count]) => ({ date, count }))
    .reverse();
};

const calculateWeeklySubmissionTrends = (submissions, period) => {
  const weeklyData = {};
  let weeks;

  switch(period.toLowerCase()) {
    case 'today':
    case 'week':
      weeks = 1;
      break;
    case 'month':
      weeks = 4;
      break;
    default:
      weeks = 4;
  }

  for (let i = 0; i < weeks; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyData[weekKey] = 0;
  }

  submissions.forEach(sub => {
    const submissionDate = new Date(sub.createdAt);
    const weekStart = new Date(submissionDate.setDate(submissionDate.getDate() - submissionDate.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    if (weeklyData[weekKey] !== undefined) {
      weeklyData[weekKey]++;
    }
  });

  return Object.entries(weeklyData)
    .map(([weekStart, count]) => ({ weekStart, count }))
    .reverse();
};

export const getCandidateDetails = async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const vendorId = req.user._id;

    // Verify test belongs to vendor
    const test = await Test.findOne({ _id: testId, vendor: vendorId })
      .populate('mcqs')
      .populate('codingChallenges');
      
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get all submissions for this candidate
    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .populate('user', 'name email')
    .populate('codingSubmission')
    .populate('mcqSubmission')
    .sort({ createdAt: -1 });

    if (!submissions.length) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const latestSubmission = submissions[0];

    const response = {
      candidateInfo: {
        _id: latestSubmission.user._id,
        name: latestSubmission.user.name,
        email: latestSubmission.user.email
      },
      testPerformance: {
        status: latestSubmission.status,
        totalScore: latestSubmission.totalScore || 0,
        attempts: submissions.length,
        lastAttemptDate: latestSubmission.createdAt,
        startTime: latestSubmission.startTime,
        endTime: latestSubmission.endTime
      },
      sections: {
        mcq: {
          score: latestSubmission.mcqSubmission?.totalScore || 0,
          maxScore: test.mcqs.reduce((sum, mcq) => sum + (mcq.marks || 0), 0),
          questionsAttempted: latestSubmission.mcqSubmission?.answers?.length || 0,
          totalQuestions: test.mcqs.length,
          submissions: test.mcqs.map(mcq => {
            const answer = latestSubmission.mcqSubmission?.answers?.find(
              a => a.questionId.toString() === mcq._id.toString()
            );
            
            return {
              questionId: mcq._id,
              question: mcq.question,
              selectedOptions: answer?.selectedOptions || [],
              correctOptions: mcq.correctOptions,
              isCorrect: answer?.isCorrect || false,
              marks: mcq.marks,
              explanation: mcq.explanation,
              options: mcq.options
            };
          })
        },
        coding: {
          score: latestSubmission.codingSubmission?.totalScore || 0,
          maxScore: test.codingChallenges.reduce((sum, challenge) => sum + (challenge.marks || 0), 0),
          challengesAttempted: latestSubmission.codingSubmission?.answers?.length || 0,
          totalChallenges: test.codingChallenges.length,
          submissions: test.codingChallenges.map(challenge => {
            const submission = latestSubmission.codingSubmission?.answers?.find(
              a => a.challengeId.toString() === challenge._id.toString()
            );

            return {
              challengeId: challenge._id,
              title: challenge.title,
              attempts: submission?.attempts || 0,
              bestScore: submission?.score || 0,
              submissions: submission?.submissions?.map(sub => ({
                code: sub.code,
                language: sub.language,
                status: sub.status,
                marks: sub.marks,
                executionTime: sub.executionTime,
                memory: sub.memory,
                testCasesPassed: sub.testCaseResults?.filter(tc => tc.passed).length || 0,
                totalTestCases: sub.testCaseResults?.length || 0,
                submittedAt: sub.submittedAt,
                testCases: sub.testCaseResults?.map(tc => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: tc.actualOutput,
                  passed: tc.passed,
                  executionTime: tc.executionTime,
                  memory: tc.memory,
                  error: tc.error
                }))
              })) || []
            };
          })
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getCandidateDetails:', error);
    res.status(500).json({ 
      error: "Failed to fetch candidate details",
      message: error.message 
    });
  }
};

export const getCandidateSubmissions = async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const vendorId = req.user._id;

    // Verify test belongs to vendor
    const test = await Test.findOne({ _id: testId, vendor: vendorId });
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get all submissions for this candidate
    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .populate('user', 'name email')
    .populate('codingSubmission')
    .populate('mcqSubmission')
    .sort({ createdAt: -1 });

    const response = {
      testTitle: test.title,
      candidateInfo: {
        name: submissions[0]?.user.name,
        email: submissions[0]?.user.email
      },
      totalAttempts: submissions.length,
      submissions: submissions.map(sub => ({
        submissionId: sub._id,
        version: sub.version,
        status: sub.status,
        startTime: sub.startTime,
        endTime: sub.endTime,
        totalScore: sub.totalScore,
        mcq: sub.mcqSubmission ? {
          submissionId: sub.mcqSubmission._id,
          completed: sub.mcqSubmission.completed,
          submittedAt: sub.mcqSubmission.submittedAt,
          totalScore: sub.mcqSubmission.totalScore,
          answers: sub.mcqSubmission.answers?.map(answer => ({
            questionId: answer.questionId,
            selectedOptions: answer.selectedOptions,
            marks: answer.marks,
            isCorrect: answer.isCorrect,
            timeTaken: answer.timeTaken
          }))
        } : null,
        coding: sub.codingSubmission ? {
          submissionId: sub.codingSubmission._id,
          completed: sub.codingSubmission.completed,
          submittedAt: sub.codingSubmission.submittedAt,
          totalScore: sub.codingSubmission.totalScore,
          challenges: sub.codingSubmission.challenges?.map(challenge => ({
            challengeId: challenge.challengeId,
            submissions: challenge.submissions?.map(submission => ({
              code: submission.code,
              language: submission.language,
              status: submission.status,
              marks: submission.marks,
              executionTime: submission.executionTime,
              memory: submission.memory,
              output: submission.output,
              error: submission.error,
              submittedAt: submission.submittedAt,
              testCaseResults: submission.testCaseResults?.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.actualOutput,
                passed: tc.passed,
                executionTime: tc.executionTime,
                memory: tc.memory,
                error: tc.error
              }))
            }))
          }))
        } : null
      })),
      summary: {
        bestScore: Math.max(...submissions.map(s => s.totalScore || 0), 0),
        averageScore: submissions.length 
          ? Math.round(submissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / submissions.length) 
          : 0,
        totalMCQAttempts: submissions.filter(s => s.mcqSubmission?.completed).length,
        totalCodingAttempts: submissions.filter(s => s.codingSubmission?.completed).length,
        lastAttemptDate: submissions[0]?.createdAt
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getCandidateSubmissions:', error);
    res.status(500).json({ 
      error: "Failed to fetch candidate submissions",
      message: error.message 
    });
  }
};

export const getPerformanceMetrics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { period = 'year' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, previousStartDate;

    switch(period.toLowerCase()) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
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
      createdAt: { $gte: previousStartDate, $lt: startDate }
    }).populate('codingSubmission');

    // Calculate skill metrics
    const skillMetrics = {
      problemSolving: calculateSkillMetrics(currentSubmissions, previousSubmissions, 'problemSolving'),
      codeQuality: calculateSkillMetrics(currentSubmissions, previousSubmissions, 'codeQuality'),
      performance: calculateSkillMetrics(currentSubmissions, previousSubmissions, 'performance'),
      security: calculateSkillMetrics(currentSubmissions, previousSubmissions, 'security'),
      bestPractices: calculateSkillMetrics(currentSubmissions, previousSubmissions, 'bestPractices')
    };

    // Calculate overall metrics
    const overallMetrics = {
      totalCandidates: new Set(currentSubmissions.map(s => s.user.toString())).size,
      averageScore: calculateTestAverage(currentSubmissions.map(s => s.totalScore || 0)),
      passRate: calculateTestPassRate(currentSubmissions),
      averageCompletionTime: calculateAverageCompletionTime(currentSubmissions)
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
        monthly: calculateMonthlyTrends(currentSubmissions),
        skillGrowth: calculateSkillGrowthTrends(currentSubmissions, previousSubmissions)
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

// Helper functions
const calculateSkillMetrics = (currentSubmissions, previousSubmissions, skillType) => {
  const currentScores = getSkillScores(currentSubmissions, skillType);
  const previousScores = getSkillScores(previousSubmissions, skillType);

  const currentAvg = calculateTestAverage(currentScores);
  const previousAvg = calculateTestAverage(previousScores);

  return {
    score: currentAvg,
    level: determineSkillLevel(currentAvg),
    candidates: new Set(currentSubmissions.map(s => s.user.toString())).size,
    growth: calculateGrowth(currentAvg, previousAvg)
  };
};

const getSkillScores = (submissions, skillType) => {
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

const determineSkillLevel = (score) => {
  if (score >= 90) return 'Expert';
  if (score >= 80) return 'Advanced';
  if (score >= 70) return 'Intermediate';
  return 'Beginner';
};

const calculateGrowth = (current, previous) => {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const calculateAverageCompletionTime = (submissions) => {
  if (!submissions.length) return 0;
  return Math.round(submissions.reduce((a, b) => a + b.duration, 0) / submissions.length);
};

const calculateMonthlyTrends = (submissions) => {
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
    averageScore: calculateTestAverage(data.scores)
  }));
};

const calculateSkillGrowthTrends = (currentSubmissions, previousSubmissions) => {
  const skills = ['problemSolving', 'codeQuality', 'performance', 'security', 'bestPractices'];
  
  return skills.reduce((acc, skill) => {
    const current = calculateTestAverage(getSkillScores(currentSubmissions, skill));
    const previous = calculateTestAverage(getSkillScores(previousSubmissions, skill));
    
    acc[skill] = {
      current,
      previous,
      growth: calculateGrowth(current, previous)
    };
    
    return acc;
  }, {});
};

export const getRecentActivity = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { limit = 10, page = 1 } = req.query;

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Get recent activities
    const activities = await Submission.find({
      test: { $in: testIds }
    })
    .sort('-updatedAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'name email')
    .populate('test', 'title difficulty category')
    .lean();

    // Format activities
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: 'submission',
      timestamp: activity.updatedAt,
      details: {
        candidate: {
          name: activity.user.name,
          email: activity.user.email
        },
        test: {
          title: activity.test.title,
          difficulty: activity.test.difficulty,
          category: activity.test.category
        },
        performance: {
          score: activity.totalScore,
          status: activity.status,
          duration: activity.duration,
          result: activity.totalScore >= activity.test.passingMarks ? 'PASS' : 'FAIL'
        }
      }
    }));

    // Get total count for pagination
    const totalCount = await Submission.countDocuments({
      test: { $in: testIds }
    });

    res.json({
      activities: formattedActivities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      },
      summary: {
        recentSubmissions: formattedActivities.length,
        uniqueCandidates: new Set(formattedActivities.map(a => a.details.candidate.email)).size,
        passRate: calculateTestPassRate(activities),
        averageScore: calculateTestAverage(activities.map(a => a.totalScore || 0))
      }
    });

  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity',
      message: error.message 
    });
  }
};

export const updateTestStatus = async (req, res) => {
  try {
    const { testId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: draft, published, archived' 
      });
    }

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    });

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to modify it" 
      });
    }

    // Additional validation before publishing
    if (status === 'published') {
      // Check if test has required components
      const hasRequiredComponents = await validateTestComponents(test);
      if (!hasRequiredComponents.valid) {
        return res.status(400).json({ 
          error: 'Test cannot be published',
          details: hasRequiredComponents.errors 
        });
      }
    }

    // Update test status
    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { 
        status,
        updatedAt: new Date(),
        ...(status === 'published' && { publishedAt: new Date() })
      },
      { new: true }
    );

    // If archiving, cancel pending invitations
    if (status === 'archived') {
      await TestInvitation.updateMany(
        { 
          test: testId,
          status: 'pending'
        },
        { 
          status: 'cancelled',
          updatedAt: new Date()
        }
      );
    }

    res.json({
      message: `Test status updated to ${status}`,
      test: {
        id: updatedTest._id,
        title: updatedTest.title,
        status: updatedTest.status,
        updatedAt: updatedTest.updatedAt,
        publishedAt: updatedTest.publishedAt
      }
    });

  } catch (error) {
    console.error('Error in updateTestStatus:', error);
    res.status(500).json({ 
      error: 'Failed to update test status',
      message: error.message 
    });
  }
};

// Helper function to validate test components before publishing
const validateTestComponents = async (test) => {
  const errors = [];

  // Check for basic test configuration
  if (!test.title) errors.push('Test title is required');
  if (!test.duration) errors.push('Test duration is required');
  if (!test.passingMarks) errors.push('Passing marks must be set');

  // Check for questions/challenges
  if (!test.mcqs || test.mcqs.length === 0) {
    errors.push('Test must have at least one MCQ question');
  }

  if (!test.codingChallenges || test.codingChallenges.length === 0) {
    errors.push('Test must have at least one coding challenge');
  }

  // Check MCQ configuration
  test.mcqs?.forEach((mcq, index) => {
    if (!mcq.question) errors.push(`MCQ #${index + 1}: Question text is required`);
    if (!mcq.options || mcq.options.length < 2) {
      errors.push(`MCQ #${index + 1}: At least 2 options are required`);
    }
    if (!mcq.correctOptions || mcq.correctOptions.length === 0) {
      errors.push(`MCQ #${index + 1}: Correct option(s) must be specified`);
    }
  });

  // Check coding challenges configuration
  test.codingChallenges?.forEach((challenge, index) => {
    if (!challenge.title) errors.push(`Challenge #${index + 1}: Title is required`);
    if (!challenge.description) errors.push(`Challenge #${index + 1}: Description is required`);
    if (!challenge.testCases || challenge.testCases.length === 0) {
      errors.push(`Challenge #${index + 1}: At least one test case is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

const calculateDailySubmissions = (submissions) => {
  if (!submissions || submissions.length === 0) return [];
  
  // Group submissions by date
  const dailyGroups = submissions.reduce((acc, sub) => {
    const date = new Date(sub.submittedAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        count: 0,
        totalScore: 0
      };
    }
    acc[date].count++;
    acc[date].totalScore += sub.totalScore || 0;
    return acc;
  }, {});

  // Convert to array and calculate averages
  return Object.values(dailyGroups)
    .map(day => ({
      date: day.date,
      submissions: day.count,
      averageScore: Math.round((day.totalScore / day.count) * 10) / 10
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const calculateAverageTestDuration = (submissions) => {
  if (!submissions || submissions.length === 0) return 0;
  const totalDuration = submissions.reduce((sum, sub) => sum + (sub.duration || 0), 0);
  return Math.round(totalDuration / submissions.length);
};

const calculateTimeOfDayDistribution = (submissions) => {
  if (!submissions || submissions.length === 0) return {};
  
  return submissions.reduce((acc, sub) => {
    const hour = new Date(sub.startTime).getHours();
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    acc[timeSlot] = (acc[timeSlot] || 0) + 1;
    return acc;
  }, {});
};

const calculateDayOfWeekDistribution = (submissions) => {
  if (!submissions || submissions.length === 0) return {};
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return submissions.reduce((acc, sub) => {
    const day = days[new Date(sub.startTime).getDay()];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
};

const calculateCompletionTimeDistribution = (submissions) => {
  if (!submissions || submissions.length === 0) return {};
  
  return submissions.reduce((acc, sub) => {
    const duration = sub.duration || 0;
    const bracket = Math.floor(duration / 300) * 5; // Group in 5-minute brackets
    const key = `${bracket}-${bracket + 5}min`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

// Add these helper functions
const calculatePassRateTrend = (recentSubmissions, lastWeekSubmissions) => {
  const recentPassRate = calculatePassRate(recentSubmissions);
  const lastWeekPassRate = calculatePassRate(lastWeekSubmissions);
  
  if (lastWeekPassRate === 0) return 0;
  return Math.round(((recentPassRate - lastWeekPassRate) / lastWeekPassRate) * 100);
};

export const getCandidatePerformance = async (req, res) => {
  try {
    const { timeframe = 'month', testId } = req.query;
    const vendorId = req.user._id;

    // Get all tests for this vendor if no specific testId
    let testsQuery = { vendor: vendorId };
    if (testId) {
      testsQuery._id = testId;
    }

    const tests = await Test.find(testsQuery);
    
    if (testId && tests.length === 0) {
      return res.status(404).json({
        message: "Test not found or you don't have access to this test"
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Build submission query
    const submissionQuery = {
      test: testId ? testId : { $in: tests.map(t => t._id) },
      submittedAt: { $gte: startDate },
      status: 'completed'
    };

    const submissions = await Submission.find(submissionQuery)
      .populate('user', 'name email')
      .populate('test', 'title passingMarks')
      .sort('-submittedAt');

    const metrics = {
      totalTests: tests.length,
      totalSubmissions: submissions.length,
      uniqueCandidates: new Set(submissions.map(s => s.user._id.toString())).size,
      averageScore: calculateTestAverage(submissions.map(s => s.totalScore)),
      passRate: calculateTestPassRate(submissions, submissions[0]?.test?.passingMarks || 70),
      testDetails: tests.map(test => ({
        testId: test._id,
        title: test.title,
        submissions: submissions.filter(s => s.test._id.toString() === test._id.toString()).length
      })),
      scoreDistribution: {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      },
      recentTrends: []
    };

    // Calculate score distribution
    submissions.forEach(submission => {
      const score = submission.totalScore || 0;
      if (score <= 20) metrics.scoreDistribution['0-20']++;
      else if (score <= 40) metrics.scoreDistribution['21-40']++;
      else if (score <= 60) metrics.scoreDistribution['41-60']++;
      else if (score <= 80) metrics.scoreDistribution['61-80']++;
      else metrics.scoreDistribution['81-100']++;
    });

    // Calculate trends (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    metrics.recentTrends = last7Days.map(date => {
      const daySubmissions = submissions.filter(s => 
        s.submittedAt.toISOString().split('T')[0] === date
      );
      return {
        date,
        submissions: daySubmissions.length,
        averageScore: calculateTestAverage(daySubmissions.map(s => s.totalScore))
      };
    });

    res.json({
      timeframe,
      testId: testId || 'all',
      lastUpdated: new Date(),
      metrics
    });

  } catch (error) {
    console.error('Error in getCandidatePerformance:', error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadUsersFromCSV = async (req, res) => {
  try {
    const { testId } = req.params;
    const { validUntil, maxAttempts } = req.body;

    // Configure multer for file upload
    const upload = multer({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv') {
          return cb(new Error('Only CSV files are allowed'));
        }
        cb(null, true);
      }
    }).single('file');

    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload a CSV file'
        });
      }

      const results = [];
      const duplicates = [];
      let processedCount = 0;

      // Process CSV file
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', async (data) => {
          try {
            // Validate required fields
            if (!data.email || !data.name) {
              throw new Error('Missing required fields');
            }

            // Check if user already has access
            const existingAccess = await Test.findOne({
              _id: testId,
              'accessControl.allowedUsers.email': data.email
            });

            if (existingAccess) {
              duplicates.push({
                email: data.email,
                name: data.name
              });
            } else {
              // Add user to test access
              await Test.findByIdAndUpdate(testId, {
                $push: {
                  'accessControl.allowedUsers': {
                    email: data.email,
                    name: data.name,
                    validUntil: validUntil || undefined,
                    maxAttempts: maxAttempts || undefined,
                    status: 'active'
                  }
                }
              });

              results.push({
                email: data.email,
                name: data.name
              });
            }

            processedCount++;
          } catch (error) {
            console.error(`Error processing row: ${error.message}`);
          }
        })
        .on('end', () => {
          // Clean up temporary file
          fs.unlinkSync(req.file.path);

          // Send response
          res.json({
            message: 'Users processed successfully',
            addedUsers: results,
            duplicateUsers: duplicates,
            summary: {
              totalProcessed: processedCount,
              added: results.length,
              duplicates: duplicates.length
            }
          });
        });
    });
  } catch (error) {
    console.error('Error in uploadUsersFromCSV:', error);
    res.status(500).json({
      error: 'Failed to process CSV file',
      message: error.message
    });
  }
};

export const getTestAccessAndUsers = async (req, res) => {
  try {
    const { testId } = req.params;

    console.log('Fetching test access for testId:', testId);

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    })
    .select('accessControl')  // Only select the fields we need
    .lean();  // Convert to plain JavaScript object

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    console.log('Raw test data:', JSON.stringify(test, null, 2));

    // Ensure accessControl exists
    const accessControl = test.accessControl || {};
    
    // Safely extract and format allowed users
    const allowedUsers = (accessControl.allowedUsers || []).map(user => {
      // Handle both cases where user data might be stored
      const userData = user.userId || user;
      
      return {
        userId: typeof userData._id === 'object' ? userData._id.toString() : userData._id,
        email: userData.email || user.email,
        name: userData.name || user.name,
        validUntil: user.validUntil || accessControl.defaultValidUntil,
        maxAttempts: user.maxAttempts || accessControl.defaultMaxAttempts || 0,
        status: user.status || 'active'
      };
    });

    // Format the response according to the API schema
    const response = {
      type: accessControl.type || 'private',
      accessType: accessControl.type || 'private',
      allowedDomains: accessControl.allowedDomains || [],
      defaultValidUntil: accessControl.defaultValidUntil,
      defaultMaxAttempts: accessControl.defaultMaxAttempts || 0,
      allowedUsers
    };

    console.log('Formatted response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('Error in getTestAccessAndUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getVendorAllCandidates = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get all tests created by this vendor
    const vendorTests = await Test.find({ vendor: vendorId });
    
    if (!vendorTests || vendorTests.length === 0) {
      return res.json({
        totalCandidates: 0,
        candidates: []
      });
    }

    // Get all submissions for vendor's tests
    const submissions = await Submission.find({
      test: { $in: vendorTests.map(test => test._id) }
    })
    .populate('user', 'name email')
    .populate('test', 'title')
    .lean();

    // Group submissions by candidate
    const candidateMap = new Map();
    
    submissions.forEach(submission => {
      if (!submission.user || !submission.test) return; // Skip if user or test is null

      const candidateId = submission.user._id.toString();
      
      if (!candidateMap.has(candidateId)) {
        candidateMap.set(candidateId, {
          _id: candidateId,
          name: submission.user.name,
          email: submission.user.email,
          totalAttempts: 0,
          testsAttempted: new Set(),
          scores: [],
          lastAttempt: null
        });
      }

      const candidate = candidateMap.get(candidateId);
      candidate.totalAttempts++;
      candidate.testsAttempted.add(submission.test.title);
      
      if (submission.totalScore !== undefined) {
        candidate.scores.push(submission.totalScore);
      }

      const submissionDate = new Date(submission.createdAt);
      if (!candidate.lastAttempt || submissionDate > candidate.lastAttempt) {
        candidate.lastAttempt = submissionDate;
      }
    });

    // Convert candidate data for response
    const candidates = Array.from(candidateMap.values()).map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      totalAttempts: candidate.totalAttempts,
      testsAttempted: Array.from(candidate.testsAttempted),
      lastAttempt: candidate.lastAttempt,
      averageScore: candidate.scores.length > 0 
        ? (candidate.scores.reduce((a, b) => a + b, 0) / candidate.scores.length).toFixed(2)
        : null
    }));

    res.json({
      totalCandidates: candidates.length,
      candidates: candidates
    });

  } catch (error) {
    console.error('Error in getVendorAllCandidates:', error);
    res.status(500).json({
      error: 'Failed to fetch candidates',
      message: error.message
    });
  }
};

// Helper function to calculate progress and score
const calculateProgress = (submission) => {
  if (!submission) return { percentage: 0, score: 0, timeSpent: 0 };

  // Helper function to format time
  const formatTimeSpent = (minutes) => {
    if (minutes < 1) return "Less than a minute";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? 
      `${hours}h ${remainingMinutes}m` : 
      `${hours}h`;
  };

  if (submission.status === 'completed') {
    // Calculate MCQ score
    const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
      const isCorrect = Array.isArray(answer.correctOptions) && 
        Array.isArray(answer.selectedOptions) &&
        answer.correctOptions.length === answer.selectedOptions.length &&
        answer.correctOptions.every((opt, idx) => 
          opt === answer.selectedOptions[idx]
        );
      return total + (isCorrect ? (answer.marks || 0) : 0);
    }, 0) || 0;

    // Calculate coding score
    const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
      const maxMarks = challenge.marks || 0;
      const bestSubmission = challenge.submissions?.reduce((best, current) => {
        return (current.marks > best.marks) ? current : best;
      }, { marks: 0 });
      return total + (bestSubmission.marks * maxMarks / 100);
    }, 0) || 0;

    // Calculate total score percentage
    const totalPossibleScore = submission.test.totalMarks || 100;
    const scorePercentage = ((mcqScore + codingScore) / totalPossibleScore) * 100;

    // Calculate time spent
    let timeSpentMinutes;
    if (submission.duration) {
      timeSpentMinutes = Math.round(submission.duration / 60);
    } else if (submission.endTime && submission.startTime) {
      timeSpentMinutes = Math.round(
        (new Date(submission.endTime) - new Date(submission.startTime)) / (1000 * 60)
      );
    } else {
      timeSpentMinutes = 0;
    }

    return {
      percentage: 100,
      score: Math.round(scorePercentage),
      timeSpent: timeSpentMinutes,
      timeSpentFormatted: formatTimeSpent(timeSpentMinutes),
      scoreDetails: {
        mcqScore,
        codingScore,
        totalPossibleScore
      }
    };
  }

  // For in-progress submissions
  const timeSpentMinutes = submission.startTime ? 
    Math.round((new Date() - new Date(submission.startTime)) / (1000 * 60)) : 0;

  return {
    percentage: 0,
    score: 0,
    timeSpent: timeSpentMinutes,
    timeSpentFormatted: formatTimeSpent(timeSpentMinutes),
    scoreDetails: {
      mcqScore: 0,
      codingScore: 0,
      totalPossibleScore: submission.test.totalMarks || 100
    }
  };
};

// Helper function to check MCQ answers
const checkMCQAnswer = (correctOptions, selectedOptions) => {
  return Array.isArray(correctOptions) && 
    Array.isArray(selectedOptions) &&
    correctOptions.length === selectedOptions.length &&
    [...correctOptions].sort().every((opt, idx) => 
      opt === [...selectedOptions].sort()[idx]
    );
};

// Calculate scores for candidate metrics
const calculateScores = (submission) => {
  if (!submission || !submission.test) return { mcqScore: 0, codingScore: 0, totalScore: 0 };

  // Calculate MCQ scores
  const mcqScore = submission.mcqSubmission?.answers?.reduce((total, answer) => {
    if (!answer || !answer.questionId) return total;

    const question = submission.test.mcqs?.find(q => 
      q?._id?.toString() === answer.questionId?.toString()
    );
    
    const isCorrect = checkMCQAnswer(
      question?.correctOptions || [],
      answer.selectedOptions || []
    );

    return total + (isCorrect ? (question?.marks || 0) : 0);
  }, 0) || 0;

  // Calculate coding scores
  const codingScore = submission.codingSubmission?.challenges?.reduce((total, challenge) => {
    if (!challenge || !challenge.challengeId) return total;

    const maxMarks = submission.test.codingChallenges?.find(
      c => c?._id?.toString() === challenge.challengeId?.toString()
    )?.marks || 0;
    
    const bestSubmission = challenge.submissions?.reduce((best, current) => {
      return (current.marks > best.marks) ? current : best;
    }, { marks: 0 });

    return total + (bestSubmission.marks * maxMarks / 100);
  }, 0) || 0;

  return {
    mcqScore,
    codingScore,
    totalScore: mcqScore + codingScore
  };
};

export const getCandidateMetrics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { status, search, timeframe } = req.query;

    // Get all tests by this vendor
    const tests = await Test.find({ vendor: vendorId });
    
    if (!tests || tests.length === 0) {
      return res.json({
        metrics: {
          activeTestTakers: 0,
          totalCandidates: 0,
          statusBreakdown: { completed: 0, inProgress: 0, pending: 0 }
        },
        candidates: []
      });
    }

    // Get all submissions for these tests
    const submissions = await Submission.find({
      test: { $in: tests.map(test => test._id) }
    })
    .populate({
      path: 'test',
      populate: [
        { path: 'mcqs' },
        { path: 'codingChallenges' }
      ]
    })
    .populate('user', 'name email')
    .lean();

    if (!submissions || submissions.length === 0) {
      return res.json({
        metrics: {
          activeTestTakers: 0,
          totalCandidates: 0,
          statusBreakdown: { completed: 0, inProgress: 0, pending: 0 }
        },
        candidates: []
      });
    }

    const candidatesData = submissions.map(submission => {
      // Add null checks for submission and user
      if (!submission?.user?._id || !submission?.test) {
        return null;  // Skip this submission if user or test is missing
      }

      const scores = calculateScores(submission);
      
      return {
        candidateId: submission.user._id,
        testId: submission.test._id,
        candidateName: submission.user.name || 'Unknown',
        email: submission.user.email || 'No email',
        registeredDate: submission.createdAt,
        testType: submission.test.title || 'Unknown Test',
        testPeriod: {
          start: submission.startTime || null,
          end: submission.endTime || null
        },
        progress: 100,
        score: scores.totalScore,
        timeSpent: submission.duration ? Math.round(submission.duration / 60) : 0,
        timeSpentFormatted: formatTimeSpent(submission.duration ? Math.round(submission.duration / 60) : 0),
        status: submission.status || 'unknown',
        lastActivity: {
          time: submission.updatedAt || submission.createdAt || new Date(),
          type: 'Last activity'
        },
        scoreDetails: {
          mcqScore: scores.mcqScore,
          codingScore: scores.codingScore,
          totalPossibleScore: submission.test.totalMarks || 0
        },
        user: {
          email: submission.user.email || 'No email',
          name: submission.user.name || 'Unknown'
        }
      };
    }).filter(Boolean); // Remove any null entries

    // Calculate metrics
    const metrics = {
      activeTestTakers: candidatesData.filter(c => 
        new Date(c.lastActivity.time) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      totalCandidates: new Set(candidatesData.map(c => c.candidateId)).size,
      statusBreakdown: {
        completed: candidatesData.filter(c => c.status === 'completed').length,
        inProgress: candidatesData.filter(c => c.status === 'in_progress').length,
        pending: candidatesData.filter(c => c.status === 'pending').length
      }
    };

    res.json({ metrics, candidates: candidatesData });

  } catch (error) {
    console.error('Error in getCandidateMetrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch candidate metrics',
      details: error.message 
    });
  }
};

export const generateCustomReport = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      reportName,
      dateRange,
      startDate,
      endDate,
      metrics,
      format,
      includeCharts = true
    } = req.body;

    // Calculate date range
    let dateFilter = {};
    switch (dateRange) {
      case 'last7days':
        dateFilter = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'last30days':
        dateFilter = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'last90days':
        dateFilter = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case 'custom':
        dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
        break;
    }

    // Get all tests for this vendor
    const tests = await Test.find({ vendor: vendorId });
    const testIds = tests.map(test => test._id);

    // Gather data based on selected metrics
    const reportData = {
      reportName,
      generatedAt: new Date(),
      metrics: {}
    };

    // Calculate metrics based on selection
    if (metrics.includes('completionRate')) {
      const completionStats = await TestResult.aggregate([
        { $match: { test: { $in: testIds }, completedAt: dateFilter } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { 
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }}
      ]);
      reportData.metrics.completionRate = completionStats[0] || { total: 0, completed: 0 };
    }

    // Generate report file
    let reportUrl;
    switch (format.toLowerCase()) {
      case 'pdf':
        reportUrl = await generatePDF(reportData, includeCharts);
        break;
      case 'excel':
        reportUrl = await generateExcel(reportData);
        break;
      case 'csv':
        reportUrl = await generateCSV(reportData);
        break;
    }

    // Save report metadata
    const report = await Report.create({
      vendor: vendorId,
      name: reportName,
      format: format.toLowerCase(),
      url: reportUrl,
      metrics,
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined
    });

    res.json({
      message: 'Report generated successfully',
      report: {
        id: report._id,
        name: report.name,
        url: report.url,
        format: report.format,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReportsList = async (req, res) => {
  try {
    const reports = await Report.find({ vendor: req.user._id })
      .sort({ createdAt: -1 })
      .select('name format url createdAt metrics dateRange');

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getVendorCandidates = async (req, res) => {
  try {
    // Get all tests for this vendor
    const vendorTests = await Test.find({ vendor: req.user._id });
    const testIds = vendorTests.map(test => test._id);

    // Get all submissions for vendor's tests
    const submissions = await Submission.find({
      test: { $in: testIds }
    })
    .populate('user', 'name email')
    .populate('test', 'title totalMarks');

    // Group submissions by user
    const candidateMap = submissions.reduce((acc, submission) => {
      const userId = submission.user._id.toString();
      
      if (!acc[userId]) {
        acc[userId] = {
          _id: submission.user._id,
          name: submission.user.name,
          email: submission.user.email,
          totalAttempts: 0,
          testsAttempted: new Set(),
          lastAttempt: null,
          totalScore: 0,
          completedAttempts: 0
        };
      }

      // Update candidate stats
      acc[userId].totalAttempts++;
      acc[userId].testsAttempted.add(submission.test.title);
      
      // Update last attempt if this is more recent
      const submissionDate = new Date(submission.updatedAt);
      if (!acc[userId].lastAttempt || submissionDate > new Date(acc[userId].lastAttempt)) {
        acc[userId].lastAttempt = submission.updatedAt;
      }

      // Only count completed submissions for average score
      if (submission.status === 'completed') {
        acc[userId].totalScore += submission.totalScore || 0;
        acc[userId].completedAttempts++;
      }

      return acc;
    }, {});

    // Format candidates array
    const candidates = Object.values(candidateMap).map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      totalAttempts: candidate.totalAttempts,
      testsAttempted: Array.from(candidate.testsAttempted),
      lastAttempt: candidate.lastAttempt,
      averageScore: candidate.completedAttempts > 0
        ? (candidate.totalScore / candidate.completedAttempts).toFixed(2)
        : "0.00"
    }));

    res.json({
      totalCandidates: candidates.length,
      candidates: candidates
    });

  } catch (error) {
    console.error('Error in getVendorCandidates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch candidates',
      message: error.message 
    });
  }
};

export const getCandidateTestDetails = async (req, res) => {
  try {
    const { testId, userId } = req.params;

    // Verify test belongs to vendor
    const test = await Test.findOne({
      _id: testId,
      vendor: req.user._id
    }).populate('mcqs codingChallenges');

    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view it" 
      });
    }

    // Get user details
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Get all submissions for this user and test
    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .populate('mcqSubmission')
    .populate('codingSubmission')
    .sort('-createdAt');

    if (!submissions.length) {
      return res.status(404).json({ error: "No submissions found for this candidate" });
    }

    // Get the latest submission
    const latestSubmission = submissions[0];

    // Calculate scores from the latest submission
    const mcqScore = latestSubmission.mcqSubmission?.answers?.reduce((total, answer) => {
      const question = test.mcqs.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      const isCorrect = Array.isArray(question?.correctOptions) && 
        Array.isArray(answer.selectedOptions) &&
        question.correctOptions.length === answer.selectedOptions.length &&
        [...question.correctOptions].sort().every((opt, idx) => 
          opt === [...answer.selectedOptions].sort()[idx]
        );
      return total + (isCorrect ? (question?.marks || 0) : 0);
    }, 0) || 0;

    const codingScore = latestSubmission.codingSubmission?.challenges?.reduce((total, challenge) => {
      const maxMarks = test.codingChallenges.find(
        c => c._id.toString() === challenge.challengeId.toString()
      )?.marks || 0;
      const bestSubmission = challenge.submissions?.reduce((best, current) => {
        return (current.marks > best.marks) ? current : best;
      }, { marks: 0 });
      return total + (bestSubmission.marks * maxMarks / 100);
    }, 0) || 0;

    // Format detailed response
    const response = {
      candidateInfo: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      testPerformance: {
        status: latestSubmission.status,
        totalScore: mcqScore + codingScore,
        attempts: submissions.length,
        lastAttemptDate: latestSubmission.updatedAt,
        startTime: latestSubmission.startTime,
        endTime: latestSubmission.endTime,
        duration: latestSubmission.duration
      },
      sections: {
        mcq: {
          score: mcqScore,
          maxScore: test.mcqs.reduce((total, mcq) => total + (mcq.marks || 0), 0),
          questionsAttempted: latestSubmission.mcqSubmission?.answers?.length || 0,
          totalQuestions: test.mcqs.length,
          submissions: latestSubmission.mcqSubmission?.answers?.map(answer => {
            const question = test.mcqs.find(q => 
              q._id.toString() === answer.questionId.toString()
            );
            return {
              questionId: answer.questionId,
              question: question?.question,
              selectedOptions: answer.selectedOptions,
              correctOptions: question?.correctOptions,
              isCorrect: Array.isArray(question?.correctOptions) && 
                Array.isArray(answer.selectedOptions) &&
                question.correctOptions.length === answer.selectedOptions.length &&
                [...question.correctOptions].sort().every((opt, idx) => 
                  opt === [...answer.selectedOptions].sort()[idx]
                ),
              marks: question?.marks || 0,
              submittedAt: answer.submittedAt
            };
          }) || []
        },
        coding: {
          score: codingScore,
          maxScore: test.codingChallenges.reduce((total, challenge) => total + (challenge.marks || 0), 0),
          challengesAttempted: latestSubmission.codingSubmission?.challenges?.length || 0,
          totalChallenges: test.codingChallenges.length,
          submissions: latestSubmission.codingSubmission?.challenges?.map(challenge => {
            const challengeDetails = test.codingChallenges.find(c => 
              c._id.toString() === challenge.challengeId.toString()
            );
            return {
              challengeId: challenge.challengeId,
              title: challengeDetails?.title,
              attempts: challenge.submissions?.length || 0,
              bestScore: Math.max(...(challenge.submissions?.map(s => s.marks) || [0])),
              submissions: challenge.submissions?.map(sub => ({
                code: sub.code,
                language: sub.language,
                status: sub.status,
                marks: sub.marks,
                executionTime: sub.executionTime,
                memory: sub.memory,
                testCasesPassed: sub.testCaseResults?.filter(tc => tc.passed).length || 0,
                totalTestCases: sub.testCaseResults?.length || 0,
                submittedAt: sub.submittedAt
              }))
            };
          }) || []
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getCandidateTestDetails:', error);
    res.status(500).json({ 
      error: "Failed to fetch candidate details",
      details: error.message 
    });
  }
};