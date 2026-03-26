/**
 * API Service for Projectify AI
 * Handles communication with backend API
 */

// Determine API base URL based on current environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost) or production
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If running on localhost, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5001/api';
  }
  
  // If running on Netlify, use production backend URL
  // TODO: Replace with actual production backend URL when deployed
  if (hostname === 'projectify-ai.netlify.app') {
    // For now, we'll use a placeholder - you need to deploy your backend
    // and update this URL to point to your production backend
    console.warn('Using placeholder production URL. Please update with actual backend URL.');
    return 'https://projectify-ai-backend.onrender.com/api'; // Example placeholder
  }
  
  // Default fallback (for other deployments)
  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
    constructor() {
        this.token = null;
        this.user = null;
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Set user data
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
    }

    /**
     * Get authentication headers
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

 /**
 * Make API request
 */
async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: this.getHeaders(!options.public),
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        // Handle 401 Unauthorized
        if (response.status === 401 && !options.public) {
            this.clearAuth();
            window.location.href = 'index.html';
            throw new Error('Session expired. Please log in again.');
        }

        // Safely parse JSON only if content-type is JSON
        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok) {
            const message = (data && data.message) ? data.message : `API error: ${response.status}`;
            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.request('/health', { public: true });
            return response;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Authentication API methods
     */
    auth = {
        // Register user with backend
        register: async (userData) => {
            return await apiService.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                public: true
            });
        },

        // Verify token with backend
        verifyToken: async (token) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                return await response.json();
            } catch (error) {
                throw error;
            }
        },

        // Check authentication status
        checkAuth: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/check`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return await response.json();
            } catch (error) {
                throw error;
            }
        },

        // Get user profile
        getProfile: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiService.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                return await response.json();
            } catch (error) {
                throw error;
            }
        }
    };

    /**
     * Projects API methods
     */
    projects = {
        // Get all projects
        getAll: async () => {
            return await apiService.request('/projects');
        },

        // Get project by ID
        getById: async (id) => {
            return await apiService.request(`/projects/${id}`);
        },

        // Create project
        create: async (projectData) => {
            return await apiService.request('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
        },

        // Update project
        update: async (id, projectData) => {
            return await apiService.request(`/projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(projectData)
            });
        },

        // Delete project
        delete: async (id) => {
            return await apiService.request(`/projects/${id}`, {
                method: 'DELETE'
            });
        },

        // Analyze project with AI
        analyze: async (id) => {
            return await apiService.request(`/projects/${id}/analyze`, {
                method: 'POST'
            });
        },

        // Get AI status
        getAIStatus: async () => {
            return await apiService.request('/projects/ai/status', { public: true });
        }
    };
}

// Create singleton instance
const apiService = new ApiService();

// Export for use in other files
window.apiService = apiService;