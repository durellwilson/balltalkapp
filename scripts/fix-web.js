#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🧹 Cleaning up Metro cache...');

// Clear Metro cache
try {
  // Remove Metro cache directory
  const metroDir = path.join(os.tmpdir(), 'metro-cache');
  if (fs.existsSync(metroDir)) {
    console.log(`Removing Metro cache directory: ${metroDir}`);
    execSync(`rm -rf "${metroDir}"`);
  }
  
  // Remove Expo web cache
  const webCacheDir = path.join(process.cwd(), '.expo', 'web');
  if (fs.existsSync(webCacheDir)) {
    console.log(`Removing Expo web cache directory: ${webCacheDir}`);
    execSync(`rm -rf "${webCacheDir}"`);
  }
  
  // Remove node_modules/.cache
  const nodeModulesCacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesCacheDir)) {
    console.log(`Removing node_modules/.cache directory: ${nodeModulesCacheDir}`);
    execSync(`rm -rf "${nodeModulesCacheDir}"`);
  }
  
  console.log('✅ Cache cleanup complete!');
} catch (error) {
  console.error('❌ Error cleaning cache:', error);
}

console.log('🚀 Starting web app with clean cache...');

// Start the web app with a clean cache
try {
  execSync('npx expo start --web --port 9003 --clear', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error starting web app:', error);
} 