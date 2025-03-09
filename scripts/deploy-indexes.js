#!/usr/bin/env node

/**
 * Script to deploy Firebase indexes
 * This script deploys the updated indexes to Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command and return the output
function execute(command) {
  try {
    log(`Executing: ${command}`, colors.cyan);
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

// Main function
async function main() {
  log('🔥 Deploying Firebase indexes...', colors.yellow);

  // Check if firestore.indexes.json exists
  const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  if (!fs.existsSync(indexesPath)) {
    log('❌ firestore.indexes.json not found!', colors.red);
    process.exit(1);
  }

  // Deploy indexes
  log('📤 Deploying indexes to Firebase...', colors.blue);
  const result = execute('firebase deploy --only firestore:indexes');

  if (result.success) {
    log('✅ Indexes deployed successfully!', colors.green);
  } else {
    log('❌ Failed to deploy indexes:', colors.red);
    log(result.stderr || result.error, colors.red);
    process.exit(1);
  }

  log('🎉 All done!', colors.green);
}

// Run the script
main().catch(error => {
  log(`❌ Error: ${error.message}`, colors.red);
  process.exit(1);
}); 