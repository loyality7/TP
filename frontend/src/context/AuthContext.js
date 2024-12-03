import { createContext, useReducer, useContext, useEffect } from 'react';
import apiService from '../services/api';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('token'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await apiService.post('/auth/login', credentials, {
        requiresAuth: false
      });
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = response.data;

      if (!user || !token) {
        throw new Error('Invalid response format: missing token or user data');
      }

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update auth state
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, token }
      });

      return { user, token };
      
    } catch (error) {
      console.error('Login Error:', error);
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Login failed';
      
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: errorMessage
      });
      
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Add this to handle initial auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
      if (apiService && apiService.defaults) {
        apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      dispatch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;