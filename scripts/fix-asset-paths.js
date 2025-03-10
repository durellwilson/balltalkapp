#!/usr/bin/env node

/**
 * Fix Asset Paths Script
 * 
 * This script helps fix asset path issues in the codebase by:
 * 1. Identifying incorrect asset paths
 * 2. Fixing relative paths that may be broken during consolidation
 * 3. Ensuring assets are properly referenced from their correct locations
 * 
 * Usage:
 *   node scripts/fix-asset-paths.js [options]
 * 
 * Options:
 *   --scan           Scan the codebase for potential asset path issues
 *   --fix            Fix identified asset path issues
 *   --target=<file>  Fix asset paths in a specific file
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
  ]
};

// Parse options
const options = {
  scan: args.includes('--scan'),
  fix: args.includes('--fix'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help'),
  target: args.find(arg => arg.startsWith('--target='))?.split('=')[1]
};

// Show help message
if (options.help || (!options.scan && !options.fix && !options.target)) {
  console.log(`
Fix Asset Paths Script

This script helps fix asset path issues in the codebase by:
1. Identifying incorrect asset paths
2. Fixing relative paths that may be broken during consolidation
3. Ensuring assets are properly referenced from their correct locations

Usage:
  node scripts/fix-asset-paths.js [options]

Options:
  --scan           Scan the codebase for potential asset path issues
  --fix            Fix identified asset path issues
  --target=<file>  Fix asset paths in a specific file
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

function getAllAssets() {
  const assets = [];
  
  for (const assetDir of CONFIG.assetDirs) {
    const dirPath = path.join(CONFIG.rootDir, assetDir);
    
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (!stat.isDirectory() && CONFIG.assetExtensions.some(ext => file.endsWith(ext))) {
          assets.push({
            name: file,
            path: path.join(assetDir, file),
            fullPath: fullPath
          });
        }
      }
    }
  }
  
  return assets;
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

function isAssetPathValid(assetPath, sourceFilePath) {
  // Check if the asset path is absolute (starts with /)
  if (assetPath.startsWith('/')) {
    return false;
  }
  
  // Check if the asset path is a URL
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return true;
  }
  
  // Check if the asset path is relative
  if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
    // Calculate the absolute path of the asset
    const sourceDir = path.dirname(sourceFilePath);
    const absoluteAssetPath = path.resolve(sourceDir, assetPath);
    
    // Check if the asset exists
    return fs.existsSync(absoluteAssetPath);
  }
  
  // Check if the asset exists in the assets directory
  for (const assetDir of CONFIG.assetDirs) {
    const absoluteAssetPath = path.join(CONFIG.rootDir, assetDir, assetPath);
    if (fs.existsSync(absoluteAssetPath)) {
      return true;
    }
  }
  
  return false;
}

function findCorrectAssetPath(assetPath, sourceFilePath, allAssets) {
  // If the asset path is a URL, return it as is
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  // Get the asset filename
  const assetFilename = path.basename(assetPath);
  
  // Find matching assets
  const matchingAssets = allAssets.filter(asset => asset.name === assetFilename);
  
  if (matchingAssets.length === 0) {
    return null;
  }
  
  if (matchingAssets.length === 1) {
    // Calculate the relative path from the source file to the asset
    const sourceDir = path.dirname(sourceFilePath);
    const relativeAssetPath = path.relative(sourceDir, matchingAssets[0].fullPath);
    
    // Ensure the path starts with ./ or ../
    return relativeAssetPath.startsWith('.') ? relativeAssetPath : `./${relativeAssetPath}`;
  }
  
  // If there are multiple matching assets, prefer the one in the assets/images directory
  const preferredAsset = matchingAssets.find(asset => asset.path.includes('assets/images'));
  
  if (preferredAsset) {
    // Calculate the relative path from the source file to the asset
    const sourceDir = path.dirname(sourceFilePath);
    const relativeAssetPath = path.relative(sourceDir, preferredAsset.fullPath);
    
    // Ensure the path starts with ./ or ../
    return relativeAssetPath.startsWith('.') ? relativeAssetPath : `./${relativeAssetPath}`;
  }
  
  // If no preferred asset is found, use the first one
  const sourceDir = path.dirname(sourceFilePath);
  const relativeAssetPath = path.relative(sourceDir, matchingAssets[0].fullPath);
  
  // Ensure the path starts with ./ or ../
  return relativeAssetPath.startsWith('.') ? relativeAssetPath : `./${relativeAssetPath}`;
}

function fixAssetPaths(filePath, allAssets, dryRun = false) {
  const relativePath = getRelativePath(filePath);
  const content = getFileContent(filePath);
  
  // Find asset references
  const assetReferences = findAssetReferences(content);
  
  if (assetReferences.length === 0) {
    return {
      file: relativePath,
      assetReferences: 0,
      invalidPaths: 0,
      fixedPaths: 0
    };
  }
  
  let updatedContent = content;
  let invalidPaths = 0;
  let fixedPaths = 0;
  
  // Check each asset reference
  for (const assetPath of assetReferences) {
    if (!isAssetPathValid(assetPath, filePath)) {
      invalidPaths++;
      
      // Find the correct asset path
      const correctPath = findCorrectAssetPath(assetPath, filePath, allAssets);
      
      if (correctPath) {
        // Replace the asset path in the content
        const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedPath, 'g');
        updatedContent = updatedContent.replace(regex, correctPath);
        
        fixedPaths++;
      }
    }
  }
  
  // Write the updated content to the file
  if (invalidPaths > 0 && fixedPaths > 0 && !dryRun) {
    fs.writeFileSync(filePath, updatedContent);
  }
  
  return {
    file: relativePath,
    assetReferences: assetReferences.length,
    invalidPaths,
    fixedPaths
  };
}

function scanForAssetPathIssues() {
  console.log('Scanning for asset path issues...');
  
  const allFiles = getAllFiles(CONFIG.rootDir, CONFIG.ignorePatterns);
  const allAssets = getAllAssets();
  
  console.log(`Found ${allFiles.length} files to scan and ${allAssets.length} assets.`);
  
  const results = [];
  
  for (const file of allFiles) {
    const content = getFileContent(file);
    const assetReferences = findAssetReferences(content);
    
    if (assetReferences.length > 0) {
      const invalidPaths = assetReferences.filter(assetPath => !isAssetPathValid(assetPath, file));
      
      if (invalidPaths.length > 0) {
        results.push({
          file: getRelativePath(file),
          assetReferences: assetReferences.length,
          invalidPaths: invalidPaths.length,
          paths: invalidPaths
        });
      }
    }
  }
  
  console.log(`\nFound ${results.length} files with invalid asset paths.`);
  
  if (results.length > 0) {
    console.log('\nFiles with invalid asset paths:');
    
    for (const result of results) {
      console.log(`\n${result.file}:`);
      console.log(`  - ${result.invalidPaths} invalid paths out of ${result.assetReferences} asset references`);
      
      for (const path of result.paths) {
        console.log(`  - Invalid path: ${path}`);
      }
    }
    
    console.log('\nRun with --fix to fix these issues.');
  }
  
  return results;
}

function fixAllAssetPaths() {
  console.log('Fixing asset path issues...');
  
  const allFiles = getAllFiles(CONFIG.rootDir, CONFIG.ignorePatterns);
  const allAssets = getAllAssets();
  
  console.log(`Found ${allFiles.length} files to scan and ${allAssets.length} assets.`);
  
  const results = [];
  
  for (const file of allFiles) {
    const result = fixAssetPaths(file, allAssets, options.dryRun);
    
    if (result.invalidPaths > 0) {
      results.push(result);
    }
  }
  
  console.log(`\nFixed asset paths in ${results.length} files.`);
  
  if (results.length > 0) {
    console.log('\nFiles with fixed asset paths:');
    
    for (const result of results) {
      console.log(`\n${result.file}:`);
      console.log(`  - Fixed ${result.fixedPaths} out of ${result.invalidPaths} invalid paths`);
    }
    
    if (options.dryRun) {
      console.log('\nThis was a dry run. No changes were made.');
      console.log('Run without --dry-run to apply the changes.');
    }
  }
  
  return results;
}

function fixTargetFile(targetFile) {
  console.log(`Fixing asset paths in ${targetFile}...`);
  
  const fullPath = path.resolve(CONFIG.rootDir, targetFile);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${targetFile}`);
    process.exit(1);
  }
  
  const allAssets = getAllAssets();
  
  console.log(`Found ${allAssets.length} assets.`);
  
  const result = fixAssetPaths(fullPath, allAssets, options.dryRun);
  
  console.log(`\nResults for ${targetFile}:`);
  console.log(`  - ${result.assetReferences} asset references found`);
  console.log(`  - ${result.invalidPaths} invalid paths found`);
  console.log(`  - ${result.fixedPaths} paths fixed`);
  
  if (options.dryRun) {
    console.log('\nThis was a dry run. No changes were made.');
    console.log('Run without --dry-run to apply the changes.');
  }
  
  return result;
}

// Main execution
try {
  if (options.scan) {
    scanForAssetPathIssues();
  } else if (options.fix) {
    fixAllAssetPaths();
  } else if (options.target) {
    fixTargetFile(options.target);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 