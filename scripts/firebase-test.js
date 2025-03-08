#!/usr/bin/env node

/**
 * Firebase Testing Script for BallTalk App
 * This script provides a menu-driven interface for testing with Firebase emulators
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Check if a process is running on a port
function isPortInUse(port) {
  try {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i:${port} | grep LISTEN`;
    
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Display the main menu
function showMainMenu() {
  console.clear();
  logSection('Firebase Testing for BallTalk App');
  
  log('\nSelect an option:', colors.bright);
  log('1. Start Firebase emulators', colors.fg.yellow);
  log('2. Seed Firebase emulators with test data', colors.fg.yellow);
  log('3. Start app with Firebase emulators', colors.fg.yellow);
  log('4. Run tests with Firebase emulators', colors.fg.yellow);
  log('5. View Firebase emulator UI', colors.fg.yellow);
  log('6. Reset Firebase emulators', colors.fg.yellow);
  log('7. Deploy to Firebase (Production)', colors.fg.yellow);
  log('8. Show Firebase testing instructions', colors.fg.yellow);
  log('0. Exit', colors.fg.yellow);
  
  rl.question('\nEnter your choice: ', (choice) => {
    handleMenuChoice(choice);
  });
}

// Handle menu choice
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      startEmulators();
      break;
    case '2':
      seedEmulators();
      break;
    case '3':
      startAppWithEmulators();
      break;
    case '4':
      runTestsWithEmulators();
      break;
    case '5':
      openEmulatorUI();
      break;
    case '6':
      resetEmulators();
      break;
    case '7':
      deployToFirebase();
      break;
    case '8':
      showInstructions();
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

// Start Firebase emulators
function startEmulators() {
  logSection('Starting Firebase Emulators');
  
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    log('Firebase CLI is not installed. Installing...', colors.fg.yellow);
    execute('npm install -g firebase-tools');
  }
  
  // Check if emulators are already running
  if (isPortInUse(9099) || isPortInUse(8080) || isPortInUse(9199)) {
    log('Firebase emulators are already running', colors.fg.yellow);
    promptContinue();
    return;
  }
  
  log('Starting Firebase emulators...', colors.fg.yellow);
  execute('firebase emulators:start --import=./firebase-emulator --export-on-exit');
  
  // This will only execute if the emulators are stopped
  promptContinue();
}

// Seed Firebase emulators with test data
function seedEmulators() {
  logSection('Seeding Firebase Emulators');
  
  // Check if emulators are running
  if (!isPortInUse(9099) || !isPortInUse(8080) || !isPortInUse(9199)) {
    log('Firebase emulators are not running. Please start them first.', colors.fg.red);
    promptContinue();
    return;
  }
  
  log('Seeding Firebase emulators with test data...', colors.fg.yellow);
  execute('npm run emulators:seed');
  
  log('Firebase emulators seeded with test data', colors.fg.green);
  promptContinue();
}

// Start app with Firebase emulators
function startAppWithEmulators() {
  logSection('Starting App with Firebase Emulators');
  
  // Check if emulators are running
  if (!isPortInUse(9099) || !isPortInUse(8080) || !isPortInUse(9199)) {
    log('Firebase emulators are not running. Starting them...', colors.fg.yellow);
    execute('npm run emulators:start', { stdio: 'ignore' });
  }
  
  log('Starting app with Firebase emulators...', colors.fg.yellow);
  execute('npm run start:emulators');
  
  // This will only execute if the app is stopped
  promptContinue();
}

// Run tests with Firebase emulators
function runTestsWithEmulators() {
  logSection('Running Tests with Firebase Emulators');
  
  // Check if emulators are running
  if (!isPortInUse(9099) || !isPortInUse(8080) || !isPortInUse(9199)) {
    log('Firebase emulators are not running. Starting them...', colors.fg.yellow);
    execute('npm run emulators:start', { stdio: 'ignore' });
  }
  
  log('Running tests with Firebase emulators...', colors.fg.yellow);
  execute('npm run test:unit -- --testPathPattern=firebase');
  
  log('Tests completed', colors.fg.green);
  promptContinue();
}

// Open Firebase emulator UI
function openEmulatorUI() {
  logSection('Opening Firebase Emulator UI');
  
  // Check if emulators are running
  if (!isPortInUse(9099) || !isPortInUse(8080) || !isPortInUse(9199)) {
    log('Firebase emulators are not running. Please start them first.', colors.fg.red);
    promptContinue();
    return;
  }
  
  log('Opening Firebase emulator UI...', colors.fg.yellow);
  
  const url = 'http://localhost:4000';
  const command = process.platform === 'win32'
    ? `start ${url}`
    : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;
  
  execute(command, { exitOnError: false });
  
  log(`Firebase emulator UI opened at ${url}`, colors.fg.green);
  promptContinue();
}

// Reset Firebase emulators
function resetEmulators() {
  logSection('Resetting Firebase Emulators');
  
  // Check if emulators are running
  if (isPortInUse(9099) || isPortInUse(8080) || isPortInUse(9199)) {
    log('Stopping Firebase emulators...', colors.fg.yellow);
    
    const command = process.platform === 'win32'
      ? `taskkill /F /IM node.exe /FI "WINDOWTITLE eq firebase"`
      : `pkill -f "firebase emulators"`;
    
    execute(command, { exitOnError: false });
  }
  
  log('Clearing Firebase emulator data...', colors.fg.yellow);
  
  const emulatorDir = path.join(process.cwd(), 'firebase-emulator');
  if (fs.existsSync(emulatorDir)) {
    execute(`rm -rf ${emulatorDir}`);
    log('Firebase emulator data cleared', colors.fg.green);
  } else {
    log('No Firebase emulator data to clear', colors.fg.yellow);
  }
  
  log('Firebase emulators reset', colors.fg.green);
  promptContinue();
}

// Deploy to Firebase (Production)
function deployToFirebase() {
  logSection('Deploying to Firebase (Production)');
  
  log('WARNING: This will deploy to your production Firebase project.', colors.fg.red);
  rl.question('Are you sure you want to continue? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      log('Deploying to Firebase...', colors.fg.yellow);
      execute('npm run deploy');
      log('Deployment completed', colors.fg.green);
    } else {
      log('Deployment cancelled', colors.fg.yellow);
    }
    
    promptContinue();
  });
}

// Show Firebase testing instructions
function showInstructions() {
  logSection('Firebase Testing Instructions');
  
  log('\n1. Start Firebase Emulators:', colors.fg.magenta);
  log('   - This starts the Firebase emulators for Auth, Firestore, and Storage');
  log('   - The emulators will run on the following ports:');
  log('     - Auth: 9099');
  log('     - Firestore: 8080');
  log('     - Storage: 9199');
  log('     - Emulator UI: 4000');
  
  log('\n2. Seed Firebase Emulators:', colors.fg.magenta);
  log('   - This seeds the emulators with test data');
  log('   - Test users:');
  log('     - Athlete: athlete@example.com / password123');
  log('     - Fan: fan@example.com / password123');
  log('   - Test songs and playlists will be created');
  
  log('\n3. Start App with Firebase Emulators:', colors.fg.magenta);
  log('   - This starts the app configured to use the Firebase emulators');
  log('   - The app will connect to the emulators instead of the production Firebase');
  
  log('\n4. Run Tests with Firebase Emulators:', colors.fg.magenta);
  log('   - This runs the tests that interact with Firebase using the emulators');
  
  log('\n5. View Firebase Emulator UI:', colors.fg.magenta);
  log('   - This opens the Firebase emulator UI in your browser');
  log('   - You can view and modify the data in the emulators');
  
  log('\n6. Reset Firebase Emulators:', colors.fg.magenta);
  log('   - This stops the emulators and clears the emulator data');
  
  log('\n7. Deploy to Firebase (Production):', colors.fg.magenta);
  log('   - This deploys the app to your production Firebase project');
  log('   - Use with caution!');
  
  log('\nTesting Flow:', colors.fg.blue);
  log('1. Start Firebase emulators');
  log('2. Seed emulators with test data');
  log('3. Start app with emulators');
  log('4. Test the app using the test accounts');
  log('5. View the emulator UI to verify data changes');
  log('6. Reset emulators when done');
  
  promptContinue();
}

// Prompt to continue
function promptContinue() {
  rl.question('\nPress Enter to return to the main menu...', () => {
    showMainMenu();
  });
}

// Main function
function main() {
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    log('Firebase CLI is not installed. Installing...', colors.fg.yellow);
    execute('npm install -g firebase-tools');
  }
  
  // Show the main menu
  showMainMenu();
}

// Handle script termination
process.on('SIGINT', () => {
  log('\nExiting...', colors.fg.green);
  rl.close();
  process.exit(0);
});

// Run the main function
main(); 