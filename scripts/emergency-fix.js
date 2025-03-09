#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚨 EMERGENCY FIX FOR EXPO ROUTER WEB ERROR 🚨');
console.log('Fixing "TypeError: Cannot read properties of undefined (reading \'type\')"');

const projectRoot = process.cwd();

// Create a direct entry point that bypasses the problematic resolution
const tempDir = path.join(projectRoot, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a fallback component directory and file
const fallbacksDir = path.join(projectRoot, 'components', 'fallbacks');
if (!fs.existsSync(fallbacksDir)) {
  fs.mkdirSync(fallbacksDir, { recursive: true });
}

// Create the missing ErrorFallback component
const errorFallbackPath = path.join(fallbacksDir, 'ErrorFallback.tsx');
const errorFallbackContent = `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrorFallback({ error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message || 'An unknown error occurred'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
`;

fs.writeFileSync(errorFallbackPath, errorFallbackContent);
console.log(`✅ Created missing ErrorFallback component at: ${errorFallbackPath}`);

// Create a custom entry file
const entryPath = path.join(tempDir, 'entry.js');
const entryContent = `
// Custom entry point to fix Metro bundling issues
import 'expo-router/entry';
`;

fs.writeFileSync(entryPath, entryContent);
console.log(`✅ Created custom entry point at: ${entryPath}`);

// Temporarily modify package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const originalMain = packageJson.main;

packageJson.main = './temp/entry.js';
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Temporarily updated package.json main field');

// Clear all caches
console.log('🧹 Clearing all caches...');
try {
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
  execSync('rm -rf .expo', { stdio: 'inherit' });
  console.log('✅ Caches cleared');
} catch (error) {
  console.error('❌ Error clearing caches:', error);
}

console.log('🚀 Starting web app with emergency fixes...');
console.log('Press Ctrl+C when done to restore original configuration');

try {
  // Start the web app with the emergency fixes
  execSync('EXPO_DEBUG=true npx expo start --web --port 9003 --clear', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      EXPO_DEBUG: 'true',
      NODE_OPTIONS: '--trace-warnings'
    }
  });
} catch (error) {
  console.error('❌ Error starting web app:', error);
} finally {
  // Restore original package.json
  packageJson.main = originalMain;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Restored original package.json configuration');
} 