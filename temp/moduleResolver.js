// Module resolver to fix import paths
console.log('Initializing module resolver...');

// This file helps Metro bundler resolve modules correctly
// Add any custom module resolution logic here if needed

// For example, to handle Firebase modules correctly:
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode with custom module resolution');
}

module.exports = {}; 