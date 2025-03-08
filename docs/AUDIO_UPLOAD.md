# Audio Upload Technical Documentation

## Overview

The Audio Upload module handles the complete process of selecting, uploading, and processing audio files to Firebase Storage and Firestore. This document outlines the technical implementation, dependencies, and integration points.

## Architecture

The audio upload system follows a clean architecture pattern with:

1. **Presentation Layer**: UI components for user interaction
2. **Service Layer**: Business logic for file handling and uploads
3. **Data Layer**: Firebase Storage and Firestore integration

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  UI Components      │     │  Service Layer      │     │  Firebase           │
│  - AudioFileUploader│────▶│  - AudioStorageServi│────▶│  - Firebase Storage │
│  - UploadedFileDeta │     │  - DawService       │     │  - Firestore        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Components

### AudioFileUploader

**Purpose**: Provides the UI for selecting, previewing, and uploading audio files.

**Key Properties**:
- `projectId`: The ID of the project to associate the audio with
- `trackId`: Optional track ID if uploading to an existing track
- `onUploadComplete`: Callback function when upload completes
- `onCancel`: Callback function when user cancels

**Key Methods**:
- `pickAudioFile()`: Opens the device file picker
- `loadAudio()`: Loads selected audio for preview
- `uploadFile()`: Initiates the upload process
- `togglePlayback()`: Controls audio preview playback
- `resetState()`: Resets component state for a new upload

**State Management**:
- Tracks upload progress
- Manages audio preview playback
- Tracks file metadata (name, size, duration)
- Handles success/error states

### UploadedFileDetails

**Purpose**: Displays details and playback controls for an uploaded audio file.

**Key Properties**:
- `fileName`: Name of the uploaded file
- `fileUrl`: Firebase Storage URL of the file
- `duration`: Duration of the audio file in seconds
- `trackName`: Optional name of the track the file is associated with
- `createdAt`: Timestamp of when the file was uploaded
- `onClose`: Optional callback for closing the details view

**Key Methods**:
- `loadSound()`: Loads the audio file for playback
- `togglePlayback()`: Controls audio playback
- `formatTime()`: Formats seconds to MM:SS format
- `formatDate()`: Formats the upload date

## Services

### AudioStorageService

**Purpose**: Handles the upload and management of audio files in Firebase Storage.

**Key Methods**:
- `uploadAudioFile()`: Uploads a file to Firebase Storage and creates metadata in Firestore
- `updateProjectTrackAudio()`: Updates track information with uploaded audio details
- `getAudioFileMetadata()`: Retrieves metadata for an audio file
- `getUserAudioFiles()`: Gets all audio files for a specific user
- `getProjectAudioFiles()`: Gets all audio files for a specific project
- `deleteAudioFile()`: Deletes an audio file and its metadata

**Error Handling**:
- Platform-specific error detection
- Network error handling and retries
- Progress monitoring and reporting

### DawService

**Purpose**: Manages project data and integrates uploaded audio files into projects.

**Key Methods**:
- `updateProject()`: Updates project data in Firestore
- `playAudio()`: Plays audio files
- `updateTrackAudio()`: Updates a track with new audio file
- `createProject()`: Creates a new project
- `getProjects()`: Retrieves projects for a user

## Data Models

### AudioFileMetadata
```typescript
interface AudioFileMetadata {
  id: string;                 // Unique identifier for the audio file
  fileName: string;           // Storage filename
  originalFileName: string;   // Original file name from user's device
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
  waveformData?: number[];    // Audio waveform data for visualization
  tags?: string[];            // Searchable tags
  transcoded: boolean;        // Whether the file has been transcoded
  transcodingStatus: string;  // Status of transcoding process
}
```

### Project (Reference)
```typescript
interface Project {
  id: string;                // Unique identifier
  name: string;              // Project name
  tracks: Track[];           // Audio tracks
  createdAt: string;         // Creation timestamp
  updatedAt: string;         // Last update timestamp
  ownerId: string;           // Owner user ID
  // Additional fields...
}
```

## Error Handling

The upload module implements comprehensive error handling:

1. **Pre-upload validation**:
   - File size limits (50MB max)
   - Supported file types (MP3, WAV, M4A, etc.)
   - User authentication verification
   
2. **Upload error handling**:
   - Network connectivity issues
   - Firebase Storage errors
   - Permission errors
   
3. **Post-upload validation**:
   - Firestore metadata creation confirmation
   - File playback verification

## Performance Considerations

1. **Large File Handling**: 
   - Chunked uploads for files > 10MB
   - Progress tracking for user feedback
   
2. **Concurrency**:
   - Limited to 3 simultaneous uploads
   - Queue management for multiple files
   
3. **Caching**:
   - Local caching of uploaded files for offline access
   - Metadata caching for faster UI rendering

## Testing Strategy

1. **Unit Tests**:
   - Service method tests with mocked Firebase
   - Component render tests
   
2. **Integration Tests**:
   - Upload flow with Firebase emulator
   - Component integration tests
   
3. **E2E Tests**:
   - Complete upload workflow

## Security Considerations

1. **Firebase Security Rules**:
   - User-based access control
   - Size and type restrictions
   
2. **Content Validation**:
   - Server-side file type validation
   - Content scanning (future enhancement)

## Future Improvements

1. **Batch Upload**: Support for uploading multiple files
2. **Drag-and-Drop**: Enhanced UI for drag-and-drop uploads
3. **Audio Transcoding**: Automatic format conversion
4. **Waveform Generation**: Server-side waveform data generation
5. **Audio Analysis**: BPM and key detection

## Dependencies

- Expo Document Picker
- Expo FileSystem
- Expo AV (Audio/Video)
- Firebase Storage
- Firebase Firestore 