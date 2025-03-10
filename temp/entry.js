// Custom entry point to fix Metro bundling issues
console.log('Loading custom entry point...');

// Import our module resolver
require('./moduleResolver');

// Import the standard Expo Router entry
import 'expo-router/entry';
