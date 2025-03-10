/**
 * Script to update navigation methods and imports
 * 
 * This script will:
 * 1. Replace navigation.navigate() with router.push()
 * 2. Update imports from old screens directory
 * 3. Fix invalid navigation paths
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

// Function to update navigation methods and imports in a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace navigation.navigate() with router.push()
    const navigateRegex = /navigation\.navigate\(['"]([^'"]+)['"]/g;
    const updatedContent = content.replace(navigateRegex, (match, screenName) => {
      updated = true;
      return `router.push('/${screenName.toLowerCase()}'`;
    });
    
    // Update imports from old screens directory
    const importRegex = /import\s+(\w+)\s+from\s+['"]\.\.\/screens\/(\w+)['"]/g;
    const updatedImport = updatedContent.replace(importRegex, (match, importName, screenName) => {
      updated = true;
      return `import ${importName} from '../app/${screenName.toLowerCase()}'`;
    });
    
    // Only write to file if changes were made
    if (updated) {
      fs.writeFileSync(filePath, updatedImport, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Main function
function main() {
  const rootDir = path.resolve(__dirname, '..');
  const files = getAllFiles(rootDir);
  
  console.log(`Found ${files.length} files to process`);
  
  files.forEach(file => {
    updateFile(file);
  });
  
  console.log('Navigation update completed');
}

main(); 