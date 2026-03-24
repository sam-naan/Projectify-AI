const express = require('express');
const router = express.Router();
const {
  register,
  loginUser,
  verifyToken,
  createCustomAuthToken,
  getCurrentUser,
  updateUserProfile,
  logoutUser
} = require('../controllers/authController');
const {
  authenticateFirebaseToken,
  validateAuthRequest,
  validateMockRegistration,
  optionalAuthentication
} = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @note    Firebase handles user creation on frontend, this is for additional setup
 */
router.post('/register', validateMockRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @note    Firebase handles login on frontend, this verifies tokens
 */
router.post('/login', validateAuthRequest, loginUser);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify Firebase ID token
 * @access  Public
 * @body    {idToken} - Firebase ID token
 */
router.post('/verify', async (req, res) => {
  // This endpoint would verify a token sent in the body
  // For now, we'll use the middleware-based verification below
  res.status(200).json({
    message: 'Use GET /api/auth/verify with Authorization header instead',
    instructions: 'Include Firebase ID token in Authorization: Bearer <token> header'
  });
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token from Authorization header and get user info
 * @access  Private (requires valid token)
 */
router.get('/verify', authenticateFirebaseToken, verifyToken);

/**
 * @route   POST /api/auth/custom-token
 * @desc    Create a custom Firebase token
 * @access  Private (requires admin privileges in production)
 * @body    {uid, additionalClaims}
 */
router.post('/custom-token', authenticateFirebaseToken, createCustomAuthToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires valid token)
 */
router.get('/me', authenticateFirebaseToken, getCurrentUser);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private (requires valid token)
 * @body    {displayName, photoURL}
 */
router.put('/me', authenticateFirebaseToken, updateUserProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (requires valid token)
 * @note    Firebase handles logout on frontend, this is for server-side cleanup
 */
router.post('/logout', authenticateFirebaseToken, logoutUser);

/**
 * @route   GET /api/auth/check
 * @desc    Check authentication status (optional authentication)
 * @access  Public
 * @returns {authenticated: boolean, user: object|null}
 */
router.get('/check', optionalAuthentication, (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        name: req.user.name
      }
    });
  }
  
  return res.status(200).json({
    authenticated: false,
    user: null,
    message: 'No valid authentication token provided'
  });
});

/**
 * @route   GET /api/auth/health
 * @desc    Check authentication service health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Authentication Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      { path: '/register', method: 'POST', description: 'Register new user' },
      { path: '/login', method: 'POST', description: 'Login user' },
      { path: '/verify', method: 'GET', description: 'Verify token' },
      { path: '/me', method: 'GET', description: 'Get user profile' },
      { path: '/check', method: 'GET', description: 'Check auth status' }
    ]
  });
});

module.exports = router;