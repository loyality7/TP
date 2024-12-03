import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Add auth token to requests that need it
axiosInstance.interceptors.request.use((config) => {
  // Create a new config object to avoid mutating the original
  const newConfig = { ...config };
  
  // Ensure headers exist
  newConfig.headers = newConfig.headers || {};
  
  // For public endpoints, remove any Authorization header
  if (newConfig.requiresAuth === false) {
    delete newConfig.headers.Authorization;
    return newConfig;
  }

  // For protected endpoints, add the token
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      newConfig.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
  }

  return newConfig;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error occurred' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default axiosInstance; 