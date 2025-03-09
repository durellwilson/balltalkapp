// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

// Use the parent directory (project root) instead of __dirname (config directory)
const projectRoot = path.resolve(__dirname, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Add additional file extensions for web support
config.resolver.sourceExts.push('mjs');

// Add support for CJS modules used by Firebase
config.resolver.sourceExts.push('cjs');

// Add support for native modules
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Ensure proper resolution of Firebase modules and other dependencies
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@firebase/app': require.resolve('@firebase/app'),
  '@firebase/auth': require.resolve('@firebase/auth'),
  '@firebase/firestore': require.resolve('@firebase/firestore'),
  '@firebase/storage': require.resolve('@firebase/storage'),
  '@react-native-community/datetimepicker': path.resolve(projectRoot, 'node_modules/@react-native-community/datetimepicker'),
};

// Configure server settings for web access
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers for web
      res.setHeader('Access-Control-Allow-Origin', '*');
      return middleware(req, res, next);
    };
  },
};

// Add specific configuration for Expo Router
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // First, let Metro try to resolve it normally
  const defaultResolve = context.resolveRequest;
  if (defaultResolve) {
    try {
      return defaultResolve(context, moduleName, platform);
    } catch (error) {
      // If it fails, we'll try our custom resolution
      console.log(`Failed to resolve ${moduleName}, trying custom resolution`);
    }
  }

  // Special handling for expo-router/entry
  if (moduleName === 'expo-router/entry') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'node_modules/expo-router/entry.js'),
    };
  }

  // Let Metro handle the default case
  return undefined;
};

module.exports = config; 