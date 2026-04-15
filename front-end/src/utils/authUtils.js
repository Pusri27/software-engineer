/**
 * Auth Utilities
 * Handle token validation and cleanup
 */

import { AUTH_ENDPOINTS } from "../config/api";

export const validateAndCleanupToken = async () => {
  const token = sessionStorage.getItem('token');
  
  // Jika tidak ada token, return
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    // Verify token ke backend
    const res = await fetch(AUTH_ENDPOINTS.PROFILE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      return true;
    } else if (res.status === 401) {
      // Token invalid atau expired (401 Unauthorized)
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    } else {
      // Other errors (500, 503, dll) - KEEP TOKEN
      console.warn(`⚠️ Server error (${res.status}) - keeping token`);
      return true; // Assume token still valid
    }
  } catch (err) {
    // Network error, backend down, etc - KEEP TOKEN
    console.warn('⚠️ Token verification failed (network error) - keeping token:', err.message);
    return true; // Assume token still valid
  }
};

// Logout function
export const logout = (navigate) => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  navigate('/login');
};

