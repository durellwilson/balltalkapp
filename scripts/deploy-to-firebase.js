#!/usr/bin/env node

/**
 * Deploy script for Firebase
 * 
 * This script builds the application and deploys it to Firebase
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BUILD_DIR = 'web-build';
const FIREBASE_PROJECT = 'balltalkapp'; // Update with your project name

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper to run commands and log
function runCommand(command, message) {
  console.log(`${colors.cyan}${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Helper to check if npm script exists
function scriptExists(scriptName) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.scripts && packageJson.scripts[scriptName];
  } catch (error) {
    console.error(`${colors.red}Error checking for script: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main deploy function
async function deploy() {
  console.log(`\n${colors.bright}${colors.cyan}====== DEPLOYING TO FIREBASE ======${colors.reset}\n`);
  
  try {
    // 1. Run tests first if they exist
    if (scriptExists('test')) {
      console.log(`${colors.yellow}Running tests before deployment${colors.reset}`);
      if (!runCommand('npm test', 'Running tests')) {
        throw new Error('Tests failed. Deployment aborted.');
      }
    } else {
      console.log(`${colors.yellow}No test script found in package.json - skipping tests${colors.reset}`);
      console.log(`${colors.yellow}Consider adding tests to ensure code quality${colors.reset}`);
    }
    
    // Try to run the navigation tests directly if available
    if (fs.existsSync(path.join(process.cwd(), 'scripts', 'test-navigation.js'))) {
      console.log(`${colors.yellow}Running navigation tests${colors.reset}`);
      if (!runCommand('node scripts/test-navigation.js', 'Running navigation tests')) {
        const proceed = await askForConfirmation('Navigation tests failed. Do you want to proceed with deployment anyway?');
        if (!proceed) {
          throw new Error('Deployment aborted due to failing navigation tests.');
        }
        console.log(`${colors.yellow}Proceeding with deployment despite test failures${colors.reset}`);
      }
    }
    
    // 2. Build the web app
    console.log(`\n${colors.yellow}Building web application${colors.reset}`);
    if (!runCommand('npx expo build:web', 'Building web app')) {
      throw new Error('Build failed. Deployment aborted.');
    }
    
    // 3. Ensure firebase config exists
    if (!fs.existsSync('firebase.json')) {
      throw new Error('firebase.json not found. Please configure Firebase first.');
    }
    
    // 4. Deploy to Firebase
    console.log(`\n${colors.yellow}Deploying to Firebase${colors.reset}`);
    if (!runCommand(`firebase deploy --project=${FIREBASE_PROJECT}`, 'Deploying to Firebase')) {
      throw new Error('Firebase deployment failed.');
    }
    
    // 5. Success!
    console.log(`\n${colors.green}${colors.bright}====== DEPLOYMENT SUCCESSFUL ======${colors.reset}`);
    console.log(`${colors.green}Your app has been deployed to Firebase!${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}DEPLOYMENT FAILED: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Helper for user confirmation
function askForConfirmation(question) {
  return new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`${colors.yellow}${question} (y/N): ${colors.reset}`, answer => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the deploy function
deploy(); 