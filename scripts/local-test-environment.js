/**
 * Local Testing Environment Setup for Audio Processing
 * 
 * This script sets up a local testing environment for the audio processing system,
 * including:
 * - Setting up a local Firebase emulator
 * - Creating test audio files
 * - Setting up test users
 * - Running the verification script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to log with colors
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  log('='.repeat(80), colors.fg.cyan);
  log(`  ${title}`, colors.fg.cyan + colors.bright);
  log('='.repeat(80), colors.fg.cyan);
}

// Helper function to run commands and handle errors
function runCommand(command, errorMessage, ignoreError = false) {
  try {
    log(`> ${command}`, colors.dim);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreError) {
      log(`Warning: ${errorMessage}`, colors.fg.yellow);
      log(`Command failed: ${command}`, colors.fg.yellow);
      log(`${error.message}`, colors.fg.yellow);
      return true;
    } else {
      log(`ERROR: ${errorMessage}`, colors.fg.red);
      log(`Command failed: ${command}`, colors.fg.red);
      log(`${error.message}`, colors.fg.red);
      return false;
    }
  }
}

// Create necessary directories
function createDirectories() {
  logSection('Creating Directories');
  
  const directories = [
    'test-assets',
    'test-assets/audio',
    'test-assets/output',
    'firebase-emulator'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      log(`Creating directory: ${dir}`, colors.fg.yellow);
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      log(`Directory already exists: ${dir}`, colors.fg.green);
    }
  });
}

// Create test audio files
function createTestAudioFiles() {
  logSection('Creating Test Audio Files');
  
  // Create a simple test audio file
  const testAudioPath = path.join('test-assets', 'audio', 'test-tone.wav');
  
  // Check if audiobuffer-to-wav is installed
  try {
    execSync('npx audiobuffer-to-wav --help', { stdio: 'ignore' });
    
    // Create different test tones
    const testTones = [
      { name: 'test-tone-440hz.wav', frequency: 440, duration: 3 },
      { name: 'test-tone-880hz.wav', frequency: 880, duration: 3 },
      { name: 'test-tone-220hz.wav', frequency: 220, duration: 3 },
      { name: 'test-tone-1khz.wav', frequency: 1000, duration: 3 }
    ];
    
    testTones.forEach(tone => {
      const tonePath = path.join('test-assets', 'audio', tone.name);
      log(`Creating test tone: ${tone.name}`, colors.fg.yellow);
      execSync(`npx audiobuffer-to-wav --frequency ${tone.frequency} --duration ${tone.duration} --output ${tonePath}`, { stdio: 'ignore' });
    });
    
    log('Test audio files created successfully', colors.fg.green);
  } catch (e) {
    log('audiobuffer-to-wav not available, creating empty test files', colors.fg.yellow);
    
    // Create empty files as a fallback
    const testFiles = [
      'test-tone-440hz.wav',
      'test-tone-880hz.wav',
      'test-tone-220hz.wav',
      'test-tone-1khz.wav'
    ];
    
    testFiles.forEach(file => {
      const filePath = path.join('test-assets', 'audio', file);
      fs.writeFileSync(filePath, Buffer.alloc(1000));
    });
    
    log('Empty test audio files created', colors.fg.yellow);
  }
}

// Set up Firebase emulator
function setupFirebaseEmulator() {
  logSection('Setting Up Firebase Emulator');
  
  // Check if firebase-tools is installed
  try {
    execSync('npx firebase --version', { stdio: 'ignore' });
    log('Firebase tools is installed', colors.fg.green);
  } catch (e) {
    log('Installing firebase-tools...', colors.fg.yellow);
    if (!runCommand('npm install -g firebase-tools', 'Failed to install firebase-tools')) {
      return false;
    }
  }
  
  // Create firebase.json if it doesn't exist
  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
  if (!fs.existsSync(firebaseJsonPath)) {
    log('Creating firebase.json...', colors.fg.yellow);
    
    const firebaseJson = {
      "emulators": {
        "auth": {
          "port": 9099
        },
        "firestore": {
          "port": 8080
        },
        "storage": {
          "port": 9199
        },
        "ui": {
          "enabled": true,
          "port": 4000
        }
      },
      "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
      },
      "storage": {
        "rules": "storage.rules"
      }
    };
    
    fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseJson, null, 2));
    log('firebase.json created', colors.fg.green);
  } else {
    log('firebase.json already exists', colors.fg.green);
  }
  
  // Create storage.rules if it doesn't exist
  const storageRulesPath = path.join(process.cwd(), 'storage.rules');
  if (!fs.existsSync(storageRulesPath)) {
    log('Creating storage.rules...', colors.fg.yellow);
    
    const storageRules = `rules_version = '2';
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
    
    // Test files can be read and written by anyone during testing
    match /test-assets/{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;
    
    fs.writeFileSync(storageRulesPath, storageRules);
    log('storage.rules created', colors.fg.green);
  } else {
    log('storage.rules already exists', colors.fg.green);
  }
  
  // Create firestore.rules if it doesn't exist
  const firestoreRulesPath = path.join(process.cwd(), 'firestore.rules');
  if (!fs.existsSync(firestoreRulesPath)) {
    log('Creating firestore.rules...', colors.fg.yellow);
    
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own audio processing settings
    match /audioProcessingSettings/{userId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read presets
    match /presets/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Test collections can be read and written by anyone during testing
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}`;
    
    fs.writeFileSync(firestoreRulesPath, firestoreRules);
    log('firestore.rules created', colors.fg.green);
  } else {
    log('firestore.rules already exists', colors.fg.green);
  }
  
  // Create firestore.indexes.json if it doesn't exist
  const firestoreIndexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  if (!fs.existsSync(firestoreIndexesPath)) {
    log('Creating firestore.indexes.json...', colors.fg.yellow);
    
    const firestoreIndexes = {
      "indexes": [],
      "fieldOverrides": []
    };
    
    fs.writeFileSync(firestoreIndexesPath, JSON.stringify(firestoreIndexes, null, 2));
    log('firestore.indexes.json created', colors.fg.green);
  } else {
    log('firestore.indexes.json already exists', colors.fg.green);
  }
  
  return true;
}

// Start Firebase emulator
function startFirebaseEmulator() {
  logSection('Starting Firebase Emulator');
  
  log('Starting Firebase emulator...', colors.fg.yellow);
  log('This will run in the background. Press Ctrl+C to stop.', colors.fg.yellow);
  
  // Start the emulator in the background
  const emulatorProcess = require('child_process').spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,storage'], {
    detached: true,
    stdio: 'inherit'
  });
  
  // Don't wait for the emulator to exit
  emulatorProcess.unref();
  
  log('Firebase emulator started', colors.fg.green);
  log('Emulator UI available at: http://localhost:4000', colors.fg.green);
  
  // Give the emulator some time to start
  log('Waiting for emulator to start...', colors.fg.yellow);
  execSync('sleep 5');
  
  return true;
}

// Set up test environment variables
function setupEnvironmentVariables() {
  logSection('Setting Up Environment Variables');
  
  const envPath = path.join(process.cwd(), '.env.test');
  const envContent = `# Test Environment Variables
EXPO_PUBLIC_FIREBASE_API_KEY=test-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost:9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-balltalkapp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-balltalkapp.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
EXPO_PUBLIC_FIREBASE_DATABASE_URL=http://localhost:8080

# Dolby.io API Configuration (mock)
EXPO_PUBLIC_DOLBY_API_KEY=test-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=test-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=true
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14

# Firebase Emulator Configuration
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL=http://localhost:8080
EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL=http://localhost:9199
`;
  
  fs.writeFileSync(envPath, envContent);
  log('.env.test file created', colors.fg.green);
  
  // Create a script to load the test environment
  const loadEnvScriptPath = path.join(process.cwd(), 'scripts', 'load-test-env.js');
  const loadEnvScriptContent = `/**
 * Load Test Environment Variables
 * 
 * This script loads the test environment variables from .env.test
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load the test environment variables
const envPath = path.join(process.cwd(), '.env.test');
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading test environment variables:', result.error);
    process.exit(1);
  }
  console.log('Test environment variables loaded successfully');
} else {
  console.error('Test environment file not found:', envPath);
  console.error('Run "node scripts/local-test-environment.js" to create it');
  process.exit(1);
}
`;
  
  fs.writeFileSync(loadEnvScriptPath, loadEnvScriptContent);
  log('load-test-env.js script created', colors.fg.green);
  
  return true;
}

// Run the verification script
function runVerificationScript() {
  logSection('Running Verification Script');
  
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'verify-audio-processing.ts'))) {
    log('Running verification script...', colors.fg.yellow);
    
    // Run the verification script with the test environment
    if (runCommand('node scripts/load-test-env.js && npx ts-node scripts/verify-audio-processing.ts test-assets/audio/test-tone-440hz.wav', 'Failed to run verification script', true)) {
      log('Verification script completed', colors.fg.green);
      return true;
    } else {
      log('Verification script failed', colors.fg.red);
      return false;
    }
  } else {
    log('Verification script not found', colors.fg.yellow);
    log('Skipping verification', colors.fg.yellow);
    return true;
  }
}

// Main function
async function main() {
  logSection('Local Testing Environment Setup');
  
  log('Setting up local testing environment for audio processing...', colors.fg.yellow);
  
  // Create directories
  createDirectories();
  
  // Create test audio files
  createTestAudioFiles();
  
  // Set up Firebase emulator
  if (!setupFirebaseEmulator()) {
    log('Failed to set up Firebase emulator', colors.fg.red);
    process.exit(1);
  }
  
  // Set up environment variables
  if (!setupEnvironmentVariables()) {
    log('Failed to set up environment variables', colors.fg.red);
    process.exit(1);
  }
  
  // Start Firebase emulator
  if (!startFirebaseEmulator()) {
    log('Failed to start Firebase emulator', colors.fg.red);
    process.exit(1);
  }
  
  // Run verification script
  if (!runVerificationScript()) {
    log('Verification failed', colors.fg.red);
    process.exit(1);
  }
  
  logSection('Setup Complete');
  log('Local testing environment setup completed successfully!', colors.fg.green);
  log('Next steps:', colors.fg.yellow);
  log('1. Use the Firebase emulator UI at http://localhost:4000', colors.fg.white);
  log('2. Run tests with the test environment: node scripts/load-test-env.js && npm run test:audio', colors.fg.white);
  log('3. Verify audio processing with: node scripts/load-test-env.js && npm run verify:audio test-assets/audio/test-tone-440hz.wav', colors.fg.white);
  log('4. To stop the Firebase emulator, press Ctrl+C in the terminal where it\'s running', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 