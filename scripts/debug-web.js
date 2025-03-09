#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log the current directory
console.log('Current directory:', process.cwd());

// Log the contents of the config directory
console.log('Config directory contents:');
try {
  const configFiles = fs.readdirSync(path.join(process.cwd(), 'config'));
  console.log(configFiles);
} catch (error) {
  console.error('Error reading config directory:', error);
}

// Log the app.config.js file
console.log('app.config.js:');
try {
  const appConfig = fs.readFileSync(path.join(process.cwd(), 'app.config.js'), 'utf8');
  console.log(appConfig);
} catch (error) {
  console.error('Error reading app.config.js:', error);
}

// Log the babel.config.js file
console.log('babel.config.js:');
try {
  const babelConfig = fs.readFileSync(path.join(process.cwd(), 'babel.config.js'), 'utf8');
  console.log(babelConfig);
} catch (error) {
  console.error('Error reading babel.config.js:', error);
}

// Log the metro.config.js file
console.log('metro.config.js:');
try {
  const metroConfig = fs.readFileSync(path.join(process.cwd(), 'metro.config.js'), 'utf8');
  console.log(metroConfig);
} catch (error) {
  console.error('Error reading metro.config.js:', error);
}

// Run the web app with debugging
try {
  console.log('Running the web app...');
  execSync('npx expo start --web --port 9003 --no-dev --clear', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running the web app:', error);
} 