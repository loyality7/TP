import judge0 from '../config/judge0.js';

// Language ID mapping for Judge0
const LANGUAGE_IDS = {
  'c': 50,
  'cpp': 54,
  'java': 62,
  'python': 71,
  'python3': 71,
  'javascript': 63,
  'nodejs': 63,
  'ruby': 72,
  'swift': 83,
  'go': 60,
  'scala': 81,
  'kotlin': 78,
  'rust': 73,
  'php': 68,
  'typescript': 74,
  'csharp': 51,
  'perl': 85
};

export const executeCode = async (req, res) => {
  try {
    const { language, code, inputs } = req.body;

    console.log('Received execution request:', {
      code,
      language,
      codeLength: code?.length,
      inputs
    });

    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({
        error: `Unsupported language: ${language}`
      });
    }

    // Execute code using judge0 service
    const result = await judge0.submitCode(languageId, code, inputs);
    
    // Add debugging logs
    console.log('Raw Judge0 result:', {
      time: result.time,
      memory: result.memory,
      status: result.status
    });

    // Format the response to match the expected schema
    const response = {
      status: result.status.description,
      output: result.stdout,
      error: result.stderr || result.compile_output || '',
      executionTime: result.time,  // Remove parseFloat since it's already handled in judge0.js
      memory: result.memory        // Remove parseInt since it's already handled in judge0.js
    };

    console.log('Final response:', response);
    res.json(response);

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      error: 'Failed to execute code',
      details: error.message
    });
  }
}; 