const fs = require('fs');
const path = require('path');

// Ensure the workflows directory exists
const workflowsDir = path.join(__dirname, '../.github/workflows');
if (!fs.existsSync(workflowsDir)) {
  fs.mkdirSync(workflowsDir, { recursive: true });
}

// Define the workflow file content
const workflowContent = `name: Audio Processing CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'services/audio/**'
      - 'models/audio/**'
      - 'components/audio/**'
      - 'screens/StudioScreen.tsx'
      - 'app/(tabs)/studio.tsx'
      - 'scripts/verify-audio-processing.ts'
  pull_request:
    branches: [ main ]
    paths:
      - 'services/audio/**'
      - 'models/audio/**'
      - 'components/audio/**'
      - 'screens/StudioScreen.tsx'
      - 'app/(tabs)/studio.tsx'
      - 'scripts/verify-audio-processing.ts'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'development'
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  lint:
    name: Lint Audio Processing Code
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint audio processing files
        run: npx eslint services/audio models/audio components/audio screens/StudioScreen.tsx app/\\(tabs\\)/studio.tsx

  test:
    name: Test Audio Processing
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run audio processing unit tests
        run: npm run test:unit -- --testPathPattern="services/audio|models/audio"

      - name: Create test audio file
        run: |
          mkdir -p test-assets
          # Generate a simple sine wave audio file for testing
          npx audiobuffer-to-wav --frequency 440 --duration 3 --output test-assets/test-tone.wav

      - name: Run verification script
        run: |
          # Only run if the verification script exists
          if [ -f "scripts/verify-audio-processing.ts" ]; then
            npx ts-node scripts/verify-audio-processing.ts test-assets/test-tone.wav
          else
            echo "Verification script not found, skipping"
          fi

      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        with:
          name: audio-processing-test-results
          path: output/
          retention-days: 5

  build:
    name: Build Audio Processing Module
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build web app
        run: npm run build:web
        env:
          EXPO_PUBLIC_FIREBASE_API_KEY: \${{ secrets.FIREBASE_API_KEY }}
          EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: \${{ secrets.FIREBASE_AUTH_DOMAIN }}
          EXPO_PUBLIC_FIREBASE_PROJECT_ID: \${{ secrets.FIREBASE_PROJECT_ID }}
          EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: \${{ secrets.FIREBASE_STORAGE_BUCKET }}
          EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: \${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          EXPO_PUBLIC_FIREBASE_APP_ID: \${{ secrets.FIREBASE_APP_ID }}
          EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: \${{ secrets.FIREBASE_MEASUREMENT_ID }}
          EXPO_PUBLIC_FIREBASE_DATABASE_URL: \${{ secrets.FIREBASE_DATABASE_URL }}
          EXPO_PUBLIC_DOLBY_API_KEY: \${{ secrets.DOLBY_API_KEY }}
          EXPO_PUBLIC_DOLBY_API_SECRET: \${{ secrets.DOLBY_API_SECRET }}

      - name: Upload web build artifact
        uses: actions/upload-artifact@v3
        with:
          name: web-build-audio
          path: web-build/

  deploy:
    name: Deploy Audio Processing
    runs-on: ubuntu-latest
    needs: build
    if: (github.event_name == 'push' && github.ref == 'refs/heads/main') || github.event_name == 'workflow_dispatch'
    environment:
      name: \${{ github.event.inputs.environment || 'development' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Download web build artifact
        uses: actions/download-artifact@v3
        with:
          name: web-build-audio
          path: web-build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: \${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: \${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: \${{ github.event.inputs.environment || 'development' }}
          projectId: \${{ secrets.FIREBASE_PROJECT_ID }}

      - name: Update Firebase Storage Rules for Audio Processing
        run: |
          # Install Firebase CLI if not already installed
          npm install -g firebase-tools
          
          # Create temporary storage rules file with audio processing rules
          cat > storage.rules << 'EOL'
          rules_version = '2';
          service firebase.storage {
            match /b/{bucket}/o {
              // Allow authenticated users to read and write audio files
              match /audio/{userId}/{allPaths=**} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && request.auth.uid == userId;
              }
              
              // Allow authenticated users to read preset files
              match /presets/{allPaths=**} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && request.auth.token.admin == true;
              }
            }
          }
          EOL
          
          # Deploy storage rules
          firebase deploy --only storage --project \${{ secrets.FIREBASE_PROJECT_ID }} --token \${{ secrets.FIREBASE_TOKEN }}

      - name: Send deployment notification
        if: success()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK }}
          SLACK_CHANNEL: deployments
          SLACK_COLOR: \${{ job.status }}
          SLACK_TITLE: Audio Processing Deployment
          SLACK_MESSAGE: 'Audio Processing module has been deployed to \${{ github.event.inputs.environment || "development" }} :rocket:'
          SLACK_FOOTER: 'BallTalk App'
`;

// Write the workflow file
const workflowFilePath = path.join(workflowsDir, 'audio-processing-ci.yml');
fs.writeFileSync(workflowFilePath, workflowContent);

console.log(`Workflow file created at: ${workflowFilePath}`); 