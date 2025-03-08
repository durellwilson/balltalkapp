/**
 * Deploy Audio Processing System to Firebase
 * 
 * This script builds and deploys the audio processing system to Firebase,
 * including:
 * - Building the web app
 * - Deploying to Firebase Hosting
 * - Updating Firebase Storage and Firestore rules
 * - Setting up Firebase Functions (if needed)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Helper function to ask for user confirmation
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${question} (y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  logSection('Checking Firebase CLI');
  
  try {
    execSync('npx firebase --version', { stdio: 'ignore' });
    log('Firebase CLI is installed', colors.fg.green);
    return true;
  } catch (e) {
    log('Firebase CLI is not installed', colors.fg.red);
    log('Installing Firebase CLI...', colors.fg.yellow);
    
    if (!runCommand('npm install -g firebase-tools', 'Failed to install Firebase CLI')) {
      return false;
    }
    
    log('Firebase CLI installed successfully', colors.fg.green);
    return true;
  }
}

// Check if user is logged in to Firebase
async function checkFirebaseLogin() {
  logSection('Checking Firebase Login');
  
  try {
    execSync('npx firebase projects:list', { stdio: 'ignore' });
    log('User is logged in to Firebase', colors.fg.green);
    return true;
  } catch (e) {
    log('User is not logged in to Firebase', colors.fg.red);
    log('Please log in to Firebase...', colors.fg.yellow);
    
    if (!runCommand('npx firebase login', 'Failed to log in to Firebase')) {
      return false;
    }
    
    log('Logged in to Firebase successfully', colors.fg.green);
    return true;
  }
}

// Check if Firebase project is selected
async function checkFirebaseProject() {
  logSection('Checking Firebase Project');
  
  // Check if .firebaserc exists
  const firebaseRcPath = path.join(process.cwd(), '.firebaserc');
  if (fs.existsSync(firebaseRcPath)) {
    try {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
      if (firebaseRc.projects && firebaseRc.projects.default) {
        log(`Firebase project is set to: ${firebaseRc.projects.default}`, colors.fg.green);
        
        // Ask for confirmation
        const confirmed = await askForConfirmation(`Do you want to deploy to project ${firebaseRc.projects.default}?`);
        if (!confirmed) {
          log('Please select a different project...', colors.fg.yellow);
          if (!runCommand('npx firebase use', 'Failed to select Firebase project')) {
            return false;
          }
        }
        
        return true;
      }
    } catch (e) {
      log('Error reading .firebaserc file', colors.fg.red);
    }
  }
  
  log('No Firebase project selected', colors.fg.red);
  log('Please select a Firebase project...', colors.fg.yellow);
  
  if (!runCommand('npx firebase use', 'Failed to select Firebase project')) {
    return false;
  }
  
  log('Firebase project selected successfully', colors.fg.green);
  return true;
}

// Build the web app
function buildWebApp() {
  logSection('Building Web App');
  
  log('Building web app...', colors.fg.yellow);
  
  // Check if build:web script exists in package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts['build:web']) {
      log('build:web script not found in package.json', colors.fg.red);
      log('Using default build command: npx expo export', colors.fg.yellow);
      
      if (!runCommand('npx expo export', 'Failed to build web app')) {
        return false;
      }
    } else {
      if (!runCommand('npm run build:web', 'Failed to build web app')) {
        return false;
      }
    }
    
    log('Web app built successfully', colors.fg.green);
    return true;
  } catch (e) {
    log('Error reading package.json', colors.fg.red);
    log(e.message, colors.fg.red);
    return false;
  }
}

// Update Firebase Storage rules
function updateStorageRules() {
  logSection('Updating Firebase Storage Rules');
  
  // Check if storage.rules exists
  const storageRulesPath = path.join(process.cwd(), 'storage.rules');
  if (!fs.existsSync(storageRulesPath)) {
    log('storage.rules file not found', colors.fg.red);
    log('Creating storage.rules file...', colors.fg.yellow);
    
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
  }
}`;
    
    fs.writeFileSync(storageRulesPath, storageRules);
    log('storage.rules file created', colors.fg.green);
  } else {
    log('storage.rules file found', colors.fg.green);
  }
  
  log('Deploying storage rules...', colors.fg.yellow);
  if (!runCommand('npx firebase deploy --only storage', 'Failed to deploy storage rules')) {
    return false;
  }
  
  log('Storage rules deployed successfully', colors.fg.green);
  return true;
}

// Update Firestore rules
function updateFirestoreRules() {
  logSection('Updating Firestore Rules');
  
  // Check if firestore.rules exists
  const firestoreRulesPath = path.join(process.cwd(), 'firestore.rules');
  if (!fs.existsSync(firestoreRulesPath)) {
    log('firestore.rules file not found', colors.fg.red);
    log('Creating firestore.rules file...', colors.fg.yellow);
    
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
  }
}`;
    
    fs.writeFileSync(firestoreRulesPath, firestoreRules);
    log('firestore.rules file created', colors.fg.green);
  } else {
    log('firestore.rules file found', colors.fg.green);
  }
  
  // Check if firestore.indexes.json exists
  const firestoreIndexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  if (!fs.existsSync(firestoreIndexesPath)) {
    log('firestore.indexes.json file not found', colors.fg.red);
    log('Creating firestore.indexes.json file...', colors.fg.yellow);
    
    const firestoreIndexes = {
      "indexes": [],
      "fieldOverrides": []
    };
    
    fs.writeFileSync(firestoreIndexesPath, JSON.stringify(firestoreIndexes, null, 2));
    log('firestore.indexes.json file created', colors.fg.green);
  } else {
    log('firestore.indexes.json file found', colors.fg.green);
  }
  
  log('Deploying Firestore rules...', colors.fg.yellow);
  if (!runCommand('npx firebase deploy --only firestore', 'Failed to deploy Firestore rules')) {
    return false;
  }
  
  log('Firestore rules deployed successfully', colors.fg.green);
  return true;
}

// Deploy to Firebase Hosting
function deployToHosting() {
  logSection('Deploying to Firebase Hosting');
  
  log('Deploying to Firebase Hosting...', colors.fg.yellow);
  if (!runCommand('npx firebase deploy --only hosting', 'Failed to deploy to Firebase Hosting')) {
    return false;
  }
  
  log('Deployed to Firebase Hosting successfully', colors.fg.green);
  return true;
}

// Main function
async function main() {
  logSection('Deploy Audio Processing System to Firebase');
  
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    log('Failed to check Firebase CLI', colors.fg.red);
    process.exit(1);
  }
  
  // Check if user is logged in to Firebase
  if (!await checkFirebaseLogin()) {
    log('Failed to check Firebase login', colors.fg.red);
    process.exit(1);
  }
  
  // Check if Firebase project is selected
  if (!await checkFirebaseProject()) {
    log('Failed to check Firebase project', colors.fg.red);
    process.exit(1);
  }
  
  // Build the web app
  if (!buildWebApp()) {
    log('Failed to build web app', colors.fg.red);
    process.exit(1);
  }
  
  // Update Firebase Storage rules
  if (!updateStorageRules()) {
    log('Failed to update Storage rules', colors.fg.red);
    process.exit(1);
  }
  
  // Update Firestore rules
  if (!updateFirestoreRules()) {
    log('Failed to update Firestore rules', colors.fg.red);
    process.exit(1);
  }
  
  // Deploy to Firebase Hosting
  if (!deployToHosting()) {
    log('Failed to deploy to Firebase Hosting', colors.fg.red);
    process.exit(1);
  }
  
  logSection('Deployment Complete');
  log('Audio processing system deployed successfully!', colors.fg.green);
  log('Next steps:', colors.fg.yellow);
  log('1. Visit your Firebase console to verify the deployment', colors.fg.white);
  log('2. Test the deployed application', colors.fg.white);
  log('3. Set up monitoring and alerts', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 