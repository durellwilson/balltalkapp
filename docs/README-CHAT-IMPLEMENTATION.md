# BallTalk Chat Implementation Guide

This guide provides detailed information about the chat functionality in the BallTalk app, including how to use it, how it works, and how to extend it.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Usage](#usage)
5. [Firebase Schema](#firebase-schema)
6. [Extending the Chat](#extending-the-chat)
7. [Troubleshooting](#troubleshooting)

## Overview

The BallTalk chat system provides a robust, real-time messaging platform that allows athletes and fans to communicate directly or in groups. The system supports various features like message reactions, read receipts, and typing indicators to create a rich chat experience.

## Features

- **Direct Messaging**: One-on-one conversations between users
- **Group Chats**: Conversations with multiple participants
- **Premium Groups**: Monetized group chats for athletes
- **Message Reactions**: Add emoji reactions to messages
- **Read Receipts**: See when messages have been read
- **Typing Indicators**: See when users are typing
- **Offline Support**: Queue messages when offline
- **Real-time Updates**: Messages appear instantly

## Architecture

The chat system is built using the following components:

### Frontend

- **Chat Screens**: React Native screens for displaying conversations and messages
- **Chat Service**: TypeScript service for handling chat operations
- **Context Providers**: React Context for managing state

### Backend

- **Firebase Firestore**: Database for storing conversations and messages
- **Firebase Authentication**: User authentication and management
- **Firebase Cloud Functions**: Server-side logic for chat operations

## Usage

### Viewing Conversations

1. Navigate to the Chat tab in the app
2. View a list of your conversations
3. Tap on a conversation to open it

### Starting a New Conversation

1. In the Chat tab, tap the "+" button
2. Search for a user
3. Tap on the user to start a conversation

### Sending Messages

1. Open a conversation
2. Type your message in the input field
3. Tap the send button

### Adding Reactions

1. Long press on a message
2. Select an emoji from the reaction menu

### Creating a Group

1. In the Chat tab, tap "New Group"
2. Select multiple users
3. Enter a group name
4. Tap "Create Group"

## Firebase Schema

The chat system uses the following Firestore collections:

### Conversations Collection

```typescript
interface Conversation {
  id?: string;
  participants: string[]; // User IDs
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: string; // User ID
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  unreadCount?: Record<string, number>; // User ID -> count
  isPremium?: boolean;
  isAthleteOnly?: boolean;
  isFanGroup?: boolean;
  isMonetized?: boolean;
}
```

### Messages Collection

```typescript
interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  readBy: string[]; // User IDs
  reactions?: MessageReaction[];
  attachments?: Attachment[];
}

interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Timestamp;
}

interface Attachment {
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  name: string;
  size?: number;
  duration?: number; // For audio/video
}
```

### Typing Collection

```typescript
interface TypingStatus {
  userId: string;
  displayName: string;
  timestamp: Timestamp;
}
```

## Extending the Chat

### Adding New Message Types

To add support for new message types (e.g., location sharing):

1. Update the `Message` interface in `services/ChatService.ts`
2. Add UI components for rendering the new message type
3. Update the message input to support creating the new message type

### Adding New Reactions

The reaction system supports any emoji. To add new reaction options:

1. Update the reaction picker UI to include the new emojis
2. No changes needed to the backend

### Adding Chat Features

To add new chat features (e.g., message threading):

1. Update the Firebase schema to support the new feature
2. Add methods to `ChatService` for the new functionality
3. Update the UI to support the new feature

## Troubleshooting

### Common Issues

#### Messages Not Appearing

- Check your internet connection
- Verify that you have the correct permissions
- Check Firebase console for errors

#### Reactions Not Working

- Ensure the message exists
- Verify that you have permission to react
- Check for Firebase permission errors

#### Typing Indicators Not Showing

- Typing indicators expire after 5 seconds
- Verify that the other user is actually typing
- Check for Firebase permission errors

### Firebase Indexes

If you encounter query errors, you may need to update the Firebase indexes:

1. Update `firestore.indexes.json` with the required indexes
2. Deploy the indexes using `npm run deploy:indexes`

### Testing

To verify that the chat functionality is working correctly:

1. Run the chat verification script: `npm run verify:chat`
2. Follow the prompts to test creating conversations and sending messages

## Conclusion

The BallTalk chat system provides a robust foundation for real-time communication between athletes and fans. By following this guide, you can effectively use, maintain, and extend the chat functionality. 