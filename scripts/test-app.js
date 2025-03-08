#!/usr/bin/env node

/**
 * Script to help with testing the BallTalk app
 * This script provides a menu of testing options
 */

const { execSync } = require('child_process');
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
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
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

// Display the main menu
function showMainMenu() {
  console.clear();
  console.log(`\n${colors.bright}${colors.green}=== BallTalk Testing Tool ===${colors.reset}\n`);
  console.log(`${colors.bright}Select a testing option:${colors.reset}\n`);
  console.log(`${colors.yellow}1.${colors.reset} Start app with tunnel (for testing on physical devices)`);
  console.log(`${colors.yellow}2.${colors.reset} Start app with tunnel and clear cache`);
  console.log(`${colors.yellow}3.${colors.reset} Run unit tests`);
  console.log(`${colors.yellow}4.${colors.reset} Run audio-specific tests`);
  console.log(`${colors.yellow}5.${colors.reset} Start Firebase emulators`);
  console.log(`${colors.yellow}6.${colors.reset} Run linting`);
  console.log(`${colors.yellow}7.${colors.reset} Test Dolby API integration`);
  console.log(`${colors.yellow}8.${colors.reset} Test vocal isolation`);
  console.log(`${colors.yellow}9.${colors.reset} Run all tests (CI mode)`);
  console.log(`${colors.yellow}0.${colors.reset} Exit\n`);
  
  rl.question('Enter your choice: ', (choice) => {
    handleMenuChoice(choice);
  });
}

// Handle the user's menu choice
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      console.log(`\n${colors.bright}${colors.green}Starting app with tunnel...${colors.reset}\n`);
      executeCommand('npm run start:tunnel');
      break;
    case '2':
      console.log(`\n${colors.bright}${colors.green}Starting app with tunnel and clearing cache...${colors.reset}\n`);
      executeCommand('npm run start:clear:tunnel');
      break;
    case '3':
      console.log(`\n${colors.bright}${colors.green}Running unit tests...${colors.reset}\n`);
      executeCommand('npm run test:unit');
      promptContinue();
      break;
    case '4':
      console.log(`\n${colors.bright}${colors.green}Running audio-specific tests...${colors.reset}\n`);
      executeCommand('npm run test:audio');
      promptContinue();
      break;
    case '5':
      console.log(`\n${colors.bright}${colors.green}Starting Firebase emulators...${colors.reset}\n`);
      executeCommand('npm run emulators:start');
      break;
    case '6':
      console.log(`\n${colors.bright}${colors.green}Running linting...${colors.reset}\n`);
      executeCommand('npm run lint');
      promptContinue();
      break;
    case '7':
      console.log(`\n${colors.bright}${colors.green}Testing Dolby API integration...${colors.reset}\n`);
      executeCommand('npm run test:dolby');
      promptContinue();
      break;
    case '8':
      console.log(`\n${colors.bright}${colors.green}Testing vocal isolation...${colors.reset}\n`);
      executeCommand('npm run test:vocal-isolation');
      promptContinue();
      break;
    case '9':
      console.log(`\n${colors.bright}${colors.green}Running all tests (CI mode)...${colors.reset}\n`);
      executeCommand('npm run lint');
      executeCommand('npm run test:unit');
      executeCommand('npm run test:audio');
      promptContinue();
      break;
    case '0':
      console.log(`\n${colors.bright}${colors.green}Exiting...${colors.reset}\n`);
      rl.close();
      process.exit(0);
      break;
    default:
      console.log(`\n${colors.red}Invalid choice. Please try again.${colors.reset}\n`);
      promptContinue();
      break;
  }
}

// Prompt to continue
function promptContinue() {
  rl.question(`\n${colors.yellow}Press Enter to return to the main menu...${colors.reset}`, () => {
    showMainMenu();
  });
}

// Display testing instructions
function showInstructions() {
  console.log(`\n${colors.bright}${colors.blue}=== Testing Instructions ===${colors.reset}\n`);
  console.log(`${colors.magenta}Audio Mastering Testing Flow:${colors.reset}`);
  console.log(`1. Record or upload an audio file`);
  console.log(`2. Navigate to the Audio Mastering screen`);
  console.log(`3. Test equalizer, compressor, limiter, and output controls`);
  console.log(`4. Test preset selection and saving`);
  console.log(`5. Process the audio and verify the result`);
  console.log(`6. Save and export the processed audio\n`);
  
  console.log(`${colors.magenta}Offline Mode Testing Flow:${colors.reset}`);
  console.log(`1. Enable airplane mode on your device`);
  console.log(`2. Record audio or attempt to upload`);
  console.log(`3. Verify that the app stores the recording locally`);
  console.log(`4. Re-enable network connection`);
  console.log(`5. Verify that pending uploads are processed\n`);
  
  rl.question(`${colors.yellow}Press Enter to continue to the main menu...${colors.reset}`, () => {
    showMainMenu();
  });
}

// Start the script
console.clear();
console.log(`\n${colors.bright}${colors.green}=== BallTalk App Testing Tool ===${colors.reset}\n`);
console.log(`This tool helps you test the BallTalk app in various ways.\n`);

rl.question(`${colors.yellow}Do you want to see testing instructions? (y/n): ${colors.reset}`, (answer) => {
  if (answer.toLowerCase() === 'y') {
    showInstructions();
  } else {
    showMainMenu();
  }
});

// Handle script termination
process.on('SIGINT', () => {
  console.log(`\n${colors.bright}${colors.green}Exiting...${colors.reset}\n`);
  rl.close();
  process.exit(0);
}); 