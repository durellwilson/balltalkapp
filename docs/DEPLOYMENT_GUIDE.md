# BallTalk App Deployment Guide

This document outlines the steps to deploy the BallTalk app for testing and production.

## Local Development Deployment

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Expo CLI
- For iOS testing: macOS with Xcode installed
- For Android testing: Android Studio with an emulator configured

### Running in Development Mode

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Expo development server**:
   ```bash
   # Regular start
   npm run start
   
   # Start with a clean cache (recommended if you encounter issues)
   npm run start -- --clear
   ```

3. **Test on different platforms**:
   - For web: Press `w` in the terminal or open http://localhost:19006
   - For iOS simulator: Press `i` in the terminal
   - For Android emulator: Press `a` in the terminal
   - For physical device: Scan the QR code with the Expo Go app

### Common Local Deployment Issues

1. **Metro bundler port conflicts**:
   - If port 8081 is already in use, Expo will suggest using a different port
   - You can manually specify a port: `npm run start -- --port 8082`

2. **Module resolution errors**:
   - Clear the cache: `npm run start -- --clear`
   - Delete the node_modules folder and reinstall: `rm -rf node_modules && npm install`

3. **Firebase connection issues**:
   - Verify that your environment variables are set correctly
   - Use the local emulator: `npm run emulators:start`

## Automated CI/CD Pipeline

BallTalk uses GitHub Actions for continuous integration and deployment. The pipeline is defined in `.github/workflows/ci.yml`.

### Pipeline Stages

1. **Test**: Runs linting and unit tests on every push and pull request
2. **Build Web**: Builds the web version of the app
3. **Deploy Preview**: Deploys the web app to a Firebase preview channel for develop branch
4. **Deploy Production**: Deploys the web app to Firebase production for main branch
5. **Build Mobile Preview**: Builds preview versions of iOS and Android apps for develop branch
6. **Build Mobile Production**: Builds production versions of iOS and Android apps for main branch

### Triggering Deployments

- **Pull Request**: Runs tests only
- **Push to develop**: Runs tests, builds web app, deploys to preview channel, builds preview mobile apps
- **Push to main**: Runs tests, builds web app, deploys to production, builds production mobile apps

### Viewing Deployment Status

1. Go to the GitHub repository
2. Click on "Actions" tab
3. Select the workflow run to view details
4. For preview deployments, a comment will be added to the PR with the preview URL

### Environment Variables and Secrets

The following secrets need to be configured in GitHub repository settings:

- `FIREBASE_TOKEN`: Firebase CLI authentication token
- `EXPO_TOKEN`: Expo account token for EAS builds
- `CODECOV_TOKEN`: Token for uploading code coverage reports

## Manual Production Deployment

### Web Deployment to Firebase Hosting

1. **Build the web version**:
   ```bash
   npm run build:web
   ```

2. **Deploy to Firebase Hosting**:
   ```bash
   npm run deploy
   ```

   Or to deploy to a test channel for 1 day:
   ```bash
   npm run test:deploy
   ```

### iOS and Android App Store Deployment

#### Build for App Stores using EAS Build

1. **Configure app.json**:
   Ensure your `app.json` has the correct version, bundle identifier, and other metadata.

2. **Configure eas.json**:
   Make sure your `eas.json` contains your production build profiles.

3. **Build for iOS**:
   ```bash
   eas build --platform ios --profile production
   ```

4. **Build for Android**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Submit to App Stores**:
   ```bash
   # iOS
   eas submit --platform ios --profile production
   
   # Android
   eas submit --platform android --profile production
   ```

### Over-the-Air Updates

For minor updates that don't require new native code, you can use EAS Update:

1. **Create an update**:
   ```bash
   eas update --branch production --message "Description of changes"
   ```

2. **Roll back if needed**:
   Use the Expo dashboard to roll back to a previous update.

## Troubleshooting Deployment Issues

### Firebase Deployment Issues

- **Permission errors**: Ensure you're logged in with the correct Firebase account
- **Build errors**: Check for any errors in the build process by running with verbose output: `npm run build:web -- --verbose`

### App Store Submission Issues

- **iOS rejection**: Common reasons include missing privacy policies, inappropriate content, or crash on launch
- **Android rejection**: Similar issues, plus potential Google Play policy violations

### CI/CD Pipeline Issues

- **Failed tests**: Check the test logs to identify and fix failing tests
- **Build failures**: Verify that all dependencies are correctly installed and configured
- **Deployment failures**: Check that all required secrets are properly configured in GitHub

### Runtime Error Monitoring

Set up Firebase Crashlytics to monitor runtime errors in your deployed application:

1. **Enable Crashlytics in Firebase console**
2. **Add appropriate error boundaries in your React components**
3. **Log errors to Crashlytics**:
   ```javascript
   try {
     // Your code
   } catch (error) {
     if (__DEV__) {
       console.error(error);
     } else {
       firebase.crashlytics().recordError(error);
     }
   }
   ```

## Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass (`npm run test:unit`)
- [ ] The app has been tested on all target platforms
- [ ] Firebase security rules are properly configured
- [ ] Environment variables are set correctly
- [ ] App version and build numbers are incremented
- [ ] Privacy policy and terms of service are up to date
- [ ] App metadata (icons, screenshots, descriptions) is ready for the app stores 