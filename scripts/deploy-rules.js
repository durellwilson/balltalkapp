#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  }
};

// Helper function to log with colors
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if files exist
function checkFilesExist() {
  const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
  
  let allFilesExist = true;
  
  if (!fs.existsSync(firestoreRulesPath)) {
    log(`Firestore rules file not found at: ${firestoreRulesPath}`, colors.fg.red);
    allFilesExist = false;
  }
  
  if (!fs.existsSync(storageRulesPath)) {
    log(`Storage rules file not found at: ${storageRulesPath}`, colors.fg.red);
    allFilesExist = false;
  }
  
  return allFilesExist;
}

// Deploy Firestore rules
function deployFirestoreRules() {
  try {
    log('Deploying Firestore security rules...', colors.fg.yellow);
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    log('Firestore rules deployed successfully!', colors.fg.green);
    return true;
  } catch (error) {
    log(`Error deploying Firestore rules: ${error.message}`, colors.fg.red);
    return false;
  }
}

// Deploy Storage rules
function deployStorageRules() {
  try {
    log('Deploying Storage security rules...', colors.fg.yellow);
    execSync('firebase deploy --only storage:rules', { stdio: 'inherit' });
    log('Storage rules deployed successfully!', colors.fg.green);
    return true;
  } catch (error) {
    log(`Error deploying Storage rules: ${error.message}`, colors.fg.red);
    return false;
  }
}

// Main function
async function main() {
  log('🔒 Starting BallTalk Security Rules Deployment', colors.fg.green + colors.bright);
  
  // Step 1: Check if rules files exist
  log('\n📝 Step 1: Checking rules files...', colors.fg.yellow);
  const filesExist = checkFilesExist();
  
  if (!filesExist) {
    log('Required rules files are missing. Please create them first.', colors.fg.red);
    process.exit(1);
  }
  
  // Step 2: Deploy Firestore rules
  log('\n🔥 Step 2: Deploying Firestore rules...', colors.fg.yellow);
  const firestoreSuccess = deployFirestoreRules();
  
  // Step 3: Deploy Storage rules
  log('\n📦 Step 3: Deploying Storage rules...', colors.fg.yellow);
  const storageSuccess = deployStorageRules();
  
  // Summary
  log('\n📋 Deployment Summary:', colors.fg.cyan);
  log(`Firestore Rules: ${firestoreSuccess ? '✅ Success' : '❌ Failed'}`, firestoreSuccess ? colors.fg.green : colors.fg.red);
  log(`Storage Rules: ${storageSuccess ? '✅ Success' : '❌ Failed'}`, storageSuccess ? colors.fg.green : colors.fg.red);
  
  if (firestoreSuccess && storageSuccess) {
    log('\n✅ All security rules deployed successfully!', colors.fg.green + colors.bright);
  } else {
    log('\n⚠️ Some rules failed to deploy. Please check the errors above.', colors.fg.red + colors.bright);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 