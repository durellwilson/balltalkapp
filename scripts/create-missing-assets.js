#!/usr/bin/env node

/**
 * Create Missing Assets Script
 * 
 * This script helps create missing assets in the codebase by:
 * 1. Identifying missing assets referenced in the code
 * 2. Creating placeholder assets for missing files
 * 3. Ensuring all referenced assets exist
 * 
 * Usage:
 *   node scripts/create-missing-assets.js [options]
 * 
 * Options:
 *   --scan           Scan the codebase for missing assets
 *   --create         Create placeholder assets for missing files
 *   --dry-run        Show what would be done without making changes
 *   --help           Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  assetDirs: ['assets', 'assets/images', 'assets/icons', 'assets/fonts'],
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  assetExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ttf', '.otf'],
  ignorePatterns: [
    'node_modules',
    '.git',
    'build',
    'dist',
    '.expo',
    '.next',
    'android',
    'ios',
    'web-build'
  ],
  placeholderAssets: {
    '.png': path.join(__dirname, '..', 'assets', 'images', 'favicon.png'),
    '.jpg': path.join(__dirname, '..', 'assets', 'images', 'favicon.png'),
    '.jpeg': path.join(__dirname, '..', 'assets', 'images', 'favicon.png'),
    '.gif': path.join(__dirname, '..', 'assets', 'images', 'favicon.png'),
    '.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#cccccc"/><text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" alignment-baseline="middle" fill="#666666">Placeholder</text></svg>',
    '.ttf': path.join(__dirname, '..', 'node_modules', 'expo-font', 'build', 'FontLoader.js'),
    '.otf': path.join(__dirname, '..', 'node_modules', 'expo-font', 'build', 'FontLoader.js')
  }
};

// Parse options
const options = {
  scan: args.includes('--scan'),
  create: args.includes('--create'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help')
};

// Show help message
if (options.help || (!options.scan && !options.create)) {
  console.log(`
Create Missing Assets Script

This script helps create missing assets in the codebase by:
1. Identifying missing assets referenced in the code
2. Creating placeholder assets for missing files
3. Ensuring all referenced assets exist

Usage:
  node scripts/create-missing-assets.js [options]

Options:
  --scan           Scan the codebase for missing assets
  --create         Create placeholder assets for missing files
  --dry-run        Show what would be done without making changes
  --help           Show this help message
  `);
  process.exit(0);
}

// Helper functions
function getAllFiles(dir, ignorePaths = []) {
  const fullIgnorePaths = ignorePaths.map(p => path.join(CONFIG.rootDir, p));
  const results = [];

  function traverseDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      
      // Skip ignored paths
      if (fullIgnorePaths.some(ignorePath => fullPath.startsWith(ignorePath))) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverseDir(fullPath);
      } else {
        // Only include files with specified extensions
        if (CONFIG.fileExtensions.some(ext => fullPath.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    }
  }
  
  traverseDir(dir);
  return results;
}

function getRelativePath(filePath) {
  return path.relative(CONFIG.rootDir, filePath);
}

function getFileContent(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function findAssetReferences(fileContent) {
  // Find import statements for assets
  const importRegex = /import\s+[^'"]*['"]([^'"]*\.(png|jpg|jpeg|gif|svg|ttf|otf))['"];?/g;
  const importMatches = [...fileContent.matchAll(importRegex)].map(match => match[1]);
  
  // Find require statements for assets
  const requireRegex = /require\s*\(\s*['"]([^'"]*\.(png|jpg|jpeg|gif|svg|ttf|otf))['"]s*\)/g;
  const requireMatches = [...fileContent.matchAll(requireRegex)].map(match => match[1]);
  
  // Find uri references to assets
  const uriRegex = /uri:\s*['"]([^'"]*\.(png|jpg|jpeg|gif|svg|ttf|otf))['"],?/g;
  const uriMatches = [...fileContent.matchAll(uriRegex)].map(match => match[1]);
  
  // Find source references to assets
  const sourceRegex = /source\s*=\s*[{]?\s*(?:uri:\s*)?['"]([^'"]*\.(png|jpg|jpeg|gif|svg|ttf|otf))['"],?/g;
  const sourceMatches = [...fileContent.matchAll(sourceRegex)].map(match => match[1]);
  
  return [...importMatches, ...requireMatches, ...uriMatches, ...sourceMatches];
}

function resolveAssetPath(assetPath, sourceFilePath) {
  // If the asset path is a URL or a data URI, return null
  if (assetPath.startsWith('http://') || 
      assetPath.startsWith('https://') || 
      assetPath.startsWith('data:') ||
      assetPath.startsWith('file://')) {
    return null;
  }
  
  // If the asset path is relative, resolve it relative to the source file
  if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
    const sourceDir = path.dirname(sourceFilePath);
    return path.resolve(sourceDir, assetPath);
  }
  
  // If the asset path is absolute (starts with /), resolve it relative to the root directory
  if (assetPath.startsWith('/')) {
    return path.join(CONFIG.rootDir, assetPath);
  }
  
  // Otherwise, check if the asset exists in any of the asset directories
  for (const assetDir of CONFIG.assetDirs) {
    const absoluteAssetPath = path.join(CONFIG.rootDir, assetDir, assetPath);
    if (fs.existsSync(absoluteAssetPath)) {
      return absoluteAssetPath;
    }
  }
  
  // If the asset is not found, return a default path in the assets directory
  return path.join(CONFIG.rootDir, 'assets', 'images', assetPath);
}

function createPlaceholderAsset(assetPath) {
  const ext = path.extname(assetPath);
  const dir = path.dirname(assetPath);
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Get the placeholder asset for the extension
  const placeholder = CONFIG.placeholderAssets[ext];
  
  if (!placeholder) {
    console.error(`No placeholder asset defined for extension: ${ext}`);
    return false;
  }
  
  // If the placeholder is a file path, copy the file
  if (typeof placeholder === 'string' && fs.existsSync(placeholder)) {
    fs.copyFileSync(placeholder, assetPath);
    return true;
  }
  
  // If the placeholder is a string (e.g., SVG content), write it to the file
  if (typeof placeholder === 'string') {
    fs.writeFileSync(assetPath, placeholder);
    return true;
  }
  
  return false;
}

function scanForMissingAssets() {
  console.log('Scanning for missing assets...');
  
  const allFiles = getAllFiles(CONFIG.rootDir, CONFIG.ignorePatterns);
  
  console.log(`Found ${allFiles.length} files to scan.`);
  
  const missingAssets = [];
  
  for (const file of allFiles) {
    const content = getFileContent(file);
    const assetReferences = findAssetReferences(content);
    
    for (const assetPath of assetReferences) {
      const resolvedPath = resolveAssetPath(assetPath, file);
      
      if (resolvedPath && !fs.existsSync(resolvedPath)) {
        missingAssets.push({
          sourceFile: getRelativePath(file),
          assetPath,
          resolvedPath: getRelativePath(resolvedPath)
        });
      }
    }
  }
  
  console.log(`\nFound ${missingAssets.length} missing assets.`);
  
  if (missingAssets.length > 0) {
    console.log('\nMissing assets:');
    
    for (const asset of missingAssets) {
      console.log(`\n${asset.sourceFile}:`);
      console.log(`  - Referenced asset: ${asset.assetPath}`);
      console.log(`  - Resolved path: ${asset.resolvedPath}`);
    }
    
    console.log('\nRun with --create to create placeholder assets for these missing files.');
  }
  
  return missingAssets;
}

function createMissingAssets() {
  console.log('Creating placeholder assets for missing files...');
  
  const missingAssets = scanForMissingAssets();
  
  if (missingAssets.length === 0) {
    return;
  }
  
  console.log('\nCreating placeholder assets:');
  
  let createdCount = 0;
  
  for (const asset of missingAssets) {
    const resolvedPath = path.join(CONFIG.rootDir, asset.resolvedPath);
    
    console.log(`\n${asset.sourceFile}:`);
    console.log(`  - Creating placeholder for: ${asset.assetPath}`);
    console.log(`  - At path: ${asset.resolvedPath}`);
    
    if (options.dryRun) {
      console.log('  - Dry run: Not creating file');
      continue;
    }
    
    const success = createPlaceholderAsset(resolvedPath);
    
    if (success) {
      console.log('  - Created successfully');
      createdCount++;
    } else {
      console.log('  - Failed to create placeholder');
    }
  }
  
  console.log(`\nCreated ${createdCount} placeholder assets.`);
  
  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were created.');
    console.log('Run without --dry-run to create the placeholder assets.');
  }
}

// Main execution
try {
  if (options.scan) {
    scanForMissingAssets();
  } else if (options.create) {
    createMissingAssets();
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 