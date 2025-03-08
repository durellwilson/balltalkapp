# Real-Time Collaboration in BallTalk Studio

This document provides an overview of the real-time collaboration feature in the BallTalk Studio.

## Overview

The collaboration feature allows multiple users to work together on a music project in real-time. Users can:

- Create or join collaboration sessions
- Chat with other collaborators
- See who is currently active in the session
- Share project changes in real-time

## Architecture

The collaboration feature is built using the following components:

1. **CollaborationService**: A service that manages collaboration sessions, messages, and events using Firebase Firestore.
2. **CollaborationPanel**: A UI component that provides the interface for collaboration.
3. **DawService**: Enhanced with collaboration-specific methods to manage project collaborators.

## Data Models

### CollaborationSession

```typescript
interface CollaborationSession {
  id: string;
  projectId: string;
  hostId: string;
  activeUsers: CollaborationUser[];
  startedAt: string;
  status: 'active' | 'ended';
  inviteCode?: string;
}
```

### CollaborationUser

```typescript
interface CollaborationUser {
  userId: string;
  displayName: string;
  role: 'host' | 'guest';
  joinedAt: string;
  isActive: boolean;
  lastActivity: string;
}
```

### CollaborationMessage

```typescript
interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: string;
}
```

### CollaborationEvent

```typescript
interface CollaborationEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: 'join' | 'leave' | 'track_added' | 'track_deleted' | 'recording_started' | 'recording_stopped';
  timestamp: string;
  metadata?: any;
}
```

## Usage

### Creating a Collaboration Session

1. Open a project in the Studio
2. Click the "Collaborate" button in the toolbar
3. Click "Create Session" in the collaboration panel
4. Share the invite code with collaborators

### Joining a Collaboration Session

1. Open the Studio
2. Click the "Collaborate" button in the toolbar
3. Click "Join Session" in the collaboration panel
4. Enter the invite code provided by the host

### Chatting with Collaborators

1. Open the collaboration panel
2. Type your message in the input field at the bottom
3. Press "Send" to share your message with all collaborators

## Implementation Details

### Real-Time Updates

The collaboration feature uses Firebase Firestore listeners to provide real-time updates:

- `subscribeToSession`: Listens for changes to the collaboration session
- `subscribeToMessages`: Listens for new messages in the chat
- `subscribeToEvents`: Listens for collaboration events (join, leave, etc.)

### Security

- Only the project owner can enable collaboration on a project
- Collaborators can only join sessions they've been invited to
- All actions are authenticated and authorized through Firebase

## Future Enhancements

- Track-level permissions (who can edit which tracks)
- Voice chat integration
- Conflict resolution for simultaneous edits
- Recording notifications and playback synchronization
- Collaborative mixing features

## Troubleshooting

### Common Issues

1. **Can't create a session**
   - Ensure you have an active internet connection
   - Verify that you have the necessary permissions for the project

2. **Can't join a session**
   - Double-check the invite code
   - Ensure the session is still active
   - Verify that you have a stable internet connection

3. **Messages not appearing**
   - Check your internet connection
   - Try refreshing the collaboration panel

### Support

For additional support, please contact the BallTalk support team at support@balltalk.app. 