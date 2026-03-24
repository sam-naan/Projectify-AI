const { auth, firestore, createCustomToken } = require('../config/firebase');

/**
 * Auth Controller
 * Handles authentication-related operations
 */

/**
 * Register a new user
 * Creates user record in Firestore
 */
const register = async (email, password, displayName = '') => {
    const firebaseConfigured = await this.isFirebaseConfigured();
    
    if (!firebaseConfigured) {
        return this.mockRegister(email, password, displayName);
    }
    
    try {
        // Step 1: Create user in Firebase Auth
        const userCredential = await firebaseFunctions.createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Set the Display Name in Firebase
        if (displayName) {
            await firebaseFunctions.updateProfile(user, { displayName });
        }

        // Step 3: Get the Token
        const token = await user.getIdToken();
        apiService.setToken(token); // Use 'token' consistently!

        // Step 4: CRITICAL - Trigger the Backend Registration
        // This ensures the user is actually stored in Firestore
        try {
            await apiService.auth.register({
                uid: user.uid,
                email: user.email,
                displayName: displayName || user.displayName,
                isMock: false // Explicitly tell backend this is a real user
            });
        } catch (backendError) {
            console.error('Auth succeeded but Firestore sync failed:', backendError);
            // Optional: Handle what happens if DB write fails but Auth worked
        }

        return {
            success: true,
            user: { uid: user.uid, email: user.email },
            message: 'Registration successful'
        };
    } catch (error) {
        return { success: false, error: this.getFirebaseErrorMessage(error) };
    }
}

/**
 * Login user
 * Note: Firebase handles login on the frontend
 * This endpoint verifies the token and returns user info
 */
const loginUser = async (req, res) => {
  try {
    const { uid } = req.body; // Pass the UID from the frontend after Firebase login

    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: userDoc.data() // Return the actual Firestore data!
    });
  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
      details: error.message
    });
  }
};

/**
 * Verify user token and return user information
 * This is the main authentication endpoint for the backend
 */
const verifyToken = async (req, res) => {
  try {
    // This middleware should be used with authenticateFirebaseToken
    // which attaches user info to req.user
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid user token provided'
      });
    }

    return res.status(200).json({
      message: 'Token verified successfully',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        name: req.user.name,
        picture: req.user.picture
      },
      authenticated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    return res.status(500).json({
      error: 'Token verification failed',
      message: 'An error occurred during token verification',
      details: error.message
    });
  }
};

/**
 * Create custom token (if needed for specific use cases)
 * This can be used to create custom tokens for specific authentication flows
 */
const createCustomAuthToken = async (req, res) => {
  try {
    const { uid, additionalClaims } = req.body;

    if (!uid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'User ID (uid) is required'
      });
    }

    const customToken = await createCustomToken(uid, additionalClaims || {});

    return res.status(200).json({
      message: 'Custom token created successfully',
      customToken,
      expiresIn: '1 hour',
      note: 'This custom token can be exchanged for an ID token on the frontend using Firebase Auth SDK'
    });

  } catch (error) {
    console.error('Custom token creation error:', error);
    
    return res.status(500).json({
      error: 'Custom token creation failed',
      message: 'An error occurred while creating custom token',
      details: error.message
    });
  }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid user token provided'
      });
    }

    // Get additional user info from Firebase Auth if needed
    let userRecord;
    try {
      userRecord = await auth.getUser(req.user.uid);
    } catch (error) {
      console.warn('Could not fetch user record from Firebase:', error.message);
    }

    const userProfile = {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      displayName: userRecord?.displayName || req.user.name,
      photoURL: userRecord?.photoURL || req.user.picture,
      metadata: userRecord ? {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      } : null
    };

    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    
    return res.status(500).json({
      error: 'Failed to get user profile',
      message: 'An error occurred while fetching user profile',
      details: error.message
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid user token provided'
      });
    }

    const { displayName, photoURL } = req.body;

    // Update user in Firebase Auth
    const updatedUser = await auth.updateUser(req.user.uid, {
      displayName: displayName || undefined,
      photoURL: photoURL || undefined
    });

    return res.status(200).json({
      message: 'User profile updated successfully',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    
    return res.status(500).json({
      error: 'Failed to update user profile',
      message: 'An error occurred while updating user profile',
      details: error.message
    });
  }
};

/**
 * Logout user
 * Note: Firebase handles logout on the frontend
 * This endpoint is for server-side cleanup if needed
 */
const logoutUser = async (req, res) => {
  try {
    // In Firebase, logout is handled on the frontend by signing out
    // Server-side, we might want to blacklist tokens or perform cleanup
    
    return res.status(200).json({
      message: 'Logout successful',
      note: 'Logout is handled by Firebase Authentication on the frontend.',
      instructions: [
        'Call Firebase Auth signOut() method on frontend',
        'Clear any stored tokens from localStorage/sessionStorage',
        'Redirect user to login page'
      ]
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    return res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
      details: error.message
    });
  }
};

module.exports = {
  register,
  loginUser,
  verifyToken,
  createCustomAuthToken,
  getCurrentUser,
  updateUserProfile,
  logoutUser
};