#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting codebase cleanup...');

const projectRoot = process.cwd();
const screensDir = path.join(projectRoot, 'screens');
const appDir = path.join(projectRoot, 'app');
const studioDir = path.join(appDir, 'studio');
const chatDir = path.join(appDir, 'chat');
const authDir = path.join(appDir, '(auth)');
const paymentDir = path.join(appDir, 'payment');

// 1. Remove duplicate files from /screens directory
console.log('\n🔍 Checking for duplicate files between /screens and /app directories...');

// Get all files in the screens directory
function getAllFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Check if a file in /screens has a corresponding file in /app
function hasCorrespondingFile(screenFile) {
  const fileName = path.basename(screenFile, path.extname(screenFile));
  const fileNameWithoutScreen = fileName.replace(/Screen$/, '');
  const kebabCase = fileNameWithoutScreen
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  // Check for files with the same name in different formats
  const possiblePaths = [
    path.join(appDir, `${fileName}.tsx`),
    path.join(appDir, `${fileName.toLowerCase()}.tsx`),
    path.join(appDir, `${kebabCase}.tsx`),
    path.join(appDir, `${kebabCase}-.tsx`),
    path.join(studioDir, `${fileName}.tsx`),
    path.join(studioDir, `${fileName.toLowerCase()}.tsx`),
    path.join(studioDir, `${kebabCase}.tsx`),
    path.join(studioDir, `${kebabCase}-.tsx`),
    path.join(chatDir, `${fileName}.tsx`),
    path.join(chatDir, `${fileName.toLowerCase()}.tsx`),
    path.join(chatDir, `${kebabCase}.tsx`),
    path.join(chatDir, `${kebabCase}-.tsx`),
    path.join(authDir, `${fileName}.tsx`),
    path.join(authDir, `${fileName.toLowerCase()}.tsx`),
    path.join(authDir, `${kebabCase}.tsx`),
    path.join(authDir, `${kebabCase}-.tsx`),
    path.join(paymentDir, `${fileName}.tsx`),
    path.join(paymentDir, `${fileName.toLowerCase()}.tsx`),
    path.join(paymentDir, `${kebabCase}.tsx`),
    path.join(paymentDir, `${kebabCase}-.tsx`),
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return null;
}

// Delete duplicate files
const screenFiles = getAllFiles(screensDir);
let deletedCount = 0;

for (const file of screenFiles) {
  const correspondingFile = hasCorrespondingFile(file);
  
  if (correspondingFile) {
    console.log(`Found duplicate: ${path.relative(projectRoot, file)} -> ${path.relative(projectRoot, correspondingFile)}`);
    fs.unlinkSync(file);
    deletedCount++;
  }
}

console.log(`✅ Deleted ${deletedCount} duplicate files from /screens directory`);

// 2. Fix file naming issues in /app directory
console.log('\n🔧 Fixing file naming issues in /app directory...');

// Fix files with "-.tsx" suffix
function fixFileNaming(dir) {
  let fixedCount = 0;
  
  if (!fs.existsSync(dir)) return fixedCount;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixedCount += fixFileNaming(fullPath);
    } else if (file.endsWith('-.tsx')) {
      const newName = file.replace('-.tsx', '.tsx');
      const newPath = path.join(dir, newName);
      
      // Check if the destination file already exists
      if (fs.existsSync(newPath)) {
        // Compare file sizes to keep the larger one
        const srcStat = fs.statSync(fullPath);
        const destStat = fs.statSync(newPath);
        
        if (srcStat.size > destStat.size) {
          // The source file is larger, replace the destination
          fs.unlinkSync(newPath);
          fs.renameSync(fullPath, newPath);
          console.log(`Replaced smaller file: ${path.relative(projectRoot, newPath)}`);
          fixedCount++;
        } else {
          // The destination file is larger or the same size, delete the source
          fs.unlinkSync(fullPath);
          console.log(`Deleted smaller duplicate: ${path.relative(projectRoot, fullPath)}`);
          fixedCount++;
        }
      } else {
        // Rename the file
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed: ${path.relative(projectRoot, fullPath)} -> ${path.relative(projectRoot, newPath)}`);
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

const fixedCount = fixFileNaming(appDir);
console.log(`✅ Fixed ${fixedCount} file naming issues in /app directory`);

// 3. Remove empty directories
console.log('\n🗑️ Removing empty directories...');

function removeEmptyDirs(dir) {
  let removedCount = 0;
  
  if (!fs.existsSync(dir)) return removedCount;
  
  const files = fs.readdirSync(dir);
  
  if (files.length === 0) {
    fs.rmdirSync(dir);
    console.log(`Removed empty directory: ${path.relative(projectRoot, dir)}`);
    return 1;
  }
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      removedCount += removeEmptyDirs(fullPath);
    }
  }
  
  // Check again after processing subdirectories
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`Removed empty directory: ${path.relative(projectRoot, dir)}`);
    removedCount++;
  }
  
  return removedCount;
}

const removedCount = removeEmptyDirs(screensDir);
console.log(`✅ Removed ${removedCount} empty directories`);

// 4. Check for duplicate files within app subdirectories
console.log('\n🔍 Checking for duplicate files within /app subdirectories...');

function findDuplicatesInDir(dir) {
  let duplicatesCount = 0;
  
  if (!fs.existsSync(dir)) return duplicatesCount;
  
  const files = fs.readdirSync(dir);
  const fileMap = {};
  
  // Group files by their base name (without extension)
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (!stat.isDirectory()) {
      const baseName = path.basename(file, path.extname(file))
        .replace(/Screen$/, '')
        .toLowerCase();
      
      if (!fileMap[baseName]) {
        fileMap[baseName] = [];
      }
      
      fileMap[baseName].push(fullPath);
    }
  }
  
  // Check for duplicates
  for (const [baseName, filePaths] of Object.entries(fileMap)) {
    if (filePaths.length > 1) {
      console.log(`Found duplicate files for "${baseName}" in ${path.relative(projectRoot, dir)}:`);
      
      // Sort by file size (descending)
      filePaths.sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.size - statA.size;
      });
      
      // Keep the largest file
      const largestFile = filePaths[0];
      console.log(`  Keeping: ${path.basename(largestFile)} (${fs.statSync(largestFile).size} bytes)`);
      
      // Delete the rest
      for (let i = 1; i < filePaths.length; i++) {
        const fileToDelete = filePaths[i];
        console.log(`  Deleting: ${path.basename(fileToDelete)} (${fs.statSync(fileToDelete).size} bytes)`);
        fs.unlinkSync(fileToDelete);
        duplicatesCount++;
      }
    }
  }
  
  return duplicatesCount;
}

const duplicatesInStudio = findDuplicatesInDir(studioDir);
const duplicatesInChat = findDuplicatesInDir(chatDir);
const duplicatesInAuth = findDuplicatesInDir(authDir);
const duplicatesInPayment = findDuplicatesInDir(paymentDir);

const totalDuplicates = duplicatesInStudio + duplicatesInChat + duplicatesInAuth + duplicatesInPayment;
console.log(`✅ Removed ${totalDuplicates} duplicate files within /app subdirectories`);

console.log('\n🎉 Codebase cleanup complete!');
console.log(`
Summary:
- Deleted ${deletedCount} duplicate files from /screens directory
- Fixed ${fixedCount} file naming issues in /app directory
- Removed ${removedCount} empty directories
- Removed ${totalDuplicates} duplicate files within /app subdirectories
`);

// Suggest next steps
console.log('Next steps:');
console.log('1. Run the app to ensure all features work correctly');
console.log('2. Check for any remaining issues in the codebase');
console.log('3. Update import statements if needed');
console.log('4. Run comprehensive tests as outlined in the TESTING-PLAN.md file'); 