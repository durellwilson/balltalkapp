// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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
  '@react-native-community/datetimepicker': path.resolve(__dirname, 'node_modules/@react-native-community/datetimepicker'),
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

module.exports = config; 