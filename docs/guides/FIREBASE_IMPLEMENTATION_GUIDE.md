# Firebase Implementation Guide for BallTalk App

This guide provides detailed instructions for implementing and using Firebase in the BallTalk audio app. It covers authentication, Firestore database, and Storage, with a focus on best practices for audio file handling.

## Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Authentication](#authentication)
3. [Firestore Database](#firestore-database)
4. [Firebase Storage](#firebase-storage)
5. [Offline Support](#offline-support)
6. [Security Rules](#security-rules)
7. [Testing](#testing)
8. [Deployment](#deployment)

## Firebase Setup

### Project Configuration

The BallTalk app is already configured to use Firebase with the following services:
- Authentication
- Firestore Database
- Storage

The configuration is in `config/firebase.ts`:

```typescript
// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

### Environment Variables

For local development, create a `.env` file with your Firebase configuration:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Authentication

### User Authentication Flow

The BallTalk app supports multiple authentication methods:
- Email/Password
- Google Sign-In
- Apple Sign-In

#### Email/Password Authentication

```typescript
// Sign up with email/password
async signUpWithEmail(email: string, password: string, username?: string, role: 'athlete' | 'fan' = 'fan'): Promise<FirebaseUser | null> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    await this.createUserProfile(userCredential.user.uid, {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: username || userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      role,
      isVerified: false,
      createdAt: serverTimestamp()
    });
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: username || userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      role,
      isVerified: false
    };
  } catch (error) {
    console.error('Error signing up with email:', error);
    return null;
  }
}

// Sign in with email/password
async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await this.getUserDocument(userCredential.user.uid);
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      role: userDoc?.role || 'fan',
      isVerified: userDoc?.isVerified || false
    };
  } catch (error) {
    console.error('Error signing in with email:', error);
    return null;
  }
}
```

### User Profiles

User profiles are stored in Firestore with the following structure:

```typescript
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'athlete' | 'fan' | 'admin';
  isVerified: boolean;
  createdAt?: any;
  bio?: string;
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
  };
  preferences?: {
    notifications: boolean;
    privacy: 'public' | 'private';
    theme: 'light' | 'dark' | 'system';
  };
}
```

## Firestore Database

### Data Structure

The BallTalk app uses the following Firestore collections:

1. **users**: User profiles
2. **songs**: Audio tracks uploaded by athletes
3. **playlists**: User-created playlists
4. **comments**: Comments on songs
5. **verifications**: Athlete verification requests

### Song Data Model

```typescript
interface Song {
  id: string;
  artistId: string;
  title: string;
  genre: string;
  description?: string;
  releaseDate: string;
  fileUrl: string;
  duration: number;
  coverArtUrl?: string;
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  lyrics?: string;
  collaborators?: string[];
  isProcessed?: boolean;
  processingData?: {
    equalizer?: any;
    compression?: any;
    effects?: any;
  };
}
```

### CRUD Operations

#### Creating a Song

```typescript
async uploadSong(
  artistId: string,
  title: string,
  genre: string,
  audioFile: Blob,
  coverArt?: Blob,
  songData?: Partial<Song>
): Promise<Song | null> {
  try {
    const songId = uuidv4();
    const now = new Date().toISOString();

    // Upload audio file to storage
    const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
    await uploadBytes(audioRef, audioFile);
    const fileUrl = await getDownloadURL(audioRef);

    // Upload cover art if provided
    let coverArtUrl = '';
    if (coverArt) {
      const coverArtRef = ref(storage, `songs/${artistId}/${songId}/cover.jpg`);
      await uploadBytes(coverArtRef, coverArt);
      coverArtUrl = await getDownloadURL(coverArtRef);
    }

    // Create song object
    const newSong: Song = {
      id: songId,
      artistId,
      title,
      genre,
      releaseDate: now,
      fileUrl,
      duration: 0, // This would be calculated from the audio file
      visibility: 'public',
      createdAt: now,
      updatedAt: now,
      ...(coverArtUrl && { coverArtUrl }),
      ...songData
    };

    // Save to Firestore
    await setDoc(doc(db, 'songs', songId), newSong);
    
    return newSong;
  } catch (error) {
    console.error('Error uploading song:', error);
    return null;
  }
}
```

#### Reading Songs

```typescript
async getSongsByArtist(artistId: string): Promise<Song[]> {
  try {
    const songsQuery = query(
      collection(db, 'songs'),
      where('artistId', '==', artistId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(songsQuery);
    const songs: Song[] = [];
    
    querySnapshot.forEach((doc) => {
      songs.push(doc.data() as Song);
    });
    
    return songs;
  } catch (error) {
    console.error('Error getting songs by artist:', error);
    return [];
  }
}
```

## Firebase Storage

### Audio File Storage

Audio files are stored in Firebase Storage with the following structure:
- `songs/{artistId}/{songId}/audio.mp3`: The audio file
- `songs/{artistId}/{songId}/cover.jpg`: The cover art (if provided)

### Uploading Audio Files

```typescript
async uploadAudioFile(artistId: string, songId: string, audioFile: Blob): Promise<string> {
  try {
    const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
    await uploadBytes(audioRef, audioFile);
    const fileUrl = await getDownloadURL(audioRef);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
}
```

### Downloading Audio Files

```typescript
async getAudioFileUrl(artistId: string, songId: string): Promise<string> {
  try {
    const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
    const fileUrl = await getDownloadURL(audioRef);
    return fileUrl;
  } catch (error) {
    console.error('Error getting audio file URL:', error);
    throw error;
  }
}
```

## Offline Support

### Enabling Offline Persistence

To enable offline support for Firestore, add the following to your Firebase initialization:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
  console.log('Offline persistence enabled');
} catch (error) {
  console.error('Error enabling offline persistence:', error);
}
```

### Handling Offline Audio Uploads

To handle offline audio uploads, you can use the `OfflineStorageService` and `SyncService`:

```typescript
// Store pending uploads
async storePendingUpload(
  artistId: string,
  title: string,
  genre: string,
  audioFilePath: string,
  coverArtPath?: string,
  additionalData?: any
): Promise<string> {
  const uploadId = uuidv4();
  const pendingUpload = {
    id: uploadId,
    artistId,
    title,
    genre,
    audioFilePath,
    coverArtPath,
    additionalData,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  await AsyncStorage.setItem(
    `pendingUpload_${uploadId}`,
    JSON.stringify(pendingUpload)
  );
  
  return uploadId;
}

// Sync pending uploads when online
async syncPendingUploads(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const pendingUploadKeys = keys.filter(key => key.startsWith('pendingUpload_'));
  
  for (const key of pendingUploadKeys) {
    const pendingUploadJson = await AsyncStorage.getItem(key);
    if (pendingUploadJson) {
      const pendingUpload = JSON.parse(pendingUploadJson);
      
      try {
        // Read the audio file from local storage
        const audioFile = await FileSystem.readAsStringAsync(pendingUpload.audioFilePath, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        // Convert base64 to blob
        const audioBlob = this.base64ToBlob(audioFile, 'audio/mp3');
        
        // Upload the song
        let coverArtBlob;
        if (pendingUpload.coverArtPath) {
          const coverArt = await FileSystem.readAsStringAsync(pendingUpload.coverArtPath, {
            encoding: FileSystem.EncodingType.Base64
          });
          coverArtBlob = this.base64ToBlob(coverArt, 'image/jpeg');
        }
        
        await songService.uploadSong(
          pendingUpload.artistId,
          pendingUpload.title,
          pendingUpload.genre,
          audioBlob,
          coverArtBlob,
          pendingUpload.additionalData
        );
        
        // Remove the pending upload
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error syncing pending upload:', error);
      }
    }
  }
}
```

## Security Rules

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Don't allow deletion of user profiles
    }
    
    // Songs
    match /songs/{songId} {
      allow read: if resource.data.visibility == 'public' || 
                   (request.auth != null && resource.data.artistId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.artistId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.artistId == request.auth.uid;
    }
    
    // Playlists
    match /playlists/{playlistId} {
      allow read: if resource.data.isPublic || 
                   (request.auth != null && resource.data.userId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Comments
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      get(/databases/$(database)/documents/songs/$(resource.data.songId)).data.artistId == request.auth.uid);
    }
  }
}
```

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Audio files
    match /songs/{artistId}/{songId}/{fileName} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && request.auth.uid == artistId;
      allow delete: if request.auth != null && request.auth.uid == artistId;
    }
    
    // User profile images
    match /users/{userId}/{fileName} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing

### Testing with Firebase Emulators

For local development and testing, use Firebase emulators:

```bash
# Start Firebase emulators
npm run test:firebase
```

This will start the Firebase emulators for:
- Authentication (port 9099)
- Firestore (port 8080)
- Storage (port 9199)

### Testing Authentication

1. Start the app with Firebase emulators
2. Test user registration:
   - Create a new account with email and password
   - Verify that the account is created in the Auth emulator
3. Test user login:
   - Log in with the test athlete account: `athlete@example.com` / `password123`
   - Verify that you can access athlete-specific features

### Testing Audio Upload and Playback

1. Start the app with Firebase emulators
2. Log in with the test athlete account
3. Upload an audio file:
   - Navigate to the upload screen
   - Select an audio file
   - Add title, genre, and other metadata
   - Upload the file
4. Verify that the file is uploaded to Firebase Storage
5. Play the audio file:
   - Navigate to the song details screen
   - Click the play button
   - Verify that the audio plays correctly

## Deployment

### Deploying to Firebase

To deploy the app to Firebase:

```bash
# Deploy to Firebase Hosting
npm run deploy

# Deploy Firestore and Storage rules
npm run deploy:rules
```

### Continuous Integration/Continuous Deployment

The BallTalk app uses GitHub Actions for CI/CD:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build_and_deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build web app
        run: npm run build:web
        env:
          EXPO_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          EXPO_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          EXPO_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
``` 