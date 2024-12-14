import Test from "../models/test.model.js";
import TestSession from "../models/testSession.model.js";
import TestResult from "../models/testResult.model.js";
import TestInvitation from "../models/testInvitation.model.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import TestRegistration from "../models/testRegistration.model.js";
import Submission from '../models/submission.model.js';
import { LANGUAGE_IDS, LANGUAGE_NAMES } from '../constants/languages.js';
import User from '../models/user.model.js';
import TestAccess from '../models/testAccess.model.js';
import SystemSettings from '../models/systemSettings.model.js';
import Vendor from '../models/vendor.model.js';

// Add these status enums at the top with existing imports
const TEST_STATUS = {
  NOT_STARTED: 'not_started',
  STARTED: 'started',
  IN_MCQ: 'in_mcq',
  IN_CODING: 'in_coding',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

const SESSION_STATUS = {
  CREATED: 'created',
  STARTED: 'started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
};

export const createTest = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      duration, 
      proctoring, 
      instructions,
      type = 'assessment',
      category,
      difficulty,
      accessControl = { type: 'private' },
      mcqs = [],
      codingChallenges = []
    } = req.body;

    // Validate test type
    if (!['assessment', 'coding_challenge'].includes(type)) {
      return res.status(400).json({
        error: "Test type must be either 'assessment' or 'coding_challenge'"
      });
    }

    // Validate MCQs if provided
    for (const mcq of mcqs) {
      if (!mcq.question || !mcq.options || !mcq.correctOptions || !mcq.marks) {
        return res.status(400).json({
          error: "Each MCQ must have question, options, correctOptions, and marks"
        });
      }
    }

    // Validate coding challenges without language ID conversion
    for (const challenge of codingChallenges) {
      // Basic validation
      if (!challenge.title || !challenge.description || !challenge.problemStatement || 
          !challenge.constraints || !challenge.allowedLanguages || 
          !challenge.languageImplementations || !challenge.marks || 
          !challenge.timeLimit || !challenge.memoryLimit || !challenge.difficulty) {
        return res.status(400).json({
          error: "Missing required fields in coding challenge"
        });
      }

      // Validate allowed languages array exists
      if (!Array.isArray(challenge.allowedLanguages) || challenge.allowedLanguages.length === 0) {
        return res.status(400).json({
          error: "At least one programming language must be allowed"
        });
      }

      // Validate language implementations
      for (const [lang, impl] of Object.entries(challenge.languageImplementations)) {
        if (!impl.visibleCode || !impl.invisibleCode) {
          return res.status(400).json({
            error: `Both visibleCode and invisibleCode are required for language: ${lang}`
          });
        }
      }

      // Validate test cases if provided
      if (challenge.testCases) {
        for (const testCase of challenge.testCases) {
          if (!testCase.input || !testCase.output) {
            return res.status(400).json({
              error: "Each test case must have input and output"
            });
          }
        }
      }
    }

    // Calculate total marks
    const totalMcqMarks = mcqs.reduce((sum, mcq) => sum + mcq.marks, 0);
    const totalCodingMarks = codingChallenges.reduce((sum, challenge) => sum + challenge.marks, 0);
    const totalMarks = totalMcqMarks + totalCodingMarks;

    // Create test
    const test = await Test.create({
      title,
      description,
      vendor: req.user._id,
      duration,
      proctoring,
      instructions,
      type,
      category,
      difficulty,
      status: 'draft',
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      timeLimit: duration,
      mcqs,
      codingChallenges,
      accessControl,
      uuid: uuidv4(),
      sharingToken: crypto.randomBytes(32).toString('hex'),
      testStatus: TEST_STATUS.NOT_STARTED,
      sessionStatus: SESSION_STATUS.CREATED
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: "Failed to create test"
    });
  }
};

export const getTests = async (req, res) => {
  try {
    let query = { status: 'published' };
    
    // If user is authenticated
    if (req.user) {
      if (req.user.role === 'user') {
        query = {
          status: 'published',
          $or: [
            { 'accessControl.type': 'public' },
            { 'accessControl.type': 'coding_challenge' }
          ]
        };
      }
      // If user role is 'user', show:
      // 1. Published public tests
      // 2. Published practice tests
      else if (req.user.role === 'user') {
        query = {
          status: 'published',
          $or: [
            { 'accessControl.type': 'public' },
            { 'accessControl.type': 'coding_challenge' }
          ]
        };
      }
      // If vendor, show only their tests
      else if (req.user.role === 'vendor') {
        query = { vendor: req.user._id };
      }
      // Admin can see all tests (no additional query needed)
    } else {
      // For non-authenticated users, only show public tests
      query = {
        status: 'published',
        'accessControl.type': 'public'
      };
    }
    
    const tests = await Test.find(query)
      .populate('vendor', 'name email')
      .select('-mcqs.correctOptions -codingChallenges.testCases')
      .sort({ createdAt: -1 });

    // Transform the response
    const transformedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      type: test.type,
      status: test.status,
      category: test.category,
      difficulty: test.difficulty,
      accessControl: {
        type: test.accessControl?.type || 'private',
        userLimit: test.accessControl?.userLimit || 0,
        allowedUsers: test.accessControl?.allowedUsers?.map(user => ({
          email: user.email,
          name: user.name,
          addedAt: user.addedAt
        })) || [],
        allowedEmails: test.accessControl?.allowedEmails || [],
        currentUserCount: test.accessControl?.allowedUsers?.length || 0
      },
      vendor: {
        name: test.vendor?.name,
        email: test.vendor?.email
      },
      mcqs: test.mcqs?.map(mcq => ({
        question: mcq.question,
        options: mcq.options,
        marks: mcq.marks,
        difficulty: mcq.difficulty,
        answerType: mcq.answerType
      })) || [],
      codingChallenges: test.codingChallenges?.map(challenge => ({
        title: challenge.title,
        description: challenge.description,
        constraints: challenge.constraints,
        marks: challenge.marks,
        timeLimit: challenge.timeLimit,
        memoryLimit: challenge.memoryLimit,
        difficulty: challenge.difficulty,
        allowedLanguages: challenge.allowedLanguages,
        languageImplementations: challenge.languageImplementations
      })) || [],
      questionCounts: {
        mcq: test.mcqs?.length || 0,
        coding: test.codingChallenges?.length || 0
      },
      instructions: test.instructions,
      proctoring: test.proctoring,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      testStatus: test.testStatus,
      sessionStatus: test.sessionStatus
    }));

    res.json(transformedTests);
  } catch (error) {
    console.error('Error in getTests:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('vendor', 'name email')
      .lean();
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && 
        test.vendor._id.toString() !== req.user._id.toString() && 
        test.status === 'draft') {
      return res.status(403).json({ error: "Not authorized to access this test" });
    }

    // Transform the response
    const transformedTest = {
      ...test,
      accessControl: {
        type: test.accessControl?.type || 'private',
        userLimit: test.accessControl?.userLimit || 0,
        allowedUsers: test.accessControl?.allowedUsers?.map(user => ({
          email: user.email,
          name: user.name,
          addedAt: user.addedAt
        })) || [],
        allowedEmails: test.accessControl?.allowedEmails || [],
        currentUserCount: test.accessControl?.allowedUsers?.length || 0
      },
      codingChallenges: test.codingChallenges?.map(challenge => ({
        ...challenge,
        allowedLanguages: challenge.allowedLanguages?.map(langId => 
          LANGUAGE_NAMES[langId] || langId
        ),
        languageImplementations: Object.entries(challenge.languageImplementations || {}).reduce((acc, [langId, impl]) => {
          const langName = LANGUAGE_NAMES[langId] || langId;
          acc[langName] = impl;
          return acc;
        }, {})
      }))
    };

    res.json(transformedTest);
  } catch (error) {
    // Improve error handling
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid test ID format" });
    }
    console.error('Error in getTestById:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update test
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this test" });
    }

    const {
      title,
      description,
      duration,
      proctoring,
      instructions,
      status,
      mcqs,
      codingChallenges,
      timeLimit,
      totalMarks,
      testStatus,
      sessionStatus,
    } = req.body;

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (proctoring !== undefined) updateData.proctoring = proctoring;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (status !== undefined) updateData.status = status;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
    if (testStatus !== undefined) updateData.testStatus = testStatus;
    if (sessionStatus !== undefined) updateData.sessionStatus = sessionStatus;

    // Validate and update MCQs
    if (mcqs !== undefined) {
      for (const mcq of mcqs) {
        if (!mcq.question || !mcq.options || !mcq.correctOptions || 
            !mcq.answerType || !mcq.marks || !mcq.difficulty) {
          return res.status(400).json({
            error: "Invalid MCQ format"
          });
        }
      }
      updateData.mcqs = mcqs;
    }

    // Validate and update coding challenges
    if (codingChallenges !== undefined) {
      for (const challenge of codingChallenges) {
        if (!challenge.title || !challenge.description || !challenge.problemStatement || 
            !challenge.constraints || !challenge.allowedLanguages || 
            !challenge.languageImplementations || !challenge.marks || 
            !challenge.timeLimit || !challenge.memoryLimit || !challenge.difficulty) {
          return res.status(400).json({
            error: "Invalid coding challenge format"
          });
        }

        // Validate language implementations
        for (const [lang, impl] of Object.entries(challenge.languageImplementations)) {
          if (!impl.visibleCode || !impl.invisibleCode) {
            return res.status(400).json({
              error: `Both visibleCode and invisibleCode are required for language: ${lang}`
            });
          }
        }
      }
      updateData.codingChallenges = codingChallenges;
    }

    // Update test and recalculate total marks if necessary
    if (mcqs || codingChallenges) {
      const totalMcqMarks = (mcqs || test.mcqs).reduce((sum, mcq) => sum + mcq.marks, 0);
      const totalCodingMarks = (codingChallenges || test.codingChallenges)
        .reduce((sum, challenge) => sum + challenge.marks, 0);
      updateData.totalMarks = totalMcqMarks + totalCodingMarks;
      updateData.passingMarks = Math.ceil(updateData.totalMarks * 0.4);
    }

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete test
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check if user owns this test
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this test" });
    }

    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const shareTest = async (req, res) => {
  try {
    const { emails, validUntil, maxAttempts } = req.body;
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Generate invitations for each email
    const invitations = await Promise.all(
      emails.map(async (email) => {
        const token = crypto.randomBytes(32).toString('hex');
        const invitation = await TestInvitation.create({
          test: test._id,
          email,
          token,
          validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          maxAttempts: maxAttempts || 1,
          testStatus: TEST_STATUS.NOT_STARTED,
          sessionStatus: SESSION_STATUS.CREATED
        });

        // Generate individual shareable link
        invitation.shareableLink = `${process.env.FRONTEND_URL}/test/take/${test._id}?invitation=${token}`;
        return invitation;
      })
    );

    // Send emails with the shareable links
    // TODO: Implement email sending logic

    res.json({
      message: "Test shared successfully",
      invitations: invitations.map(inv => ({
        email: inv.email,
        shareableLink: inv.shareableLink,
        validUntil: inv.validUntil,
        maxAttempts: inv.maxAttempts,
        testStatus: inv.testStatus,
        sessionStatus: inv.sessionStatus
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add single or multiple MCQs to a test
export const addMCQs = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Handle both single MCQ and array of MCQs
    const mcqsToAdd = Array.isArray(req.body) ? req.body : [req.body];

    // Validate MCQs
    for (const mcq of mcqsToAdd) {
      if (!mcq.question || !mcq.options || !mcq.correctOptions || 
          !mcq.answerType || !mcq.marks || !mcq.difficulty) {
        return res.status(400).json({
          error: "Each MCQ must have question, options, correctOptions, answerType, marks, and difficulty"
        });
      }

      // Validate single answer type
      if (mcq.answerType === 'single' && mcq.correctOptions.length !== 1) {
        return res.status(400).json({
          error: "Single answer questions must have exactly one correct option"
        });
      }
    }

    // Add MCQs to test
    test.mcqs.push(...mcqsToAdd);
    
    // Recalculate total marks
    test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                      (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
    test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    
    await test.save();
    
    res.status(201).json({
      message: "MCQs added successfully",
      
      test,
      addedMCQs: mcqsToAdd
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update MCQ
export const updateMCQ = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const mcqIndex = test.mcqs.findIndex(
      mcq => mcq._id.toString() === req.params.mcqId
    );

    if (mcqIndex === -1) {
      return res.status(404).json({ error: "MCQ not found" });
    }

    // Validate the updated MCQ data
    const updatedMCQ = { ...test.mcqs[mcqIndex].toObject(), ...req.body };
    
    if (updatedMCQ.answerType === 'single' && updatedMCQ.correctOptions?.length !== 1) {
      return res.status(400).json({
        error: "Single answer questions must have exactly one correct option"
      });
    }

    // Update only the provided fields
    test.mcqs[mcqIndex] = updatedMCQ;
    
    // Recalculate total marks if marks were updated
    if (req.body.marks) {
      test.totalMarks = test.mcqs.reduce((sum, mcq) => sum + mcq.marks, 0) +
                       (test.codingChallenges?.reduce((sum, ch) => sum + ch.marks, 0) || 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();
    
    res.json({
      message: "MCQ updated successfully",
      updatedMCQ: test.mcqs[mcqIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete MCQ
export const deleteMCQ = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    test.mcqs = test.mcqs.filter(
      mcq => mcq._id.toString() !== req.params.mcqId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add single or multiple coding challenges to a test
export const addCodingChallenges = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Handle both single challenge and array of challenges
    const challengesToAdd = Array.isArray(req.body) ? req.body : [req.body];

    // Validate coding challenges
    for (const challenge of challengesToAdd) {
      const missingFields = [];
      const requiredFields = [
        'title', 'description', 'constraints', 'allowedLanguages',
        'marks', 'timeLimit', 'memoryLimit', 'difficulty'
      ];

      for (const field of requiredFields) {
        if (!challenge[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          missingFields,
          receivedChallenge: challenge
        });
      }

      // Validate allowed languages array
      if (!Array.isArray(challenge.allowedLanguages) || challenge.allowedLanguages.length === 0) {
        return res.status(400).json({
          error: "At least one programming language must be allowed",
          receivedLanguages: challenge.allowedLanguages
        });
      }

      // Validate difficulty enum
      if (!['easy', 'medium', 'hard'].includes(challenge.difficulty)) {
        return res.status(400).json({
          error: "Invalid difficulty level. Must be 'easy', 'medium', or 'hard'",
          receivedDifficulty: challenge.difficulty
        });
      }

      // Validate numeric fields
      if (typeof challenge.marks !== 'number' || challenge.marks <= 0) {
        return res.status(400).json({
          error: "Marks must be a positive number",
          receivedMarks: challenge.marks
        });
      }

      if (typeof challenge.timeLimit !== 'number' || challenge.timeLimit <= 0) {
        return res.status(400).json({
          error: "Time limit must be a positive number",
          receivedTimeLimit: challenge.timeLimit
        });
      }

      if (typeof challenge.memoryLimit !== 'number' || challenge.memoryLimit <= 0) {
        return res.status(400).json({
          error: "Memory limit must be a positive number",
          receivedMemoryLimit: challenge.memoryLimit
        });
      }
    }

    // Convert language IDs to names for each challenge
    for (const challenge of challengesToAdd) {
      if (Array.isArray(challenge.allowedLanguages)) {
        challenge.allowedLanguages = challenge.allowedLanguages.map(langId => {
          const language = Object.entries(LANGUAGE_IDS).find(([_, id]) => id === langId);
          if (!language) {
            throw new Error(`Invalid language ID: ${langId}`);
          }
          return language[0].toLowerCase(); // Return the language name in lowercase
        });
      }
    }

    // Add coding challenges to test
    test.codingChallenges.push(...challengesToAdd);
    
    // Recalculate total marks
    test.totalMarks = test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) + 
                      test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0);
    test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    
    await test.save();
    
    res.status(201).json({
      message: `Successfully added ${challengesToAdd.length} coding challenge(s)`,
      test,
      addedChallenges: challengesToAdd.map(c => ({
        id: c._id,
        title: c.title,
        marks: c.marks
      }))
    });
  } catch (error) {
    // Improved error handling
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

// Update Coding Challenge
export const updateCodingChallenge = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challengeIndex = test.codingChallenges.findIndex(
      challenge => challenge._id.toString() === req.params.challengeId
    );

    if (challengeIndex === -1) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    const { 
      title, 
      description, 
      problemStatement,
      constraints,
      allowedLanguages,
      languageImplementations,
      testCases,
      marks,
      timeLimit,
      memoryLimit,
      difficulty,
      tags 
    } = req.body;

    // Validate language implementations if provided
    if (languageImplementations) {
      for (const [lang, impl] of Object.entries(languageImplementations)) {
        if (!impl.visibleCode || !impl.invisibleCode) {
          return res.status(400).json({
            error: `Both visibleCode and invisibleCode are required for language: ${lang}`
          });
        }
      }
    }

    // Update the challenge with new data
    const updatedChallenge = {
      ...test.codingChallenges[challengeIndex].toObject(),
      ...(title && { title }),
      ...(description && { description }),
      ...(problemStatement && { problemStatement }),
      ...(constraints && { constraints }),
      ...(allowedLanguages && { allowedLanguages }),
      ...(languageImplementations && { languageImplementations }),
      ...(testCases && { testCases }),
      ...(marks && { marks }),
      ...(timeLimit && { timeLimit }),
      ...(memoryLimit && { memoryLimit }),
      ...(difficulty && { difficulty }),
      ...(tags && { tags })
    };

    test.codingChallenges[challengeIndex] = updatedChallenge;
    
    // Recalculate total marks if marks were updated
    if (marks) {
      test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                       (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();
    
    res.json({
      message: "Coding challenge updated successfully",
      updatedChallenge: test.codingChallenges[challengeIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Coding Challenge
export const deleteCodingChallenge = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    test.codingChallenges = test.codingChallenges.filter(
      challenge => challenge._id.toString() !== req.params.challengeId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Publish Test
export const publishTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if test has at least one type of question
    const hasMCQs = test.mcqs && test.mcqs.length > 0;
    const hasCoding = test.codingChallenges && test.codingChallenges.length > 0;

    if (!hasMCQs && !hasCoding) {
      return res.status(400).json({ 
        error: "Test must have at least one MCQ or coding challenge" 
      });
    }

    // Update test status and add publishing details
    test.status = 'published';
    test.publishedAt = new Date();

    await test.save();

    // Generate shareable link with just the UUID
    const shareableLink = `${process.env.FRONTEND_URL}/test/shared/${test.uuid}`;

    res.json({
      message: "Test published successfully",
      test: {
        _id: test._id,
        title: test.title,
        publishedAt: test.publishedAt,
        accessControl: test.accessControl?.type || 'private',
        questionCounts: {
          mcq: test.mcqs?.length || 0,
          coding: test.codingChallenges?.length || 0
        }
      },
      shareableLink
    });

  } catch (error) {
    console.error('Error in publishTest:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add Test Case
export const addTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    challenge.testCases.push(req.body);
    await test.save();
    
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Test Case
export const updateTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    const testCaseIndex = challenge.testCases.findIndex(
      tc => tc._id.toString() === req.params.testCaseId
    );

    if (testCaseIndex === -1) {
      return res.status(404).json({ error: "Test case not found" });
    }

    challenge.testCases[testCaseIndex] = {
      ...challenge.testCases[testCaseIndex],
      ...req.body
    };
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Test Case
export const deleteTestCase = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const challenge = test.codingChallenges.id(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Coding challenge not found" });
    }

    challenge.testCases = challenge.testCases.filter(
      tc => tc._id.toString() !== req.params.testCaseId
    );
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Test Session Management Functions
export const startTestSession = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { deviceInfo } = req.body;

    // Find test by UUID
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check for existing session
    const existingSession = await TestSession.findOne({
      test: test._id,
      user: req.user._id,
      status: 'active'
    });

    if (existingSession) {
      // Calculate if existing session has expired
      const timeElapsed = Date.now() - existingSession.startTime;
      const timeLimit = test.timeLimit * 60 * 1000; // Convert minutes to milliseconds

      if (timeElapsed > timeLimit) {
        // Update session to completed if expired
        existingSession.status = 'completed';
        existingSession.endTime = new Date(existingSession.startTime.getTime() + timeLimit);
        await existingSession.save();

        return res.status(400).json({
          message: 'Previous session has expired',
          session: {
            status: 'completed',
            reason: 'timeout'
          }
        });
      }

      return res.status(200).json({
        message: 'Existing session found',
        session: existingSession
      });
    }

    // Create new session
    const session = await TestSession.create({
      test: test._id,
      user: req.user._id,
      startTime: new Date(),
      duration: test.timeLimit,
      status: 'active',
      deviceInfo: {
        userAgent: deviceInfo?.userAgent,
        platform: deviceInfo?.platform,
        screenResolution: deviceInfo?.screenResolution,
        language: deviceInfo?.language,
        ip: req.ip
      }
    });

    return res.status(201).json({
      message: 'Session created successfully',
      session: {
        _id: session._id,
        startTime: session.startTime,
        duration: session.duration,
        status: session.status,
        timeLimit: test.timeLimit * 60 * 1000 // Send timeLimit in milliseconds
      }
    });

  } catch (error) {
    console.error('Error in startTestSession:', error);
    return res.status(500).json({
      message: 'Error creating test session',
      error: error.message
    });
  }
};

export const endTestSession = async (req, res) => {
  try {
    const { uuid, sessionId } = req.params;

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    res.json({
      message: 'Session ended successfully',
      session: {
        _id: session._id,
        status: session.status,
        endTime: session.endTime
      }
    });

  } catch (error) {
    console.error('Error in endTestSession:', error);
    res.status(500).json({
      message: 'Error ending test session',
      error: error.message
    });
  }
};

export const verifyTestInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    const invitation = await TestInvitation.findOne({ token })
      .populate('test')
      .populate('vendor', 'name email');

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    // Check if invitation has expired
    if (invitation.validUntil < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if maximum attempts reached
    if (invitation.attemptsUsed >= invitation.maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }

    // Check if test is still published
    if (!invitation.test || invitation.test.isDraft) {
      return res.status(400).json({ error: 'Test is no longer available' });
    }

    // Return test details with invitation info
    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        validUntil: invitation.validUntil,
        attemptsLeft: invitation.maxAttempts - invitation.attemptsUsed,
        status: invitation.status
      },
      test: {
        id: invitation.test._id,
        title: invitation.test.title,
        description: invitation.test.description,
        duration: invitation.test.duration,
        totalMarks: invitation.test.totalMarks,
        vendor: {
          name: invitation.vendor.name,
          email: invitation.vendor.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptTestInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const invitation = await TestInvitation.findOne({ token });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.attemptsUsed += 1;
    invitation.lastAttemptAt = new Date();
    await invitation.save();

    // Create test session
    const session = await TestSession.create({
      test: invitation.test,
      user: req.user._id,
      startTime: new Date(),
      status: 'started',
      invitation: invitation._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Invitation accepted successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendTestInvitations = async (req, res) => {
  try {
    const { testId } = req.params;
    const { candidates, validUntil, maxAttempts } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create invitations for each candidate
    const invitations = await Promise.all(
      candidates.map(async (candidate) => {
        const token = crypto.randomBytes(32).toString('hex');
        const invitation = await TestInvitation.create({
          test: test._id,
          vendor: req.user._id,
          email: candidate.email,
          name: candidate.name,
          token,
          validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          maxAttempts: maxAttempts || 1,
          shareableLink: `${process.env.FRONTEND_URL}/test/take/${test._id}?token=${token}`
        });

        // TODO: Send email to candidate
        // await sendInvitationEmail(invitation);

        return invitation;
      })
    );

    res.json({
      message: 'Invitations sent successfully',
      invitations: invitations.map(inv => ({
        id: inv._id,
        email: inv.email,
        name: inv.name,
        shareableLink: inv.shareableLink,
        validUntil: inv.validUntil,
        maxAttempts: inv.maxAttempts
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestInvitations = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const invitations = await TestInvitation.find({
      test: testId,
      vendor: req.user._id
    }).sort({ createdAt: -1 });

    res.json(invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      name: inv.name,
      status: inv.status,
      validUntil: inv.validUntil,
      maxAttempts: inv.maxAttempts,
      attemptsUsed: inv.attemptsUsed,
      lastAttemptAt: inv.lastAttemptAt,
      shareableLink: inv.shareableLink
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyTestByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const test = await Test.findOne({ uuid })
      .select('title description duration type category totalMarks status vendor')
      .populate('vendor', 'name email');
    
    if (!test) {
      return res.status(404).json({
        message: 'Test not found'
      });
    }

    return res.status(200).json({
      message: 'Test verified successfully',
      test: {
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        totalMarks: test.totalMarks,
        status: test.status,
        vendor: {
          name: test.vendor?.name,
          email: test.vendor?.email
        }
      }
    });

  } catch (error) {
    console.error('Error in verifyTestByUuid:', error);
    return res.status(500).json({
      message: 'Error verifying test',
      error: error.message
    });
  }
};

export const checkTestRegistration = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user._id;

    // Get test details with populated vendor
    const test = await Test.findOne({ uuid })
      .populate('vendor')
      .lean();

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check access conditions
    const isAdmin = user.role === 'admin';
    const isVendor = test.vendor._id.toString() === userId.toString();
    const isPublicTest = test.accessControl?.type === 'public';
    const isPracticeTest = test.type === 'coding_challenge';
    const isAllowedUser = test.accessControl?.allowedUsers?.some(u => 
      u.email === user.email
    );
    const hasAccessByEmail = test.accessControl?.allowedEmails?.includes(user.email);

    const canAccess = isAdmin || isVendor || isPublicTest || isPracticeTest || 
                      isAllowedUser || hasAccessByEmail;

    // Get existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: userId
    });

    // Get last session
    const lastSession = await TestSession.findOne({
      test: test._id,
      user: userId
    }).sort({ startTime: -1 });

    // Determine registration requirement
    const requiresRegistration = !isPracticeTest && !existingRegistration;

    // Build response
    const response = {
      canAccess,
      requiresRegistration,
      isRegistered: !!existingRegistration,
      testId: test._id.toString(),
      vendorId: test.vendor._id.toString(),
      message: !canAccess ? 'You do not have access to this test' :
               existingRegistration ? 'You are already registered for this test' :
               requiresRegistration ? 'Registration required for this test' :
               'You can take this test',
      test: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        type: test.type,
        vendor: {
          id: test.vendor._id,
          name: test.vendor.name
        },
        accessControl: {
          type: test.accessControl?.type || 'private',
          allowedUsers: test.accessControl?.allowedUsers || []
        }
      }
    };

    // Add registration info if exists
    if (existingRegistration) {
      response.registration = {
        id: existingRegistration._id,
        status: existingRegistration.status,
        registeredAt: existingRegistration.registeredAt
      };
    }

    // Add last session if exists
    if (lastSession) {
      response.lastSession = {
        id: lastSession._id,
        status: lastSession.status,
        startTime: lastSession.startTime
      };
    }

    // Log response for debugging
    console.log('Check Registration Response:', {
      testId: response.testId,
      vendorId: response.vendorId,
      canAccess: response.canAccess,
      isRegistered: response.isRegistered
    });

    res.json(response);

  } catch (error) {
    console.error('Error in checkRegistration:', error);
    res.status(500).json({
      error: "Failed to check registration status",
      details: error.message
    });
  }
};

export const getTestIdByUuid = async (req, res) => {
  try {
    console.log('UUID received:', req.params.uuid); // Debug log

    const test = await Test.findOne({ uuid: req.params.uuid })
      .select('_id uuid title'); // Only select necessary fields
    
    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid);
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    res.json({
      message: "Test found successfully",
      data: {
        id: test._id,
        uuid: test.uuid,
        title: test.title
      }
    });

  } catch (error) {
    console.error('Error in getTestIdByUuid:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      uuid: req.params.uuid
    });
  }
};

export const createTestSession = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { deviceInfo } = req.body;

    // Find test by UUID
    const test = await Test.findOne({ uuid });
    if (!test) {
      return res.status(404).json({ 
        message: 'Test not found',
        uuid 
      });
    }

    // Check for existing active session
    const existingSession = await TestSession.findOne({
      test: test._id,
      user: req.user._id,
      status: { $in: ['started', 'in_progress'] }
    });

    if (existingSession) {
      return res.json({
        message: 'Active session exists',
        session: {
          _id: existingSession._id,
          status: existingSession.status,
          startTime: existingSession.startTime
        }
      });
    }

    // Create new session
    const session = await TestSession.create({
      test: test._id,
      user: req.user._id,
      status: 'started',
      startTime: new Date(),
      deviceInfo,
      browserSwitches: 0,
      tabSwitches: 0
    });

    res.status(201).json({
      message: 'Session created successfully',
      session: {
        _id: session._id,
        status: session.status,
        startTime: session.startTime
      }
    });

  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ 
      message: 'Error creating test session',
      error: error.message 
    });
  }
};

export const addAllowedUsers = async (req, res) => {
  try {
    const { testId } = req.params;
    const { users } = req.body; // Expect array of {email, name} objects

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Initialize accessControl if needed
    if (!test.accessControl) {
      test.accessControl = {
        type: 'private',
        userLimit: 0,
        allowedUsers: [],
        allowedEmails: [],
        currentUserCount: 0
      };
    }

    // Add new users to allowedUsers array (avoiding duplicates)
    const existingEmails = test.accessControl.allowedUsers.map(user => user.email);
    const newUsers = users.filter(user => !existingEmails.includes(user.email))
      .map(user => ({
        email: user.email,
        name: user.name,
        addedAt: new Date()
      }));

    test.accessControl.allowedUsers.push(...newUsers);
    test.accessControl.currentUserCount = test.accessControl.allowedUsers.length;

    await test.save();

    res.json({
      message: "Users added successfully",
      addedUsers: newUsers,
      currentUserCount: test.accessControl.currentUserCount
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

export const removeAllowedUsers = async (req, res) => {
  try {
    const { testId } = req.params;
    const { emails } = req.body; // Expect array of email strings

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Remove users from allowedUsers array
    const initialCount = test.accessControl.allowedUsers.length;
    test.accessControl.allowedUsers = test.accessControl.allowedUsers.filter(
      user => !emails.includes(user.email)
    );
    test.accessControl.currentUserCount = test.accessControl.allowedUsers.length;

    await test.save();

    res.json({
      message: "Users removed successfully",
      removedCount: initialCount - test.accessControl.currentUserCount,
      currentUserCount: test.accessControl.currentUserCount,
      removedEmails: emails
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

export const getPublicTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on filters
    let query = {
      'accessControl.type': 'public',
      status: 'published'
    };

    // Add optional filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Test.countDocuments(query);

    // Get tests with sorting options
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    const tests = await Test.find(query)
      .select('title description duration totalMarks type category difficulty vendor questionCounts createdAt updatedAt')
      .populate('vendor', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Format response
    const formattedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      type: test.type,
      category: test.category,
      difficulty: test.difficulty,
      vendor: {
        name: test.vendor.name,
        email: test.vendor.email
      },
      questionCounts: {
        mcq: test.mcqs?.length || 0,
        coding: test.codingChallenges?.length || 0
      },
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    }));

    res.json({
      tests: formattedTests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      filters: {
        category: req.query.category,
        difficulty: req.query.difficulty,
        type: req.query.type,
        search: req.query.search
      },
      sorting: {
        field: sortField,
        order: req.query.sortOrder || 'desc'
      }
    });
  } catch (error) {
    console.error('Error fetching public tests:', error);
    res.status(500).json({ 
      message: 'Error fetching public tests', 
      error: error.message 
    });
  }
};

export const getTestByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const test = await Test.findOne({ uuid })
      .select('_id uuid title description duration type category difficulty totalMarks status accessControl vendor mcqs codingChallenges')
      .populate('vendor', 'name email')
      .lean();

    if (!test) {
      return res.status(404).json({ 
        message: "Test not found" 
      });
    }

    // Transform the response
    const transformedTest = {
      _id: test._id,
      uuid: test.uuid,
      title: test.title,
      description: test.description,
      duration: test.duration,
      type: test.type,
      category: test.category,
      difficulty: test.difficulty,
      totalMarks: test.totalMarks,
      status: test.status,
      accessControl: test.accessControl?.type || 'public',
      vendor: {
        name: test.vendor?.name || 'Anonymous',
        email: test.vendor?.email
      },
      mcqs: test.mcqs?.map(mcq => ({
        _id: mcq._id,
        question: mcq.question,
        options: mcq.options,
        marks: mcq.marks,
        difficulty: mcq.difficulty,
        answerType: mcq.answerType
      })),
      codingChallenges: test.codingChallenges?.map(challenge => {
        // Convert language IDs to names
        const allowedLanguages = challenge.allowedLanguages.map(langId => {
          const languageName = Object.entries(LANGUAGE_IDS).find(([name, id]) => id === langId)?.[0];
          return languageName || langId;
        });

        // Convert language implementations keys from IDs to names
        const languageImplementations = {};
        Object.entries(challenge.languageImplementations).forEach(([langId, impl]) => {
          const languageName = Object.entries(LANGUAGE_IDS).find(([name, id]) => id === langId)?.[0];
          if (languageName) {
            languageImplementations[languageName] = impl;
          }
        });

        return {
          _id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          problemStatement: challenge.problemStatement,
          constraints: challenge.constraints,
          allowedLanguages,
          languageImplementations,
          marks: challenge.marks,
          timeLimit: challenge.timeLimit,
          memoryLimit: challenge.memoryLimit,
          difficulty: challenge.difficulty,
          testCases: challenge.testCases?.filter(tc => tc.isVisible).map(tc => ({
            input: tc.input,
            output: tc.output,
            explanation: tc.explanation
          })),
          tags: challenge.tags
        };
      })
    };

    res.json({
      message: "Test retrieved successfully",
      data: transformedTest
    });

  } catch (error) {
    console.error('Error in getTestByUuid:', error);
    res.status(500).json({ 
      message: "Failed to retrieve test",
      error: error.message
    });
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    // Find all submissions for this user and test
    const submissions = await Submission.find({
      test: testId,
      user: userId
    })
    .populate('test', 'title duration totalMarks passingMarks')
    .sort({ submittedAt: -1 })
    .lean();

    if (!submissions || submissions.length === 0) {
      return res.json({
        message: "No submissions found",
        submissions: []
      });
    }

    // Transform submissions data
    const transformedSubmissions = submissions.map(submission => ({
      _id: submission._id,
      test: {
        _id: submission.test._id,
        title: submission.test.title,
        duration: submission.test.duration,
        totalMarks: submission.test.totalMarks,
        passingMarks: submission.test.passingMarks
      },
      score: submission.score,
      status: submission.status,
      submittedAt: submission.submittedAt,
      duration: submission.duration,
      mcqAnswers: submission.mcqAnswers?.length || 0,
      codingAnswers: submission.codingAnswers?.length || 0,
      feedback: submission.feedback || null,
      attempts: submission.attempts || 1
    }));

    res.json({
      message: "Submissions retrieved successfully",
      count: submissions.length,
      submissions: transformedSubmissions
    });

  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to retrieve submissions",
      details: error.message 
    });
  }
};

export const updateCodingChallenges = async (req, res) => {
  try {
    const { testId } = req.params;
    const challenges = Array.isArray(req.body) ? req.body : [req.body];

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedChallenges = [];
    const errors = [];

    // Update each challenge
    for (const challengeUpdate of challenges) {
      const { challengeId, ...updateData } = challengeUpdate;
      
      const challengeIndex = test.codingChallenges.findIndex(
        challenge => challenge._id.toString() === challengeId
      );

      if (challengeIndex === -1) {
        errors.push(`Challenge not found: ${challengeId}`);
        continue;
      }

      // Validate language implementations if provided
      if (updateData.languageImplementations) {
        for (const [lang, impl] of Object.entries(updateData.languageImplementations)) {
          if (!impl.visibleCode || !impl.invisibleCode) {
            errors.push(`Both visibleCode and invisibleCode are required for language: ${lang}`);
            continue;
          }
        }
      }

      // Update the challenge
      const updatedChallenge = {
        ...test.codingChallenges[challengeIndex].toObject(),
        ...updateData
      };

      test.codingChallenges[challengeIndex] = updatedChallenge;
      updatedChallenges.push(updatedChallenge);
    }

    // Recalculate total marks if any marks were updated
    if (updatedChallenges.some(c => c.marks)) {
      test.totalMarks = (test.mcqs?.reduce((sum, mcq) => sum + mcq.marks, 0) || 0) + 
                       (test.codingChallenges?.reduce((sum, challenge) => sum + challenge.marks, 0) || 0);
      test.passingMarks = Math.ceil(test.totalMarks * 0.4);
    }

    await test.save();

    res.json({
      message: "Coding challenges updated successfully",
      updatedCount: updatedChallenges.length,
      errors: errors.length > 0 ? errors : undefined,
      updatedChallenges: updatedChallenges.map(c => ({
        id: c._id,
        title: c.title,
        marks: c.marks
      }))
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update coding challenges",
      details: error.message 
    });
  }
};

export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, proctorNote, browserSwitches, tabSwitches } = req.body;

    const session = await TestSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Test session not found" });
    }

    // Verify the session belongs to the current user
    if (session.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this session" });
    }

    // Validate status transition based on current status
    const validTransitions = {
      'active': ['in_progress', 'terminated'],
      'in_progress': ['completed', 'terminated'],
      'completed': [], // No transitions allowed from completed
      'terminated': [] // No transitions allowed from terminated
    };

    if (status && (!validTransitions[session.status] || !validTransitions[session.status].includes(status))) {
      return res.status(400).json({ 
        error: "Invalid status transition",
        currentStatus: session.status,
        allowedTransitions: validTransitions[session.status]
      });
    }

    // Update session fields
    if (status) {
      session.status = status;
      
      // Set end time only for completed or terminated status
      if (['completed', 'terminated'].includes(status)) {
        session.endTime = new Date();
      }
    }

    if (typeof browserSwitches === 'number') {
      session.browserSwitches = browserSwitches;
    }

    if (typeof tabSwitches === 'number') {
      session.tabSwitches = tabSwitches;
    }

    // Add proctor note if provided
    if (proctorNote) {
      session.proctorNotes.push({
        note: proctorNote,
        timestamp: new Date(),
        addedBy: req.user._id
      });
    }

    await session.save();

    res.json({
      message: "Session status updated successfully",
      session: {
        _id: session._id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        browserSwitches: session.browserSwitches,
        tabSwitches: session.tabSwitches,
        lastUpdated: new Date(),
        proctorNotes: session.proctorNotes
      }
    });

  } catch (error) {
    console.error('Error in updateSessionStatus:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid session ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update session status",
      details: error.message 
    });
  }
};

export const updateTestAccess = async (req, res) => {
  try {
    const { testId } = req.params;
    const { accessControl } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Validate access control type
    if (!accessControl || !['public', 'private', 'restricted', 'invitation'].includes(accessControl.type)) {
      return res.status(400).json({
        error: "Invalid access control type",
        receivedType: accessControl?.type
      });
    }

    // Update access control settings
    test.accessControl = {
      type: accessControl.type,
      userLimit: accessControl.userLimit || 0,
      allowedUsers: test.accessControl?.allowedUsers || [],
      allowedEmails: accessControl.allowedEmails || [],
      currentUserCount: test.accessControl?.currentUserCount || 0,
      ...(accessControl.password && { password: accessControl.password }),
      ...(accessControl.validUntil && { validUntil: new Date(accessControl.validUntil) }),
      updatedAt: new Date()
    };

    await test.save();

    res.json({
      message: "Test access updated successfully",
      test: {
        _id: test._id,
        title: test.title,
        accessControl: {
          type: test.accessControl.type,
          userLimit: test.accessControl.userLimit,
          currentUserCount: test.accessControl.currentUserCount,
          updatedAt: test.accessControl.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error in updateTestAccess:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test access",
      details: error.message 
    });
  }
};

export const updateTestVisibility = async (req, res) => {
  try {
    const { testId } = req.params;
    const { visibility, status } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update test visibility" });
    }

    // Validate visibility
    if (visibility && !['public', 'private', 'unlisted'].includes(visibility)) {
      return res.status(400).json({
        error: "Invalid visibility type. Must be 'public', 'private', or 'unlisted'",
        receivedVisibility: visibility
      });
    }

    // Validate status
    if (status && !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'draft', 'published', or 'archived'",
        receivedStatus: status
      });
    }

    // Update test visibility and status
    const updates = {
      ...(visibility && { 'accessControl.type': visibility }),
      ...(status && { status }),
      updatedAt: new Date()
    };

    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { $set: updates },
      { 
        new: true,
        select: 'title status accessControl updatedAt' 
      }
    );

    // Add visibility change to test history if needed
    if (visibility && visibility !== test.accessControl.type) {
      await Test.findByIdAndUpdate(testId, {
        $push: {
          history: {
            action: 'visibility_changed',
            from: test.accessControl.type,
            to: visibility,
            changedBy: req.user._id,
            timestamp: new Date()
          }
        }
      });
    }

    res.json({
      message: "Test visibility updated successfully",
      test: {
        _id: updatedTest._id,
        title: updatedTest.title,
        status: updatedTest.status,
        visibility: updatedTest.accessControl.type,
        updatedAt: updatedTest.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in updateTestVisibility:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test visibility",
      details: error.message 
    });
  }
};

export const getFeaturedPublicTests = async (req, res) => {
  try {
    const tests = await Test.find({
      'accessControl.type': 'public',
      status: 'published',
      featured: true
    })
    .select('title description duration totalMarks type category difficulty vendor')
    .populate('vendor', 'name email')
    .limit(5)
    .sort({ createdAt: -1 });

    res.json({
      message: 'Featured tests retrieved successfully',
      tests: tests.map(test => ({
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        type: test.type,
        category: test.category,
        difficulty: test.difficulty,
        vendor: {
          name: test.vendor.name,
          email: test.vendor.email
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching featured tests',
      error: error.message 
    });
  }
};

export const getPublicTestCategories = async (req, res) => {
  try {
    const categories = await Test.distinct('category', {
      'accessControl.type': 'public',
      status: 'published'
    });

    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
};

export const registerForTest = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user._id;

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const test = await Test.findOne({ uuid }).populate('vendor');
      if (!test) {
        throw new Error("Test not found");
      }

      // Get system settings for price
      const settings = await SystemSettings.findOne();
      const pricePerUser = settings?.testPricing?.pricePerUser || 4.35; // Default price

      // Find vendor and check balance
      const vendor = await Vendor.findById(test.vendor._id);
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Check if vendor has sufficient balance
      if (vendor.wallet.balance < pricePerUser) {
        throw new Error("Vendor has insufficient balance");
      }

      // Check if already registered
      const existingRegistration = await TestRegistration.findOne({
        test: test._id,
        user: userId
      });

      if (existingRegistration) {
        throw new Error("Already registered for this test");
      }

      // Check access conditions
      const isAdmin = user.role === 'admin';
      const isVendor = test.vendor._id.toString() === userId.toString();
      const isPublicTest = test.accessControl?.type === 'public';
      const isPracticeTest = test.type === 'coding_challenge';
      const isAllowedUser = test.accessControl?.allowedUsers?.some(u => 
        u.email === user.email
      );
      const hasAccessByEmail = test.accessControl?.allowedEmails?.includes(user.email);

      const canAccess = isAdmin || isVendor || isPublicTest || isPracticeTest || 
                        isAllowedUser || hasAccessByEmail;

      if (!canAccess) {
        throw new Error("Not authorized to access this test");
      }

      // Deduct balance from vendor's wallet
      if (!isAdmin && !isVendor) { // Don't charge for admin or vendor's own test
        vendor.wallet.balance -= pricePerUser;
        vendor.wallet.transactions.push({
          type: 'debit',
          amount: pricePerUser,
          description: `Test registration fee for ${user.email} - ${test.title}`,
          timestamp: new Date()
        });
        await vendor.save({ session });
      }

      // Create registration
      const registration = await TestRegistration.create([{
        test: test._id,
        user: userId,
        registeredAt: new Date(),
        status: 'registered',
        registrationType: isPracticeTest ? 'coding_challenge' : 'assessment',
        testType: test.type,
        accessType: test.accessControl?.type || 'private',
        paymentInfo: {
          amount: pricePerUser,
          status: 'completed',
          paidBy: test.vendor._id
        }
      }], { session });

      // Commit transaction
      await session.commitTransaction();

      res.status(201).json({
        message: "Successfully registered for test",
        registration: {
          id: registration[0]._id,
          registeredAt: registration[0].registeredAt,
          status: registration[0].status,
          registrationType: registration[0].registrationType,
          testType: registration[0].testType
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in registerForTest:', error);
    res.status(error.message.includes('Not authorized') ? 403 : 500).json({
      message: "Error registering for test",
      error: error.message
    });
  }
};

export const validateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await TestSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to access this session" });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ 
        error: "Invalid session status",
        status: session.status
      });
    }

    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ error: "Session has expired" });
    }

    req.testSession = session;
    next();

  } catch (error) {
    console.error('Error in validateSession:', error);
    res.status(500).json({
      error: "Session validation failed",
      details: error.message
    });
  }
};

export const updateTestType = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type } = req.body;

    // Validate test type
    if (!['assessment', 'coding_challenge'].includes(type)) {
      return res.status(400).json({
        error: "Invalid test type. Must be either 'assessment' or 'coding_challenge'",
        receivedType: type
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update test type" });
    }

    // Update test type
    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { 
        $set: { 
          type,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        select: 'title type status updatedAt' 
      }
    );

    // Add type change to test history
    await Test.findByIdAndUpdate(testId, {
      $push: {
        history: {
          action: 'type_changed',
          from: test.type,
          to: type,
          changedBy: req.user._id,
          timestamp: new Date()
        }
      }
    });

    res.json({
      message: "Test type updated successfully",
      test: {
        _id: updatedTest._id,
        title: updatedTest.title,
        type: updatedTest.type,
        status: updatedTest.status,
        updatedAt: updatedTest.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in updateTestType:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to update test type",
      details: error.message 
    });
  }
};

export const getTestForTaking = async (req, res) => {
  try {
    const { uuid } = req.params;
    const test = await Test.findOne({ uuid })
      .populate('vendor', 'name email')
      .lean();

    if (!test) {
      return res.status(404).json({ 
        message: 'Test not found' 
      });
    }

    // Check if user is authorized to take the test
    const userEmail = req.user.email;
    const isAdmin = req.user.role === 'admin';
    const isVendor = test.vendor._id.toString() === req.user._id.toString();
    const isAllowedUser = test.accessControl?.allowedUsers?.some(
      user => user.email === userEmail
    );

    if (!isAdmin && !isVendor && !isAllowedUser) {
      return res.status(403).json({ 
        message: 'You are not authorized to take this test' 
      });
    }

    // Transform the response
    const response = {
      message: 'Test loaded successfully',
      data: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        type: test.type,
        accessControl: {
          type: test.accessControl?.type || 'private',
          userLimit: test.accessControl?.userLimit || 0,
          // Only include the current user's info if they're in allowedUsers
          allowedUsers: isAllowedUser ? [{
            email: userEmail,
            name: test.accessControl.allowedUsers.find(u => u.email === userEmail)?.name,
            addedAt: test.accessControl.allowedUsers.find(u => u.email === userEmail)?.addedAt
          }] : [],
          currentUserCount: test.accessControl?.allowedUsers?.length || 0
        },
        mcqs: test.mcqs || [],
        codingChallenges: test.codingChallenges || []
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getTestForTaking:', error);
    res.status(500).json({ 
      message: 'Error loading test',
      error: error.message 
    });
  }
};

export const verifyTest = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Find test and populate vendor
    const test = await Test.findOne({ uuid }).populate('vendor');
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get current price per user from system settings
    const settings = await SystemSettings.findOne();
    const pricePerUser = settings?.testPricing?.pricePerUser || 4.35;

    // Get vendor's current balance
    const vendor = await Vendor.findById(test.vendor._id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Check if vendor has sufficient balance
    const hasBalance = vendor.wallet.balance >= pricePerUser;

    res.json({
      message: "Test verified successfully",
      test: {
        title: test.title,
        description: test.description,
        duration: test.duration,
        type: test.type,
        category: test.category,
        totalMarks: test.totalMarks,
        status: test.status,
        vendor: {
          name: vendor.name,
          email: vendor.email,
          hasBalance
        }
      }
    });

  } catch (error) {
    console.error('Error in verifyTest:', error);
    res.status(500).json({ 
      error: "Failed to verify test",
      message: error.message 
    });
  }
};

export const createSession = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    // Check for existing active session
    const existingSession = await TestSession.findOne({
      userId,
      testId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (existingSession) {
      return res.json({
        session: existingSession,
        message: "Resuming existing session"
      });
    }

    // Get test details for duration
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Create new session with proper expiration
    const startTime = new Date();
    const expiresAt = new Date(startTime.getTime() + (test.duration * 60 * 1000));

    const session = await TestSession.create({
      testId,
      userId,
      startTime,
      expiresAt,
      status: 'active',
      deviceInfo: req.body.deviceInfo || {},
      progress: {
        mcqAnswers: {},
        codingAnswers: {},
        lastSaved: startTime
      }
    });

    res.json({
      session: {
        id: session._id,
        startTime,
        expiresAt,
        duration: test.duration
      }
    });

  } catch (error) {
    console.error('Error in createSession:', error);
    res.status(500).json({
      error: "Failed to create session",
      details: error.message
    });
  }
};

export const verifyTestAccess = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user._id;

    // Get user and test details
    const [user, test] = await Promise.all([
      User.findById(userId),
      Test.findOne({ uuid }).lean()
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    console.log('Checking access for user:', user.email);

    // Check access through TestAccess collection
    const testAccess = await TestAccess.findOne({
      test: test._id,
      $or: [
        { user: userId },
        { 'userEmail': user.email }
      ]
    });

    // Check if user has access through test's access control
    const hasAccessInTest = test.accessControl?.allowedEmails?.includes(user.email) ||
                          test.accessControl?.allowedUsers?.some(u => u.email === user.email);

    const hasAccess = testAccess || hasAccessInTest;

    if (!hasAccess) {
      return res.json({
        canAccess: false,
        isRegistered: true,
        message: "You do not have access to this test",
        test: {
          id: test._id,
          title: test.title,
          type: test.type,
          uuid: test.uuid,
          accessControl: {
            type: test.accessControl?.type || 'private'
          }
        }
      });
    }

    // Check for active session
    const activeSession = await TestSession.findOne({
      userId,
      'test.uuid': uuid,
      status: { $in: ['started', 'in_progress'] }
    });

    res.json({
      canAccess: true,
      isRegistered: true,
      lastSession: activeSession ? {
        id: activeSession._id,
        startTime: activeSession.startTime,
        status: activeSession.status
      } : null,
      test: {
        id: test._id,
        title: test.title,
        type: test.type,
        uuid: test.uuid,
        accessControl: {
          type: test.accessControl?.type || 'private'
        }
      }
    });

  } catch (error) {
    console.error('Error verifying test access:', error);
    res.status(500).json({
      error: "Failed to verify test access",
      details: error.message
    });
  }
};

export const checkRegistration = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user._id;

    // Get test details with populated vendor
    const test = await Test.findOne({ uuid })
      .populate('vendor')
      .lean();

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check access conditions
    const isAdmin = user.role === 'admin';
    const isVendor = test.vendor._id.toString() === userId.toString();
    const isPublicTest = test.accessControl?.type === 'public';
    const isPracticeTest = test.type === 'coding_challenge';
    const isAllowedUser = test.accessControl?.allowedUsers?.some(u => 
      u.email === user.email
    );
    const hasAccessByEmail = test.accessControl?.allowedEmails?.includes(user.email);

    const canAccess = isAdmin || isVendor || isPublicTest || isPracticeTest || 
                      isAllowedUser || hasAccessByEmail;

    // Get existing registration
    const existingRegistration = await TestRegistration.findOne({
      test: test._id,
      user: userId
    });

    // Get last session
    const lastSession = await TestSession.findOne({
      test: test._id,
      user: userId
    }).sort({ startTime: -1 });

    // Build response object
    const response = {
      testId: test._id.toString(),           // Add testId at top level
      vendorId: test.vendor._id.toString(),  // Add vendorId at top level
      canAccess,
      requiresRegistration: !isPracticeTest && !existingRegistration,
      isRegistered: !!existingRegistration,
      message: !canAccess ? 'You do not have access to this test' :
               existingRegistration ? 'You are already registered for this test' :
               !isPracticeTest ? 'Registration required for this test' :
               'You can take this test',
      test: {
        id: test._id,
        uuid: test.uuid,
        title: test.title,
        type: test.type,
        vendor: {
          id: test.vendor._id,
          name: test.vendor.name
        },
        accessControl: {
          type: test.accessControl?.type || 'private',
          allowedUsers: test.accessControl?.allowedUsers || []
        }
      }
    };

    // Add registration info if exists
    if (existingRegistration) {
      response.registration = {
        id: existingRegistration._id,
        status: existingRegistration.status,
        registeredAt: existingRegistration.registeredAt
      };
    }

    // Add last session if exists
    if (lastSession) {
      response.lastSession = {
        id: lastSession._id,
        status: lastSession.status,
        startTime: lastSession.startTime
      };
    }

    // Log the response for debugging
    console.log('Check Registration Response:', {
      testId: response.testId,
      vendorId: response.vendorId,
      canAccess: response.canAccess,
      isRegistered: response.isRegistered
    });

    res.json(response);

  } catch (error) {
    console.error('Error in checkRegistration:', error);
    res.status(500).json({
      error: "Failed to check registration status",
      details: error.message
    });
  }
};

export const getTestAccess = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Check authorization
    if (!req.user.isAdmin && test.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to view test access" });
    }

    // Transform allowed users to include more details
    const allowedUsers = test.accessControl?.allowedUsers?.map(user => ({
      email: user.email,
      name: user.name,
      addedAt: user.addedAt
    })) || [];

    res.json({
      type: test.accessControl?.type || 'private',
      userLimit: test.accessControl?.userLimit || 0,
      allowedUsers,
      currentUserCount: allowedUsers.length,
      allowedEmails: test.accessControl?.allowedEmails || []
    });

  } catch (error) {
    console.error('Error in getTestAccess:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: "Invalid test ID format",
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: "Failed to get test access settings",
      details: error.message 
    });
  }
};

export const parseTestUuid = async (req, res) => {
  try {
    console.log('Parsing UUID:', req.params.uuid); // Debug log

    const test = await Test.findOne({ uuid: req.params.uuid })
      .select('_id uuid title vendor')
      .populate('vendor', '_id name')
      .lean();
    
    if (!test) {
      console.log('Test not found for UUID:', req.params.uuid);
      return res.status(404).json({ 
        message: "Test not found",
        uuid: req.params.uuid 
      });
    }

    res.json({
      message: "Test parsed successfully",
      data: {
        testId: test._id.toString(),
        vendorId: test.vendor._id.toString(),
        uuid: test.uuid,
        title: test.title,
        vendor: {
          name: test.vendor.name
        }
      }
    });

  } catch (error) {
    console.error('Error in parseTestUuid:', error);
    res.status(500).json({ 
      message: "Error parsing test UUID",
      error: error.message,
      uuid: req.params.uuid
    });
  }
};

