# ADR 001: Audio Upload Architecture

## Status
Accepted

## Context
The BallTalk app requires a robust system for uploading, processing, and playing back audio files. This functionality is critical for the core user experience, allowing athletes to record, share, and collaborate on audio tracks.

We needed to design a solution that addresses:
1. Cross-platform compatibility (web, iOS, Android)
2. Integration with Firebase Storage for file persistence
3. Proper metadata management in Firestore
4. Immediate feedback and playback after upload
5. Scalable handling of potentially large audio files
6. Offline capabilities for interrupted uploads

## Decision
We implemented a layered architecture for audio uploads with the following components:

1. **Presentation Layer**:
   - `AudioFileUploader`: Component for selecting and uploading files
   - `UploadedFileDetails`: Component for displaying and playing uploaded files

2. **Service Layer**:
   - `AudioStorageService`: Handles interactions with Firebase Storage and Firestore
   - `DawService`: Manages project and track relationships

3. **Data Layer**:
   - Firebase Storage: For raw audio file storage
   - Firestore: For metadata and relationship management

The architecture follows these key patterns:
- **Repository Pattern**: Service classes abstract database operations
- **Command Pattern**: Upload operations encapsulated as discrete commands
- **Observer Pattern**: Progress tracking via callbacks

## Key Implementation Decisions

1. **Firebase Storage Structure**:
   We implemented a hierarchical storage structure:
   ```
   /users/{userId}/audio/
   /projects/{projectId}/audio/
   /public/audio/{userId}/
   ```
   
   This provides logical separation based on privacy and ownership.

2. **Metadata Management**:
   For each uploaded audio file, we store comprehensive metadata in Firestore:
   - Basic file properties (name, size, format)
   - Audio-specific properties (duration, waveform data)
   - Organizational properties (project, track associations)
   
   This allows for efficient queries without downloading the actual files.

3. **Upload Process**:
   We implemented a multi-step upload process:
   - Client-side validation
   - Firebase Storage upload with progress tracking
   - Firestore metadata creation
   - Project/track relationship updates
   
   This ensures data consistency and provides feedback to users.

4. **Platform-Specific Implementations**:
   For optimal performance, we use platform-specific upload mechanisms:
   - Web: Using `fetch` + `Blob` with Firebase Storage Web SDK
   - Native: Using React Native Firebase SDK's `putFile` method
   
   This accommodates the platform differences while maintaining a consistent API.

5. **Immediate Feedback**:
   After successful upload, we:
   - Display file details
   - Enable immediate playback
   - Provide visual confirmation of Firebase storage
   
   This improves user experience by confirming upload success.

## Consequences

### Positive
- **Scalability**: The architecture accommodates files of various sizes
- **User Experience**: Immediate feedback reduces perceived wait time
- **Maintainability**: Clear separation of concerns for easier future changes
- **Cross-Platform**: Works consistently across web and native platforms
- **Offline Support**: Groundwork laid for resumable uploads

### Negative
- **Complexity**: Multiple layers add complexity to the codebase
- **Firebase Coupling**: Tightly coupled to Firebase services
- **Performance Overhead**: Metadata management adds database operations
- **Testing Difficulty**: Complex integration tests needed for full validation

### Neutral
- **Security Model**: Relies on Firebase security rules for access control
- **Quota Management**: Subject to Firebase storage and bandwidth quotas

## Alternatives Considered

1. **Direct Upload to CDN**:
   - Pros: Potentially faster delivery for public files
   - Cons: More complex authentication, separate storage from database
   - Decision: Rejected in favor of Firebase's integrated solution

2. **Client-Side Processing**:
   - Pros: Reduced bandwidth for uploads (compressed files)
   - Cons: Inconsistent capabilities across platforms, CPU-intensive on mobile
   - Decision: Deferred to future enhancement

3. **WebSocket-Based Upload**:
   - Pros: Real-time progress, better for unstable connections
   - Cons: More complex server implementation, Firebase doesn't natively support
   - Decision: Rejected due to added complexity

## Future Work

1. **Chunked Uploads**: Implement chunking for large files
2. **Resumable Uploads**: Add support for resuming interrupted uploads
3. **Service Refactoring**: Split services into more focused responsibilities
4. **Background Uploads**: Support uploads while app is in background
5. **Waveform Generation**: Move waveform visualization data generation to server 