# BallTalk App - Expo Router Migration

This document outlines the migration of the BallTalk app to the Expo Router architecture, providing a guide to the new structure and key components.

## Architecture Overview

The app has been migrated from the previous navigation system to Expo Router, which provides a file-system based routing approach. This means that the app's navigation structure is defined by the file and directory structure in the `app/` directory.

### Key Directories

- `app/` - The root directory for all Expo Router screens and layouts
  - `(auth)/` - Authentication-related screens (login, signup, etc.)
  - `(tabs)/` - Main tab navigation screens
  - `studio/` - Studio feature screens and components
  - `chat/` - Chat feature screens and components
  - `index.tsx` - The entry point/home screen of the app

### Layout Files

Layout files (`_layout.tsx`) define the navigation structure for their respective directories:

- `app/_layout.tsx` - Root layout that sets up the theme provider and authentication context
- `app/(auth)/_layout.tsx` - Authentication flow layout with stack navigation
- `app/(tabs)/_layout.tsx` - Tab navigation layout with different tabs based on user role
- `app/studio/_layout.tsx` - Studio feature layout with nested navigation
- `app/chat/_layout.tsx` - Chat feature layout with nested navigation

## Key Features

### Authentication

The authentication flow is managed in the `app/(auth)/` directory, with screens for:
- Login (`login.tsx`)
- Signup (`signup.tsx`)
- Athlete Signup (`athlete-signup.tsx`)
- Fan Hub (`fan-hub.tsx`)

The authentication context is provided at the root level and accessible throughout the app.

### Studio

The studio feature is now organized in the `app/studio/` directory with:
- Main studio interface (`index.tsx`)
- Library view (`library.tsx`)
- Mastering tools (`mastering.tsx`)
- Full editor (`full.tsx`)

The `app/(tabs)/studio.tsx` file now serves as a router that redirects to the appropriate studio screen based on user role.

### Chat

The chat feature is organized in the `app/chat/` directory with:
- Chat list (`index.tsx`)
- Conversation view (`[id].tsx`)
- New conversation screen (`new.tsx`)
- Additional chat-related screens

## Theme Support

The app supports both light and dark themes, with theme-specific styling applied throughout the UI. The theme context is provided at the root level and can be accessed using the `useTheme` hook.

## Audio Recording

Audio recording functionality is implemented in the `components/audio/recorder/` directory, with the main component being `BasicRecorder.tsx`. This component provides a user-friendly interface for recording, playing back, and managing audio recordings.

## Migration Notes

1. All screens have been moved from the `screens/` directory to the appropriate locations in the `app/` directory.
2. Navigation has been updated to use Expo Router's `Link`, `router`, and other navigation utilities.
3. Layouts have been created to define the navigation structure for different parts of the app.
4. Components have been updated to work with the new routing system.

## Future Improvements

1. Further optimize performance with lazy loading and memoization
2. Enhance error handling and fallback UI
3. Improve accessibility features
4. Add comprehensive testing for all routes and components

## Troubleshooting

If you encounter issues with the app:

1. Clear the cache with `npm run clear-cache`
2. Ensure all dependencies are installed with `npm install`
3. Check for syntax errors in component files
4. Verify that all imports are correct and files exist in the expected locations 