#!/usr/bin/env node

/**
 * Resolve Duplicate Files Script
 * 
 * This script helps resolve duplicate files by:
 * 1. Comparing the content of two files
 * 2. Showing the differences between them
 * 3. Allowing the user to choose which file to keep
 * 4. Updating imports in other files to point to the kept file
 * 5. Removing the duplicate file
 * 
 * Usage:
 *   node scripts/resolve-duplicate.js <file1> <file2>
 * 
 * Options:
 *   --keep=<file>  Specify which file to keep (file1 or file2)
 *   --dry-run      Show what would be done without making changes
 *   --help         Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);

// Show help message
if (args.includes('--help') || args.length < 2) {
  console.log(`
Resolve Duplicate Files Script

This script helps resolve duplicate files by:
1. Comparing the content of two files
2. Showing the differences between them
3. Allowing the user to choose which file to keep
4. Updating imports in other files to point to the kept file
5. Removing the duplicate file

Usage:
  node scripts/resolve-duplicate.js <file1> <file2> [options]

Options:
  --keep=<file>  Specify which file to keep (file1 or file2)
  --dry-run      Show what would be done without making changes
  --help         Show this help message
  `);
  process.exit(0);
}

// Get file paths
const file1 = args[0];
const file2 = args[1];

// Parse options
const options = {
  dryRun: args.includes('--dry-run'),
  keep: args.find(arg => arg.startsWith('--keep='))?.split('=')[1]
};

// Validate file paths
if (!fs.existsSync(file1)) {
  console.error(`Error: File not found: ${file1}`);
  process.exit(1);
}

if (!fs.existsSync(file2)) {
  console.error(`Error: File not found: ${file2}`);
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper functions
function getFileContent(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getRelativePath(filePath) {
  return path.relative(process.cwd(), path.resolve(filePath));
}

function findImports(filePattern) {
  try {
    // Use grep to find imports of the file
    const grepCommand = `grep -r --include="*.{js,jsx,ts,tsx}" "import.*from.*['\\"]\\..*${filePattern}['\\""]" .`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    return [];
  }
}

function updateImports(oldFile, newFile) {
  const oldRelativePath = getRelativePath(oldFile);
  const newRelativePath = getRelativePath(newFile);
  
  // Get the file name without extension
  const oldFileName = path.basename(oldFile, path.extname(oldFile));
  
  // Find files that import the old file
  const importingFiles = findImports(oldFileName);
  
  console.log(`\nFound ${importingFiles.length} files importing ${oldRelativePath}`);
  
  if (importingFiles.length === 0) {
    return;
  }
  
  if (options.dryRun) {
    console.log('Would update imports in the following files:');
    importingFiles.forEach(line => {
      const [filePath] = line.split(':');
      console.log(`  ${filePath}`);
    });
    return;
  }
  
  console.log('Updating imports in the following files:');
  
  importingFiles.forEach(line => {
    const [filePath] = line.split(':');
    console.log(`  ${filePath}`);
    
    // Read the file content
    const content = getFileContent(filePath);
    
    // Calculate the relative path from the importing file to the new file
    const importingDir = path.dirname(filePath);
    const oldImportPath = path.relative(importingDir, oldFile);
    const newImportPath = path.relative(importingDir, newFile);
    
    // Replace the import path
    const updatedContent = content.replace(
      new RegExp(`(import.*from.*['"])${oldImportPath.replace(/\\/g, '\\\\')}(['"])`, 'g'),
      `$1${newImportPath.replace(/\\/g, '\\\\')}$2`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
  });
}

function compareFiles() {
  const content1 = getFileContent(file1);
  const content2 = getFileContent(file2);
  
  const relativePath1 = getRelativePath(file1);
  const relativePath2 = getRelativePath(file2);
  
  console.log(`\nComparing files:`);
  console.log(`1: ${relativePath1} (${content1.length} bytes)`);
  console.log(`2: ${relativePath2} (${content2.length} bytes)`);
  
  if (content1 === content2) {
    console.log('\nThe files are identical.');
  } else {
    console.log('\nThe files are different.');
    
    try {
      // Use diff to show the differences
      const diffCommand = `diff -u "${file1}" "${file2}"`;
      const diffResult = execSync(diffCommand, { encoding: 'utf8' });
      console.log('\nDifferences:');
      console.log(diffResult);
    } catch (error) {
      // diff returns non-zero exit code if files are different
      console.log('\nDifferences:');
      console.log(error.stdout);
    }
  }
}

function resolveFiles() {
  compareFiles();
  
  const relativePath1 = getRelativePath(file1);
  const relativePath2 = getRelativePath(file2);
  
  // If keep option is specified, use that
  if (options.keep) {
    if (options.keep === 'file1') {
      keepFile(file1, file2);
    } else if (options.keep === 'file2') {
      keepFile(file2, file1);
    } else {
      console.error(`Error: Invalid value for --keep option: ${options.keep}`);
      process.exit(1);
    }
    return;
  }
  
  // Ask the user which file to keep
  rl.question(`\nWhich file do you want to keep? (1 for ${relativePath1}, 2 for ${relativePath2}): `, answer => {
    if (answer === '1') {
      keepFile(file1, file2);
    } else if (answer === '2') {
      keepFile(file2, file1);
    } else {
      console.log('Invalid choice. Exiting without making changes.');
    }
    
    rl.close();
  });
}

function keepFile(keepFile, removeFile) {
  const keepPath = getRelativePath(keepFile);
  const removePath = getRelativePath(removeFile);
  
  console.log(`\nKeeping: ${keepPath}`);
  console.log(`Removing: ${removePath}`);
  
  if (options.dryRun) {
    console.log('\nDry run: No changes made.');
    return;
  }
  
  // Update imports
  updateImports(removeFile, keepFile);
  
  // Remove the duplicate file
  fs.unlinkSync(removeFile);
  console.log(`\nRemoved: ${removePath}`);
  
  console.log('\nDuplicate resolved successfully!');
}

// Main execution
try {
  resolveFiles();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 