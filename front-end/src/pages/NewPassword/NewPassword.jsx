import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../Login/Login.css';
import './NewPassword.css';
import { AUTH_ENDPOINTS } from '../../config/api';
import logoWithText from "../../assets/Logo/Logo with Text_White.png";

const NewPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams(); // Get token dari URL params (/new-password/:token)

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  // Check if passwords match in real-time
  const passwordsMatch = formData.newPassword && formData.confirmPassword && 
                         formData.newPassword === formData.confirmPassword;
  const showRedLine = formData.confirmPassword && 
                      formData.newPassword !== formData.confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation: check if passwords match
    if (!formData.newPassword || !formData.confirmPassword) {
      setSubmitError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setSubmitError('Passwords do not match!');
      return;
    }

    if (!token) {
      setSubmitError('Invalid reset link');
      return;
    }

    // Submit the form
    setIsLoading(true);
    setSubmitError('');

    // Call backend API to reset password
    fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: token,
        newPassword: formData.newPassword 
      })
    })
    .then(response => response.json())
    .then(data => {
      setIsLoading(false);
      if (data.message === 'Password reset successfully') {
        setIsSubmitted(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setSubmitError(data.message || 'Failed to reset password');
      }
    })
    .catch(error => {
      setIsLoading(false);
      console.error('Error:', error);
      setSubmitError('Failed to reset password. Please try again.');
    });
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <div className="app">
        <div className="login-container new-password-container">
          <div className="login-content new-password-content">
            <div className="success-message-container">
              <div className="success-icon">✓</div>
              <h1 className="success-title">Password Reset Successful!</h1>
              <p className="success-message">
                Your password has been successfully reset.
              </p>
              <p className="success-subtitle">
                You will be redirected to the login page in a few seconds...
              </p>
              <button 
                className="login-button back-to-login-button"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="login-container new-password-container">
        <div className="login-content new-password-content">
          <div className="welcome-section">
            <img 
              src={logoWithText} 
              alt="Logo" 
              style={{ 
                width: '200px', 
                marginBottom: '60px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }} 
            />
            <h1 style={{ fontWeight: '700', marginBottom: '4px', textAlign: 'center' }}>Reset Your Password</h1>
            <p className="reset-subtitle" style={{ marginTop: '0', textAlign: 'center' }}>
              Please enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="input-field"
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <div className="underline"></div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="input-field"
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <div className={`underline ${showRedLine ? 'error' : ''}`}></div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
            
            <p className={`submit-error ${submitError ? 'visible' : ''}`}>
              {submitError || 'Passwords do not match!'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;

