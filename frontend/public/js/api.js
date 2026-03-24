/**
 * API Service for Projectify AI
 * Handles communication with backend API
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Set user data
     */
    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `API error: ${response.status}`);
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