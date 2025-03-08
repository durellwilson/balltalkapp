const fs = require('fs');
const path = require('path');

// Define the .env.test content
const envTestContent = `# Test Environment Variables
EXPO_PUBLIC_FIREBASE_API_KEY=test-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost:9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-balltalkapp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-balltalkapp.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
EXPO_PUBLIC_FIREBASE_DATABASE_URL=http://localhost:9001

# Dolby.io API Configuration (mock)
EXPO_PUBLIC_DOLBY_API_KEY=test-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=test-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=true
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14

# Firebase Emulator Configuration
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL=http://localhost:8082
EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL=http://localhost:9199`;

// Write the .env.test file
const envTestPath = path.join(process.cwd(), '.env.test');
fs.writeFileSync(envTestPath, envTestContent);

console.log(`.env.test file created at: ${envTestPath}`); 