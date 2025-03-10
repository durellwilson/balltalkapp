# BallTalk App Navigation Guide

## Overview

The BallTalk app uses Expo Router for navigation, which is a file-based routing system. This document provides guidance on how to navigate between screens and how to update navigation paths.

## Navigation Structure

The app is organized into the following navigation structure:

```
app/
├── _layout.tsx                 # Main app layout with error boundary and providers
├── index.tsx                   # Home screen / entry point
├── (tabs)/                     # Tab navigation
│   ├── _layout.tsx             # Tab layout with 4 main tabs
│   ├── index.tsx               # Home tab
│   ├── studio.tsx              # Studio tab
│   ├── profile.tsx             # Profile tab
│   └── chat.tsx                # Chat tab
├── studio/                     # Studio features
├── chat/                       # Chat features
├── payment/                    # Payment features
├── (auth)/                     # Authentication features
└── admin/                      # Admin features
```

## How to Navigate Between Screens

### Using `router.push()`

To navigate to a screen, use the `router.push()` method from Expo Router:

```tsx
import { router } from 'expo-router';

// Navigate to a screen
router.push('/studio');

// Navigate to a nested screen
router.push('/studio/recordings');

// Navigate to a screen with parameters
router.push('/chat/[id]');

// Navigate to a screen in a group
router.push('/(auth)/login');
```

### Using `Link` Component

For declarative navigation, use the `Link` component:

```tsx
import { Link } from 'expo-router';

// Link to a screen
<Link href="/studio">Go to Studio</Link>

// Link to a nested screen
<Link href="/studio/recordings">Go to Recordings</Link>

// Link to a screen with parameters
<Link href="/chat/[id]">Go to Chat</Link>

// Link to a screen in a group
<Link href="/(auth)/login">Go to Login</Link>
```

## Navigation Path Conventions

### Tab Navigation

- `/` - Home screen
- `/(tabs)/index` - Home tab
- `/(tabs)/studio` - Studio tab
- `/(tabs)/profile` - Profile tab
- `/(tabs)/chat` - Chat tab

### Studio Features

- `/studio` - Studio home screen
- `/studio/recordings` - Recordings management
- `/studio/songs` - Songs management
- `/studio/audio-mastering` - Audio mastering feature
- `/studio/audio-upload` - Audio upload feature

### Chat Features

- `/chat` - Chat home screen
- `/chat/[id]` - Dynamic chat conversation
- `/chat/new` - New chat
- `/chat/new-group` - New group chat
- `/chat/premium-groups` - Premium groups

### Authentication

- `/(auth)/login` - Login screen
- `/(auth)/signup` - Signup screen
- `/(auth)/athlete-signup` - Athlete signup

### Payment

- `/payment/subscribe` - Subscribe screen
- `/payment/subscription` - Subscription management

### Admin

- `/admin/verification` - Admin verification
- `/admin/verification-test` - Verification test

## Common Navigation Patterns

### Navigating to a Tab

```tsx
// Navigate to the Home tab
router.push('/(tabs)');

// Navigate to the Studio tab
router.push('/(tabs)/studio');

// Navigate to the Profile tab
router.push('/(tabs)/profile');

// Navigate to the Chat tab
router.push('/(tabs)/chat');
```

### Navigating to a Nested Screen

```tsx
// Navigate to the Recordings screen in the Studio tab
router.push('/studio/recordings');

// Navigate to a specific chat conversation
router.push(`/chat/${conversationId}`);
```

### Navigating to an Authentication Screen

```tsx
// Navigate to the Login screen
router.push('/(auth)/login');

// Navigate to the Signup screen
router.push('/(auth)/signup');
```

## Troubleshooting

### Screen Not Found

If you encounter a "Screen not found" error, check the following:

1. Make sure the screen exists in the correct location
2. Make sure the navigation path is correct
3. Make sure the screen is exported correctly

### Navigation Path Issues

If you're having issues with navigation paths, try the following:

1. Use the `router.push()` method instead of `navigation.navigate()`
2. Make sure the path starts with a `/`
3. Make sure the path is in the correct format (e.g., `/studio/recordings` instead of `studio/recordings`)

## Best Practices

1. **Use Consistent Path Format**: Always use the same format for navigation paths (e.g., always start with a `/`)
2. **Use Dynamic Routes**: Use dynamic routes for screens that need parameters (e.g., `/chat/[id]`)
3. **Group Related Screens**: Group related screens in directories (e.g., `/studio/`, `/chat/`)
4. **Use Tab Navigation**: Use tab navigation for the main sections of the app
5. **Use Stack Navigation**: Use stack navigation for nested screens within a section 