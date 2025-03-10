#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting navigation paths update...');

const projectRoot = process.cwd();

// Define the old and new paths
const pathMappings = [
  // Studio related paths
  { old: '/(tabs)/vocal-isolation', new: '/studio/vocal-isolation' },
  { old: '/(tabs)/shared-tracks', new: '/studio/shared-tracks' },
  { old: '/(tabs)/dolby', new: '/studio/dolby' },
  { old: '/(tabs)/batch', new: '/studio/batch-processing' },
  { old: '/(tabs)/recordings', new: '/studio/recordings' },
  { old: '/(tabs)/songs', new: '/studio/songs' },
  { old: '/(tabs)/podcasts', new: '/studio/podcasts' },
  
  // Chat related paths
  { old: '/(tabs)/fan-hub', new: '/chat/fan-hub' },
  { old: '/(tabs)/community', new: '/chat/community' },
  
  // Admin related paths
  { old: '/(tabs)/admin-verification', new: '/admin/verification' },
  { old: '/(tabs)/verification-test', new: '/admin/verification-test' },
  
  // Profile related paths
  { old: '/(tabs)/athlete-profile', new: '/athlete-profile' },
  { old: '/(tabs)/fan-profile', new: '/fan-profile' },
  { old: '/(tabs)/athletes-example', new: '/athlete-examples' },
  { old: '/(tabs)/athletes', new: '/athletes' },
  
  // Other paths
  { old: '/(tabs)/testing', new: '/testing' },
  { old: '/(tabs)/discover', new: '/discover' },
];

// Find all TypeScript and JavaScript files in the project
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx'], ignore = ['node_modules', '.git', 'dist', '.expo']) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Skip ignored directories
    if (ignore.includes(file)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, extensions, ignore));
    } else if (extensions.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Update navigation paths in a file
function updateNavigationPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const { old, new: newPath } of pathMappings) {
    // Look for navigation.navigate, router.push, Link href, etc.
    const patterns = [
      { regex: new RegExp(`navigation\\.navigate\\(['"]${old}['"]`, 'g'), replacement: `router.push('/${newpath}'` },
      { regex: new RegExp(`router\\.push\\(['"]${old}['"]`, 'g'), replacement: `router.push('${newPath}'` },
      { regex: new RegExp(`href=['"]${old}['"]`, 'g'), replacement: `href='${newPath}'` },
      { regex: new RegExp(`to=['"]${old}['"]`, 'g'), replacement: `to='${newPath}'` },
      { regex: new RegExp(`path=['"]${old}['"]`, 'g'), replacement: `path='${newPath}'` },
      { regex: new RegExp(`screen=['"]${old}['"]`, 'g'), replacement: `screen='${newPath}'` },
    ];
    
    for (const { regex, replacement } of patterns) {
      const newContent = content.replace(regex, replacement);
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Main execution
const files = findFiles(projectRoot);
let updatedCount = 0;

for (const file of files) {
  const updated = updateNavigationPaths(file);
  if (updated) {
    console.log(`Updated navigation paths in: ${path.relative(projectRoot, file)}`);
    updatedCount++;
  }
}

console.log(`\n✅ Updated navigation paths in ${updatedCount} files`);
console.log('🎉 Navigation paths update complete!');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Run the app to test if all navigation paths work correctly');
console.log('2. If you encounter any issues, check the specific file and update the navigation paths manually');
console.log('3. Continue with the remaining tasks in the STATUS-SUMMARY.md file'); 