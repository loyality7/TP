import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { useAuth } from '../../hooks/auth/useAuth';
import { toast } from 'react-toastify';

const LoginForm = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    console.log('Form field updated:', e.target.name, e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    setLoading(true);
    setError('');
    
    try {
      const result = await login({
        login: formData.emailOrUsername,
        password: formData.password
      });
      
      if (result?.user) {
        console.log('Login successful:', result);
        toast.success('Successfully logged in!');
        if (onLoginSuccess) {
          onLoginSuccess();
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
      
      <div className="social-buttons">
        <button className="social-button" disabled={loading}>
          <i className="fab fa-github"></i>
          GitHub
        </button>
        <button className="social-button" disabled={loading}>
          <i className="fab fa-google"></i>
          Google
        </button>
      </div>

      <div className="divider">
        <span>or</span>
      </div>

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