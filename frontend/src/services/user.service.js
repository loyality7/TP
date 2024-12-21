import apiService from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiService.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Create or update full profile
  updateFullProfile: async (profileData) => {
    try {
      const response = await apiService.post('/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating full profile:', error);
      throw error;
    }
  },

  // Update basic profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiService.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Update skills
  updateSkills: async (skills) => {
    try {
      const response = await apiService.put('/user/skills', { skills });
      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  }
}; 