// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

// Use the parent directory (project root) instead of __dirname (config directory)
const projectRoot = path.resolve(__dirname, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Add additional file extensions for web support
config.resolver.sourceExts.push('mjs', 'cjs', 'svg');

// Remove svg from asset extensions since we're handling it as source
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// Simple explicit resolutions for common problematic modules
config.resolver.extraNodeModules = {
  '@firebase/app': path.resolve(projectRoot, 'node_modules/@firebase/app'),
  '@firebase/auth': path.resolve(projectRoot, 'node_modules/@firebase/auth'),
  '@firebase/firestore': path.resolve(projectRoot, 'node_modules/@firebase/firestore'),
  '@firebase/storage': path.resolve(projectRoot, 'node_modules/@firebase/storage'),
};

// Add basic logging - ensure reporter exists first
if (!config.reporter) {
  config.reporter = {};
}

config.reporter.update = (event) => {
  if (event.type === 'bundle_build_done') {
    console.log(`Bundle built in ${event.duration}ms`);
  }
};

module.exports = config; 