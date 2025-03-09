/**
 * Firebase Configuration
 * 
 * This file centralizes all Firebase configuration and initialization.
 * It provides a clean interface for the rest of the app to use Firebase services.
 */

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  Auth, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator, 
  FirebaseStorage 
} from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

/**
 * Validates Firebase configuration
 * @returns {boolean} Whether the configuration is valid
 */
const validateFirebaseConfig = (): boolean => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.warn(`Missing required Firebase configuration keys: ${missingKeys.join(', ')}`);
    console.warn('Please check your environment variables or .env file');
    
    // In development, provide more helpful information
    if (__DEV__) {
      console.info('For local development, make sure you have a .env file with the following variables:');
      console.info('EXPO_PUBLIC_FIREBASE_API_KEY');
      console.info('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
      console.info('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
      console.info('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
      console.info('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
      console.info('EXPO_PUBLIC_FIREBASE_APP_ID');
      console.info('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)');
    }
    
    return false;
  }
  
  return true;
};

/**
 * Initializes Firebase app
 * @returns {FirebaseApp} Firebase app instance
 */
const initializeFirebase = (): FirebaseApp => {
  try {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      if (!validateFirebaseConfig()) {
        throw new Error('Invalid Firebase configuration');
      }
      
      const app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
      return app;
    } else {
      const app = getApp();
      console.log('Using existing Firebase app');
      return app;
    }
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw error;
  }
};

/**
 * Initializes Firebase services
 * @param {FirebaseApp} app Firebase app instance
 * @returns {Object} Firebase services
 */
const initializeServices = (app: FirebaseApp) => {
  let auth: Auth;
  let db: Firestore;
  let storage: FirebaseStorage;

  try {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Set persistence for authentication on web
    if (Platform.OS === 'web') {
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('Firebase auth persistence set to browserLocalPersistence');
        })
        .catch((error) => {
          console.error('Error setting auth persistence:', error);
        });
    }
    
    // Enable offline persistence for Firestore
    if (Platform.OS === 'web') {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore offline persistence enabled for web');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
          } else {
            console.error('Error enabling Firestore persistence:', err);
          }
        });
    } else {
      // For native platforms
      enableIndexedDbPersistence(db).catch((err) => {
        console.error('Error enabling Firestore offline persistence:', err);
      });
    }
    
    return { auth, db, storage };
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
    throw error;
  }
};

/**
 * Connects to Firebase emulators if in development mode
 * @param {Auth} auth Firebase Auth instance
 * @param {Firestore} db Firestore instance
 * @param {FirebaseStorage} storage Firebase Storage instance
 */
const connectToEmulators = (auth: Auth, db: Firestore, storage: FirebaseStorage) => {
  const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  if (useEmulators) {
    console.log('Connecting to Firebase emulators...');
    
    // Use localhost for emulators
    const host = Platform.OS === 'web' ? 'localhost' : '10.0.2.2'; // Use 10.0.2.2 for Android emulator
    
    try {
      connectAuthEmulator(auth, `http://${host}:9099`);
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      
      console.log('Connected to Firebase emulators successfully');
    } catch (error) {
      console.error('Error connecting to Firebase emulators:', error);
    }
  } else {
    console.log('Using production Firebase services');
  }
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  firebaseApp = initializeFirebase();
  const services = initializeServices(firebaseApp);
  auth = services.auth;
  db = services.db;
  storage = services.storage;
  
  connectToEmulators(auth, db, storage);
} catch (error) {
  console.error('Fatal error initializing Firebase:', error);
  // In a real app, you might want to show a user-friendly error message
  // or fallback to a degraded mode
}

// Export Firebase instances
export { firebaseApp, auth, db, storage };

// Export helper functions for testing and advanced usage
export const firebaseHelpers = {
  validateFirebaseConfig,
  initializeFirebase,
  initializeServices,
  connectToEmulators
}; 