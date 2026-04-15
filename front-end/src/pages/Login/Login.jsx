import './Login.css'
import logoOnly from '../../assets/Logo/Logo Only_White.png'
import textOnly from '../../assets/Logo/Text Only_White.png'
import { useNavigate } from 'react-router-dom';
import {useState, useEffect, useRef} from 'react';
import { AUTH_ENDPOINTS } from '../../config/api';
import { Loading } from '@/components/ui/loading';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  // Check if user is already logged in
  // If yes, redirect to home page (avoid staying on login page)
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  // Cursor glow effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    };

    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handle login form submit
  const handleLogin = async (e) =>{
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email, password})
      });

      const data = await res.json();
      if(res.ok){
        // Save token and user (if returned) to sessionStorage
        sessionStorage.setItem('token', data.token || '');
        if (data.user) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        // Navigate based on user role
        // If admin -> /admin page, otherwise -> home page
        const userRole = data.user?.role || 'user';
        
        // Keep loading state true, will be handled by navigation
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setErrorMessage(data.message || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error', err);
      setErrorMessage('Login failed');
      setIsLoading(false);
    }
  }

  // Handle forgot password link click
  const handleForgotPassword = () => {
    navigate('/reset-password');
  };

  return (
    <div className="app">
      {isLoading && <Loading message="Logging in..." fullScreen={true} />}
      
      <div className="login-container" ref={containerRef}>
        {/* Decorative Icons */}
        <div className="docs-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="0.17" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        
        <div className="pencil-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </div>
        
        <div className="people-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="0.22" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        
        <div className="folder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="0.38" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        
        <div className="magnifier-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="login-content">
          <div className="welcome-section">
            <img src={logoOnly} alt="Logo" className="logo-only" />
            <h1>Welcome to</h1>
            <img src={textOnly} alt="Nebwork" className="text-only" />
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email:</label>
              <input 
                type="email" 
                className="input-field"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="underline"></div>
            </div>
            
            <div className="input-group">
              <label>Password:</label>
              <input 
                type="password" 
                className="input-field"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="underline"></div>
            </div>
            
            {errorMessage && (
              <p style={{ color: "red", fontSize: "0.9em" }}>{errorMessage}</p>
            )}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
          
          <div className="forgot-password">
            Forgot password? <span className="forgot-link" onClick={handleForgotPassword}>Click here!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login
