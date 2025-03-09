/**
 * Firebase Integration Test Script
 * This script tests the app's actual Firebase implementation by importing the app's services
 */

// Using require syntax for node compatibility
const fs = require('fs');
const path = require('path');

// Define test status tracking
let allTestsPassed = true;
const testResults = [];

// Helper to log test results
function logResult(testName, success, message = '') {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status} - ${testName}${message ? ': ' + message : ''}`);
  
  testResults.push({ name: testName, success, message });
  if (!success) allTestsPassed = false;
  
  return success;
}

// This script will perform direct integration testing with the app's services
// But requires babel/register for transpiling since our app is using ES modules
async function setupBabelRegister() {
  try {
    console.log('Setting up Babel for ES module transpilation...');
    // Dynamic require to avoid issues if babel-register isn't available
    require('@babel/register')({
      presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
      plugins: [
        ['@babel/plugin-transform-modules-commonjs'],
        ['@babel/plugin-proposal-class-properties'],
        ['@babel/plugin-transform-runtime']
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      // Ignore node_modules except for specific packages our services might depend on
      ignore: [/node_modules\/(?!(@react-native|react-native|expo)).*/]
    });
    
    // Set up process.env to mimic what would be in the app
    process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef123456';
    
    console.log('Babel setup completed');
    return true;
  } catch (error) {
    console.error('Failed to set up Babel:', error);
    return false;
  }
}

// Test the AuthService
async function testAuthService() {
  console.log('\n--- Testing AuthService ---');
  
  try {
    // Import the AuthService
    const AuthService = require('./services/AuthService');
    console.log('Successfully imported AuthService');
    
    // Get an instance of the service
    const authService = AuthService.default || AuthService;
    
    if (!authService) {
      return logResult('Import AuthService', false, 'Failed to import AuthService properly');
    }
    
    logResult('Import AuthService', true);
    
    // Test creating a new user
    try {
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';
      
      console.log(`Creating test user: ${email}`);
      const user = await authService.signUpWithEmail(email, password, `test_user_${Date.now()}`, 'fan');
      
      if (user && user.uid) {
        logResult('Create User', true, `Created user with UID: ${user.uid}`);
      } else {
        logResult('Create User', false, 'User was not created properly');
      }
      
      // Test signing out
      await authService.signOut();
      logResult('Sign Out', true);
      
      // Test signing in
      console.log(`Signing in with: ${email}`);
      const signedInUser = await authService.signInWithEmail(email, password);
      
      if (signedInUser && signedInUser.uid) {
        logResult('Sign In', true, `Signed in user with UID: ${signedInUser.uid}`);
      } else {
        logResult('Sign In', false, 'User was not signed in properly');
      }
      
      // Clean up - sign out
      await authService.signOut();
      
      return true;
    } catch (error) {
      console.error('Error testing AuthService:', error);
      logResult('AuthService Tests', false, error.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to import AuthService:', error);
    logResult('Import AuthService', false, error.message);
    return false;
  }
}

// Test the AudioStorageService
async function testAudioStorageService() {
  console.log('\n--- Testing AudioStorageService ---');
  
  try {
    // Import the AudioStorageService
    const AudioStorageService = require('./services/AudioStorageService');
    console.log('Successfully imported AudioStorageService');
    
    // Get an instance of the service
    const audioStorageService = AudioStorageService.default || AudioStorageService;
    
    if (!audioStorageService) {
      return logResult('Import AudioStorageService', false, 'Failed to import AudioStorageService properly');
    }
    
    logResult('Import AudioStorageService', true);
    
    // Get the test audio file
    const testAudioPath = path.join(process.cwd(), 'test-assets', 'test-audio.mp3');
    
    if (!fs.existsSync(testAudioPath)) {
      return logResult('Access Test Audio', false, 'Test audio file does not exist');
    }
    
    const testAudioFile = fs.readFileSync(testAudioPath);
    logResult('Access Test Audio', true, `File size: ${testAudioFile.length} bytes`);
    
    // Create a file object that matches what the service expects
    const fileBlob = new Blob([testAudioFile], { type: 'audio/mp3' });
    const testUserId = `test-user-${Date.now()}`;
    const fileName = `test-audio-${Date.now()}.mp3`;
    
    try {
      console.log(`Uploading audio: ${fileName} for user ${testUserId}`);
      // Test uploading a file
      const uploadResult = await audioStorageService.uploadAudio(fileBlob, testUserId, fileName);
      
      if (uploadResult && uploadResult.url) {
        logResult('Upload Audio', true, `URL: ${uploadResult.url}`);
      } else {
        logResult('Upload Audio', false, 'Upload did not return a valid result');
      }
      
      // Test getting download URL
      try {
        const url = await audioStorageService.getAudioDownloadURL(testUserId, fileName);
        logResult('Get Download URL', !!url, url);
      } catch (error) {
        logResult('Get Download URL', false, error.message);
      }
      
      // Test deleting the file
      try {
        await audioStorageService.deleteAudio(testUserId, fileName);
        logResult('Delete Audio', true);
      } catch (error) {
        logResult('Delete Audio', false, error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error testing AudioStorageService:', error);
      logResult('AudioStorageService Tests', false, error.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to import AudioStorageService:', error);
    logResult('Import AudioStorageService', false, error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Firebase Integration Tests');
  console.log('=================================');
  
  // Set up Babel for ES module transpilation
  const babelSetup = await setupBabelRegister();
  if (!babelSetup) {
    console.error('Failed to set up Babel. Cannot continue tests.');
    process.exit(1);
  }
  
  // Run the tests sequentially
  const authSuccess = await testAuthService();
  const audioStorageSuccess = await testAudioStorageService();
  
  // Show summary
  console.log('\n--- Test Summary ---');
  logResult('Auth Service Tests', authSuccess);
  logResult('Audio Storage Tests', audioStorageSuccess);
  
  console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  // Create a detailed report
  const report = {
    date: new Date().toISOString(),
    allPassed: allTestsPassed,
    tests: testResults
  };
  
  // Save the report to a file
  const reportPath = path.join(process.cwd(), 'firebase-integration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nTest report saved to: ${reportPath}`);
  
  return allTestsPassed;
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