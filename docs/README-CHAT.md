# BallTalk Chat Features

This document provides an overview of the chat functionality implemented in the BallTalk app, including message reactions and read receipts.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Services](#services)
4. [Features](#features)
5. [Firebase Integration](#firebase-integration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Overview

The BallTalk app includes a comprehensive chat system that allows users to:
- View a list of conversations
- Start new conversations with other users
- Send and receive messages in real-time
- React to messages with emojis
- See when messages have been read by recipients

## Components

### Chat Screens

1. **ChatScreen** (`screens/chat/ChatScreen.tsx`)
   - Displays a list of the user's conversations
   - Shows unread message counts
   - Allows navigation to individual conversations

2. **ConversationScreen** (`screens/chat/ConversationScreen.tsx`)
   - Displays messages in a conversation
   - Supports sending new messages
   - Implements message reactions
   - Shows read receipts
   - Handles real-time updates

3. **NewConversationScreen** (`screens/chat/NewConversationScreen.tsx`)
   - Allows users to start new conversations
   - Displays a searchable list of users
   - Handles creation of new conversations

## Services

### Message Service

The `MessageService` (`services/MessageService.ts`) handles all chat-related operations:

- **Conversation Management**
  - Creating conversations
  - Fetching conversations
  - Updating conversation metadata

- **Message Operations**
  - Sending messages
  - Fetching messages
  - Real-time message subscriptions
  - Message reactions
  - Read receipts

### User Service

The `UserService` (`services/UserService.ts`) provides user-related functionality:

- Fetching user profiles
- Searching for users
- Managing user data

## Features

### Message Reactions

Users can react to messages with emoji reactions:

- Add reactions to messages
- Remove reactions
- See who reacted to a message
- Multiple users can react to the same message

Implementation details:
- Reactions are stored in a `reactions` array in each message document
- Each reaction includes the emoji, user ID, and timestamp
- Real-time updates ensure reactions appear immediately for all participants

### Read Receipts

The app tracks when messages have been read:

- Messages show when they've been read by recipients
- Unread message counts are displayed in the conversation list
- Read status updates in real-time

Implementation details:
- Each message has a `readBy` array containing user IDs of users who have read the message
- Conversation documents track unread counts per user
- When a user opens a conversation, messages are automatically marked as read

## Firebase Integration

### Firestore Structure

The chat system uses the following Firestore collections:

1. **conversations**
   ```
   {
     id: string,
     participants: string[],
     createdAt: timestamp,
     updatedAt: timestamp,
     isGroupChat: boolean,
     unreadCount: {
       [userId: string]: number
     }
   }
   ```

2. **messages**
   ```
   {
     id: string,
     conversationId: string,
     senderId: string,
     receiverId: string,
     content: string,
     timestamp: timestamp,
     readBy: string[],
     reactions: [
       {
         emoji: string,
         userId: string,
         timestamp: timestamp
       }
     ]
   }
   ```

### Security Rules

Firestore security rules ensure that:
- Users can only access conversations they are participants in
- Users can only read and write messages in their conversations
- Users can only add/remove their own reactions to messages

## Testing

A test script is provided to verify the chat functionality:

```bash
npm run test:chat-features
```

This script tests:
1. Creating a test conversation
2. Sending a test message
3. Adding a reaction to the message
4. Marking the message as read
5. Removing the reaction
6. Cleaning up test data

The test script is located at `scripts/test-chat-features.js`.

## Troubleshooting

### Common Issues

1. **Messages not appearing in real-time**
   - Check that Firebase Firestore listeners are properly set up
   - Verify that the user has the correct permissions in Firestore rules

2. **Reactions not working**
   - Ensure the message document structure includes the reactions array
   - Check that the Firestore rules allow updating the reactions field

3. **Read receipts not updating**
   - Verify that the readBy array is being properly updated
   - Check that the conversation's unreadCount is being decremented

### Debugging

For debugging chat functionality:
- Check the console logs for Firebase errors
- Verify that the user is properly authenticated
- Use the test script to validate basic functionality
- Inspect the Firestore database directly to verify document structure

---

For more information about the BallTalk app, refer to the main [README.md](./README.md) file. 