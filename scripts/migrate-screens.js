#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting screens migration...');

const projectRoot = process.cwd();
const screensDir = path.join(projectRoot, 'screens');
const appDir = path.join(projectRoot, 'app');

// Check if screens directory exists
if (!fs.existsSync(screensDir)) {
  console.log('❌ Screens directory not found. Nothing to migrate.');
  process.exit(0);
}

// Get all screen files
function getScreenFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...getScreenFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Convert screen name to kebab case
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/Screen$/, '')
    .toLowerCase();
}

// Migrate a screen file
function migrateScreen(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(screensDir, filePath);
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));
  const kebabCaseName = toKebabCase(fileNameWithoutExt);
  
  // Determine the target directory
  let targetDir = appDir;
  
  // Check content to determine the appropriate directory
  if (content.includes('audio') || content.includes('recording') || content.includes('mastering') || 
      content.includes('vocal') || content.includes('dolby') || content.includes('podcast') || 
      content.includes('song') || content.includes('track')) {
    targetDir = path.join(appDir, 'studio');
  } else if (content.includes('chat') || content.includes('message') || content.includes('community') || 
             content.includes('fan hub') || content.includes('fanHub')) {
    targetDir = path.join(appDir, 'chat');
  } else if (content.includes('admin') || content.includes('verification') || 
             content.includes('moderate') || content.includes('approve')) {
    targetDir = path.join(appDir, 'admin');
  } else if (content.includes('login') || content.includes('register') || 
             content.includes('sign up') || content.includes('signUp') || 
             content.includes('auth') || content.includes('password')) {
    targetDir = path.join(appDir, '(auth)');
  } else if (content.includes('payment') || content.includes('subscription') || 
             content.includes('premium') || content.includes('purchase') || 
             content.includes('buy') || content.includes('price')) {
    targetDir = path.join(appDir, 'payment');
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Determine the target file path
  const targetPath = path.join(targetDir, `${kebabCaseName}.tsx`);
  
  // Check if target file already exists
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️ Target file already exists: ${path.relative(projectRoot, targetPath)}`);
    return false;
  }
  
  // Update imports in the content
  let updatedContent = content;
  
  // Update relative imports
  const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[2];
    if (importPath.startsWith('.') || importPath.startsWith('..')) {
      // This is a relative import, we need to update it
      const absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
      const relativeToScreens = path.relative(screensDir, absoluteImportPath);
      
      if (!relativeToScreens.startsWith('..')) {
        // This is an import from the screens directory
        const newImportPath = path.relative(path.dirname(targetPath), path.join(appDir, relativeToScreens));
        updatedContent = updatedContent.replace(
          new RegExp(`from\\s+['"]${importPath}['"]`, 'g'),
          `from '${newImportPath.startsWith('.') ? newImportPath : './' + newImportPath}'`
        );
      }
    }
  }
  
  // Write the updated content to the target file
  fs.writeFileSync(targetPath, updatedContent);
  console.log(`✅ Migrated: ${path.relative(projectRoot, filePath)} -> ${path.relative(projectRoot, targetPath)}`);
  
  return true;
}

// Main execution
const screenFiles = getScreenFiles(screensDir);
let migratedCount = 0;

for (const file of screenFiles) {
  const migrated = migrateScreen(file);
  if (migrated) {
    migratedCount++;
  }
}

console.log(`\n✅ Migrated ${migratedCount} screens from /screens to /app`);
console.log('🎉 Screens migration complete!');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Review the migrated screens and ensure they work correctly');
console.log('2. Update any imports in other files that reference the old screen locations');
console.log('3. Test the app to ensure all features work correctly');
console.log('4. Once everything is working, you can delete the /screens directory'); 