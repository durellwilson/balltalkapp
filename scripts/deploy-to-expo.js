#!/usr/bin/env node

/**
 * Script to deploy the app to Expo
 * This script helps with local deployment to Expo for testing
 */

const { execSync } = require('child_process');
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
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to execute commands
function executeCommand(command, options = {}) {
  try {
    console.log(`${colors.cyan}> ${command}${colors.reset}`);
    return execSync(command, { 
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
    if (!options.ignoreError) {
      process.exit(1);
    }
    return null;
  }
}

// Check if EAS CLI is installed
function checkEasCli() {
  try {
    execSync('eas --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  console.log(`\n${colors.bright}${colors.green}=== BallTalk Expo Deployment Tool ===${colors.reset}\n`);
  
  // Check if EAS CLI is installed
  if (!checkEasCli()) {
    console.log(`${colors.yellow}EAS CLI is not installed. Installing now...${colors.reset}`);
    executeCommand('npm install -g eas-cli');
  }
  
  // Check if user is logged in to Expo
  try {
    execSync('eas whoami', { stdio: 'ignore' });
    console.log(`${colors.green}✓ Already logged in to Expo${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}You need to log in to Expo first${colors.reset}`);
    executeCommand('eas login');
  }
  
  // Ask which environment to deploy to
  rl.question(`\nWhich environment do you want to deploy to?\n1. Preview (for testing)\n2. Production\nEnter choice (1/2): `, async (choice) => {
    const environment = choice === '2' ? 'production' : 'preview';
    const branch = environment === 'production' ? 'production' : 'preview';
    
    console.log(`\n${colors.green}Deploying to ${environment} environment...${colors.reset}\n`);
    
    // Commit any pending changes
    const hasChanges = execSync('git status --porcelain').toString().trim().length > 0;
    
    if (hasChanges) {
      rl.question(`\n${colors.yellow}You have uncommitted changes. Do you want to commit them before deploying? (y/n): ${colors.reset}`, async (answer) => {
        if (answer.toLowerCase() === 'y') {
          rl.question('Enter commit message: ', (message) => {
            executeCommand('git add .');
            executeCommand(`git commit -m "${message}"`);
            deployToExpo(branch, environment);
            rl.close();
          });
        } else {
          deployToExpo(branch, environment);
          rl.close();
        }
      });
    } else {
      deployToExpo(branch, environment);
      rl.close();
    }
  });
}

// Deploy to Expo
function deployToExpo(branch, environment) {
  console.log(`\n${colors.bright}${colors.green}Deploying to Expo (${environment})...${colors.reset}\n`);
  
  // Create an update
  executeCommand(`eas update --auto --branch ${branch}`);
  
  console.log(`\n${colors.bright}${colors.green}✓ Deployment completed successfully!${colors.reset}\n`);
  
  if (environment === 'preview') {
    console.log(`${colors.yellow}To test the app:${colors.reset}`);
    console.log(`1. Open the Expo Go app on your device`);
    console.log(`2. Scan the QR code from the Expo dashboard`);
    console.log(`3. Or run 'npx expo start --tunnel' to test locally\n`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 