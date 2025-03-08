# Firebase Testing Guide for BallTalk App

This guide provides instructions for testing the BallTalk app with Firebase emulators, allowing you to test Firebase functionality without affecting your production data.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Setting Up Firebase Emulators](#setting-up-firebase-emulators)
4. [Testing with Firebase Emulators](#testing-with-firebase-emulators)
5. [Using the Firebase Testing Tool](#using-the-firebase-testing-tool)
6. [Manual Testing Steps](#manual-testing-steps)
7. [Troubleshooting](#troubleshooting)

## Introduction

Firebase emulators allow you to test your app's Firebase functionality locally without affecting your production Firebase project. This is useful for:

- Testing authentication flows
- Testing Firestore database operations
- Testing Firebase Storage uploads and downloads
- Developing and testing security rules

## Prerequisites

Before you begin testing with Firebase emulators, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v8 or later)
- Firebase CLI (`npm install -g firebase-tools`)
- Java Development Kit (JDK) 11 or later (required for Firebase emulators)

## Setting Up Firebase Emulators

### Automatic Setup

We've created a script to automate the setup process:

```bash
npm run emulators:setup
```

This script will:
1. Check if Firebase CLI is installed and install it if needed
2. Create a `.env.emulator` file with the necessary configuration
3. Start the Firebase emulators

### Manual Setup

If you prefer to set up the emulators manually:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Create a `.env.emulator` file in the project root with the following content:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY="demo-api-key"
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="demo-project.firebaseapp.com"
   EXPO_PUBLIC_FIREBASE_PROJECT_ID="demo-project"
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="demo-project.appspot.com"
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ABCDEF123"
   EXPO_PUBLIC_FIREBASE_DATABASE_URL="https://demo-project.firebaseio.com"
   EXPO_PUBLIC_USE_FIREBASE_EMULATOR="true"
   ```

3. Start the Firebase emulators:
   ```bash
   firebase emulators:start --import=./firebase-emulator --export-on-exit
   ```

## Testing with Firebase Emulators

### Starting the App with Emulators

To start the app configured to use Firebase emulators:

```bash
npm run start:emulators
```

This script will:
1. Copy the `.env.emulator` file to `.env` (backing up your existing `.env` file)
2. Start the Firebase emulators if they're not already running
3. Start the app with the emulator configuration

### Seeding Test Data

To seed the emulators with test data:

```bash
npm run emulators:seed
```

This will create:
- Test users:
  - Athlete: `athlete@example.com` / `password123`
  - Fan: `fan@example.com` / `password123`
- Test songs and playlists
- Test comments and likes

## Using the Firebase Testing Tool

We've created a comprehensive tool to help you test with Firebase emulators:

```bash
npm run test:firebase
```

This interactive tool provides the following options:

1. **Start Firebase Emulators**: Starts the Firebase emulators
2. **Seed Firebase Emulators**: Seeds the emulators with test data
3. **Start App with Firebase Emulators**: Starts the app configured to use the emulators
4. **Run Tests with Firebase Emulators**: Runs tests that interact with Firebase
5. **View Firebase Emulator UI**: Opens the Firebase emulator UI in your browser
6. **Reset Firebase Emulators**: Stops the emulators and clears the emulator data
7. **Deploy to Firebase (Production)**: Deploys the app to your production Firebase project
8. **Show Firebase Testing Instructions**: Displays detailed instructions for testing with Firebase

## Manual Testing Steps

### Authentication Testing

1. Start the app with Firebase emulators
2. Test user registration:
   - Create a new account with email and password
   - Verify that the account is created in the Auth emulator
3. Test user login:
   - Log in with the test athlete account: `athlete@example.com` / `password123`
   - Verify that you can access athlete-specific features
4. Test user logout:
   - Log out and verify that you're redirected to the login screen

### Firestore Testing

1. Start the app with Firebase emulators
2. Log in with the test athlete account
3. Test creating a new song:
   - Upload a song
   - Verify that the song is created in the Firestore emulator
4. Test reading songs:
   - Navigate to the profile screen
   - Verify that the test songs are displayed
5. Test updating a song:
   - Edit a song's details
   - Verify that the changes are reflected in the Firestore emulator
6. Test deleting a song:
   - Delete a song
   - Verify that the song is removed from the Firestore emulator

### Storage Testing

1. Start the app with Firebase emulators
2. Log in with the test athlete account
3. Test uploading a file:
   - Upload an audio file
   - Verify that the file is uploaded to the Storage emulator
4. Test downloading a file:
   - Play a song
   - Verify that the file is downloaded from the Storage emulator

## Troubleshooting

### Emulator Connection Issues

If the app can't connect to the emulators:

1. Verify that the emulators are running:
   ```bash
   lsof -i:9099  # Check Auth emulator
   lsof -i:8080  # Check Firestore emulator
   lsof -i:9199  # Check Storage emulator
   ```

2. Verify that the `.env` file has the correct configuration:
   ```
   EXPO_PUBLIC_USE_FIREBASE_EMULATOR="true"
   ```

3. Try restarting the emulators:
   ```bash
   npm run emulators:start
   ```

### Emulator Data Issues

If the emulator data is inconsistent or corrupted:

1. Reset the emulators:
   ```bash
   pkill -f "firebase emulators"
   rm -rf ./firebase-emulator
   ```

2. Start the emulators again:
   ```bash
   npm run emulators:start
   ```

3. Seed the emulators with fresh test data:
   ```bash
   npm run emulators:seed
   ```

### Firebase CLI Issues

If you encounter issues with the Firebase CLI:

1. Update the Firebase CLI:
   ```bash
   npm install -g firebase-tools@latest
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Verify that the Firebase CLI is working:
   ```bash
   firebase projects:list
   ```

## Additional Resources

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage) 