import apiService from './api';

export const testService = {
  // Get all tests
  getAllTests: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiService.get(`tests?${queryString}`);
  },

  // Create test - handles both manual form data and JSON upload
  createTest: async (testData) => {
    try {
      // Transform the data if it's from the form
      let formattedData = testData;

      // Check if data is from form (has specific form fields) and needs transformation
      if (testData.duration && !testData.isJsonUpload) {
        formattedData = {
          ...testData,
          duration: parseInt(testData.duration),
          proctoring: testData.proctoring === 'true',
          mcqs: testData.mcqs.map(mcq => ({
            ...mcq,
            marks: parseInt(mcq.marks),
            correctOptions: mcq.correctOptions.map(Number)
          })),
          codingChallenges: testData.codingChallenges.map(challenge => ({
            ...challenge,
            marks: parseInt(challenge.marks),
            timeLimit: parseInt(challenge.timeLimit),
            memoryLimit: parseInt(challenge.memoryLimit)
          }))
        };
      }

      const response = await apiService.post('/tests', formattedData);
      
      if (response.status === 201) {
        return {
          status: 201,
          data: response.data,
          message: 'Test created successfully'
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error in createTest:', error);
      
      // Enhanced error handling with proper Error object
      const errorMessage = error.response?.data?.error || 'Failed to create test';
      const errorDetails = error.response?.data?.details || {};
      
      throw new Error(JSON.stringify({
        message: errorMessage,
        details: errorDetails,
        status: error.response?.status || 500
      }));
    }
  },
  

  // Add coding challenges to a test
  addCodingChallenges: async (testId, challenges) => {
    return await apiService.post(`/tests/${testId}/coding-challenges`, challenges);
  },

  // Update test
  updateTest: async (testId, testData) => {
    const response = await apiService.put(`/tests/${testId}`, testData);
    return response.data;
  },

  // Delete test
  deleteTest: async (testId) => {
    return await apiService.delete(`/tests/${testId}`);
  },

  // Publish test
  publishTest: async (testId) => {
    return await apiService.post(`/tests/${testId}/publish`);
  },

  // Share test
  shareTest: async (testId, emails) => {
    return await apiService.post(`/tests/${testId}/share`, { emails });
  },

  // Get test by ID
  getTestById: async (testId) => {
    try {
      const response = await apiService.get(`/tests/${testId}`);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Transform the data to match form structure
      const formattedData = {
        ...response.data,
        duration: response.data.duration?.toString() || '',
        proctoring: response.data.proctoring?.toString() || 'false',
        settings: response.data.settings || {},
        mcqs: (response.data.mcqs || []).map(mcq => ({
          ...mcq,
          marks: mcq.marks?.toString() || '0'
        })),
        codingChallenges: (response.data.codingChallenges || []).map(challenge => ({
          ...challenge,
          marks: challenge.marks?.toString() || '0',
          timeLimit: challenge.timeLimit?.toString() || '0',
          memoryLimit: challenge.memoryLimit?.toString() || '0'
        }))
      };

      return { data: formattedData };
    } catch (error) {
      console.error('Error in getTestById:', error);
      throw error;
    }
  },

  // Update test visibility
  updateTestVisibility: async (testId, visibility) => {
    try {
      const response = await apiService.patch(`/tests/${testId}/visibility`, { 
        visibility,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to update test visibility:', error);
      throw error;
    }
  },

  // Get user's test results
  getUserTests: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await apiService.get(`/user/tests/all?${queryString}`);
      
      return { 
        data: response?.data || [] 
      };
    } catch (error) {
      // Removed error logging and just return empty array
      return { data: [] };
    }
  }
}; 

