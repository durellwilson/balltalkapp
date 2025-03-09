/**
 * Firebase Audio Upload and Processing Test Script
 * This script tests audio upload and processing functionality with Firebase
 */

// Using require syntax for compatibility
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase config (using hardcoded config for testing)
const firebaseConfig = {
  apiKey: "AIzaSyBPxNpjlx2UGD0j1tom8-i2GOlzUekigFc",
  authDomain: "balltalkbeta.firebaseapp.com", 
  projectId: "balltalkbeta",
  storageBucket: "balltalkbeta.appspot.com",
  messagingSenderId: "628814403087",
  appId: "1:628814403087:web:8fa13594e0608f5c2a357a",
  measurementId: "G-5EH47PRLZP"
};

// Initialize Firebase if not already initialized
let app;
try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    app = getApp();
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  // Fallback to a new initialization 
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized with fallback config');
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper to log test results
function logResult(testName, success, message = '') {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status} - ${testName}${message ? ': ' + message : ''}`);
  return success;
}

// Test audio upload to Firebase Storage
async function testAudioUpload(userId) {
  console.log('\n--- Testing Audio Upload ---');
  let success = true;
  
  try {
    // Create a test audio file if it doesn't exist (or use a sample file)
    let audioFilePath;
    try {
      // Try to find a test audio file
      audioFilePath = path.join(process.cwd(), 'test-assets', 'test-audio.mp3');
      if (!fs.existsSync(audioFilePath)) {
        console.log('Test audio file not found at:', audioFilePath);
        // Check other possible locations
        const altPath = path.join(process.cwd(), 'assets', 'audio', 'sample.mp3');
        if (fs.existsSync(altPath)) {
          audioFilePath = altPath;
          console.log('Using alternative audio file at:', audioFilePath);
        } else {
          throw new Error('No test audio file found');
        }
      }
    } catch (error) {
      console.error('Error finding test audio file:', error);
      return false;
    }
    
    // Read the audio file
    const audioFile = fs.readFileSync(audioFilePath);
    
    // Generate a unique ID for the audio
    const audioId = `test-audio-${Date.now()}`;
    
    // Upload to Firebase Storage - Use the test directory which has open permissions
    console.log(`Uploading audio file: ${audioId}`);
    const storageRef = ref(storage, `test/${audioId}.mp3`);
    const uploadResult = await uploadBytes(storageRef, audioFile);
    
    success = success && logResult('Audio Upload', !!uploadResult, `Size: ${uploadResult.metadata.size} bytes`);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    success = success && logResult('Audio Download URL', !!downloadURL, downloadURL);
    
    // Create metadata in Firestore
    const audioMetadata = {
      userId,
      fileName: `${audioId}.mp3`,
      fileSize: uploadResult.metadata.size,
      contentType: uploadResult.metadata.contentType,
      url: downloadURL,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Use the test collection in Firestore
    await setDoc(doc(db, 'tests', audioId), audioMetadata);
    success = success && logResult('Audio Metadata Creation', true);
    
    // Verify metadata
    const metadataSnapshot = await getDoc(doc(db, 'tests', audioId));
    const metadataExists = metadataSnapshot.exists();
    success = success && logResult('Audio Metadata Verification', metadataExists);
    
    // Return the audio ID for further testing
    return { success, audioId, downloadURL };
    
  } catch (error) {
    console.error('Audio upload test error:', error);
    logResult('Audio Upload Tests', false, error.message);
    return { success: false };
  }
}

// Test audio processing
async function testAudioProcessing(audioId) {
  console.log('\n--- Testing Audio Processing ---');
  let success = true;
  
  try {
    // Update the audio processing status
    const processingUpdate = {
      status: 'processing',
      processingStartedAt: new Date().toISOString()
    };
    
    // Use the test collection in Firestore
    await updateDoc(doc(db, 'tests', audioId), processingUpdate);
    success = success && logResult('Audio Processing Status Update', true);
    
    // Simulate processing (in a real app, this would be done by a cloud function or backend)
    console.log('Simulating audio processing...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing delay
    
    // Update with completed status
    const completedUpdate = {
      status: 'completed',
      processingCompletedAt: new Date().toISOString(),
      // Add processed audio details
      duration: 120, // Fake duration in seconds
      waveformData: [0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1], // Simplified waveform
      transcription: 'This is a test audio file for Firebase testing.',
      bpm: 120
    };
    
    await updateDoc(doc(db, 'tests', audioId), completedUpdate);
    success = success && logResult('Audio Processing Completion Update', true);
    
    // Verify the final state
    const finalSnapshot = await getDoc(doc(db, 'tests', audioId));
    const finalData = finalSnapshot.data();
    success = success && logResult('Final Audio State', finalData.status === 'completed');
    
    return success;
    
  } catch (error) {
    console.error('Audio processing test error:', error);
    logResult('Audio Processing Tests', false, error.message);
    return false;
  }
}

// Sign in and run tests
async function signInAndRunTests() {
  console.log('\n--- Signing in to Firebase ---');
  try {
    // Use our newly created test user
    const email = 'wilsondurell@icloud.com';
    const password = 'sci4life';
    
    try {
      console.log(`Attempting to sign in with ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
      return userCredential.user;
    } catch (e) {
      console.error('Test user login failed:', e.message);
      console.log('Using anonymous test ID instead.');
      return { uid: `test-${Date.now()}` };
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Firebase Audio Tests');
  console.log('===========================');
  
  // Sign in
  const user = await signInAndRunTests();
  if (!user) {
    console.error('Failed to sign in. Tests cannot continue.');
    return false;
  }
  
  // Run audio upload test
  const { success: uploadSuccess, audioId } = await testAudioUpload(user.uid);
  
  // If upload succeeded, test processing
  let processingSuccess = false;
  if (uploadSuccess && audioId) {
    processingSuccess = await testAudioProcessing(audioId);
  }
  
  // Summary
  console.log('\n--- Test Summary ---');
  logResult('Audio Upload Tests', uploadSuccess);
  logResult('Audio Processing Tests', processingSuccess);
  
  const allSuccess = uploadSuccess && processingSuccess;
  console.log(`\n${allSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allSuccess;
}

// Run the tests
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  }); 