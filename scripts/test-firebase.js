/**
 * Firebase Integration Test Script
 * 
 * This script tests the Firebase integration to ensure all services
 * are working correctly. It checks authentication, Firestore, Storage,
 * and Cloud Functions.
 */

const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
require('firebase/storage');
require('firebase/functions');
const fs = require('fs');
const path = require('path');

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions();

// Test authentication
async function testAuthentication() {
  console.log('Testing Firebase Authentication...');
  
  try {
    // Sign in anonymously for testing
    const userCredential = await auth.signInAnonymously();
    console.log('✅ Authentication successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Test Firestore
async function testFirestore(user) {
  console.log('Testing Firestore...');
  
  try {
    // Create a test document
    const testDocRef = db.collection('test').doc(user.uid);
    await testDocRef.set({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      testValue: 'Test successful'
    });
    
    // Read the test document
    const docSnapshot = await testDocRef.get();
    if (docSnapshot.exists) {
      console.log('✅ Firestore write/read successful');
    } else {
      throw new Error('Document does not exist after writing');
    }
    
    // Clean up
    await testDocRef.delete();
    console.log('✅ Firestore delete successful');
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    throw error;
  }
}

// Test Storage
async function testStorage(user) {
  console.log('Testing Firebase Storage...');
  
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for Firebase Storage');
    
    // Upload the test file
    const storageRef = storage.ref();
    const testFileRef = storageRef.child(`test/${user.uid}/test-file.txt`);
    
    await testFileRef.put(fs.readFileSync(testFilePath));
    console.log('✅ Storage upload successful');
    
    // Get download URL
    const downloadURL = await testFileRef.getDownloadURL();
    console.log('✅ Storage download URL successful:', downloadURL);
    
    // Clean up
    await testFileRef.delete();
    fs.unlinkSync(testFilePath);
    console.log('✅ Storage delete successful');
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    throw error;
  }
}

// Test Cloud Functions
async function testCloudFunctions() {
  console.log('Testing Cloud Functions...');
  
  try {
    // Call a test function (assumes a function named 'helloWorld' exists)
    const helloWorld = functions.httpsCallable('helloWorld');
    const result = await helloWorld({ text: 'Testing' });
    console.log('✅ Cloud Functions call successful:', result.data);
  } catch (error) {
    console.error('❌ Cloud Functions test failed:', error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting Firebase integration tests...');
    
    // Test authentication
    const user = await testAuthentication();
    
    // Test Firestore
    await testFirestore(user);
    
    // Test Storage
    await testStorage(user);
    
    // Test Cloud Functions
    await testCloudFunctions();
    
    // Sign out
    await auth.signOut();
    console.log('✅ Sign out successful');
    
    console.log('✅ All Firebase integration tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 