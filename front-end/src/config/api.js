// Centralized API Configuration
// Update BASE_URL here to change all API endpoints globally

const BASE_URL = 'http://127.0.0.1:5001';
// const BASE_URL = 'https://nebwork-backend-fx667.ondigitalocean.app';
// const BASE_URL = 'https://test-dev-lw9pz.ondigitalocean.app';

// AUTH ENDPOINTS
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/auth/login`,
  LOGOUT: `${BASE_URL}/api/auth/logout`,
  PROFILE: `${BASE_URL}/api/auth/profile`,
  FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password  `,
};

// WORKLOG ENDPOINTS
export const WORKLOG_ENDPOINTS = {
  LIST: `${BASE_URL}/api/worklogs`,                    // GET all, POST create
  ONE: (id) => `${BASE_URL}/api/worklogs/${id}`,       // GET, PUT, DELETE single
  FILTER: `${BASE_URL}/api/worklogs/filter`,           // GET user logs
  SUMMARIZE: `${BASE_URL}/api/worklogs/summarize`,     // POST AI summary of worklogs
  RELATED: (id) => `${BASE_URL}/api/worklogs/${id}/related`, // GET semantically similar
  MY_STATS: `${BASE_URL}/api/worklogs/my-stats`,       // GET personal activity stats
  VERSIONS: (id) => `${BASE_URL}/api/worklogs/${id}/versions`, // GET, POST versions
  LOGHISTORY_ONE: (id) => `${BASE_URL}/api/worklogs/loghistory/${id}`, // GET Single Log
};

// ADMIN ENDPOINTS
export const ADMIN_ENDPOINTS = {
  EMPLOYEES: `${BASE_URL}/api/admin/employees`,                // GET all, DELETE user
  EMPLOYEE: (id) => `${BASE_URL}/api/admin/employees/${id}`,   // GET single user
  TOGGLE_STATUS: (id) => `${BASE_URL}/api/admin/employees/${id}/toggle-status`,
  VERSION: (id) => `${BASE_URL}/api/admin/employees/${id}/versions`,
  ANALYTICS: `${BASE_URL}/api/admin/analytics`,               // GET division analytics
};

// CHATBOT ENDPOINTS
export const CHATBOT_ENDPOINTS = {
  SEND_MESSAGE: `${BASE_URL}/api/chatbot`,
  GET_MESSAGES: (sessionId) => `${BASE_URL}/api/chatbot/session/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${BASE_URL}/api/chatbot/session/${sessionId}`,
  GET_HISTORY: `${BASE_URL}/api/chatbot/history`,
};

// UPLOAD ENDPOINTS
export const UPLOAD_ENDPOINTS = {
  SINGLE: `${BASE_URL}/api/upload`,
  MULTIPLE: `${BASE_URL}/api/upload/multiple`,
  DELETE: `${BASE_URL}/api/upload`,
  DELETE_MULTIPLE: `${BASE_URL}/api/upload/multiple`,
};

// REACTION ENDPOINTS
export const REACTION_ENDPOINTS = {
  GET: (worklogId) => `${BASE_URL}/api/reactions/${worklogId}`,    // GET reactions for worklog
  TOGGLE: (worklogId) => `${BASE_URL}/api/reactions/${worklogId}`, // POST toggle/replace reaction
};

// COMMENT ENDPOINTS
export const COMMENT_ENDPOINTS = {
  GET: (worklogId) => `${BASE_URL}/api/comments/${worklogId}`,
  ADD: (worklogId) => `${BASE_URL}/api/comments/${worklogId}`,
  REPLY: (worklogId, commentId) => `${BASE_URL}/api/comments/${worklogId}/reply/${commentId}`,
  DELETE: (commentId) => `${BASE_URL}/api/comments/${commentId}`,
};

// Export base URL for direct use
export default BASE_URL;


