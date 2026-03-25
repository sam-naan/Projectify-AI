const express = require('express');
const router = express.Router();

// Import Controller functions
const {
  register,
  loginUser,
  verifyToken,
  createCustomAuthToken,
  getCurrentUser,
  updateUserProfile,
  logoutUser
} = require('../controllers/authController');

// Import Middleware
const {
  authenticateFirebaseToken,
  validateAuthRequest,
  validateMockRegistration,
  optionalAuthentication
} = require('../middleware/authMiddleware');

/**
 * PUBLIC ROUTES
 * These do not require a Bearer token in the header
 */

// Route for creating a new user record in Firestore
// Note: Frontend creates the Auth user first, then calls this
router.post('/register', validateMockRegistration, register);

// Route for logging in / verifying a returning user
router.post('/login', validateAuthRequest, loginUser);

// Health check to verify the auth service is reachable
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Projectify-AI Auth Service',
    timestamp: new Date().toISOString()
  });
});

/**
 * PRIVATE ROUTES
 * These REQUIRE 'Authorization: Bearer <token>' header
 */

// Verify a token and return user details
router.get('/verify', authenticateFirebaseToken, verifyToken);

// Get the current user's profile data
router.get('/me', authenticateFirebaseToken, getCurrentUser);

// Update profile details (e.g., displayName, photoURL)
router.put('/me', authenticateFirebaseToken, updateUserProfile);

// Server-side logout cleanup
router.post('/logout', authenticateFirebaseToken, logoutUser);

// Generate a custom token for specific Auth flows
router.post('/custom-token', authenticateFirebaseToken, createCustomAuthToken);

/**
 * HYBRID ROUTES
 * Checks for a token but doesn't fail if it's missing
 */
router.get('/check', optionalAuthentication, (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      user: req.user
    });
  }
  return res.status(200).json({
    authenticated: false,
    message: 'Guest session'
  });
});

module.exports = router;