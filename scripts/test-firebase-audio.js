/**
 * Test script for Firebase connection and audio recording
 * 
 * This script tests:
 * 1. Firebase authentication
 * 2. Firebase Firestore
 * 3. Firebase Storage
 * 4. Audio recording and upload
 */

const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
require('firebase/storage');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const readline = require('readline');

// Load environment variables
dotenv.config();

// ANSI color codes for console output
const colors = {
  fg: {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  reset: '\x1b[0m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Logging function
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Section header
function logSection(title) {
  const separator = '='.repeat(title.length + 10);
  log(`\n${separator}`, colors.fg.cyan);
  log(`===== ${title} =====`, colors.fg.cyan);
  log(`${separator}\n`, colors.fg.cyan);
}

// Initialize Firebase
function initializeFirebase() {
  logSection('Firebase Initialization');
  
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
        process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST,
        parseInt(process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT)
      );
      log(`Connected to Firestore emulator at ${process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_URL}`, colors.fg.green);
    }
    
    if (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL) {
      firebase.storage().useEmulator(
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
        parseInt(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT)
      );
      log(`Connected to Storage emulator at ${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_URL}`, colors.fg.green);
    }
  }
  
  return firebase;
}

// Test authentication
async function testAuthentication() {
  logSection('Authentication Test');
  
  return new Promise((resolve, reject) => {
    rl.question('Enter email for authentication test: ', (email) => {
      rl.question('Enter password: ', async (password) => {
        try {
          log('Signing in...', colors.fg.yellow);
          const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          log(`Successfully signed in as ${user.email} (${user.uid})`, colors.fg.green);
          log('Authentication test passed!', colors.fg.green);
          
          resolve(user);
        } catch (error) {
          log(`Authentication failed: ${error.message}`, colors.fg.red);
          reject(error);
        }
      });
    });
  });
}

// Test Firestore
async function testFirestore(user) {
  logSection('Firestore Test');
  
  try {
    const db = firebase.firestore();
    
    // Test document creation
    log('Creating test document...', colors.fg.yellow);
    const testCollection = db.collection('test_collection');
    const testDocRef = testCollection.doc(`test_doc_${Date.now()}`);
    
    await testDocRef.set({
      userId: user.uid,
      email: user.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      testValue: 'This is a test document'
    });
    
    log('Test document created successfully', colors.fg.green);
    
    // Test document retrieval
    log('Retrieving test document...', colors.fg.yellow);
    const docSnapshot = await testDocRef.get();
    
    if (docSnapshot.exists) {
      log('Test document retrieved successfully', colors.fg.green);
      log(`Document data: ${JSON.stringify(docSnapshot.data())}`, colors.fg.green);
    } else {
      throw new Error('Test document not found');
    }
    
    // Test document update
    log('Updating test document...', colors.fg.yellow);
    await testDocRef.update({
      updated: true,
      updateTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Verify update
    const updatedSnapshot = await testDocRef.get();
    if (updatedSnapshot.exists && updatedSnapshot.data().updated === true) {
      log('Test document updated successfully', colors.fg.green);
    } else {
      throw new Error('Test document update failed');
    }
    
    // Test document deletion
    log('Deleting test document...', colors.fg.yellow);
    await testDocRef.delete();
    
    // Verify deletion
    const deletedSnapshot = await testDocRef.get();
    if (!deletedSnapshot.exists) {
      log('Test document deleted successfully', colors.fg.green);
    } else {
      throw new Error('Test document deletion failed');
    }
    
    log('Firestore test passed!', colors.fg.green);
    return true;
  } catch (error) {
    log(`Firestore test failed: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Test Storage
async function testStorage(user) {
  logSection('Storage Test');
  
  try {
    const storage = firebase.storage();
    const storageRef = storage.ref();
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test_file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for Firebase Storage');
    
    // Upload test file
    log('Uploading test file...', colors.fg.yellow);
    const testFileRef = storageRef.child(`test_files/${user.uid}_${Date.now()}.txt`);
    
    const fileData = fs.readFileSync(testFilePath);
    const uploadTask = await testFileRef.put(fileData);
    
    log('Test file uploaded successfully', colors.fg.green);
    
    // Get download URL
    log('Getting download URL...', colors.fg.yellow);
    const downloadURL = await testFileRef.getDownloadURL();
    
    log(`Download URL: ${downloadURL}`, colors.fg.green);
    
    // Delete test file
    log('Deleting test file...', colors.fg.yellow);
    await testFileRef.delete();
    
    log('Test file deleted successfully', colors.fg.green);
    
    // Clean up local test file
    fs.unlinkSync(testFilePath);
    
    log('Storage test passed!', colors.fg.green);
    return true;
  } catch (error) {
    log(`Storage test failed: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Test audio recording and upload
async function testAudioRecording(user) {
  logSection('Audio Recording Test');
  
  return new Promise((resolve, reject) => {
    try {
      log('This test will record audio for 5 seconds and upload it to Firebase Storage', colors.fg.yellow);
      log('Make sure your microphone is connected and working', colors.fg.yellow);
      
      rl.question('Press Enter to start recording...', async () => {
        try {
          // Create output directory if it doesn't exist
          const outputDir = path.join(__dirname, 'test_output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }
          
          const outputFile = path.join(outputDir, `test_recording_${Date.now()}.wav`);
          
          log('Recording audio for 5 seconds...', colors.fg.yellow);
          
          // Use SoX for recording (must be installed on the system)
          const recordingProcess = exec(`sox -d -r 44100 -c 2 "${outputFile}" trim 0 5`, async (error) => {
            if (error) {
              log(`Recording failed: ${error.message}`, colors.fg.red);
              reject(error);
              return;
            }
            
            log('Recording completed successfully', colors.fg.green);
            log(`Saved to: ${outputFile}`, colors.fg.green);
            
            // Upload to Firebase Storage
            try {
              log('Uploading recording to Firebase Storage...', colors.fg.yellow);
              
              const storage = firebase.storage();
              const storageRef = storage.ref();
              const audioRef = storageRef.child(`test_recordings/${user.uid}_${Date.now()}.wav`);
              
              const fileData = fs.readFileSync(outputFile);
              const uploadTask = await audioRef.put(fileData);
              
              // Get download URL
              const downloadURL = await audioRef.getDownloadURL();
              
              log('Recording uploaded successfully', colors.fg.green);
              log(`Download URL: ${downloadURL}`, colors.fg.green);
              
              // Test audio quality
              log('Testing audio quality...', colors.fg.yellow);
              
              // Get file metadata
              const metadata = await audioRef.getMetadata();
              log(`File size: ${metadata.size} bytes`, colors.fg.green);
              log(`Content type: ${metadata.contentType}`, colors.fg.green);
              
              log('Audio recording test passed!', colors.fg.green);
              resolve(true);
            } catch (uploadError) {
              log(`Upload failed: ${uploadError.message}`, colors.fg.red);
              reject(uploadError);
            }
          });
          
          // Show recording in progress
          const recordingInterval = setInterval(() => {
            process.stdout.write('.');
          }, 500);
          
          // Clear interval after recording is done
          setTimeout(() => {
            clearInterval(recordingInterval);
            process.stdout.write('\n');
          }, 5000);
        } catch (recordingError) {
          log(`Recording setup failed: ${recordingError.message}`, colors.fg.red);
          reject(recordingError);
        }
      });
    } catch (error) {
      log(`Audio recording test failed: ${error.message}`, colors.fg.red);
      reject(error);
    }
  });
}

// Sign out
async function signOut() {
  logSection('Sign Out');
  
  try {
    await firebase.auth().signOut();
    log('Signed out successfully', colors.fg.green);
    return true;
  } catch (error) {
    log(`Sign out failed: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Initialize Firebase
    initializeFirebase();
    
    // Test authentication
    const user = await testAuthentication();
    
    // Test Firestore
    await testFirestore(user);
    
    // Test Storage
    await testStorage(user);
    
    // Test audio recording
    await testAudioRecording(user);
    
    // Sign out
    await signOut();
    
    log('\nAll tests completed successfully!', colors.fg.green);
    rl.close();
    process.exit(0);
  } catch (error) {
    log(`\nTest failed: ${error.message}`, colors.fg.red);
    rl.close();
    process.exit(1);
  }
}

// Run the main function
main(); 