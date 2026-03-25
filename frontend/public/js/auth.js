/**
 * Firebase Authentication Service for Projectify AI
 * Handles user authentication and backend synchronization
 */

let firebaseApp = null;
let auth = null;
let firebaseFunctions = null;

// 1. Initialization Logic
function initializeFirebaseFromWindow() {
    try {
        if (window.firebase && window.firebase.app && window.firebase.auth) {
            firebaseApp = window.firebase.app;
            auth = window.firebase.auth;
            firebaseFunctions = window.firebase.functions || {};
            console.log('Firebase initialized successfully from window');
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
        return false;
    }
}

// Initial attempt
let firebaseInitialized = initializeFirebaseFromWindow();

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        this.usingMockAuth = false;
        
        this.checkAndSetupFirebaseAuthListener();
    }

    async checkAndSetupFirebaseAuthListener() {
        // Wait briefly to ensure Firebase SDK is fully ready
        if (!firebaseInitialized) {
            await new Promise(resolve => setTimeout(resolve, 500));
            firebaseInitialized = initializeFirebaseFromWindow();
        }

        if (firebaseInitialized && auth) {
            auth.onAuthStateChanged(async (user) => {
                if (!this.usingMockAuth) {
                    this.currentUser = user;
                    
                    if (user) {
                        console.log('Firebase user detected:', user.email);
                        const token = await user.getIdToken();
                        apiService.setToken(token);
                        apiService.setUser({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        });
                    } else {
                        // FLICKER FIX: Only redirect if the user is on a protected page (like dashboard)
                        const protectedPages = ['dashboard.html', 'projects.html', 'profile.html'];
                        const isProtected = protectedPages.some(page => window.location.pathname.includes(page));
                        
                        if (isProtected) {
                            console.log('No session found, redirecting to login...');
                            window.location.href = 'login.html';
                        }
                        apiService.clearAuth();
                    }
                    this.notifyAuthListeners();
                }
            });
        } else {
            console.log('Firebase not detected, defaulting to Mock Auth');
            this.usingMockAuth = true;
        }
    }

    async isFirebaseConfigured() {
        return firebaseInitialized && typeof auth.signInWithEmailAndPassword === 'function';
    }

    async register(email, password, displayName = '') {
    try {
        // Check if Firebase auth is available
        if (!auth || typeof auth.createUserWithEmailAndPassword !== 'function') {
            throw new Error('Firebase Auth not available');
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (displayName) {
            await user.updateProfile({ displayName });
        }

        const token = await user.getIdToken();
        apiService.setToken(token);

        await apiService.auth.register({
            uid: user.uid,
            fullName: displayName || user.displayName,
            email: user.email,
            password: password
        });

        return { success: true, user };
    } catch (error) {
        console.error("Firebase registration error:", error.code, error.message);
        return { success: false, error: this.getFirebaseErrorMessage(error) };
    }
}

    async login(email, password) {
        if (this.usingMockAuth) return this.mockLogin(email, password);

        try {
            // Check if Firebase auth is available
            if (!auth || typeof auth.signInWithEmailAndPassword !== 'function') {
                throw new Error('Firebase Auth not available');
            }
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            const token = await user.getIdToken();
            
            apiService.setToken(token);
            apiService.setUser({
                fullName: user.displayName,       // collected from registerName input
                email: user.email
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: this.getFirebaseErrorMessage(error) };
        }
    }

    notifyAuthListeners() {
        this.authListeners.forEach(callback => callback(this.currentUser));
    }

    getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use': return 'Email already registered.';
            case 'auth/weak-password': return 'Password is too weak (min 6 chars).';
            case 'auth/configuration-not-found': return 'Firebase Auth not enabled in Console.';
            default: return error.message;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        // Check Firebase auth directly (most reliable)
        if (window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
            return true;
        }
        
        // Check if we have a current user from Firebase auth listener
        if (this.currentUser) {
            return true;
        }
        
        // Check apiService for token-based authentication
        if (typeof apiService !== 'undefined' && apiService && apiService.isAuthenticated) {
            return apiService.isAuthenticated();
        }
        
        return false;
    }

    /**
     * Wait for authentication state to be determined
     * @param {number} timeoutMs Maximum time to wait in milliseconds (default: 5000ms)
     * @returns {Promise<boolean>} Promise that resolves to true if authenticated, false if not
     */
    waitForAuthState(timeoutMs = 5000) {
        return new Promise((resolve) => {
            // If auth state is already known, resolve immediately
            if (this.isAuthenticated()) {
                resolve(true);
                return;
            }
            
            // Check if Firebase auth is already available with a user
            if (window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
                resolve(true);
                return;
            }
            
            // Declare listener variable before timeout so it's in scope
            let listener = null;
            
            // Set up a timeout
            const timeoutId = setTimeout(() => {
                // Clean up listener
                if (listener) {
                    const index = this.authListeners.indexOf(listener);
                    if (index > -1) this.authListeners.splice(index, 1);
                }
                resolve(false);
            }, timeoutMs);
            
            // Add a listener for auth state changes
            listener = (user) => {
                if (user) {
                    clearTimeout(timeoutId);
                    // Clean up listener
                    const index = this.authListeners.indexOf(listener);
                    if (index > -1) this.authListeners.splice(index, 1);
                    resolve(true);
                }
            };
            
            this.authListeners.push(listener);
            
            // Also check if we're using mock auth
            if (this.usingMockAuth) {
                clearTimeout(timeoutId);
                resolve(false);
            }
        });
    }

    /**
     * Logout the current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Clear Firebase auth if available
            if (window.firebase && window.firebase.auth && window.firebase.auth.signOut) {
                await window.firebase.auth.signOut();
            }
            
            // Clear apiService authentication
            if (typeof apiService !== 'undefined' && apiService && apiService.clearAuth) {
                apiService.clearAuth();
            }
            
            // Clear local state
            this.currentUser = null;
            this.usingMockAuth = false;
            
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if there's an error, clear local state
            this.currentUser = null;
            if (typeof apiService !== 'undefined' && apiService && apiService.clearAuth) {
                apiService.clearAuth();
            }
        }
    }

    // ... (Your existing Mock Methods here) ...
}

const authService = new AuthService();

// --- GLOBAL EXPORTS (Fixes the "Not a function" error) ---

window.handleRegister = async (fullName, email, password) => {
    const statusEl = document.getElementById('authStatus');
    if (statusEl) {
        statusEl.textContent = 'Creating account...';
        statusEl.style.display = 'block';
    }

    // ✅ Pass arguments in the correct order: (email, password, displayName)
    const result = await authService.register(email, password, fullName);

    if (result.success) {
        if (statusEl) statusEl.textContent = 'Success! Redirecting...';
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } else {
        if (statusEl) statusEl.textContent = result.error;
    }
};

window.handleLogin = async (email, password) => {
    const statusEl = document.getElementById('authStatus');
    if (statusEl) {
        statusEl.textContent = 'Logging in...';
        statusEl.style.display = 'block';
    }

    const result = await authService.login(email, password);
    
    if (result.success) {
        if (statusEl) statusEl.textContent = 'Welcome back! Redirecting...';
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } else {
        if (statusEl) statusEl.textContent = result.error;
    }
};

window.authService = authService;