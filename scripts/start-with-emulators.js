#!/usr/bin/env node

/**
 * This script starts the app with Firebase emulators
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Copy .env.emulator to .env
function setupEnvironment() {
  const envEmulatorPath = path.join(process.cwd(), '.env.emulator');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envEmulatorPath)) {
    log('Error: .env.emulator file not found. Run setup-emulators.js first.', colors.fg.red);
    process.exit(1);
  }
  
  // Backup existing .env file
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), '.env.backup');
    fs.copyFileSync(envPath, backupPath);
    log('Backed up existing .env file to .env.backup', colors.fg.yellow);
  }
  
  // Copy .env.emulator to .env
  fs.copyFileSync(envEmulatorPath, envPath);
  log('Copied .env.emulator to .env', colors.fg.green);
}

// Start Firebase emulators
function startEmulators() {
  // Check if emulators are already running
  if (isPortInUse(9099) || isPortInUse(8080) || isPortInUse(9199)) {
    log('Firebase emulators are already running', colors.fg.yellow);
    return null;
  }
  
  log('Starting Firebase emulators...', colors.fg.yellow);
  
  const emulators = spawn('firebase', ['emulators:start', '--import=./firebase-emulator', '--export-on-exit'], {
    stdio: 'pipe',
    shell: true,
  });
  
  emulators.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Check if emulators are ready
    if (output.includes('All emulators ready')) {
      log('Firebase emulators are running', colors.fg.green);
    }
  });
  
  emulators.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  emulators.on('error', (error) => {
    log(`Error starting Firebase emulators: ${error.message}`, colors.fg.red);
  });
  
  return emulators;
}

// Start the app
function startApp() {
  log('Starting the app...', colors.fg.yellow);
  
  const app = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      EXPO_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  });
  
  app.on('error', (error) => {
    log(`Error starting the app: ${error.message}`, colors.fg.red);
  });
  
  return app;
}

// Main function
function main() {
  logSection('Starting App with Firebase Emulators');
  
  // Setup environment
  setupEnvironment();
  
  // Start Firebase emulators
  const emulators = startEmulators();
  
  // Wait for emulators to start
  setTimeout(() => {
    // Start the app
    const app = startApp();
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('Shutting down...', colors.fg.yellow);
      
      if (app) {
        app.kill();
      }
      
      if (emulators) {
        emulators.kill();
      }
      
      process.exit(0);
    });
  }, 5000);
}

// Run the main function
main(); 