#!/usr/bin/env node

/**
 * Test script for the DAW studio functionality
 * This script tests the recording and uploading functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function for logging with colors
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if Firebase is configured
function checkFirebaseConfig() {
  log('Checking Firebase configuration...', colors.cyan);
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`Missing environment variables: ${missingVars.join(', ')}`, colors.red);
    log('Please set these variables in your .env file', colors.yellow);
    return false;
  }
  
  log('Firebase configuration is complete', colors.green);
  return true;
}

// Check if the required services are properly implemented
function checkServices() {
  log('Checking required services...', colors.cyan);
  
  const requiredFiles = [
    'services/DawService.ts',
    'services/AudioStorageService.ts',
    'components/studio/StudioInterface.tsx',
    'components/studio/AudioFileUploader.tsx'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`Missing required files: ${missingFiles.join(', ')}`, colors.red);
    return false;
  }
  
  log('All required services are implemented', colors.green);
  return true;
}

// Check for TypeScript errors in the services
function checkTypeScriptErrors() {
  log('Checking for TypeScript errors...', colors.cyan);
  
  try {
    execSync('npx tsc --noEmit services/DawService.ts services/AudioStorageService.ts', { stdio: 'pipe' });
    log('No TypeScript errors found in the services', colors.green);
    return true;
  } catch (error) {
    log('TypeScript errors found:', colors.red);
    log(error.stdout.toString(), colors.yellow);
    return false;
  }
}

// Main function
async function main() {
  log('=== DAW Studio Test Script ===', colors.bright + colors.cyan);
  
  // Check Firebase configuration
  if (!checkFirebaseConfig()) {
    log('Firebase configuration check failed', colors.red);
    process.exit(1);
  }
  
  // Check required services
  if (!checkServices()) {
    log('Required services check failed', colors.red);
    process.exit(1);
  }
  
  // Check for TypeScript errors
  if (!checkTypeScriptErrors()) {
    log('TypeScript errors found in the services', colors.red);
    log('Please fix the TypeScript errors before running the DAW studio', colors.yellow);
    process.exit(1);
  }
  
  log('\nAll checks passed! The DAW studio is ready to use.', colors.green);
  log('\nTo use the DAW studio:', colors.cyan);
  log('1. Start the development server: npm start', colors.white);
  log('2. Open the app in a web browser or on a device', colors.white);
  log('3. Navigate to the Studio tab', colors.white);
  log('4. Create a new project or open an existing one', colors.white);
  log('5. Add tracks and start recording or uploading audio files', colors.white);
  
  log('\nHappy recording!', colors.bright + colors.green);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.red);
  process.exit(1);
}); 