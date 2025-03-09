#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Diagnosing Expo Router setup...');

const projectRoot = process.cwd();

// Check package.json
console.log('\n📦 Checking package.json...');
const packageJsonPath = path.join(projectRoot, 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`  Main entry point: ${packageJson.main}`);
  console.log(`  Expo version: ${packageJson.dependencies.expo}`);
  console.log(`  Expo Router version: ${packageJson.dependencies['expo-router']}`);
  
  // Check if main is set correctly
  if (packageJson.main !== 'expo-router/entry') {
    console.error('  ❌ Main entry point is not set to "expo-router/entry"');
  } else {
    console.log('  ✅ Main entry point is correctly set');
  }
  
  // Check if expo and expo-router versions are compatible
  const expoVersion = packageJson.dependencies.expo.replace('^', '').replace('~', '');
  const routerVersion = packageJson.dependencies['expo-router'].replace('^', '').replace('~', '');
  
  console.log(`  Parsed versions - Expo: ${expoVersion}, Router: ${routerVersion}`);
  
  if (expoVersion.startsWith('52') && routerVersion.startsWith('4')) {
    console.log('  ✅ Expo and Expo Router versions are compatible');
  } else {
    console.error('  ❌ Potential version mismatch. For Expo 52, use Expo Router 4.x');
  }
} catch (error) {
  console.error(`  ❌ Error reading package.json: ${error.message}`);
}

// Check if expo-router is installed correctly
console.log('\n📂 Checking node_modules...');
const routerDir = path.join(projectRoot, 'node_modules/expo-router');
const entryFile = path.join(routerDir, 'entry.js');

if (fs.existsSync(routerDir)) {
  console.log('  ✅ expo-router directory exists');
  
  if (fs.existsSync(entryFile)) {
    console.log('  ✅ entry.js file exists');
    
    // Check the content of entry.js
    try {
      const entryContent = fs.readFileSync(entryFile, 'utf8');
      console.log('  ✅ entry.js file is readable');
      console.log(`  📄 First 150 characters of entry.js:\n  ${entryContent.substring(0, 150).replace(/\n/g, '\n  ')}...`);
    } catch (error) {
      console.error(`  ❌ Error reading entry.js: ${error.message}`);
    }
  } else {
    console.error('  ❌ entry.js file is missing');
  }
} else {
  console.error('  ❌ expo-router directory is missing');
}

// Check Metro config
console.log('\n🚇 Checking Metro configuration...');
const metroConfigPath = path.join(projectRoot, 'metro.config.js');
const configMetroConfigPath = path.join(projectRoot, 'config/metro.config.js');

if (fs.existsSync(metroConfigPath)) {
  console.log('  ✅ metro.config.js exists in project root');
  
  try {
    const metroConfig = fs.readFileSync(metroConfigPath, 'utf8');
    if (metroConfig.includes('resolveRequest')) {
      console.log('  ✅ metro.config.js contains resolveRequest function');
    } else {
      console.error('  ❌ metro.config.js does not contain resolveRequest function');
    }
    
    if (metroConfig.includes('expo-router/entry')) {
      console.log('  ✅ metro.config.js references expo-router/entry');
    } else {
      console.error('  ❌ metro.config.js does not reference expo-router/entry');
    }
  } catch (error) {
    console.error(`  ❌ Error reading metro.config.js: ${error.message}`);
  }
} else if (fs.existsSync(configMetroConfigPath)) {
  console.log('  ✅ metro.config.js exists in config directory');
  
  try {
    const metroConfig = fs.readFileSync(configMetroConfigPath, 'utf8');
    if (metroConfig.includes('resolveRequest')) {
      console.log('  ✅ config/metro.config.js contains resolveRequest function');
    } else {
      console.error('  ❌ config/metro.config.js does not contain resolveRequest function');
    }
    
    if (metroConfig.includes('expo-router/entry')) {
      console.log('  ✅ config/metro.config.js references expo-router/entry');
    } else {
      console.error('  ❌ config/metro.config.js does not reference expo-router/entry');
    }
  } catch (error) {
    console.error(`  ❌ Error reading config/metro.config.js: ${error.message}`);
  }
} else {
  console.error('  ❌ metro.config.js is missing');
}

// Check app directory structure
console.log('\n📱 Checking app directory structure...');
const appDir = path.join(projectRoot, 'app');

if (fs.existsSync(appDir)) {
  console.log('  ✅ app directory exists');
  
  const layoutFile = path.join(appDir, '_layout.tsx');
  const jsLayoutFile = path.join(appDir, '_layout.js');
  
  if (fs.existsSync(layoutFile) || fs.existsSync(jsLayoutFile)) {
    console.log('  ✅ _layout file exists');
  } else {
    console.error('  ❌ _layout file is missing');
  }
  
  // Count route files
  try {
    const files = fs.readdirSync(appDir);
    const routeFiles = files.filter(file => 
      !file.startsWith('_') && 
      (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.js'))
    );
    
    console.log(`  📊 Found ${routeFiles.length} route files in the app directory`);
    
    if (routeFiles.length === 0) {
      console.error('  ❌ No route files found in the app directory');
    }
  } catch (error) {
    console.error(`  ❌ Error reading app directory: ${error.message}`);
  }
} else {
  console.error('  ❌ app directory is missing');
}

// Provide recommendations
console.log('\n🔧 Recommendations:');
console.log('  1. Run "npm run web-fix" to attempt automatic fixes');
console.log('  2. If that doesn\'t work, try reinstalling expo-router:');
console.log('     npm uninstall expo-router');
console.log('     npm install expo-router@4.0.17 --save-exact');
console.log('  3. Make sure your package.json has "main": "expo-router/entry"');
console.log('  4. Clear all caches: "npm run web-clear"');
console.log('  5. If issues persist, try creating a custom entry point in temp/entry.js');

console.log('\n🏁 Diagnosis complete!'); 