import apiService from './api';

export const testService = {
  // Get all tests
  getAllTests: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiService.get(`tests?${queryString}`);
  },

  // Create new test
  createTest: async (testData) => {
    try {
      // Transform the data if needed
      const formattedData = {
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

      const response = await apiService.post('/tests', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error in createTest:', error);
      throw error;
    }
  },

  // Add coding challenges to a test
  addCodingChallenges: async (testId, challenges) => {
    return await apiService.post(`/tests/${testId}/coding-challenges`, challenges);
  },

  // Update test
  updateTest: async (testId, testData) => {
    return await apiService.put(`/tests/${testId}`, testData);
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
    return await apiService.get(`/tests/${testId}`);
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
  }
}; 