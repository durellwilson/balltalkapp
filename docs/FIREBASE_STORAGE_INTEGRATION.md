# Firebase Storage Integration Guide

## Overview

This document outlines how BallTalk integrates with Firebase Storage for audio file management. It covers setup, security rules, performance optimization, and best practices.

## Firebase Configuration

BallTalk uses Firebase v9 modular SDK with the following services:
- Firebase Authentication
- Firebase Storage
- Firestore Database

### Environment Setup

The app uses environment variables for Firebase configuration:

```
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx
```

### Firebase Module Initialization

The Firebase module is initialized in `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## Firebase Storage Structure

BallTalk organizes files in Firebase Storage using a structured approach:

```
/
├── users/
│   └── {userId}/
│       └── audio/
│           └── {audioFileName}
├── projects/
│   └── {projectId}/
│       └── audio/
│           └── {audioFileName}
└── public/
    └── audio/
        └── {userId}/
            └── {audioFileName}
```

- `/users/{userId}/audio/`: Private audio files owned by individual users
- `/projects/{projectId}/audio/`: Audio files associated with specific projects
- `/public/audio/{userId}/`: Public audio files shared by users

## File Naming Convention

Files uploaded to Firebase Storage follow this naming pattern:
`{timestamp}_{randomString}.{extension}`

Example: `1628765432123_a1b2c3d4e5f6.mp3`

This ensures uniqueness and prevents file name collisions.

## Audio File Upload Process

Audio file uploads to Firebase Storage follow this workflow:

1. **File Selection**: User selects an audio file through the `AudioFileUploader` component
2. **File Validation**: Validate file type and size (limit: 50MB)
3. **Firebase Upload**: Upload file to Firebase Storage using reference path
4. **Metadata Creation**: Create a document in Firestore with file metadata
5. **Project Association**: Update project/track data with the new audio file

### Code Example: Firebase Storage Upload

```typescript
// Create storage reference
const storageRef = ref(storage, storagePath);

// Upload file
if (Platform.OS === 'web') {
  // For web platform
  const response = await fetch(fileUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
} else {
  // For native platforms
  const reference = storage_lib().ref(storagePath);
  await reference.putFile(fileUri);
}

// Get download URL
const downloadURL = await getDownloadURL(storageRef);
```

## Firebase Security Rules

The Firebase Storage security rules enforce proper access control:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User can read and write their own private files
    match /users/{userId}/audio/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Project files can be accessed by project owner and collaborators
    match /projects/{projectId}/audio/{allPaths=**} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.ownerId || 
        exists(/databases/$(database)/documents/projects/$(projectId)/collaborators/$(request.auth.uid))
      );
    }
    
    // Public files can be read by anyone, written only by owner
    match /public/audio/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firestore Metadata Structure

For each uploaded audio file, a corresponding document is created in the `audioFiles` collection in Firestore:

```typescript
interface AudioFileMetadata {
  id: string;                 // Unique identifier (Firestore document ID)
  fileName: string;           // Storage filename 
  originalFileName: string;   // Original file name
  fileSize: number;           // Size in bytes
  duration: number;           // Duration in seconds
  format: string;             // Audio format (MP3, WAV, etc.)
  mimeType: string;           // MIME type
  uploadedBy: string;         // User ID of uploader
  uploadedAt: Timestamp;      // Upload timestamp
  projectId?: string;         // Associated project ID
  trackId?: string;           // Associated track ID
  isPublic: boolean;          // Public access flag
  streamingUrl: string;       // URL for streaming
  downloadUrl: string;        // URL for download
  waveformData?: number[];    // Audio waveform data
  tags?: string[];            // Searchable tags
  transcoded: boolean;        // Transcoding status
  transcodingStatus: string;  // Transcoding process status
}
```

## Error Handling Strategy

The app handles Firebase Storage errors using a structured approach:

1. **Pre-upload Validation**:
   - Validate file size and type before uploading
   - Verify user authentication status

2. **Upload Error Handling**:
   - Network error detection (using `diagnoseNetworkError` helper)
   - Firebase-specific error codes (storage/*)
   - Progress monitoring and timeout handling

3. **Error Recovery**:
   - Retry logic for temporary network failures
   - Graceful degradation for permanent failures
   - Detailed error reporting to users

```typescript
try {
  // Upload code...
} catch (error) {
  if (diagnoseNetworkError(error)) {
    // Handle network error
    retryUpload(file, retryCount + 1);
  } else if (error.code?.startsWith('storage/')) {
    // Handle Firebase Storage specific error
    handleFirebaseError(error);
  } else {
    // Handle general error
    throw error;
  }
}
```

## Performance Optimization

### Chunked Uploads

For large files (>10MB), the app implements chunked uploads to improve reliability:

```typescript
// Example of chunked upload implementation
const chunkSize = 2 * 1024 * 1024; // 2MB chunks
const numChunks = Math.ceil(file.size / chunkSize);
let uploadedChunks = 0;

for (let i = 0; i < numChunks; i++) {
  const start = i * chunkSize;
  const end = Math.min(file.size, start + chunkSize);
  const chunk = file.slice(start, end);
  
  // Upload chunk
  await uploadBytes(storageRef, chunk, {
    contentType: file.type,
    customMetadata: { 
      chunk: `${i + 1}/${numChunks}`
    }
  });
  
  uploadedChunks++;
  onProgress(uploadedChunks / numChunks * 100);
}
```

### Resumable Uploads

The app implements resumable uploads to handle connection interruptions:

1. Generate unique upload session ID
2. Store upload progress in local storage
3. After interruption, check for existing session and resume

## Testing Strategy

### Unit Tests

Unit tests for Firebase Storage integration using Jest:

```typescript
describe('AudioStorageService', () => {
  // Mock Firebase Storage
  jest.mock('firebase/storage', () => ({
    ref: jest.fn(),
    uploadBytes: jest.fn().mockResolvedValue({}),
    getDownloadURL: jest.fn().mockResolvedValue('https://example.com/audio.mp3'),
  }));
  
  test('uploads file successfully', async () => {
    // Test implementation
  });
  
  test('handles upload error', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Integration tests using Firebase Emulator:

```typescript
// Start Firebase emulator before tests
beforeAll(async () => {
  // Connect to Firebase emulator
  connectStorageEmulator(storage, 'localhost', 9199);
});

test('complete upload flow', async () => {
  // Test implementation using real Firebase SDK against emulator
});
```

## Best Practices

1. **Security First**:
   - Always validate file types on both client and server
   - Implement Firebase Security Rules for access control
   - Never expose sensitive file metadata

2. **Performance Optimization**:
   - Use chunked uploads for large files
   - Implement exponential backoff for retries
   - Use Firebase Storage cache control headers

3. **User Experience**:
   - Provide real-time upload progress
   - Implement cancellation mechanism
   - Show clear error messages

4. **Error Handling**:
   - Classify errors by type (network, permission, etc.)
   - Log errors to monitoring service
   - Implement recovery mechanisms

## Version Compatibility

| Firebase SDK Version | BallTalk App Version | Notes |
|----------------------|----------------------|-------|
| 9.15.0               | 1.0.0 - 1.2.0        | Initial implementation |
| 9.17.2               | 1.3.0+               | Added chunked uploads |
| 9.22.0               | 1.5.0+               | Added resumable uploads |

## Resources

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security)
- [Expo Firebase Integration](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/storage/usage) 