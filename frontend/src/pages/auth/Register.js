import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import './register.css';

const Register = () => {
  return (
    <div className="register-container">
      <div className="register-content">
        <div className="form-section">
          <RegisterForm />
        </div>
        <div className="image-section">
          <div className="image-content">
            <h1>Connecting Developers with Opportunities</h1>
            <p>Test Platform is the home of makers, making amazing things, and getting paid. Find your dream job with us.</p>
            <div className="rating">
              <div className="stars">★★★★★</div>
              <span className="rating-number">5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
