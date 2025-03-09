/**
 * Direct Firebase Testing Script
 * This script tests Firebase functionality directly without Jest
 */

// Using require syntax for compatibility
const { initializeApp, getApps, getApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} = require('firebase/auth');
const {
  getFirestore,
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
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} = require('firebase/storage');

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

// Test Authentication
async function testAuthentication() {
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
async function testFirestore() {
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
async function testStorage() {
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
  console.log('Starting Direct Firebase Tests');
  console.log('==========================');
  
  const authSuccess = await testAuthentication();
  const firestoreSuccess = await testFirestore();
  const storageSuccess = await testStorage();
  
  console.log('\n--- Test Summary ---');
  logResult('Authentication Tests', authSuccess);
  logResult('Firestore Tests', firestoreSuccess);
  logResult('Storage Tests', storageSuccess);
  
  const allSuccess = authSuccess && firestoreSuccess && storageSuccess;
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