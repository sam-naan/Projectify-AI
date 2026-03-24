/**
 * Firebase Authentication Service for Projectify AI
 * Handles user authentication with Firebase
 */

// Firebase configuration is now provided by the HTML script tag
// Firebase instances (will be set from window.firebase)
let firebaseApp = null;
let auth = null;
let firebaseFunctions = null;

// Initialize Firebase from window.firebase (set by HTML module)
function initializeFirebaseFromWindow() {
    try {
        if (window.firebase && window.firebase.app && window.firebase.auth) {
            firebaseApp = window.firebase.app;
            auth = window.firebase.auth;
            firebaseFunctions = window.firebase.functions || {};
            console.log('Firebase initialized from window.firebase');
            return true;
        } else {
            console.log('Firebase not available in window.firebase - using mock authentication');
            return false;
        }
    } catch (error) {
        console.warn('Firebase initialization from window failed:', error);
        return false;
    }
}

// Check if Firebase is properly configured and functional
async function isFirebaseConfigured() {
    if (!auth || !firebaseFunctions) {
        return false;
    }
    
    // Additional check: try to see if Firebase is actually functional
    // by checking if the auth object has the expected methods
    if (typeof auth.createUserWithEmailAndPassword !== 'function' &&
        (!firebaseFunctions.createUserWithEmailAndPassword || typeof firebaseFunctions.createUserWithEmailAndPassword !== 'function')) {
        console.log('Firebase auth methods not available');
        return false;
    }
    
    return true;
}

// Try to initialize immediately
let firebaseInitialized = initializeFirebaseFromWindow();

// If not initialized, try again after a delay (in case module is still loading)
if (!firebaseInitialized) {
    setTimeout(() => {
        firebaseInitialized = initializeFirebaseFromWindow();
        if (!firebaseInitialized) {
            console.log('Firebase not available after retry - using mock authentication');
        }
    }, 500);
}

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        this.usingMockAuth = false;
        
        // Try to load mock user from localStorage
        this.loadMockUserFromStorage();
        
        // Set up auth state listener only if Firebase is properly configured
        // We'll check this asynchronously to avoid Firebase auth state interfering with mock auth
        this.checkAndSetupFirebaseAuthListener();
    }
    
    /**
     * Load mock user from localStorage if available
     */
    loadMockUserFromStorage() {
        try {
            const storedUser = localStorage.getItem('projectify_mock_user');
            const storedToken = localStorage.getItem('projectify_mock_token');
            
            if (storedUser && storedToken) {
                const user = JSON.parse(storedUser);
                this.currentUser = user;
                this.usingMockAuth = true;
                
                // Set token and user in API service
                apiService.setToken(storedToken);
                apiService.setUser(user);
                
                console.log('Mock user loaded from localStorage:', user.email);
                this.notifyAuthListeners();
            }
        } catch (error) {
            console.warn('Error loading mock user from localStorage:', error);
        }
    }
    
    /**
     * Save mock user to localStorage
     */
    saveMockUserToStorage(user, token) {
        try {
            localStorage.setItem('projectify_mock_user', JSON.stringify(user));
            localStorage.setItem('projectify_mock_token', token);
        } catch (error) {
            console.warn('Error saving mock user to localStorage:', error);
        }
    }
    
    /**
     * Clear mock user from localStorage
     */
    clearMockUserFromStorage() {
        try {
            localStorage.removeItem('projectify_mock_user');
            localStorage.removeItem('projectify_mock_token');
        } catch (error) {
            console.warn('Error clearing mock user from localStorage:', error);
        }
    }
    
    /**
     * Check if Firebase is configured and set up auth state listener if it is
     */
    async checkAndSetupFirebaseAuthListener() {
        const isConfigured = await this.isFirebaseConfigured();
        
        if (isConfigured && auth) {
            console.log('Firebase is configured, setting up auth state listener');
            auth.onAuthStateChanged((user) => {
                // Only process Firebase auth state changes if we're not using mock auth
                if (!this.usingMockAuth) {
                    this.currentUser = user;
                    this.notifyAuthListeners();
                    
                    if (user) {
                        console.log('Firebase user signed in:', user.email);
                        this.getUserToken().then(token => {
                            if (token) {
                                apiService.setToken(token);
                                apiService.setUser({
                                    uid: user.uid,
                                    email: user.email,
                                    displayName: user.displayName,
                                    photoURL: user.photoURL
                                });
                            }
                        });
                    } else {
                        console.log('Firebase user signed out');
                        apiService.clearAuth();
                    }
                } else {
                    console.log('Using mock authentication, ignoring Firebase auth state change');
                }
            });
        } else {
            console.log('Firebase not configured or not available, using mock authentication');
            this.usingMockAuth = true;
        }
    }

    /**
     * Check if Firebase is properly configured and functional
     */
    async isFirebaseConfigured() {
        if (!auth || !firebaseFunctions) {
            return false;
        }
        
        // Additional check: try to see if Firebase is actually functional
        // by checking if the auth object has the expected methods
        if (typeof auth.createUserWithEmailAndPassword !== 'function' &&
            (!firebaseFunctions.createUserWithEmailAndPassword || typeof firebaseFunctions.createUserWithEmailAndPassword !== 'function')) {
            console.log('Firebase auth methods not available');
            return false;
        }
        
        return true;
    }

    /**
     * Register auth state change listener
     */
    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        // Call immediately with current state
        callback(this.currentUser);
    }

    /**
     * Notify all auth listeners
     */
    notifyAuthListeners() {
        this.authListeners.forEach(callback => {
            callback(this.currentUser);
        });
    }

    /**
     * Get Firebase ID token
     */
    async getUserToken() {
        if (!this.currentUser) return null;
        
        try {
            const token = await this.currentUser.getIdToken();
            return token;
        } catch (error) {
            console.error('Error getting user token:', error);
            return null;
        }
    }

    /**
     * Register new user with email/password
     */
    async register(email, password, displayName = '') {
        // First check if Firebase is properly configured and functional
        const firebaseConfigured = await this.isFirebaseConfigured();
        
        if (!firebaseConfigured) {
            console.log('Firebase not properly configured, using mock authentication');
            return this.mockRegister(email, password, displayName);
        }
        
        // Firebase appears to be configured, try to use it
        try {
            // Try Firebase registration
            const userCredential = await firebaseFunctions.createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with display name
            if (displayName) {
                await firebaseFunctions.updateProfile(user, {
                    displayName: displayName
                });
            }

            // Get token and set in API service
            const token = await user.getIdToken();
            apiService.setToken(token);
            apiService.setUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            });

            // Verify token with backend
            try {
                await apiService.auth.verifyToken(token);
            } catch (backendError) {
                console.warn('Backend token verification failed:', backendError);
            }

            console.log('User registered successfully with Firebase:', user.email);
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                },
                message: 'Registration successful with Firebase'
            };
        } catch (firebaseError) {
            // Firebase failed - check if it's a configuration error
            console.warn('Firebase registration failed:', firebaseError);
            
            // Check if it's a configuration error (like auth/configuration-not-found)
            if (firebaseError.code === 'auth/configuration-not-found' ||
                firebaseError.code === 'auth/api-key-not-valid' ||
                firebaseError.code === 'auth/network-request-failed' ||
                firebaseError.message.includes('configuration') ||
                firebaseError.message.includes('API key') ||
                firebaseError.message.includes('network')) {
                console.log('Firebase configuration or network error detected, falling back to mock authentication');
                // Fall back to mock authentication
                return this.mockRegister(email, password, displayName);
            } else {
                // Other Firebase error (like email already in use, weak password, etc.)
                console.error('Firebase registration error:', firebaseError);
                return {
                    success: false,
                    error: this.getFirebaseErrorMessage(firebaseError),
                    message: 'Registration failed: ' + (firebaseError.message || 'Unknown error')
                };
            }
        }
    }

    /**
     * Login user with email/password
     */
    async login(email, password) {
        // First check if Firebase is properly configured and functional
        const firebaseConfigured = await this.isFirebaseConfigured();
        
        if (!firebaseConfigured) {
            console.log('Firebase not properly configured, using mock authentication');
            return this.mockLogin(email, password);
        }
        
        // Firebase appears to be configured, try to use it
        try {
            // Try Firebase login
            const userCredential = await firebaseFunctions.signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get token and set in API service
            const token = await user.getIdToken();
            apiService.setToken(token);
            apiService.setUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            });

            // Verify token with backend
            try {
                await apiService.auth.verifyToken(token);
            } catch (backendError) {
                console.warn('Backend token verification failed:', backendError);
            }

            console.log('User logged in successfully with Firebase:', user.email);
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                },
                message: 'Login successful with Firebase'
            };
        } catch (firebaseError) {
            // Firebase failed - check if it's a configuration error
            console.warn('Firebase login failed:', firebaseError);
            
            // Check if it's a configuration error (like auth/configuration-not-found)
            if (firebaseError.code === 'auth/configuration-not-found' ||
                firebaseError.code === 'auth/api-key-not-valid' ||
                firebaseError.code === 'auth/network-request-failed' ||
                firebaseError.message.includes('configuration') ||
                firebaseError.message.includes('API key') ||
                firebaseError.message.includes('network')) {
                console.log('Firebase configuration or network error detected, falling back to mock authentication');
                // Fall back to mock authentication
                return this.mockLogin(email, password);
            } else {
                // Other Firebase error (like wrong password, user not found, etc.)
                console.error('Firebase login error:', firebaseError);
                return {
                    success: false,
                    error: this.getFirebaseErrorMessage(firebaseError),
                    message: 'Login failed: ' + (firebaseError.message || 'Unknown error')
                };
            }
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            if (auth && firebaseFunctions && firebaseFunctions.signOut && !this.usingMockAuth) {
                await firebaseFunctions.signOut(auth);
            }
            
            apiService.clearAuth();
            this.currentUser = null;
            this.usingMockAuth = false;
            
            // Clear mock user from localStorage
            this.clearMockUserFromStorage();
            
            this.notifyAuthListeners();
            
            return {
                success: true,
                message: 'Logout successful'
            };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Logout failed'
            };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get Firebase error message
     */
    getFirebaseErrorMessage(error) {
        const errorCode = error.code;
        
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered.';
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled.';
            case 'auth/weak-password':
                return 'Password is too weak.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return error.message || 'An unknown error occurred.';
        }
    }

    /**
     * Mock registration for development (when Firebase is not configured)
     */
    async mockRegister(email, password, displayName) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!email || !password) {
            return {
                success: false,
                error: 'Email and password are required',
                message: 'Validation failed'
            };
        }
        
        if (password.length < 6) {
            return {
                success: false,
                error: 'Password must be at least 6 characters',
                message: 'Validation failed'
            };
        }
        
        // Create mock user
        const mockUser = {
          uid: 'mock-uid-' + Date.now(),
          email: email,
          displayName: displayName || 'User',
          photoURL: null
        };
        
        // Set mock token and user
        const mockToken = 'mock-token-' + Date.now();
        
        // Register mock user in backend Firestore
        try {
          const response = await apiService.auth.register({
            uid: mockUser.uid,
            email: mockUser.email,
            displayName: mockUser.displayName
          });
          
          console.log('Mock user registered in Firestore:', response);
        } catch (error) {
          console.error('Error registering mock user:', error);
          // Continue anyway since this is mock auth
        }
        
        apiService.setToken(mockToken);
        apiService.setUser(mockUser);
        
        this.currentUser = mockUser;
        this.usingMockAuth = true;
        
        // Save to localStorage for persistence
        this.saveMockUserToStorage(mockUser, mockToken);
        
        this.notifyAuthListeners();
        
        return {
            success: true,
            user: mockUser,
            message: 'Mock registration successful (Firebase not configured)'
        };
    }

    /**
     * Mock login for development (when Firebase is not configured)
     */
    async mockLogin(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!email || !password) {
            return {
                success: false,
                error: 'Email and password are required',
                message: 'Validation failed'
            };
        }
        
        // Create mock user
        const mockUser = {
          uid: 'mock-uid-12345',
          email: email,
          displayName: 'Demo User',
          photoURL: null
        };
        
        // Set mock token and user
        const mockToken = 'mock-token-12345';
        
        // Register mock user in backend Firestore if not already registered
        try {
          const response = await apiService.auth.register({
            uid: mockUser.uid,
            email: mockUser.email,
            displayName: mockUser.displayName
          });
          
          console.log('Mock user registered in Firestore:', response);
        } catch (error) {
          console.error('Error registering mock user:', error);
          // Continue anyway since this is mock auth
        }
        
        apiService.setToken(mockToken);
        apiService.setUser(mockUser);
        
        this.currentUser = mockUser;
        this.usingMockAuth = true;
        
        // Save to localStorage for persistence
        this.saveMockUserToStorage(mockUser, mockToken);
        
        this.notifyAuthListeners();
        
        return {
            success: true,
            user: mockUser,
            message: 'Mock login successful (Firebase not configured)'
        };
    }
}

// Create singleton instance
const authService = new AuthService();

// Global functions for HTML forms
window.handleRegister = async (name, email, password) => {
    const statusEl = document.getElementById('authStatus');
    
    try {
        // Show loading state
        if (statusEl) {
            statusEl.textContent = 'Creating account...';
            statusEl.className = 'auth-status info';
            statusEl.style.display = 'block';
        }
        
        const result = await authService.register(email, password, name);
        
        if (result.success) {
            if (statusEl) {
                statusEl.textContent = 'Account created successfully! Redirecting...';
                statusEl.className = 'auth-status success';
            }
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            if (statusEl) {
                statusEl.textContent = result.error || 'Registration failed';
                statusEl.className = 'auth-status error';
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (statusEl) {
            statusEl.textContent = 'An unexpected error occurred';
            statusEl.className = 'auth-status error';
        }
    }
};

window.handleLogin = async (email, password) => {
    const statusEl = document.getElementById('authStatus');
    
    try {
        // Show loading state
        if (statusEl) {
            statusEl.textContent = 'Logging in...';
            statusEl.className = 'auth-status info';
            statusEl.style.display = 'block';
        }
        
        const result = await authService.login(email, password);
        
        if (result.success) {
            if (statusEl) {
                statusEl.textContent = 'Login successful! Redirecting...';
                statusEl.className = 'auth-status success';
            }
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            if (statusEl) {
                statusEl.textContent = result.error || 'Login failed';
                statusEl.className = 'auth-status error';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (statusEl) {
            statusEl.textContent = 'An unexpected error occurred';
            statusEl.className = 'auth-status error';
        }
    }
};

// Export for use in other files
window.authService = authService;