// Centralized token management
export const authService = {
  getToken() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  },

  setToken(token) {
    if (token) {
      sessionStorage.setItem('token', token);
    }
  },

  removeToken() {
    sessionStorage.removeItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};