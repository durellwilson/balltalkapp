#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🔍 Diagnosing Expo Router web issue...');

// Check if the expo-router entry file exists
const routerEntryPath = path.join(process.cwd(), 'node_modules/expo-router/entry.js');
if (fs.existsSync(routerEntryPath)) {
  console.log('✅ expo-router entry file exists at:', routerEntryPath);
} else {
  console.error('❌ expo-router entry file not found! This is a critical issue.');
  console.log('Attempting to fix by reinstalling expo-router...');
  try {
    execSync('npm install expo-router@4.0.17 --save-exact', { stdio: 'inherit' });
    console.log('✅ Reinstalled expo-router');
  } catch (error) {
    console.error('❌ Failed to reinstall expo-router:', error);
  }
}

// Check if the main field in package.json is correct
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.main !== 'expo-router/entry') {
    console.error('❌ package.json main field is not set to "expo-router/entry"');
    packageJson.main = 'expo-router/entry';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Fixed package.json main field');
  } else {
    console.log('✅ package.json main field is correctly set');
  }
} catch (error) {
  console.error('❌ Error checking package.json:', error);
}

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
  
  // Remove .expo directory completely
  const expoDir = path.join(process.cwd(), '.expo');
  if (fs.existsSync(expoDir)) {
    console.log(`Removing .expo directory: ${expoDir}`);
    execSync(`rm -rf "${expoDir}"`);
  }
  
  console.log('✅ Cache cleanup complete!');
} catch (error) {
  console.error('❌ Error cleaning cache:', error);
}

// Create a temporary entry file if needed
const tempEntryDir = path.join(process.cwd(), 'temp');
const tempEntryFile = path.join(tempEntryDir, 'entry.js');

try {
  if (!fs.existsSync(tempEntryDir)) {
    fs.mkdirSync(tempEntryDir, { recursive: true });
  }
  
  // Create a simple entry file that imports from expo-router
  const entryContent = `
// Temporary entry file to work around Expo Router issues
import 'expo-router/entry';
`;
  
  fs.writeFileSync(tempEntryFile, entryContent);
  console.log('✅ Created temporary entry file at:', tempEntryFile);
  
  // Update package.json temporarily
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const originalMain = packageJson.main;
  packageJson.main = './temp/entry.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Temporarily updated package.json main field to use our custom entry');
  
  console.log('🚀 Starting web app with clean cache...');
  
  // Start the web app with a clean cache
  try {
    execSync('npx expo start --web --port 9003 --clear', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error starting web app:', error);
  } finally {
    // Restore original package.json
    packageJson.main = originalMain;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Restored original package.json main field');
  }
} catch (error) {
  console.error('❌ Error creating temporary entry:', error);
} 