# BallTalk App

BallTalk is a React Native application built with Expo that allows athletes to record, process, and share audio content with their fans. The app includes features for audio recording, processing, chat, and user authentication.

## Table of Contents

- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Development](#development)
  - [Running the App](#running-the-app)
  - [Project Structure](#project-structure)
  - [Code Style](#code-style)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Firebase Emulators](#firebase-emulators)
- [Deployment](#deployment)
  - [Web Deployment](#web-deployment)
  - [Mobile Deployment](#mobile-deployment)
- [Features](#features)
  - [Authentication](#authentication)
  - [Audio Processing](#audio-processing)
  - [Chat](#chat)
  - [Offline Support](#offline-support)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account and project
- Dolby.io API credentials (for audio processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase and Dolby.io credentials (see [Environment Variables](#environment-variables)).

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Dolby.io API Configuration
EXPO_PUBLIC_DOLBY_API_KEY=your-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=your-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=false
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14

# Development Configuration
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Development

### Running the App

- **Web**: `npm run web`
- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **With Emulators**: `npm run start:emulators`

### Project Structure

The project follows a feature-based structure:

- `app/`: Expo Router screens and navigation
- `components/`: Reusable UI components
- `contexts/`: React context providers
- `hooks/`: Custom React hooks
- `services/`: API and service integrations
- `utils/`: Utility functions
- `models/`: Data models and types
- `assets/`: Static assets (images, fonts, etc.)

### Code Style

We use ESLint and TypeScript for code quality. Run the linter with:

```bash
npm run lint
```

## Testing

### Running Tests

- **Unit Tests**: `npm run test:unit`
- **Chat Tests**: `npm run test:chat`
- **Audio Tests**: `npm run test:audio`
- **All Tests**: `npm test`

### Firebase Emulators

For local development and testing, you can use Firebase emulators:

1. Start the emulators:
   ```bash
   npm run emulators:start
   ```

2. Seed the emulators with test data:
   ```bash
   npm run emulators:seed
   ```

3. Run the app with emulators:
   ```bash
   npm run start:emulators
   ```

## Deployment

### Web Deployment

Deploy to Firebase Hosting:

```bash
npm run deploy
```

### Mobile Deployment

Deploy to Expo:

- **Preview**: `npm run deploy:expo:preview`
- **Production**: `npm run deploy:expo:production`

Build standalone apps:

```bash
eas build --platform ios
eas build --platform android
```

## Features

### Authentication

The app supports multiple authentication methods:

- Email/password
- Google Sign-In
- Apple Sign-In

Authentication is managed through Firebase Authentication and integrated with Firestore for user data.

### Audio Processing

Athletes can record, process, and share audio content:

1. **Recording**: Record audio directly in the app
2. **Processing**: Apply audio enhancements using Dolby.io APIs
3. **Sharing**: Share processed audio with fans

### Chat

The app includes a real-time chat feature:

- Direct messaging between athletes and fans
- Media sharing (images, audio)
- Premium chat options for verified athletes

### Offline Support

The app supports offline functionality:

- Offline data persistence with Firestore
- Queued uploads when offline
- Automatic sync when back online

## Troubleshooting

### Common Issues

- **Firebase Authentication Issues**: Ensure your Firebase project has the appropriate authentication methods enabled.
- **Build Errors**: Make sure you have the latest dependencies with `npm install`.
- **Expo Errors**: Clear the Expo cache with `npm run clear-cache`.

### Error Handling

The app includes comprehensive error handling:

- Error boundaries for React components
- Network error detection and recovery
- Detailed error logging

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is proprietary and confidential.

## GitHub Actions Secrets

The following secrets need to be set in your GitHub repository settings for the CI/CD workflow to function properly:

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |
| `FIREBASE_DATABASE_URL` | Firebase database URL |
| `DOLBY_API_KEY` | Dolby.io API key |
| `DOLBY_API_SECRET` | Dolby.io API secret |
| `FIREBASE_TOKEN` | Firebase CLI token for deployment |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (base64 encoded) |
| `SLACK_WEBHOOK` | Slack webhook URL for notifications |

To set up these secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Add each secret with its corresponding value

## Navigation Setup and Troubleshooting

### Tab Navigation

The app uses Expo Router's file-based routing system with a tab-based navigation structure. The tab configuration is defined in `app/(tabs)/_layout.tsx`.

#### Common Issues and Fixes

1. **"Cannot use `href` and `tabBarButton` together" Error**:
   
   This error occurs when you try to use both `href` and `tabBarButton` properties on the same tab. To resolve this issue, completely remove the `href` property:
   
   ```tsx
   // Incorrect - causes error:
   <Tabs.Screen
     name="discover"
     options={{
       href: null,
       tabBarButton: () => null
     }}
   />
   
   // Correct solution:
   <Tabs.Screen
     name="discover"
     options={{
       tabBarButton: () => null
     }}
   />
   ```
   
   In Expo Router, `href` and `tabBarButton` are mutually exclusive properties and cannot be used together.
   
   See `docs/NAVIGATION_FIXES.md` for more details and alternative approaches.

2. **Running Navigation Tests**:
   
   We've added tests to ensure the navigation components render correctly. You can run them with:
   
   ```bash
   node scripts/test-navigation.js
   ```
