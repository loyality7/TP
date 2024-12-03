// Validate MCQ submission
const validateMCQSubmission = (req, res, next) => {
  try {
    const { testId, submissions } = req.body;

    // Check required fields
    if (!testId || !submissions) {
      return res.status(400).json({ 
        error: "testId and submissions are required" 
      });
    }

    // Validate submissions array
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ 
        error: "submissions must be a non-empty array" 
      });
    }

    // Validate each submission
    for (const submission of submissions) {
      const { questionId, selectedOptions } = submission;

      if (!questionId || !selectedOptions) {
        return res.status(400).json({ 
          error: "Each submission must have questionId and selectedOptions" 
        });
      }

      if (!Array.isArray(selectedOptions)) {
        return res.status(400).json({ 
          error: "selectedOptions must be an array" 
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validate coding submission
const validateCodingSubmission = (req, res, next) => {
  try {
    const { testId, submissions } = req.body;

    // Check required fields
    if (!testId || !submissions) {
      return res.status(400).json({ 
        error: "testId and submissions are required" 
      });
    }

    // Validate submissions array
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ 
        error: "submissions must be a non-empty array" 
      });
    }

    // Validate each submission
    for (const submission of submissions) {
      const { 
        challengeId, 
        code, 
        language, 
        testCaseResults 
      } = submission;

      if (!challengeId || !code || !language) {
        return res.status(400).json({ 
          error: "Each submission must have challengeId, code, and language" 
        });
      }

      if (testCaseResults) {
        if (!Array.isArray(testCaseResults)) {
          return res.status(400).json({ 
            error: "testCaseResults must be an array" 
          });
        }

        for (const testCase of testCaseResults) {
          const { input, expectedOutput, actualOutput, passed } = testCase;
          if (!input || !expectedOutput || actualOutput === undefined || passed === undefined) {
            return res.status(400).json({ 
              error: "Each test case must have input, expectedOutput, actualOutput, and passed status" 
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateSubmission = {
  mcq: validateMCQSubmission,
  coding: validateCodingSubmission
}; 