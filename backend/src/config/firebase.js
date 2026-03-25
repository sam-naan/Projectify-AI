const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;
let auth;
let firestore;
let storage;

try {
  // Check if Firebase has already been initialized
  if (!admin.apps.length) {
    // For production, use service account from environment variable or file
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Try to parse as JSON first (for environment variables that contain the JSON string)
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Loaded service account from JSON environment variable');
      } catch (error) {
        // If parsing fails, treat it as a file path
        const fs = require('fs');
        const path = require('path');
        
        // Try multiple possible locations for the file
        const possiblePaths = [
          // Relative to this file's location (src/config)
          path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT),
          // Relative to project root (backend directory)
          path.resolve(__dirname, '../..', process.env.FIREBASE_SERVICE_ACCOUNT),
          // Relative to current working directory (where server was started)
          path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT),
          // Absolute path (if provided)
          path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
        ];
        
        let foundPath = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            foundPath = possiblePath;
            break;
          }
        }
        
        if (foundPath) {
          console.log(`✅ Loaded service account from file: ${foundPath}`);
          serviceAccount = require(foundPath);
        } else {
          console.error('❌ Service account file not found. Tried paths:', possiblePaths);
          throw new Error(`Service account file not found. Checked: ${possiblePaths.join(', ')}`);
        }
      }
    } else {
      // Fallback to default location (relative to this file)
      console.log('⚠️ No FIREBASE_SERVICE_ACCOUNT env var, using default location');
      serviceAccount = require('../../firebase-service-account.json');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://projectify-ai.firebaseio.com",
      projectId: "projectify-ai",
      storageBucket: "projectify-ai.firebasestorage.app"
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    firebaseApp = admin.app();
    console.log('✅ Using existing Firebase Admin SDK instance');
  }

  // Get Firebase services
  auth = admin.auth();
  firestore = admin.firestore();
  storage = admin.storage();

  // Firestore settings
  if (firestore) {
    firestore.settings({ ignoreUndefinedProperties: true });
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  
  // For development/testing, you can use a mock or fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Running in development mode without Firebase. Some features may not work.');
  } else {
    throw new Error('Firebase initialization failed. Check your service account credentials.');
  }
}

// Helper function to verify ID token
const verifyIdToken = async (idToken) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      isValid: true
    };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// Helper function to get user by UID
const getUserByEmail = async (email) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const userRecord = await auth.getUserByEmail(email);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      fullName: userRecord.fullName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      metadata: userRecord.metadata
    };
  } catch (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
};

// Helper function to create custom token (if needed)
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const token = await auth.createCustomToken(uid, additionalClaims);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error.message);
    throw error;
  }
};

module.exports = {
  admin,
  auth,
  firestore,
  storage,
  verifyIdToken,
  getUserByEmail,
  createCustomToken,
  firebaseApp
};