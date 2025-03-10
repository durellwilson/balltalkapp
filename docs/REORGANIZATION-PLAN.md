# BallTalk App Reorganization Plan

## Current Issues
- Duplicate code between `/screens` and `/app` directories
- Too many tabs and hidden screens
- Inconsistent routing structure
- Lack of clear organization between components and screens

## New Structure

### `/app` Directory (Expo Router)
- `/app` - Main entry point for the application
  - `/_layout.tsx` - Root layout
  - `/index.tsx` - Entry redirect
  - `/(tabs)` - Tab navigation
    - `/_layout.tsx` - Tab layout (4 tabs only)
    - `/index.tsx` - Home tab
    - `/studio.tsx` - Studio tab
    - `/profile.tsx` - Profile tab
    - `/chat.tsx` - Chat tab
  - `/(auth)` - Authentication flows
    - `/_layout.tsx` - Auth layout
    - `/sign-in.tsx`
    - `/sign-up.tsx`
    - `/forgot-password.tsx`
  - `/studio` - Studio features
    - `/audio-mastering.tsx`
    - `/vocal-isolation.tsx`
    - `/batch-processing.tsx`
  - `/chat` - Chat features
    - `/new.tsx`
    - `/[id].tsx`
  - `/profile` - Profile features
    - `/edit.tsx`
    - `/settings.tsx`

### `/components` Directory
- `/components`
  - `/layout` - Layout components
    - `Header.tsx`
    - `Footer.tsx`
  - `/ui` - UI components
    - `Button.tsx`
    - `Input.tsx`
    - `Card.tsx`
  - `/audio` - Audio-related components
    - `Player.tsx`
    - `Recorder.tsx`
    - `Waveform.tsx`
  - `/studio` - Studio-related components
    - `AudioProcessingForm.tsx`
    - `ProcessingOptions.tsx`
  - `/chat` - Chat-related components
    - `ChatList.tsx`
    - `ChatMessage.tsx`
  - `/profile` - Profile-related components
    - `ProfileHeader.tsx`
    - `ActivityFeed.tsx`

### Other Directories
- `/hooks` - Custom hooks
- `/contexts` - Context providers
- `/services` - API services
- `/utils` - Utility functions
- `/constants` - Constants and configuration
- `/assets` - Static assets

## Migration Steps
1. Remove duplicate files between `/screens` and `/app`
2. Consolidate all screen logic into the `/app` directory
3. Move reusable components to the `/components` directory
4. Update imports and references
5. Clean up unused files and code

## Testing Plan
1. Test each tab navigation
2. Test all features in each tab
3. Test authentication flows
4. Test responsive design 