// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');
const fs = require('fs');

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
  // Add explicit resolution for expo-router
  'expo-router': path.resolve(projectRoot, 'node_modules/expo-router'),
  'expo-router/entry': path.resolve(projectRoot, 'node_modules/expo-router/entry.js'),
  // Add fallback components path
  '../../components/fallbacks/ErrorFallback': path.resolve(projectRoot, 'components/fallbacks/ErrorFallback.tsx'),
};

// Configure server settings for web access
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers for web
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Log requests to help with debugging
      if (req.url.includes('expo-router') || req.url.includes('entry.bundle')) {
        console.log(`[Metro] Request: ${req.url}`);
      }
      
      return middleware(req, res, next);
    };
  },
};

// Add specific configuration for Expo Router
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Log resolution attempts for debugging
  if (moduleName.includes('expo-router') || moduleName.includes('entry') || 
      moduleName.includes('ErrorFallback')) {
    console.log(`[Metro] Resolving: ${moduleName} for platform: ${platform}`);
  }

  // Handle the missing ErrorFallback component
  if (moduleName === '../../components/fallbacks/ErrorFallback') {
    const errorFallbackPath = path.resolve(projectRoot, 'components/fallbacks/ErrorFallback.tsx');
    if (fs.existsSync(errorFallbackPath)) {
      return {
        type: 'sourceFile',
        filePath: errorFallbackPath,
      };
    }
  }

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
    // Check if we have a custom entry point in the temp directory
    const tempEntryPath = path.resolve(projectRoot, 'temp/entry.js');
    if (fs.existsSync(tempEntryPath)) {
      console.log(`[Metro] Using custom entry point: ${tempEntryPath}`);
      return {
        type: 'sourceFile',
        filePath: tempEntryPath,
      };
    }
    
    // Fall back to the standard entry point
    const standardEntryPath = path.resolve(projectRoot, 'node_modules/expo-router/entry.js');
    if (fs.existsSync(standardEntryPath)) {
      console.log(`[Metro] Using standard entry point: ${standardEntryPath}`);
      return {
        type: 'sourceFile',
        filePath: standardEntryPath,
      };
    }
    
    console.error(`[Metro] Could not find entry point for expo-router/entry`);
  }

  // Let Metro handle the default case
  return undefined;
};

// Add transformer options for better error reporting
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
};

module.exports = config; 