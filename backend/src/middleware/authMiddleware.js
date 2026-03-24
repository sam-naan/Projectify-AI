const { verifyIdToken } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Extracts user information and attaches it to req.user
 */
const authenticateFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided. Please include a Bearer token in the Authorization header.'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format. Token is missing after "Bearer".'
      });
    }

    // Verify the token
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken.isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please log in again.',
        details: decodedToken.error
      });
    }

    // Attach user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.emailVerified,
      name: decodedToken.name,
      picture: decodedToken.picture
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication.',
      details: error.message
    });
  }
};

/**
 * Middleware to check if user email is verified
 * Must be used after authenticateFirebaseToken
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated.'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email address before accessing this resource.'
    });
  }

  next();
};

/**
 * Middleware to check if user has specific role (if implementing role-based access)
 * This is a placeholder for future role-based authorization
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated.'
      });
    }

    // For now, we'll just allow all authenticated users
    // In the future, you can implement role checking here
    // Example: if (req.user.role !== role) return res.status(403).json(...)
    
    next();
  };
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
const optionalAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(idToken);
      
      if (decodedToken.isValid) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.emailVerified,
          name: decodedToken.name,
          picture: decodedToken.picture
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional authentication errors
    console.warn('Optional authentication warning:', error.message);
    next();
  }
};

/**
 * Validation middleware for authentication requests
 */
const validateAuthRequest = (req, res, next) => {
  const { email, password } = req.body;
  
  const errors = [];
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
  }
  
  next();
};

/**
 * Validation middleware for mock registration requests
 */
const validateMockRegistration = (req, res, next) => {
  const { uid, email } = req.body;
  
  const errors = [];
  
  if (!uid || typeof uid !== 'string') {
    errors.push('Valid UID is required');
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  authenticateFirebaseToken,
  requireEmailVerification,
  requireRole,
  optionalAuthentication,
  validateAuthRequest,
  validateMockRegistration
};