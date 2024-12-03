import axios from "axios";

const JUDGE0_API_URL = "http://13.233.232.168:2358";

const judge0 = {
  async submitCode(languageId, sourceCode, stdin = '') {
    try {
      // Base64 encode the inputs
      const base64Code = Buffer.from(sourceCode).toString('base64');
      const base64Stdin = Buffer.from(stdin).toString('base64');

      // Initial submission
      const submissionResponse = await axios.post(`${JUDGE0_API_URL}/submissions`, {
        language_id: languageId,
        source_code: base64Code,
        stdin: base64Stdin
      }, {
        params: {
          base64_encoded: true,
          wait: false // Don't wait for completion
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const token = submissionResponse.data.token;

      // Poll for results
      let result;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
        
        const resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${token}`, {
          params: {
            base64_encoded: true
          }
        });

        result = resultResponse.data;
        
        // Check if processing is complete
        if (result.status.id >= 3) { // Status is completed
          break;
        }
        
        attempts++;
      }

      // Format the response
      return {
        stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '',
        stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '',
        compile_output: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '',
        message: result.message || '',
        time: parseFloat(result.time) || 0,
        memory: parseInt(result.memory) || 0,
        status: {
          id: result.status.id,
          description: result.status.description
        }
      };

    } catch (error) {
      console.error('Judge0 API Error:', error.response?.data || error);
      throw error;
    }
  }
};

export default judge0;
