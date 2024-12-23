import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { useAuth } from '../../hooks/auth/useAuth';
import { toast } from 'react-toastify';

const LoginForm = ({ onLoginSuccess }) => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login({
        login: formData.emailOrUsername,
        password: formData.password
      });
      
      if (result?.user) {
        toast.success('Successfully logged in!');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // First check for stored redirect URL (e.g., from test link)
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
          return; // Exit early after redirect
        }
        
        // If no stored redirect, handle role-based navigation
        switch (result.user.role) {
          case 'vendor':
            navigate('/vendor/dashboard');
            break;
          case 'admin':
            navigate('/dashboard/admin');
            break;
          case 'user':
            navigate('/dashboard/user');
            break;
          default:
            navigate('/dashboard/user');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>Welcome Back</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="emailOrUsername">Email or Username:</label>
          <input
            type="text"
            id="emailOrUsername"
            name="emailOrUsername"
            value={formData.emailOrUsername}
            onChange={handleChange}
            required
            placeholder="Enter your email or username"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        <div className="forgot-password">
          <a href="/forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="terms">
        Don't have an account? <a href="/register">Sign up</a>
      </div>
    </div>
  );
};

export default LoginForm; 