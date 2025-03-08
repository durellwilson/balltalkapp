# BallTalk App

A collaborative music platform for athletes and their fans.

## Development Status

### Completed Tasks

- ✅ Fixed Jest setup to properly load test environment
- ✅ Updated SongService to use Firebase v9 modular SDK
- ✅ Updated TrackUploader component to use the updated SongService
- ✅ Fixed Firebase mocking in tests
- ✅ Added tests for EnhancedRecordingInterface and TrackUploader components
- ✅ Implemented Dolby.io Media API integration for audio enhancement
- ✅ Created UI components for audio enhancement and analysis
- ✅ Added documentation for Dolby.io Media API integration
- ✅ Implemented vocal isolation feature for separating vocals from instrumentals
- ✅ Added batch processing for handling multiple audio files at once
- ✅ Created comprehensive test scripts for audio processing features

### Next Steps

1. Add advanced audio visualization components
2. Integrate vocal isolation with the recording workflow
3. Optimize audio processing for mobile devices
4. Add support for saving and sharing isolated tracks
5. Implement notifications for batch job completion

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Firebase account
- Dolby.io account with Media API access

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your Firebase and Dolby.io configuration.

4. Start the development server
   ```
   npm start
   ```

## Testing

Run the tests with:
```
npm test
```

Run the tests with coverage:
```
npm run test:coverage
```

Test the Dolby.io API integration:
```
npm run test:dolby
```

Test the vocal isolation feature:
```
npm run test:vocal-isolation
```

Test the batch processing feature:
```
npm run test:batch-processing
```

## Firebase Emulators

To run the app with Firebase emulators:

1. Install the Firebase CLI
   ```
   npm install -g firebase-tools
   ```

2. Start the emulators
   ```
   firebase emulators:start
   ```

3. In another terminal, start the app with emulator configuration
   ```
   EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true npm start
   ```

## CI/CD Pipeline

The app uses GitHub Actions for CI/CD. The pipeline:

1. Runs TypeScript checks
2. Runs tests
3. Tests Dolby.io API integration
4. Builds the app
5. Deploys to Firebase

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Quick Start

The easiest way to get started is to run our setup script:

```bash
npm run setup
```

This will install dependencies and start the app in web mode.

## Manual Setup

If you prefer to set up manually:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   - Web: `npm run web`
   - iOS: `npm run ios`
   - Android: `npm run android`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_database_url
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_DOLBY_API_KEY=your_dolby_api_key
EXPO_PUBLIC_DOLBY_API_SECRET=your_dolby_api_secret
```

## Demo Accounts

The app includes demo accounts for testing:
- Athlete: `athlete@example.com` / `password123`
- Fan: `fan@example.com` / `password123`

## Deployment

### Web Deployment

To deploy the web version to Firebase Hosting:

```bash
npm run deploy
```

### Mobile Deployment

To build for mobile platforms, you'll need to set up EAS Build:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure the build:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios
   ```

5. Build for Android:
   ```bash
   eas build --platform android
   ```

## Project Structure

- `app/` - Expo Router app directory
  - `(auth)/` - Authentication screens
  - `(tabs)/` - Main app tabs
- `components/` - Reusable components
  - `audio/` - Audio-related components
- `contexts/` - React contexts
- `services/` - Service classes
  - `audio/` - Audio processing services
- `src/lib/` - Library code
- `assets/` - Static assets
- `docs/` - Documentation

## Audio Processing

The app includes advanced audio processing features powered by the Dolby.io Media API:

1. **Audio Enhancement**: Reduce noise and improve audio clarity
2. **Audio Mastering**: Apply professional mastering profiles to audio
3. **Audio Analysis**: Analyze audio metrics like loudness, dynamics, and spectral balance
4. **Vocal Isolation**: Separate vocals from instrumentals in audio files
5. **Batch Processing**: Process multiple audio files at once

For more information, see the following documentation:
- [Audio Processing Features](./docs/AUDIO_PROCESSING.md)
- [Dolby.io Media API Integration Guide](./DOLBY_API_GUIDE.md)

## User Guide: Collaboration Features

### Recording Tracks

1. **Access Recording Interface**
   - Navigate to the Studio section using the bottom navigation
   - Tap on "Record" to open the recording interface

2. **Record Audio**
   - Grant microphone permissions when prompted
   - Tap the red record button to start recording
   - The waveform visualization will show your audio levels
   - Tap stop when finished

3. **Audio Processing**
   - After recording, you can adjust audio settings:
     - Mid Gain: Controls the mid-range frequencies
     - High Gain: Controls the high-range frequencies
     - Presence: Adds clarity to the vocals
   - Tap "Process Vocal" to apply these effects

4. **Save and Share**
   - Your processed recording will be saved to your library
   - From there, you can share it with collaborators

### Uploading Tracks

1. **Upload Audio Files**
   - In the Studio section, tap "Upload"
   - Select an audio file from your device (supported formats: MP3, M4A, WAV, OGG, AAC, FLAC)
   - Add metadata like title and genre
   - Tap "Upload" to save to your library

### Collaboration Workflow

1. **Sharing Tracks**
   - Open a track from your library
   - Tap the "Share" button
   - Enter the email of your collaborator
   - Set permissions (Listen, Download, Edit, or Remix)
   - Add an optional message
   - Tap "Share Track"

2. **Receiving Shared Tracks**
   - When someone shares a track with you, you'll receive a notification
   - Go to the "Shared Tracks" section
   - Accept or decline the shared track
   - Accepted tracks appear in your library with the permissions set by the owner

3. **Collaborating on Tracks**
   - Open a shared track with Edit permissions
   - Tap "Collaborate" to add your own recording or upload to this track
   - Record over the existing track or upload a new track to mix with the original
   - Save your collaborative version

4. **Real-time Collaboration**
   - Open a project and tap "Collaborate Now"
   - Share the generated code with your collaborator
   - Both users can see changes and chat in real-time
   - All changes are saved to the project

## Troubleshooting

If you encounter issues:

1. **Recording Problems**
   - Ensure microphone permissions are granted
   - Close other audio apps that might be using the microphone
   - Restart the app if recording fails

2. **Upload Issues**
   - Check your internet connection
   - Ensure file is under 50MB and in a supported format
   - Try uploading a smaller file if problems persist

3. **Sharing Problems**
   - Verify the email address is correct
   - Check that the recipient has an account
   - Try again with a different file if the issue persists

## Contact Support

If you continue to experience issues, contact support at support@balltalkapp.com or report bugs through the app's feedback feature.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

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
