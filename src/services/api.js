import axios from 'axios';

export const apiService = {
  // ... other existing methods ...
  
  getSubmissionDetails: async (testId, userId) => {
    return await axios.get(`/api/submissions/${testId}/candidates/${userId}`);
    // or whatever your API endpoint structure is, for example:
    // return await axios.get(`/api/tests/${testId}/submissions/${userId}`);
  },
};
