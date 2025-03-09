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
  Firestore
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

// Initialize Firebase app
let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} else {
  firebaseApp = getApp();
  console.log('Using existing Firebase app');
}

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

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

// Connect to emulators if in development mode
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

// Export Firebase instances
export { firebaseApp, auth, db, storage }; 