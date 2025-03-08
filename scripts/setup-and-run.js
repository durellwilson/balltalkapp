#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
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
  }
};

// Helper function to log with colors
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to run commands
function runCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, colors.fg.cyan);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`Error running command: ${command}`, colors.fg.red);
    log(error.message, colors.fg.red);
    return false;
  }
}

// Create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, colors.fg.green);
  }
}

// Main function
async function main() {
  log('🚀 Starting BallTalk App Setup', colors.fg.green + colors.bright);
  
  // Ensure scripts directory exists
  ensureDirectoryExists(path.join(process.cwd(), 'scripts'));
  
  // Step 1: Install dependencies
  log('\n📦 Step 1: Installing dependencies...', colors.fg.yellow);
  runCommand('npm install');
  
  // Step 2: Kill any running Expo processes
  log('\n🔪 Step 2: Killing any running Expo processes...', colors.fg.yellow);
  try {
    runCommand('pkill -f expo');
  } catch (error) {
    // It's okay if this fails (no processes to kill)
  }
  
  // Step 3: Create GitHub workflow directory if it doesn't exist
  log('\n📁 Step 3: Setting up GitHub workflow...', colors.fg.yellow);
  ensureDirectoryExists(path.join(process.cwd(), '.github', 'workflows'));
  
  // Step 4: Start the app
  log('\n🏃‍♂️ Step 4: Starting the app...', colors.fg.yellow);
  log('Choose how to run the app:', colors.fg.cyan);
  log('1. Web (npm run web)', colors.fg.white);
  log('2. iOS (npm run ios)', colors.fg.white);
  log('3. Android (npm run android)', colors.fg.white);
  
  // Default to web
  runCommand('npm run web');
  
  log('\n✅ Setup complete!', colors.fg.green + colors.bright);
  log('You can run the app again with:', colors.fg.white);
  log('- Web: npm run web', colors.fg.white);
  log('- iOS: npm run ios', colors.fg.white);
  log('- Android: npm run android', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 