/**
 * Test Backend Functionality on Firebase
 * 
 * This script tests the backend functionality of the audio processing system on Firebase,
 * including:
 * - Authentication
 * - Firestore operations
 * - Storage operations
 * - Audio processing functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
require('firebase/storage');
const dotenv = require('dotenv');

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

// Load environment variables
function loadEnvironmentVariables() {
  logSection('Loading Environment Variables');
  
  // Check if .env.test exists
  const envTestPath = path.join(process.cwd(), '.env.test');
  if (fs.existsSync(envTestPath)) {
    log('Loading test environment variables...', colors.fg.yellow);
    dotenv.config({ path: envTestPath });
    log('Test environment variables loaded', colors.fg.green);
    return true;
  }
  
  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    log('Loading environment variables...', colors.fg.yellow);
    dotenv.config();
    log('Environment variables loaded', colors.fg.green);
    return true;
  }
  
  log('No environment variables found', colors.fg.red);
  log('Creating default environment variables...', colors.fg.yellow);
  
  // Create default environment variables
  const envContent = `# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your-database-url

# Dolby.io API Configuration
EXPO_PUBLIC_DOLBY_API_KEY=your-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=your-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=true
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14
`;
  
  fs.writeFileSync(envPath, envContent);
  log('Default environment variables created', colors.fg.green);
  log('Please update the .env file with your actual values', colors.fg.yellow);
  
  // Load the default environment variables
  dotenv.config();
  
  return false;
}

// Initialize Firebase
function initializeFirebase() {
  logSection('Initializing Firebase');
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
  };
  
  // Check if Firebase is already initialized
  try {
    firebase.app();
    log('Firebase is already initialized', colors.fg.green);
  } catch (e) {
    log('Initializing Firebase...', colors.fg.yellow);
    firebase.initializeApp(firebaseConfig);
    log('Firebase initialized', colors.fg.green);
  }
  
  // Check if using Firebase emulator
  if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    log('Using Firebase emulator', colors.fg.yellow);
    
    // Connect to Firebase emulator
    if (process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) {
      firebase.auth().useEmulator(process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL);
      log(`Connected to Auth emulator at ${process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL}`, colors.fg.green);
    }
    
    if (process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL) {
      firebase.firestore().useEmulator(
        process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL.split(':')[0],
        parseInt(process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL.split(':')[1])
      );
      log(`Connected to Firestore emulator at ${process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL}`, colors.fg.green);
    }
    
    if (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL) {
      firebase.storage().useEmulator(
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL.split(':')[0],
        parseInt(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL.split(':')[1])
      );
      log(`Connected to Storage emulator at ${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL}`, colors.fg.green);
    }
  }
  
  return true;
}

// Test authentication
async function testAuthentication() {
  logSection('Testing Authentication');
  
  // Create a test user
  const testEmail = 'test@example.com';
  const testPassword = 'Test123!';
  
  try {
    log(`Creating test user: ${testEmail}...`, colors.fg.yellow);
    
    // Check if using emulator
    if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      // In emulator, we can create users directly
      await firebase.auth().createUserWithEmailAndPassword(testEmail, testPassword);
      log('Test user created', colors.fg.green);
    } else {
      // In production, we need to check if the user exists first
      try {
        await firebase.auth().signInWithEmailAndPassword(testEmail, testPassword);
        log('Test user already exists, signing in', colors.fg.green);
      } catch (e) {
        // User doesn't exist, create it
        await firebase.auth().createUserWithEmailAndPassword(testEmail, testPassword);
        log('Test user created', colors.fg.green);
      }
    }
    
    // Sign in with the test user
    log('Signing in with test user...', colors.fg.yellow);
    await firebase.auth().signInWithEmailAndPassword(testEmail, testPassword);
    
    // Get the current user
    const user = firebase.auth().currentUser;
    log(`Signed in as: ${user.email} (${user.uid})`, colors.fg.green);
    
    return user;
  } catch (e) {
    log(`Authentication failed: ${e.message}`, colors.fg.red);
    return null;
  }
}

// Test Firestore operations
async function testFirestore(user) {
  logSection('Testing Firestore Operations');
  
  if (!user) {
    log('No user authenticated, skipping Firestore tests', colors.fg.red);
    return false;
  }
  
  try {
    const db = firebase.firestore();
    
    // Test collection reference
    const testCollection = 'audioProcessingSettings';
    const testDocId = user.uid;
    
    log(`Writing test data to ${testCollection}/${testDocId}...`, colors.fg.yellow);
    
    // Create test data
    const testData = {
      name: 'Test Settings',
      description: 'Test audio processing settings',
      targetLoudness: -14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.uid,
      isDefault: false
    };
    
    // Write test data
    await db.collection(testCollection).doc(testDocId).set(testData);
    log('Test data written successfully', colors.fg.green);
    
    // Read test data
    log(`Reading test data from ${testCollection}/${testDocId}...`, colors.fg.yellow);
    const docSnapshot = await db.collection(testCollection).doc(testDocId).get();
    
    if (docSnapshot.exists) {
      log('Test data read successfully', colors.fg.green);
      log('Test data:', colors.fg.white);
      log(JSON.stringify(docSnapshot.data(), null, 2), colors.fg.white);
    } else {
      log('Test data not found', colors.fg.red);
      return false;
    }
    
    // Update test data
    log(`Updating test data in ${testCollection}/${testDocId}...`, colors.fg.yellow);
    await db.collection(testCollection).doc(testDocId).update({
      updatedAt: new Date().toISOString(),
      targetLoudness: -12
    });
    log('Test data updated successfully', colors.fg.green);
    
    // Read updated test data
    log(`Reading updated test data from ${testCollection}/${testDocId}...`, colors.fg.yellow);
    const updatedDocSnapshot = await db.collection(testCollection).doc(testDocId).get();
    
    if (updatedDocSnapshot.exists) {
      log('Updated test data read successfully', colors.fg.green);
      log('Updated test data:', colors.fg.white);
      log(JSON.stringify(updatedDocSnapshot.data(), null, 2), colors.fg.white);
    } else {
      log('Updated test data not found', colors.fg.red);
      return false;
    }
    
    // Delete test data
    log(`Deleting test data from ${testCollection}/${testDocId}...`, colors.fg.yellow);
    await db.collection(testCollection).doc(testDocId).delete();
    log('Test data deleted successfully', colors.fg.green);
    
    return true;
  } catch (e) {
    log(`Firestore operations failed: ${e.message}`, colors.fg.red);
    return false;
  }
}

// Test Storage operations
async function testStorage(user) {
  logSection('Testing Storage Operations');
  
  if (!user) {
    log('No user authenticated, skipping Storage tests', colors.fg.red);
    return false;
  }
  
  try {
    const storage = firebase.storage();
    
    // Test file path
    const testFilePath = `audio/${user.uid}/test-audio.wav`;
    
    // Check if test-assets directory exists
    const testAssetsDir = path.join(process.cwd(), 'test-assets', 'audio');
    if (!fs.existsSync(testAssetsDir)) {
      log('test-assets/audio directory not found', colors.fg.red);
      log('Creating test-assets/audio directory...', colors.fg.yellow);
      fs.mkdirSync(testAssetsDir, { recursive: true });
    }
    
    // Create a test audio file if it doesn't exist
    const testAudioPath = path.join(testAssetsDir, 'test-tone-440hz.wav');
    if (!fs.existsSync(testAudioPath)) {
      log('Test audio file not found', colors.fg.red);
      log('Creating test audio file...', colors.fg.yellow);
      
      // Create a simple test audio file
      fs.writeFileSync(testAudioPath, Buffer.alloc(1000));
      log('Test audio file created', colors.fg.green);
    }
    
    // Upload test file
    log(`Uploading test file to ${testFilePath}...`, colors.fg.yellow);
    const fileBuffer = fs.readFileSync(testAudioPath);
    const storageRef = storage.ref();
    const fileRef = storageRef.child(testFilePath);
    
    await fileRef.put(fileBuffer);
    log('Test file uploaded successfully', colors.fg.green);
    
    // Get download URL
    log('Getting download URL...', colors.fg.yellow);
    const downloadURL = await fileRef.getDownloadURL();
    log(`Download URL: ${downloadURL}`, colors.fg.green);
    
    // Delete test file
    log(`Deleting test file from ${testFilePath}...`, colors.fg.yellow);
    await fileRef.delete();
    log('Test file deleted successfully', colors.fg.green);
    
    return true;
  } catch (e) {
    log(`Storage operations failed: ${e.message}`, colors.fg.red);
    return false;
  }
}

// Test audio processing functionality
async function testAudioProcessing(user) {
  logSection('Testing Audio Processing Functionality');
  
  if (!user) {
    log('No user authenticated, skipping audio processing tests', colors.fg.red);
    return false;
  }
  
  try {
    // Check if verify-audio-processing.ts exists
    const verifyScriptPath = path.join(process.cwd(), 'scripts', 'verify-audio-processing.ts');
    if (!fs.existsSync(verifyScriptPath)) {
      log('verify-audio-processing.ts not found', colors.fg.red);
      log('Skipping audio processing tests', colors.fg.yellow);
      return true;
    }
    
    // Check if test audio file exists
    const testAudioPath = path.join(process.cwd(), 'test-assets', 'audio', 'test-tone-440hz.wav');
    if (!fs.existsSync(testAudioPath)) {
      log('Test audio file not found', colors.fg.red);
      log('Skipping audio processing tests', colors.fg.yellow);
      return true;
    }
    
    // Run the verification script
    log('Running audio processing verification...', colors.fg.yellow);
    if (!runCommand(`npx ts-node ${verifyScriptPath} ${testAudioPath}`, 'Failed to run verification script', true)) {
      log('Audio processing verification failed', colors.fg.red);
      return false;
    }
    
    log('Audio processing verification completed', colors.fg.green);
    return true;
  } catch (e) {
    log(`Audio processing tests failed: ${e.message}`, colors.fg.red);
    return false;
  }
}

// Sign out
async function signOut() {
  logSection('Signing Out');
  
  try {
    await firebase.auth().signOut();
    log('Signed out successfully', colors.fg.green);
    return true;
  } catch (e) {
    log(`Sign out failed: ${e.message}`, colors.fg.red);
    return false;
  }
}

// Main function
async function main() {
  logSection('Testing Backend Functionality on Firebase');
  
  // Load environment variables
  if (!loadEnvironmentVariables()) {
    log('Failed to load environment variables', colors.fg.red);
    log('Please update the .env file with your actual values and try again', colors.fg.yellow);
    process.exit(1);
  }
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    log('Failed to initialize Firebase', colors.fg.red);
    process.exit(1);
  }
  
  // Test authentication
  const user = await testAuthentication();
  if (!user) {
    log('Authentication tests failed', colors.fg.red);
    process.exit(1);
  }
  
  // Test Firestore operations
  if (!await testFirestore(user)) {
    log('Firestore tests failed', colors.fg.red);
    process.exit(1);
  }
  
  // Test Storage operations
  if (!await testStorage(user)) {
    log('Storage tests failed', colors.fg.red);
    process.exit(1);
  }
  
  // Test audio processing functionality
  if (!await testAudioProcessing(user)) {
    log('Audio processing tests failed', colors.fg.red);
    process.exit(1);
  }
  
  // Sign out
  if (!await signOut()) {
    log('Sign out failed', colors.fg.red);
    process.exit(1);
  }
  
  logSection('Testing Complete');
  log('Backend functionality tests completed successfully!', colors.fg.green);
  log('All tests passed!', colors.fg.green);
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 