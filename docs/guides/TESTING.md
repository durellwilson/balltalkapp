# Testing the BallTalk App

This document provides instructions for testing the BallTalk app, including audio recording, uploading, and multi-user testing.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Firebase account with Firestore and Storage enabled
- Service account key for Firebase Admin SDK

## Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a service account key for Firebase Admin SDK
   - Go to the Firebase console
   - Navigate to Project settings > Service accounts
   - Click "Generate new private key"
   - Save the key as `service-account.json` in the project root

4. Create test users
   ```
   npm run create:test-users
   ```

## Testing Audio Recording and Upload

1. Start the app
   ```
   npm start
   ```

2. Open the app in a web browser or on a device
   - For web: Open http://localhost:19006
   - For iOS: Scan the QR code with the Expo Go app
   - For Android: Scan the QR code with the Expo Go app

3. Log in with the test athlete account
   - Email: athlete@example.com
   - Password: password123

4. Navigate to the Studio tab

5. Test audio recording
   - Click the "Record" button
   - Record some audio
   - Click the "Stop" button
   - Verify that the recording is saved and can be played back

6. Test audio upload
   - Click the "Upload" button
   - Select an audio file
   - Add a title, genre, and description
   - Click the "Upload" button
   - Verify that the upload is successful and the song appears in the athlete's profile

## Multi-User Testing

1. Open the app in two different browsers or devices

2. Log in with the test athlete account in one browser/device
   - Email: athlete@example.com
   - Password: password123

3. Log in with the test fan account in the other browser/device
   - Email: fan@example.com
   - Password: password123

4. Test following
   - In the fan account, navigate to the athlete's profile
   - Click the "Follow" button
   - Verify that the fan is now following the athlete

5. Test sharing music
   - In the athlete account, upload a song
   - In the fan account, navigate to the athlete's profile
   - Verify that the song appears in the athlete's profile
   - Play the song and verify that it works

## Navigation Testing

1. Test the 4-button navbar
   - Click on each tab (Home, Studio, Discover, Profile)
   - Verify that the correct screen is displayed for each tab

2. Test deep linking
   - Navigate to a song detail page
   - Copy the URL
   - Open the URL in a new browser tab
   - Verify that the song detail page is displayed

## Troubleshooting

- If you encounter issues with Firebase authentication, check the Firebase console to ensure that the authentication providers are enabled.
- If you encounter issues with audio recording or upload, check the browser console for error messages.
- If you encounter issues with multi-user testing, ensure that both users are logged in and that the Firebase security rules allow the necessary operations. 