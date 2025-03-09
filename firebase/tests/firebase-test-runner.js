#!/usr/bin/env node

/**
 * Firebase Test Runner Script for BallTalk App
 * This script provides a menu-driven interface for testing Firebase functionality
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
  }
};

// Log with color
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log a section header
function logSection(title) {
  console.log('\n');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
  log(`  ${title}`, colors.bright + colors.fg.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
}

// Execute a command and return the output
function execute(command, options = {}) {
  try {
    log(`> ${command}`, colors.dim);
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.fg.red);
    log(error.message, colors.fg.red);
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    return null;
  }
}

// Check if emulators are running
function areEmulatorsRunning() {
  try {
    const output = execSync('lsof -i:4000 | grep LISTEN', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    return output.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Check if Firebase CLI is installed
function isFirebaseCliInstalled() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Ensure test audio file exists
function ensureTestAudioFile() {
  const testAudioPath = path.join(process.cwd(), 'test-assets', 'test-audio.mp3');
  
  if (!fs.existsSync(testAudioPath)) {
    log('Test audio file not found. Creating one...', colors.fg.yellow);
    execute('node test-firebase-mock-audio.js');
  } else {
    log('Test audio file exists', colors.fg.green);
  }
}

// Display the main menu
function showMainMenu() {
  console.clear();
  logSection('Firebase Testing for BallTalk App');
  
  log('\nSelect an option:', colors.bright);
  log('1. Run Firebase direct tests (production)', colors.fg.yellow);
  log('2. Run Firebase emulator tests (local)', colors.fg.yellow);
  log('3. Run Firebase integration tests (with app services)', colors.fg.yellow);
  log('4. Run Firebase audio tests', colors.fg.yellow);
  log('5. Start Firebase emulators', colors.fg.yellow);
  log('6. View Firebase emulator UI', colors.fg.yellow);
  log('7. Stop Firebase emulators', colors.fg.yellow);
  log('8. Create test user in production', colors.fg.yellow);
  log('9. Purge test data from production', colors.fg.yellow);
  log('0. Exit', colors.fg.yellow);
  
  rl.question('\nEnter your choice: ', (choice) => {
    handleMenuChoice(choice);
  });
}

// Handle menu choice
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      runDirectTests();
      break;
    case '2':
      runEmulatorTests();
      break;
    case '3':
      runIntegrationTests();
      break;
    case '4':
      runAudioTests();
      break;
    case '5':
      startEmulators();
      break;
    case '6':
      openEmulatorUI();
      break;
    case '7':
      stopEmulators();
      break;
    case '8':
      createTestUserInProduction();
      break;
    case '9':
      purgeTestDataFromProduction();
      break;
    case '0':
      log('\nExiting...', colors.fg.green);
      rl.close();
      process.exit(0);
      break;
    default:
      log('\nInvalid choice. Please try again.', colors.fg.red);
      promptContinue();
      break;
  }
}

// Run direct Firebase tests against production
function runDirectTests() {
  logSection('Running Direct Firebase Tests (Production)');
  
  // Ensure test audio file exists
  ensureTestAudioFile();
  
  log('\nRunning direct tests against production Firebase...', colors.fg.yellow);
  log('NOTE: Some tests may fail due to security rules, which is expected.', colors.fg.yellow);
  
  execute('node test-firebase-direct.js');
  
  promptContinue();
}

// Run Firebase emulator tests
function runEmulatorTests() {
  logSection('Running Firebase Emulator Tests');
  
  // Check if Firebase CLI is installed
  if (!isFirebaseCliInstalled()) {
    log('Firebase CLI is not installed. Installing...', colors.fg.yellow);
    execute('npm install -g firebase-tools');
  }
  
  // Check if emulators are running, start if not
  if (!areEmulatorsRunning()) {
    log('Firebase emulators are not running. Starting them...', colors.fg.yellow);
    execute('firebase emulators:start --import=./firebase-emulator --export-on-exit &', 
      { stdio: 'ignore' });
    
    // Wait for emulators to start
    log('Waiting for emulators to start...', colors.fg.yellow);
    execute('sleep 5');
  } else {
    log('Firebase emulators are already running', colors.fg.green);
  }
  
  // Ensure test audio file exists
  ensureTestAudioFile();
  
  // Run the tests
  log('\nRunning tests against Firebase emulators...', colors.fg.yellow);
  execute('node test-firebase-emulator.js');
  
  promptContinue();
}

// Run Firebase integration tests with app services
function runIntegrationTests() {
  logSection('Running Firebase Integration Tests');
  
  // Check if required dependencies are installed
  try {
    require.resolve('@babel/register');
  } catch (error) {
    log('Required dependencies not found. Installing...', colors.fg.yellow);
    execute('npm install --save-dev @babel/register @babel/preset-env @babel/preset-typescript @babel/preset-react @babel/plugin-transform-modules-commonjs @babel/plugin-proposal-class-properties @babel/plugin-transform-runtime');
  }
  
  // Check if emulators are running, start if not
  if (!areEmulatorsRunning()) {
    log('Firebase emulators are not running. Starting them...', colors.fg.yellow);
    execute('firebase emulators:start --import=./firebase-emulator --export-on-exit &', 
      { stdio: 'ignore' });
    
    // Wait for emulators to start
    log('Waiting for emulators to start...', colors.fg.yellow);
    execute('sleep 5');
  } else {
    log('Firebase emulators are already running', colors.fg.green);
  }
  
  // Ensure test audio file exists
  ensureTestAudioFile();
  
  // Run the tests
  log('\nRunning integration tests with app services...', colors.fg.yellow);
  execute('node test-firebase-integration.js');
  
  promptContinue();
}

// Run Firebase audio tests
function runAudioTests() {
  logSection('Running Firebase Audio Tests');
  
  // Ensure test audio file exists
  ensureTestAudioFile();
  
  // Check if emulators are running
  if (!areEmulatorsRunning()) {
    log('Firebase emulators are not running. The tests will use production Firebase.', colors.fg.yellow);
    log('This may cause permission errors. Consider using emulators instead.', colors.fg.yellow);
    
    rl.question('Continue with production Firebase? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        execute('node test-firebase-audio.js');
      } else {
        log('Starting emulators first...', colors.fg.yellow);
        execute('firebase emulators:start --import=./firebase-emulator --export-on-exit &', 
          { stdio: 'ignore' });
        
        // Wait for emulators to start
        log('Waiting for emulators to start...', colors.fg.yellow);
        execute('sleep 5');
        
        execute('node test-firebase-audio.js');
      }
      
      promptContinue();
    });
    
    return;
  }
  
  // Run the tests
  log('\nRunning audio tests against Firebase...', colors.fg.yellow);
  execute('node test-firebase-audio.js');
  
  promptContinue();
}

// Start Firebase emulators
function startEmulators() {
  logSection('Starting Firebase Emulators');
  
  // Check if Firebase CLI is installed
  if (!isFirebaseCliInstalled()) {
    log('Firebase CLI is not installed. Installing...', colors.fg.yellow);
    execute('npm install -g firebase-tools');
  }
  
  // Check if emulators are already running
  if (areEmulatorsRunning()) {
    log('Firebase emulators are already running', colors.fg.yellow);
    promptContinue();
    return;
  }
  
  log('Starting Firebase emulators...', colors.fg.yellow);
  
  // Start emulators in background
  const command = 'firebase emulators:start --import=./firebase-emulator --export-on-exit';
  execute(command);
  
  // This will only execute if the emulators are stopped
  promptContinue();
}

// Open Firebase emulator UI
function openEmulatorUI() {
  logSection('Opening Firebase Emulator UI');
  
  // Check if emulators are running
  if (!areEmulatorsRunning()) {
    log('Firebase emulators are not running. Please start them first.', colors.fg.red);
    promptContinue();
    return;
  }
  
  log('Opening Firebase emulator UI...', colors.fg.yellow);
  
  const url = 'http://localhost:4000';
  const command = process.platform === 'darwin'
    ? `open ${url}`
    : process.platform === 'win32'
      ? `start ${url}`
      : `xdg-open ${url}`;
  
  execute(command, { exitOnError: false });
  
  log(`Firebase emulator UI opened at ${url}`, colors.fg.green);
  promptContinue();
}

// Stop Firebase emulators
function stopEmulators() {
  logSection('Stopping Firebase Emulators');
  
  // Check if emulators are running
  if (!areEmulatorsRunning()) {
    log('Firebase emulators are not running.', colors.fg.yellow);
    promptContinue();
    return;
  }
  
  log('Stopping Firebase emulators...', colors.fg.yellow);
  
  // Kill all Java processes running the emulators
  if (process.platform === 'win32') {
    execute('taskkill /f /im java.exe', { exitOnError: false });
  } else {
    execute('pkill -f "firebase emulators"', { exitOnError: false });
  }
  
  log('Firebase emulators stopped', colors.fg.green);
  promptContinue();
}

// Create test user in production
function createTestUserInProduction() {
  logSection('Creating Test User in Production');
  
  rl.question('Email for test user: ', (email) => {
    rl.question('Password for test user: ', (password) => {
      // Create a simple script to create the user
      const tempScript = `
        const { initializeApp } = require('firebase/app');
        const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
        
        const firebaseConfig = {
          apiKey: "AIzaSyBPxNpjlx2UGD0j1tom8-i2GOlzUekigFc",
          authDomain: "balltalkbeta.firebaseapp.com", 
          projectId: "balltalkbeta",
          storageBucket: "balltalkbeta.appspot.com",
          messagingSenderId: "628814403087",
          appId: "1:628814403087:web:8fa13594e0608f5c2a357a",
        };
        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        
        createUserWithEmailAndPassword(auth, "${email}", "${password}")
          .then((userCredential) => {
            console.log('✅ User created successfully:', userCredential.user.uid);
            process.exit(0);
          })
          .catch((error) => {
            console.error('❌ Error creating user:', error.message);
            process.exit(1);
          });
      `;
      
      // Write script to temporary file
      const tempFile = path.join(process.cwd(), 'temp-create-user.js');
      fs.writeFileSync(tempFile, tempScript);
      
      // Execute the script
      try {
        log(`Creating test user ${email}...`, colors.fg.yellow);
        execute(`node ${tempFile}`);
        log('User creation completed', colors.fg.green);
      } catch (error) {
        log('User creation failed', colors.fg.red);
      } finally {
        // Remove the temporary file
        fs.unlinkSync(tempFile);
      }
      
      promptContinue();
    });
  });
}

// Purge test data from production
function purgeTestDataFromProduction() {
  logSection('Purging Test Data from Production');
  
  // This is a destructive operation, so we should ask for confirmation
  log('WARNING: This will delete all test data from your production Firebase.', colors.fg.red);
  log('This operation cannot be undone.', colors.fg.red);
  
  rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      log('Operation cancelled.', colors.fg.yellow);
      promptContinue();
      return;
    }
    
    rl.question('Enter email of test user to delete: ', (email) => {
      // Create a simple script to delete the user and associated data
      const tempScript = `
        const { initializeApp } = require('firebase/app');
        const { getAuth, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
        const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');
        const { getStorage, ref, listAll, deleteObject } = require('firebase/storage');
        
        const firebaseConfig = {
          apiKey: "AIzaSyBPxNpjlx2UGD0j1tom8-i2GOlzUekigFc",
          authDomain: "balltalkbeta.firebaseapp.com", 
          projectId: "balltalkbeta",
          storageBucket: "balltalkbeta.appspot.com",
          messagingSenderId: "628814403087",
          appId: "1:628814403087:web:8fa13594e0608f5c2a357a",
        };
        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        
        async function deleteTestData() {
          try {
            // First, let's try to get the user by email
            const q = query(collection(db, 'users'), where('email', '==', '${email}'));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              console.log('No user found with email: ${email}');
              return;
            }
            
            // Process each found user
            for (const userDoc of querySnapshot.docs) {
              const userId = userDoc.id;
              console.log(\`Found user: \${userId}\`);
              
              // Delete user's Firestore data
              try {
                console.log(\`Deleting Firestore data for user: \${userId}\`);
                
                // Delete user document
                await deleteDoc(doc(db, 'users', userId));
                
                // Delete user's audio files
                const audioQuery = query(collection(db, 'audioFiles'), where('userId', '==', userId));
                const audioSnapshot = await getDocs(audioQuery);
                
                for (const audioDoc of audioSnapshot.docs) {
                  await deleteDoc(audioDoc.ref);
                  console.log(\`Deleted audio document: \${audioDoc.id}\`);
                }
                
                console.log('Deleted Firestore data successfully');
              } catch (error) {
                console.error('Error deleting Firestore data:', error);
              }
              
              // Delete user's Storage data
              try {
                console.log(\`Deleting Storage data for user: \${userId}\`);
                
                // List all objects in user's folder
                const storageRef = ref(storage, \`audio/\${userId}\`);
                const listResult = await listAll(storageRef);
                
                // Delete each item
                for (const item of listResult.items) {
                  await deleteObject(item);
                  console.log(\`Deleted storage file: \${item.fullPath}\`);
                }
                
                console.log('Deleted Storage data successfully');
              } catch (error) {
                console.error('Error deleting Storage data:', error);
              }
              
              // Try to delete the Auth user
              try {
                // This would require the user to be logged in
                console.log('To delete the Auth user, you would need to be logged in as that user');
              } catch (error) {
                console.error('Error deleting Auth user:', error);
              }
            }
            
            console.log('Test data purge completed');
          } catch (error) {
            console.error('Error purging test data:', error);
          }
        }
        
        deleteTestData()
          .then(() => process.exit(0))
          .catch((error) => {
            console.error('Unhandled error:', error);
            process.exit(1);
          });
      `;
      
      // Write script to temporary file
      const tempFile = path.join(process.cwd(), 'temp-purge-data.js');
      fs.writeFileSync(tempFile, tempScript);
      
      // Execute the script
      try {
        log(`Purging test data for ${email}...`, colors.fg.yellow);
        execute(`node ${tempFile}`);
        log('Data purge completed', colors.fg.green);
      } catch (error) {
        log('Data purge failed', colors.fg.red);
      } finally {
        // Remove the temporary file
        fs.unlinkSync(tempFile);
      }
      
      promptContinue();
    });
  });
}

// Prompt to continue
function promptContinue() {
  rl.question('\nPress Enter to continue...', () => {
    showMainMenu();
  });
}

// Main function
function main() {
  showMainMenu();
}

// Start the script
main(); 