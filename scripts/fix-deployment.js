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

// Create or update a file
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  log(`Created/updated file: ${filePath}`, colors.fg.green);
}

// Main function
async function main() {
  log('🚀 Starting BallTalk Deployment Fix', colors.fg.green + colors.bright);
  
  // Step 1: Create firebase.json if it doesn't exist
  log('\n📝 Step 1: Creating Firebase configuration files...', colors.fg.yellow);
  
  const firebaseJsonContent = `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|eot|otf|ttf|ttc|woff|woff2|font.css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=604800"
          }
        ]
      }
    ]
  }
}`;

  writeFile('firebase.json', firebaseJsonContent);
  
  // Step 2: Create .firebaserc if it doesn't exist
  const firebaseRcContent = `{
  "projects": {
    "default": "balltalkbeta"
  }
}`;

  writeFile('.firebaserc', firebaseRcContent);
  
  // Step 3: Build the web app
  log('\n🔨 Step 3: Building the web app...', colors.fg.yellow);
  runCommand('npm run build:web');
  
  // Verify the dist directory exists
  if (!fs.existsSync('dist')) {
    log('\n❌ Error: The "dist" directory was not created by the build process.', colors.fg.red);
    log('Please check your build configuration.', colors.fg.red);
    process.exit(1);
  } else {
    log('\n✅ Build successful! "dist" directory found.', colors.fg.green);
  }
  
  // Step 4: Deploy to Firebase
  log('\n🚀 Step 4: Deploying to Firebase...', colors.fg.yellow);
  runCommand('firebase deploy --only hosting');
  
  log('\n✅ Deployment fix completed!', colors.fg.green + colors.bright);
  log('Your app should now be properly deployed at https://balltalkbeta.web.app', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 