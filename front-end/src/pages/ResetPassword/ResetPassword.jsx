import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";
import "./ResetPassword.css";
import { AUTH_ENDPOINTS } from "../../config/api";
import logoWithText from "../../assets/Logo/Logo with Text_White.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email})
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsSubmitted(true);
        setCountdown(60); // Start 60 second countdown
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Error during password reset request:', err);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email})
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Email reset link sent successfully!");
        setCountdown(60); // Restart countdown
      } else {
        setError(data.message || 'Failed to resend email');
      }
    } catch (err) {
      console.error('Error during password reset request:', err);
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="app">
      <div className="login-container reset-password-container">
        <div className="login-content reset-password-content">
          {!isSubmitted ? (
            <>
              <div className="welcome-section">
                <img 
                  src={logoWithText} 
                  alt="Logo" 
                  style={{ 
                    width: '200px', 
                    marginBottom: '50px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }} 
                />
                <h1 style={{ fontWeight: '700', marginBottom: '2px', textAlign: 'center' }}>Reset Your Password</h1>
                <p className="reset-subtitle" style={{ textAlign: 'center' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="input-field"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                  <div className="underline"></div>
                </div>

                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>

                <div style={{ position: 'relative', height: '0', width: '100%' }}>
                  <p className="error-message" style={{
                    color: 'red', 
                    margin:'0', 
                    position: 'absolute',
                    top: '-20px',
                    left: '0',
                    right: '0',
                    width: '100%',
                    opacity: error ? 1 : 0,
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '0',
                    lineHeight: '1.2',
                    transition: 'opacity 0.2s ease',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }}>
                    {error || ''}
                  </p>
                </div>

                <div className="forgot-password" style={{ marginTop: '-10px' }}>
                  Remember your password?{" "}
                  <span className="forgot-link" onClick={() => navigate("/login")}>
                    Back to Login
                  </span>
                </div>
              </form>
            </>
          ) : (
            <div className="success-message-container">
              <img 
                src={logoWithText} 
                alt="Logo" 
                style={{ 
                  width: '200px', 
                  marginBottom: '40px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }} 
              />
              <div className="success-icon" style={{ marginBottom: '10px' }}>✓</div>
              <h2 className="success-title">Check Your Email</h2>
              <p className="success-message">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="success-subtitle">
                Please check your inbox and click the link to reset your password.
                If you don't see the email, check your spam folder.
              </p>
              
              <button 
                className="login-button"
                onClick={handleResendEmail}
                disabled={isLoading || countdown > 0}
                style={{
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  marginBottom: '10px',
                  opacity: countdown > 0 ? '0.5' : '1'
                }}
              >
                {isLoading ? "Resending..." : "Resend Email"}
              </button>

              <p style={{ 
                fontSize: '14px', 
                color: '#ffffff', 
                textAlign: 'center',
                marginTop: '0'
              }}>
                {countdown > 0 
                  ? `Didn't receive an email? Resend email in ${countdown} second${countdown !== 1 ? 's' : ''}`
                  : "Didn't receive an email? Click Resend Email above"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

