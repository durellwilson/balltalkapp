# BallTalk App Deployment Guide

This guide provides instructions on how to fix errors, deploy the application, and set up CI/CD for the BallTalk app.

## Fix Scripts

We've created several scripts to fix common issues in the codebase:

### 1. Fix Navigation Paths

This script fixes invalid navigation paths in the codebase:

```bash
npm run fix-navigation-paths
```

### 2. Fix Template Variables

This script fixes template variables that weren't properly replaced:

```bash
npm run fix-template-variables
```

### 3. Create Missing Screens

This script creates the missing screens mentioned in the STATUS-SUMMARY.md file:

```bash
npm run create-missing-screens
```

### 4. Fix All

This script runs all the fix scripts in the correct order:

```bash
npm run fix-all
```

## Deployment

### Web Deployment

To build and deploy the web app to Firebase:

```bash
npm run build:web && npm run deploy
```

This will build the web app and deploy it to Firebase Hosting.

### Mobile Deployment

To deploy updates to Expo:

```bash
# For preview environment
npm run deploy:expo:preview

# For production environment
npm run deploy:expo:production
```

To build native apps:

```bash
# For Android
npm run build:android

# For iOS
npm run build:ios
```

## CI/CD Setup

The CI/CD workflow is configured in `.github/workflows/ci-cd.yml`. It includes the following jobs:

1. **Lint and Test**: Runs linting and unit tests
2. **Build Web**: Builds the web app
3. **Deploy Web Preview**: Deploys the web app to a preview channel on Firebase
4. **Deploy Web Production**: Deploys the web app to the production channel on Firebase
5. **Deploy Expo Preview**: Creates an Expo update for the preview environment
6. **Deploy Expo Production**: Creates an Expo update for the production environment

### GitHub Secrets

The following secrets need to be set up in your GitHub repository:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `EXPO_TOKEN`
- `EXPO_PROJECT_ID`
- `DOLBY_API_KEY`
- `DOLBY_API_SECRET`
- `CODECOV_TOKEN` (optional, for code coverage reporting)

### Manual Deployment

You can manually trigger the CI/CD workflow from the GitHub Actions tab by selecting the "BallTalk CI/CD Pipeline" workflow and clicking "Run workflow". You can choose to deploy to either the preview or production environment.

## Troubleshooting

If you encounter any issues during deployment, try the following:

1. **Clear Cache**: Run `npm run clear-cache` to clear the Expo cache
2. **Emergency Fix**: Run `npm run emergency-fix` to apply emergency fixes
3. **Fix Firebase**: Run `npm run fix-firebase` to fix Firebase configuration issues
4. **Fix Web**: Run `npm run web-fix` to fix web-specific issues

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Contact

If you have any questions or need assistance, please contact the BallTalk development team. 