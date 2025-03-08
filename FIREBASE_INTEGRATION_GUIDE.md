# Firebase Integration Guide for Ball Talk

## Overview

Ball Talk uses Firebase for authentication, data storage, and file storage. This guide explains how Firebase is integrated into the application and provides best practices for working with Firebase in this codebase.

## Firebase Services Used

- **Authentication**: User sign-up, sign-in, and account management
- **Firestore**: NoSQL database for storing user profiles, music tracks, and application data
- **Storage**: File storage for audio files, profile images, and verification documents

## Important Note on Firebase Configuration

The application uses **Firestore** as its primary database, not the Firebase Realtime Database. The `databaseURL` property has been removed from the Firebase configuration as it's not needed for Firestore operations.

## Firebase Initialization

Firebase is initialized in `src/lib/firebase.ts`. The configuration follows these principles:

1. Uses environment variables when available
2. Falls back to hardcoded configuration when environment variables are missing
3. Connects to Firebase emulators when in development mode and explicitly enabled

```typescript
// Example of proper Firebase initialization for Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  // No databaseURL needed for Firestore
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

## Firebase SDK Usage

The application uses two Firebase SDKs:

1. **Firebase Web SDK** (`firebase/app`, `firebase/auth`, etc.): Used primarily for web platform
2. **React Native Firebase** (`@react-native-firebase/app`, etc.): Used for native platforms

To avoid conflicts, the application conditionally imports the appropriate SDK based on the platform:

```typescript
// Conditional import example
import { Platform } from 'react-native';
const isNative = Platform.OS !== 'web';

let firestore;
if (isNative) {
  // Only import React Native Firebase for native platforms
  firestore = require('@react-native-firebase/firestore').default;
} else {
  // Use web SDK for web platform
  firestore = require('firebase/firestore');
}
```

## Firestore Data Structure

### Users Collection

```
users/
  ├── {userId}/
  │     ├── displayName: string
  │     ├── email: string
  │     ├── photoURL: string
  │     ├── role: 'athlete' | 'fan' | 'admin'
  │     ├── isVerified: boolean
  │     ├── createdAt: timestamp
  │     └── ...other profile fields
```

### Tracks Collection

```
tracks/
  ├── {trackId}/
  │     ├── title: string
  │     ├── artist: string (userId)
  │     ├── audioUrl: string
  │     ├── coverArtUrl: string
  │     ├── createdAt: timestamp
  │     ├── duration: number
  │     ├── isPublic: boolean
  │     └── ...other track metadata
```

### Athlete Verification Collection

```
athleteVerifications/
  ├── {userId}/
  │     ├── fullName: string
  │     ├── sport: string
  │     ├── team: string
  │     ├── status: 'pending' | 'approved' | 'rejected'
  │     ├── submittedAt: timestamp
  │     ├── reviewedAt: timestamp
  │     ├── reviewedBy: string (adminId)
  │     ├── idDocumentUrl: string
  │     └── proofOfCareerUrl: string
```

## Security Rules

Firestore and Storage security rules are defined in `firestore.rules` and `storage.rules` respectively. These rules enforce:

1. Authentication requirements for data access
2. Role-based access control (athletes, fans, admins)
3. Data validation
4. User ownership verification

## Best Practices

1. **Use Typed References**: Always use TypeScript interfaces for Firestore documents
2. **Batch Operations**: Use batch writes for related operations
3. **Error Handling**: Implement comprehensive error handling for all Firebase operations
4. **Offline Support**: Enable offline persistence for better user experience
5. **Security**: Never expose Firebase API keys in client-side code (use environment variables)
6. **Testing**: Use Firebase emulators for testing

## Common Issues and Solutions

### Authentication State Management

Use the `onAuthStateChanged` listener to track authentication state:

```typescript
import { auth } from '../src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log('User is signed in:', user.uid);
  } else {
    // User is signed out
    console.log('User is signed out');
  }
});
```

### Firestore Real-time Updates

Use `onSnapshot` for real-time updates:

```typescript
import { db } from '../src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const userDoc = doc(db, 'users', userId);
const unsubscribe = onSnapshot(userDoc, (snapshot) => {
  if (snapshot.exists()) {
    console.log('User data:', snapshot.data());
  } else {
    console.log('No such document!');
  }
});

// Don't forget to unsubscribe when component unmounts
// unsubscribe();
```

## Firebase Emulator Usage

For local development, you can use Firebase emulators:

1. Start emulators: `npm run emulators:start`
2. Connect to emulators by setting `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` in your `.env` file

## Deployment Considerations

1. **Environment Configuration**: Ensure proper environment variables are set for each environment
2. **Security Rules**: Deploy updated security rules before deploying application changes
3. **Indexes**: Create necessary Firestore indexes for complex queries
4. **Authentication Providers**: Enable required authentication providers in Firebase console

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security/start) 