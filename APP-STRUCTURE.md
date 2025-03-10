# BallTalk App Structure

## Overview

The BallTalk app has been reorganized to use Expo Router for navigation. This document explains the new structure and how to navigate the codebase.

## Directory Structure

### `/app` Directory (Expo Router)

The `/app` directory is the main entry point for the application. It uses Expo Router's file-based routing system.

- `/app/_layout.tsx` - Root layout for the entire app
- `/app/index.tsx` - Landing page / entry point
- `/app/(tabs)` - Tab navigation
  - `/_layout.tsx` - Tab layout (4 tabs only)
  - `/index.tsx` - Home tab
  - `/studio.tsx` - Studio tab
  - `/profile.tsx` - Profile tab
  - `/chat.tsx` - Chat tab
- `/app/(auth)` - Authentication flows
  - `/_layout.tsx` - Auth layout
  - `/login.tsx` - Login screen
  - `/signup.tsx` - Signup screen
- `/app/studio` - Studio features
  - `/index.tsx` - Main studio screen
  - `/mastering.tsx` - Audio mastering
  - `/library.tsx` - Audio library
  - `/batch.tsx` - Batch processing
  - `/dolby.tsx` - Dolby audio demo
- `/app/chat` - Chat features
  - `/index.tsx` - Chat list
  - `/new.tsx` - New conversation
  - `/[id].tsx` - Conversation screen
- `/app/profile` - Profile features
  - `/edit.tsx` - Edit profile
  - `/settings.tsx` - Settings

### `/components` Directory

The `/components` directory contains reusable UI components.

- `/components/layout` - Layout components
- `/components/ui` - UI components
- `/components/audio` - Audio-related components
- `/components/studio` - Studio-related components
- `/components/chat` - Chat-related components
- `/components/profile` - Profile-related components
- `/components/common` - Common components
- `/components/fallbacks` - Fallback/error components

### Other Directories

- `/hooks` - Custom React hooks
- `/contexts` - Context providers
- `/services` - API services
- `/utils` - Utility functions
- `/constants` - Constants and configuration
- `/assets` - Static assets
- `/config` - Configuration files

## Navigation

### Tab Navigation

The app uses a bottom tab navigation with 4 tabs:

1. **Home** - Main feed and content discovery
2. **Studio** - Audio recording and processing
3. **Profile** - User profile and settings
4. **Chat** - Messaging and conversations

### Deep Linking

Expo Router supports deep linking to any screen in the app. For example:

- `/` - Home screen
- `/studio` - Studio screen
- `/profile` - Profile screen
- `/chat` - Chat screen
- `/studio/mastering` - Audio mastering screen
- `/chat/new` - New conversation screen

## User Types

The app supports different user types with different permissions:

1. **Athletes** - Sports professionals who can create and share content
2. **Fans** - Users who follow athletes and consume content
3. **Guests** - Unauthenticated users with limited access

## Authentication

Authentication is handled by Firebase Authentication. The auth flow is:

1. User navigates to login/signup screen
2. User enters credentials
3. Firebase authenticates the user
4. User is redirected to the home screen

## Data Flow

The app uses a combination of local state, context, and Firebase for data management:

1. **Firebase Firestore** - Main database for user data, content, and messages
2. **Firebase Storage** - Storage for audio files and images
3. **Context API** - State management for authentication, theme, and network status
4. **Local Storage** - Caching and offline support

## Testing

To test the app:

1. Start the app with `npx expo start --clear`
2. Open the app in a simulator or on a device
3. Follow the test steps in the `TESTING-PLAN.md` document
4. Document any issues or unexpected behavior

## Troubleshooting

Common issues and solutions:

1. **Navigation issues** - Make sure all screens are properly configured in the `/app` directory
2. **Authentication issues** - Check Firebase configuration in `/config/firebase.ts`
3. **Icon issues** - Ensure `@expo/vector-icons` is properly installed and imported
4. **Firebase issues** - Verify Firebase configuration and permissions 