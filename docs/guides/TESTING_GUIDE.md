# BallTalk App Testing Guide

This guide provides instructions for testing the BallTalk audio app, including setting up the testing environment, running tests, and deploying for testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing](#local-testing)
3. [Automated Testing](#automated-testing)
4. [Deployment for Testing](#deployment-for-testing)
5. [Testing Workflows](#testing-workflows)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin testing, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v8 or later)
- Git
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Expo Go app on your mobile device

## Local Testing

### Setting Up the Local Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the App Locally

1. Start the development server:
   ```bash
   npm start
   # or with tunnel for external access
   npm run start:tunnel
   ```

2. To clear cache and restart:
   ```bash
   npm run clear-cache
   # or with tunnel
   npm run start:clear:tunnel
   ```

3. Open the app:
   - **iOS**: Press `i` in the terminal or scan the QR code with the Camera app
   - **Android**: Press `a` in the terminal or scan the QR code with the Expo Go app

### Testing with Firebase Emulators

1. Start the Firebase emulators:
   ```bash
   npm run emulators:start
   ```

2. In a new terminal, start the app with emulators:
   ```bash
   npm run start:emulators
   ```

## Automated Testing

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run audio-specific tests
npm run test:audio

# Run with coverage
npm run test:ci
```

### Running Linting

```bash
npm run lint
```

### Testing Audio Processing

```bash
# Verify audio processing functionality
npm run verify:audio

# Test Dolby API integration
npm run test:dolby

# Test vocal isolation
npm run test:vocal-isolation
```

## Deployment for Testing

### Using the Deployment Script

We've created a script to simplify the deployment process:

```bash
npm run deploy:expo
```

This interactive script will:
1. Check if EAS CLI is installed
2. Ensure you're logged in to Expo
3. Ask which environment to deploy to (preview or production)
4. Handle any uncommitted changes
5. Deploy the app to Expo

### Manual Deployment

#### Preview Deployment (for testing)

```bash
npm run deploy:expo:preview
```

#### Production Deployment

```bash
npm run deploy:expo:production
```

### CI/CD Deployment

Our GitHub Actions workflow automatically deploys:
- On push to `develop` branch: Preview deployment
- On push to `main` branch: Production deployment
- Manual trigger: Choose environment

## Testing Workflows

### Audio Mastering Testing Flow

1. Record or upload an audio file
2. Navigate to the Audio Mastering screen
3. Test the following features:
   - Equalizer controls
   - Compressor settings
   - Limiter functionality
   - Output gain adjustment
   - Preset selection and saving
4. Process the audio
5. Save and export the processed audio

### Offline Mode Testing Flow

1. Enable airplane mode on your device
2. Record audio or attempt to upload
3. Verify that the app stores the recording locally
4. Re-enable network connection
5. Verify that pending uploads are processed

### User Authentication Testing

1. Test registration with email/password
2. Test login with email/password
3. Test social login (if configured)
4. Test password reset flow
5. Test account settings and profile updates

## Troubleshooting

### Common Issues

#### Expo Build Fails

- Ensure your Expo account has the correct permissions
- Check that all environment variables are properly set
- Verify that the app.json and eas.json configurations are correct

#### Audio Processing Issues

- Check the Dolby API credentials in your .env file
- Ensure the audio file format is supported
- Check network connectivity for API calls

#### Firebase Connection Issues

- Verify Firebase configuration in .env
- Check if emulators are running (if using local environment)
- Ensure Firebase rules allow the operations you're testing

### Getting Help

If you encounter issues not covered in this guide:

1. Check the error logs
2. Review the [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)
3. Contact the development team via Slack or email

---

## Additional Resources

- [AUDIO_PROCESSING_GUIDE.md](./AUDIO_PROCESSING_GUIDE.md)
- [FIREBASE_INTEGRATION_GUIDE.md](./FIREBASE_INTEGRATION_GUIDE.md)
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
- [DOLBY_API_GUIDE.md](./DOLBY_API_GUIDE.md) 