import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

// CRITICAL: Hardcoded Firebase configuration for when env vars fail
// This ensures the app can still authenticate in all environments
const hardcodedConfig = {
  apiKey: "AIzaSyBPxNpjlx2UGD0j1tom8-i2GOlzUekigFc",
  authDomain: "balltalkbeta.firebaseapp.com",
  projectId: "balltalkbeta",
  storageBucket: "balltalkbeta.appspot.com",
  messagingSenderId: "628814403087",
  appId: "1:628814403087:web:8fa13594e0608f5c2a357a",
  measurementId: "G-5EH47PRLZP"
  // Removed databaseURL as we're using Firestore, not Realtime Database
};

// Check if we have env vars, otherwise use hardcoded config
const hasEnvConfig = 
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY && 
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;

// Use hardcoded config directly for reliability
const firebaseConfig = hasEnvConfig ? {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  // Removed databaseURL as we're using Firestore, not Realtime Database
} : hardcodedConfig;

// Debug log for Firebase config - Show ACTUAL values for debugging
console.log('Firebase Config ACTUAL VALUES:', {
  apiKey: firebaseConfig.apiKey ? 'SET (hidden for security)' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? 'SET (hidden for security)' : 'MISSING'
  // Removed databaseURL from logging
});
console.log('Using configuration source:', hasEnvConfig ? 'Environment Variables' : 'Hardcoded Fallback');

// Initialize Firebase
console.log('Initializing Firebase app...');
let firebaseApp: FirebaseApp;
try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    firebaseApp = getApp();
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  // Fallback to a new initialization if getting the existing app fails
  firebaseApp = initializeApp(hardcodedConfig);
  console.log('Firebase app initialized with hardcoded fallback config');
}

// Initialize Firebase services
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  
  console.log('Firebase services initialized:', {
    auth: auth ? '✓ Available' : '✗ Unavailable',
    db: db ? '✓ Available' : '✗ Unavailable',
    storage: storage ? '✓ Available' : '✗ Unavailable'
  });
  
  // Connect to emulators if in development and explicitly enabled
  const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  if (useEmulators) {
    console.log('Connecting to Firebase emulators...');
    
    // Use localhost for emulators
    const host = Platform.OS === 'web' ? 'localhost' : '10.0.2.2'; // Use 10.0.2.2 for Android emulator
    
    if (auth) {
      connectAuthEmulator(auth, `http://${host}:9099`);
      console.log('Connected to Auth emulator');
    }
    
    if (db) {
      connectFirestoreEmulator(db, host, 8080);
      console.log('Connected to Firestore emulator');
    }
    
    if (storage) {
      connectStorageEmulator(storage, host, 9199);
      console.log('Connected to Storage emulator');
    }
  } else {
    console.log('Using production Firebase services');
  }
} catch (error) {
  console.error('Error initializing Firebase services:', error);
  // Initialize with default values to prevent undefined errors
  auth = getAuth();
  db = getFirestore();
  storage = getStorage();
}

// Check auth state
const currentUser = auth.currentUser;
console.log('Current auth state:', currentUser ? `User signed in: ${currentUser.uid}` : 'No user signed in');

// Export
export { firebaseApp, auth, db, storage };
