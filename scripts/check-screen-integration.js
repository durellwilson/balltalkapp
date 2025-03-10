/**
 * Script to check for screens that need to be integrated
 * 
 * This script will:
 * 1. Find all router.push() calls
 * 2. Check if the target screens exist
 * 3. Report any missing screens
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to recursively get all files with specific extensions
function getAllFiles(directory, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];
  
  // Get all files with the specified extensions
  extensions.forEach(ext => {
    const pattern = path.join(directory, '**', `*${ext}`);
    const foundFiles = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] });
    files.push(...foundFiles);
  });
  
  return files;
}

// Function to extract router.push paths from a file
function extractRouterPaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const routerPushRegex = /router\.push\(['"]([^'"]+)['"]/g;
    const paths = [];
    
    let match;
    while ((match = routerPushRegex.exec(content)) !== null) {
      paths.push(match[1]);
    }
    
    return paths;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Function to check if a screen exists
function checkScreenExists(screenPath, appDir) {
  // Remove leading slash and handle special paths
  let normalizedPath = screenPath.startsWith('/') ? screenPath.substring(1) : screenPath;
  
  // Handle special paths like (auth)/login
  if (normalizedPath.includes('/')) {
    const segments = normalizedPath.split('/');
    
    // Handle dynamic segments like [id]
    const lastSegment = segments[segments.length - 1];
    if (lastSegment.startsWith('[') && lastSegment.endsWith(']')) {
      // This is a dynamic route, check if the parent directory exists
      const parentPath = segments.slice(0, segments.length - 1).join('/');
      return fs.existsSync(path.join(appDir, parentPath));
    }
    
    // Check if the file exists with .tsx extension
    return (
      fs.existsSync(path.join(appDir, `${normalizedPath}.tsx`)) ||
      fs.existsSync(path.join(appDir, normalizedPath, 'index.tsx'))
    );
  }
  
  // Check for simple paths
  return (
    fs.existsSync(path.join(appDir, `${normalizedPath}.tsx`)) ||
    fs.existsSync(path.join(appDir, normalizedPath, 'index.tsx'))
  );
}

// Main function
function main() {
  const rootDir = path.resolve(__dirname, '..');
  const appDir = path.join(rootDir, 'app');
  const files = getAllFiles(rootDir);
  
  console.log(`Found ${files.length} files to process`);
  
  const missingScreens = new Set();
  
  files.forEach(file => {
    const paths = extractRouterPaths(file);
    
    paths.forEach(screenPath => {
      if (!checkScreenExists(screenPath, appDir)) {
        missingScreens.add(screenPath);
      }
    });
  });
  
  console.log('\nMissing Screens:');
  if (missingScreens.size === 0) {
    console.log('No missing screens found!');
  } else {
    missingScreens.forEach(screen => {
      console.log(`- ${screen}`);
    });
  }
}

main(); 