import { WORKLOG_ENDPOINTS } from '../config/api';
import { securityUtils } from './security';
import { validationUtils } from './validation';
import { authService } from '../services/authService';

export const apiHandler = {
  worklog: {
    async getWorklog(id) {
      try {
        const token = authService.getToken();
        const response = await fetch(WORKLOG_ENDPOINTS.ONE(id), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch worklog');
        }

        const data = await response.json();
        
        // Sanitize content before returning
        return {
          ...data,
          title: securityUtils.sanitizeInput(data.title),
          content: securityUtils.sanitizeContent(data.content),
          tag: data.tag?.map(t => securityUtils.sanitizeInput(t)) || []
        };
      } catch (error) {
        if (error.message === 'No authentication token found') {
          window.location.href = '/login';
        }
        throw error;
      }
    },

    async saveWorklog(data) {
      try {
        const token = authService.getToken();
        
        // Validate first
        const validation = validationUtils.worklog.validateContent(data);
        if (!validation.isValid) {
          // Throw validation error with structured data
          const error = new Error('Validation failed');
          error.validationErrors = validation.errors;
          throw error;
        }

        // Sanitize data
      const sanitizedData = {
        title: securityUtils.sanitizeInput(data.title),
        content: securityUtils.sanitizeContent(data.content),
        tag: data.tag?.map(t => securityUtils.sanitizeInput(t)) || [],
        collaborators: data.collaborators || [],
        media: data.media || []
      };

    

        const response = await fetch(WORKLOG_ENDPOINTS.LIST, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) {
          throw new Error('Failed to save worklog');
        }

        return response.json();
      } catch (error) {
        if (error.message === 'No authentication token found') {
          window.location.href = '/login';
        }
        throw error;
      }
    },

    async updateWorklog(id, data) {
      try {
        const token = authService.getToken();
        
        // Validate first
        const validation = validationUtils.worklog.validateContent(data);
        if (!validation.isValid) {
          // Throw validation error with structured data
          const error = new Error('Validation failed');
          error.validationErrors = validation.errors;
          throw error;
        }

        // Sanitize data
      const sanitizedData = {
        title: securityUtils.sanitizeInput(data.title),
        content: securityUtils.sanitizeContent(data.content),
        tag: data.tag?.map(t => securityUtils.sanitizeInput(t)) || [],
        collaborators: data.collaborators || [],
        media: data.media || []
      };


        const response = await fetch(WORKLOG_ENDPOINTS.ONE(id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) {
          throw new Error('Failed to update worklog');
        }

        return response.json();
      } catch (error) {
        if (error.message === 'No authentication token found') {
          window.location.href = '/login';
        }
        throw error;
      }
    }
  }
};