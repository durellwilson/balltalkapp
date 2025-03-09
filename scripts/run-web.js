#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('Running the web app...');
  execSync('cd /Users/rellonaut/Projects/balltalkapp && npx expo start --web --port 9003 --clear', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running the web app:', error);
} 