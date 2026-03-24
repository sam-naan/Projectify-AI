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
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('../../firebase-service-account.json');

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
const getUserById = async (uid) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const userRecord = await auth.getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
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
  getUserById,
  createCustomToken,
  firebaseApp
};