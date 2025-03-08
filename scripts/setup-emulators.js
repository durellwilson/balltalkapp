#!/usr/bin/env node

/**
 * This script sets up Firebase emulators and seeds them with test data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Create .env.emulator file if it doesn't exist
function createEmulatorEnvFile() {
  const envFilePath = path.join(process.cwd(), '.env.emulator');
  
  if (!fs.existsSync(envFilePath)) {
    log('Creating .env.emulator file...', colors.fg.yellow);
    
    const envContent = `
EXPO_PUBLIC_FIREBASE_API_KEY="demo-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="demo-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="demo-project"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="demo-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ABCDEF123"
EXPO_PUBLIC_FIREBASE_DATABASE_URL="https://demo-project.firebaseio.com"
EXPO_PUBLIC_USE_FIREBASE_EMULATOR="true"
    `.trim();
    
    fs.writeFileSync(envFilePath, envContent);
    log('Created .env.emulator file', colors.fg.green);
  } else {
    log('.env.emulator file already exists', colors.fg.green);
  }
}

// Main function
async function main() {
  logSection('Setting up Firebase Emulators');
  
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    log('Firebase CLI is not installed. Installing...', colors.fg.yellow);
    execute('npm install -g firebase-tools');
  }
  
  // Create .env.emulator file
  createEmulatorEnvFile();
  
  // Start Firebase emulators
  log('Starting Firebase emulators...', colors.fg.yellow);
  execute('firebase emulators:start --import=./firebase-emulator --export-on-exit');
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 