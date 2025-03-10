/**
 * Reorganization Script
 * 
 * This script helps identify duplicate files between /screens and /app directories
 * and provides guidance on how to consolidate them.
 */

const fs = require('fs');
const path = require('path');

// Directories to compare
const SCREENS_DIR = path.join(__dirname, '../screens');
const APP_DIR = path.join(__dirname, '../app');

// Function to get all files in a directory recursively
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push({
        path: filePath,
        relativePath: path.relative(path.dirname(dir), filePath),
        name: file,
        size: stat.size
      });
    }
  });
  
  return fileList;
}

// Function to find potential duplicates based on similar names
function findPotentialDuplicates(screenFiles, appFiles) {
  const duplicates = [];
  
  screenFiles.forEach(screenFile => {
    const screenName = screenFile.name.replace('Screen.tsx', '').toLowerCase();
    
    appFiles.forEach(appFile => {
      const appName = appFile.name.replace('.tsx', '').toLowerCase();
      
      // Check if names are similar
      if (appName.includes(screenName) || screenName.includes(appName)) {
        duplicates.push({
          screen: screenFile,
          app: appFile,
          similarity: 'Name similarity'
        });
      }
    });
  });
  
  return duplicates;
}

// Main function
function main() {
  console.log('Analyzing codebase for reorganization...');
  
  // Get all files
  const screenFiles = getAllFiles(SCREENS_DIR);
  const appFiles = getAllFiles(APP_DIR);
  
  console.log(`Found ${screenFiles.length} files in /screens`);
  console.log(`Found ${appFiles.length} files in /app`);
  
  // Find potential duplicates
  const potentialDuplicates = findPotentialDuplicates(screenFiles, appFiles);
  
  console.log('\nPotential duplicate files:');
  potentialDuplicates.forEach((duplicate, index) => {
    console.log(`\n${index + 1}. Potential duplicate:`);
    console.log(`   Screen: ${duplicate.screen.relativePath}`);
    console.log(`   App: ${duplicate.app.relativePath}`);
    console.log(`   Reason: ${duplicate.similarity}`);
  });
  
  console.log('\nReorganization recommendations:');
  console.log('1. Consolidate duplicate files into the /app directory');
  console.log('2. Move reusable components to the /components directory');
  console.log('3. Update imports and references');
  console.log('4. Remove unused files');
}

// Run the script
main(); 