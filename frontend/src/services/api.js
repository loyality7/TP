import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Add auth token to requests
const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Attach the setAuthToken function to the axiosInstance
axiosInstance.setAuthToken = setAuthToken;

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use((config) => {
  const newConfig = { ...config };
  newConfig.headers = newConfig.headers || {};
  
  if (config.url.includes('/auth/login') || config.requiresAuth === false) {
    return newConfig;
  }

  const token = localStorage.getItem('token');
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  } else {
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject('No authentication token');
  }

  return newConfig;
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Handle token-related errors
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code;
      
      switch (errorCode) {
        case 'TOKEN_EXPIRED':
          toast.error('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 'TOKEN_INVALID':
          toast.error('Invalid authentication. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 'USER_NOT_FOUND':
          toast.error('Account not found. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        default:
          toast.error('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    }

    // Handle other errors
    if (error.response) {
      toast.error(error.response.data.error || 'An error occurred');
      return Promise.reject(error.response.data);
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject({ message: 'Network error occurred' });
    }
    
    toast.error('An unexpected error occurred');
    return Promise.reject({ message: error.message });
  }
);

// Add a health check method
const checkServerHealth = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('Server is accessible:', response.data);
    return true;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

// Export the service methods
export const apiService = {
  get: async (endpoint, config = {}) => {
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return await axiosInstance.get(path, config);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  post: async (endpoint, data = {}, config = {}) => {
    console.log('API Request:', {
      endpoint,
      data
    });
    
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await axiosInstance.post(path, data, {
        ...config,
        requiresAuth: endpoint.includes('/auth/login') ? false : true
      });
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  put: async (endpoint, data = {}, config = {}) => {
    try {
      return await axiosInstance.put(endpoint, data, config);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint, config = {}) => {
    try {
      return await axiosInstance.delete(endpoint, config);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
  patch: async (endpoint, data = {}, config = {}) => {
    try {
      // Check server health first
      const isServerUp = await checkServerHealth();
      if (!isServerUp) {
        throw new Error('Backend server is not accessible');
      }

      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      console.log('Making PATCH request to:', `${API_URL}${path}`);
      console.log('With data:', data);
      console.log('With headers:', axiosInstance.defaults.headers);

      const response = await axiosInstance.patch(path, data, {
        ...config,
        timeout: 5000, // Add timeout
        validateStatus: status => status >= 200 && status < 300 // Validate status
      });

      return response;
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        console.error('Network Error Details:', {
          baseURL: API_URL,
          endpoint,
          fullURL: `${API_URL}${endpoint}`,
          error: error.message
        });
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      console.error(`PATCH ${endpoint} failed:`, error);
      throw error;
    }
  },
  getCandidates: async () => {
    return await axiosInstance.get('vendor/candidates');
  },

  getCandidateMetrics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await axiosInstance.get(`vendor/candidate-metrics?${queryString}`);
  },

  getSubmissionDetails: async (testId, userId) => {
    return await axiosInstance.get(`submissions/test/${testId}/user/${userId}/details`);
  }
};

export default apiService; 