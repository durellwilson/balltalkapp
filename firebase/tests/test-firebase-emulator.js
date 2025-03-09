/**
 * Firebase Emulator Test Script
 * This script tests Firebase functionality with local emulators
 */

// Using require syntax for compatibility
const { initializeApp, getApps, getApp } = require('firebase/app');
const { 
  getAuth, 
  connectAuthEmulator,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} = require('firebase/auth');
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs
} = require('firebase/firestore');
const {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} = require('firebase/storage');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Define emulator ports
const EMULATOR_HOST = 'localhost';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;
const STORAGE_EMULATOR_PORT = 9199;
const EMULATOR_HUB_PORT = 4000;

// Firebase config for testing with emulators
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Helper to log test results
function logResult(testName, success, message = '') {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status} - ${testName}${message ? ': ' + message : ''}`);
  return success;
}

// Check if emulators are running
async function checkEmulatorsRunning() {
  return new Promise((resolve) => {
    const checkProcess = spawn('lsof', [`-i:${EMULATOR_HUB_PORT}`]);
    
    let output = '';
    checkProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    checkProcess.on('close', (code) => {
      const isRunning = output.includes('LISTEN');
      resolve(isRunning);
    });
  });
}

// Start Firebase emulators
async function startEmulators() {
  console.log('Starting Firebase emulators...');
  
  const emulatorProcess = spawn('firebase', ['emulators:start', '--import=./firebase-emulator', '--export-on-exit'], {
    detached: true,
    stdio: 'pipe'
  });
  
  return new Promise((resolve, reject) => {
    let output = '';
    
    emulatorProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      process.stdout.write(dataStr);
      
      // Check if all emulators are running
      if (dataStr.includes('All emulators ready')) {
        console.log('Firebase emulators started successfully');
        resolve(emulatorProcess);
      }
    });
    
    emulatorProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    emulatorProcess.on('error', (error) => {
      console.error('Failed to start emulators:', error);
      reject(error);
    });
    
    // Set a timeout for starting emulators
    setTimeout(() => {
      if (!output.includes('All emulators ready')) {
        console.log('Timeout waiting for emulators, but continuing anyway...');
        resolve(emulatorProcess);
      }
    }, 15000); // 15 seconds timeout
  });
}

// Initialize Firebase with emulators
async function initializeFirebaseWithEmulators() {
  // Initialize Firebase
  let app;
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      app = getApp();
      console.log('Using existing Firebase app');
    }
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    app = initializeApp(firebaseConfig);
  }
  
  // Initialize services
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  // Connect to emulators
  console.log('Connecting to Firebase emulators...');
  try {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`);
    console.log('Connected to Auth emulator');
    
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
    console.log('Connected to Firestore emulator');
    
    connectStorageEmulator(storage, EMULATOR_HOST, STORAGE_EMULATOR_PORT);
    console.log('Connected to Storage emulator');
  } catch (error) {
    console.error('Error connecting to emulators:', error);
    throw error;
  }
  
  return { auth, db, storage };
}

// Test Authentication
async function testAuthentication(auth) {
  console.log('\n--- Testing Authentication ---');
  let success = true;
  
  try {
    // Test sign up
    const email = `test-${Date.now()}@example.com`;
    const password = 'Test123!';
    
    // Create a new user
    console.log(`Creating test user: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    success = success && logResult('User Creation', !!user, `UID: ${user?.uid}`);
    
    // Test sign out
    await signOut(auth);
    success = success && logResult('User Sign Out', !auth.currentUser);
    
    // Test sign in
    const signInCredential = await signInWithEmailAndPassword(auth, email, password);
    success = success && logResult('User Sign In', !!signInCredential.user);
    
    // Sign out after tests
    await signOut(auth);
  } catch (error) {
    console.error('Authentication test error:', error);
    success = false;
    logResult('Authentication Tests', false, error.message);
  }
  
  return success;
}

// Test Firestore
async function testFirestore(db) {
  console.log('\n--- Testing Firestore ---');
  let success = true;
  
  try {
    // Create test document
    const testId = `test-${Date.now()}`;
    const testDoc = {
      name: 'Test Document',
      createdAt: new Date().toISOString(),
      testValue: Math.random()
    };
    
    // Test creating a document
    console.log(`Creating test document: ${testId}`);
    await setDoc(doc(db, 'tests', testId), testDoc);
    success = success && logResult('Document Creation', true);
    
    // Test reading a document
    const docSnapshot = await getDoc(doc(db, 'tests', testId));
    const docExists = docSnapshot.exists();
    success = success && logResult('Document Reading', docExists);
    
    // Test updating a document
    const updateData = { updated: true, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'tests', testId), updateData);
    
    const updatedSnapshot = await getDoc(doc(db, 'tests', testId));
    success = success && logResult('Document Update', updatedSnapshot.data().updated === true);
    
    // Test querying documents
    const q = query(collection(db, 'tests'), where('updated', '==', true));
    const querySnapshot = await getDocs(q);
    success = success && logResult('Document Query', !querySnapshot.empty);
    
    // Test deleting a document
    await deleteDoc(doc(db, 'tests', testId));
    const deletedSnapshot = await getDoc(doc(db, 'tests', testId));
    success = success && logResult('Document Deletion', !deletedSnapshot.exists());
    
  } catch (error) {
    console.error('Firestore test error:', error);
    success = false;
    logResult('Firestore Tests', false, error.message);
  }
  
  return success;
}

// Test Storage
async function testStorage(storage) {
  console.log('\n--- Testing Storage ---');
  let success = true;
  
  try {
    // Create a test file
    const testId = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for Firebase Storage';
    
    // Test uploading a file
    console.log(`Uploading test file: ${testId}`);
    const storageRef = ref(storage, `tests/${testId}`);
    await uploadString(storageRef, testContent);
    success = success && logResult('File Upload', true);
    
    // Test downloading a file
    const downloadURL = await getDownloadURL(storageRef);
    success = success && logResult('File Download URL', !!downloadURL, downloadURL);
    
    // Test file exists by checking download URL
    const urlExists = typeof downloadURL === 'string' && downloadURL.length > 0;
    success = success && logResult('File Exists', urlExists);
    
    // Test deleting a file
    await deleteObject(storageRef);
    
    // Verify deletion by trying to download (should fail)
    try {
      await getDownloadURL(storageRef);
      success = success && logResult('File Deletion', false, 'File still exists');
    } catch (error) {
      // Expecting an error because the file should be deleted
      success = success && logResult('File Deletion', true);
    }
    
  } catch (error) {
    console.error('Storage test error:', error);
    success = false;
    logResult('Storage Tests', false, error.message);
  }
  
  return success;
}

// Main test function
async function runTests() {
  console.log('Starting Firebase Emulator Tests');
  console.log('===============================');
  
  // Check if emulators are running
  const emulatorsRunning = await checkEmulatorsRunning();
  
  let emulatorProcess = null;
  
  if (!emulatorsRunning) {
    // Start emulators if not running
    try {
      emulatorProcess = await startEmulators();
      // Give emulators time to fully initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Failed to start emulators:', error);
      process.exit(1);
    }
  } else {
    console.log('Firebase emulators are already running');
  }
  
  try {
    // Initialize Firebase with emulators
    const { auth, db, storage } = await initializeFirebaseWithEmulators();
    
    // Run tests
    const authSuccess = await testAuthentication(auth);
    const firestoreSuccess = await testFirestore(db);
    const storageSuccess = await testStorage(storage);
    
    // Summary
    console.log('\n--- Test Summary ---');
    logResult('Authentication Tests', authSuccess);
    logResult('Firestore Tests', firestoreSuccess);
    logResult('Storage Tests', storageSuccess);
    
    const allSuccess = authSuccess && firestoreSuccess && storageSuccess;
    console.log(`\n${allSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allSuccess;
  } catch (error) {
    console.error('Error running tests:', error);
    return false;
  } finally {
    // Only stop emulators if we started them
    if (emulatorProcess) {
      console.log('Tests completed. Emulators will continue running for further testing.');
      console.log('To stop emulators manually, use: firebase emulators:stop');
    }
  }
}

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error running tests:', error);
    process.exit(1);
  }); 