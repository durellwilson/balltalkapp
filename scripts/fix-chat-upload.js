/**
 * Fix Chat and Upload Functionality
 * 
 * This script addresses several issues:
 * 1. Firebase Storage upload failures
 * 2. Missing icons 
 * 3. Chat functionality issues
 * 
 * It performs the following actions:
 * - Updates Firebase Storage rules
 * - Deploys updated Firestore rules
 * - Updates Firebase hosting headers to prevent caching of critical files
 * - Clears local cache
 * - Verifies configurations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to run a command and log the output
function runCommand(command, message) {
  console.log(`\n${colors.cyan}${colors.bright}› ${message}${colors.reset}`);
  console.log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    console.log(`${colors.green}✓ Command completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Command failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Check if firebase.json exists
function updateFirebaseConfig() {
  console.log(`\n${colors.cyan}${colors.bright}› Updating Firebase configuration${colors.reset}`);
  
  const firebaseConfigPath = path.join(__dirname, '../firebase.json');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    console.error(`${colors.red}✗ firebase.json not found${colors.reset}`);
    return false;
  }
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Add no-cache headers for critical files
    if (!firebaseConfig.hosting.headers) {
      firebaseConfig.hosting.headers = [];
    }
    
    // Ensure app.json is never cached
    const appJsonHeader = firebaseConfig.hosting.headers.find(header => header.source === '/app.json');
    if (!appJsonHeader) {
      firebaseConfig.hosting.headers.push({
        source: '/app.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      });
    }
    
    // Add no-cache for Firebase authentication settings
    const firebaseAuthHeader = firebaseConfig.hosting.headers.find(header => header.source === '/__/firebase/init.js');
    if (!firebaseAuthHeader) {
      firebaseConfig.hosting.headers.push({
        source: '/__/firebase/init.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      });
    }
    
    // Add no-cache for chat assets
    const chatAssetsHeader = firebaseConfig.hosting.headers.find(header => header.source === '/assets/chat/**');
    if (!chatAssetsHeader) {
      firebaseConfig.hosting.headers.push({
        source: '/assets/chat/**',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      });
    }
    
    // Write updated configuration
    fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
    console.log(`${colors.green}✓ firebase.json updated with no-cache headers for critical files${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to update firebase.json: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main function to fix chat and upload issues
async function fixChatAndUpload() {
  console.log(`${colors.cyan}${colors.bright}========================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright} FIXING CHAT AND UPLOAD FUNCTIONALITY${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================${colors.reset}`);
  
  let success = true;
  
  // Update Firebase configuration
  if (!updateFirebaseConfig()) {
    success = false;
  }
  
  // Deploy updated Firebase Storage rules
  if (!runCommand('firebase deploy --only storage', 'Deploying updated Firebase Storage rules')) {
    success = false;
  }
  
  // Deploy updated Firestore rules
  if (!runCommand('firebase deploy --only firestore:rules', 'Deploying updated Firestore rules')) {
    success = false;
  }
  
  // Build with cleared cache
  if (!runCommand('npm run clear-cache && npm run build:web', 'Rebuilding web app with cleared cache')) {
    success = false;
  }
  
  // Deploy to Firebase with cache control
  if (!runCommand('firebase deploy --only hosting', 'Deploying to Firebase with updated cache settings')) {
    success = false;
  }
  
  // Final status
  console.log(`\n${colors.cyan}${colors.bright}========================================${colors.reset}`);
  if (success) {
    console.log(`${colors.green}${colors.bright}✓ FIXES APPLIED SUCCESSFULLY${colors.reset}`);
    console.log(`${colors.green}The chat and upload functionality should now be working correctly.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ SOME FIXES FAILED${colors.reset}`);
    console.log(`${colors.red}Please check the logs above for details on which steps failed.${colors.reset}`);
  }
  console.log(`${colors.cyan}${colors.bright}========================================${colors.reset}\n`);
}

// Run the fix
fixChatAndUpload().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 