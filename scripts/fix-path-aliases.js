#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting path alias update...');

const projectRoot = process.cwd();

// Define the problematic imports and their replacements
const importMappings = [
  // Components
  { pattern: /from\s+['"]\.\.\/\.\.\/components\/([^'"]+)['"]/g, replacement: "from '../../components/$1'" },
  { pattern: /from\s+['"]\.\.\/components\/([^'"]+)['"]/g, replacement: "from '../../components/$1'" },
  { pattern: /require\(['"]\.\.\/\.\.\/components\/([^'"]+)['"]\)/g, replacement: "require('../../components/$1')" },
  { pattern: /require\(['"]\.\.\/components\/([^'"]+)['"]\)/g, replacement: "require('../../components/$1')" },
  
  // Constants
  { pattern: /from\s+['"]\.\.\/\.\.\/constants\/([^'"]*)['"]/g, replacement: "from '@constants/$1'" },
  { pattern: /from\s+['"]\.\.\/constants\/([^'"]*)['"]/g, replacement: "from '@constants/$1'" },
  { pattern: /from\s+['"]\.\.\/\.\.\/constants['"]/g, replacement: "from '@constants/index'" },
  { pattern: /from\s+['"]\.\.\/constants['"]/g, replacement: "from '@constants/index'" },

  // Hooks
  { pattern: /from\s+['"]\.\.\/\.\.\/hooks\/([^'"]+)['"]/g, replacement: "from '../../hooks/$1'" },
  { pattern: /from\s+['"]\.\.\/hooks\/([^'"]+)['"]/g, replacement: "from '../../hooks/$1'" },
  
  // Contexts
  { pattern: /from\s+['"]\.\.\/\.\.\/contexts\/([^'"]+)['"]/g, replacement: "from '../../contexts/$1'" },
  { pattern: /from\s+['"]\.\.\/contexts\/([^'"]+)['"]/g, replacement: "from '../../contexts/$1'" },
  
  // Services
  { pattern: /from\s+['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g, replacement: "from '../../services/$1'" },
  { pattern: /from\s+['"]\.\.\/services\/([^'"]+)['"]/g, replacement: "from '../../services/$1'" },
  
  // Utils
  { pattern: /from\s+['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, replacement: "from '../../utils/$1'" },
  { pattern: /from\s+['"]\.\.\/utils\/([^'"]+)['"]/g, replacement: "from '../../utils/$1'" },
  
  // Models
  { pattern: /from\s+['"]\.\.\/\.\.\/models\/([^'"]+)['"]/g, replacement: "from '../../models/$1'" },
  { pattern: /from\s+['"]\.\.\/models\/([^'"]+)['"]/g, replacement: "from '../../models/$1'" },
  
  // Assets
  { pattern: /from\s+['"]\.\.\/\.\.\/assets\/([^'"]+)['"]/g, replacement: "from '@assets/$1'" },
  { pattern: /from\s+['"]\.\.\/assets\/([^'"]+)['"]/g, replacement: "from '@assets/$1'" },
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

// Update import paths in a file
function updateImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const { pattern, replacement } of importMappings) {
    const newContent = content.replace(pattern, replacement);
    
    if (newContent !== content) {
      content = newContent;
      updated = true;
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
  const updated = updateImportPaths(file);
  if (updated) {
    console.log(`Updated import paths in: ${path.relative(projectRoot, file)}`);
    updatedCount++;
  }
}

console.log(`\n✅ Updated import paths in ${updatedCount} files`);

// Check if npm modules are installed
try {
  require.resolve('babel-plugin-module-resolver');
  console.log('✅ babel-plugin-module-resolver is already installed');
} catch (error) {
  console.log('📦 Installing babel-plugin-module-resolver...');
  execSync('npm install --save-dev babel-plugin-module-resolver', { stdio: 'inherit' });
  console.log('✅ Installed babel-plugin-module-resolver');
}

console.log('\n🎉 Path alias update complete!');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Clear Metro cache with `npx expo start --clear`');
console.log('2. If you encounter any issues, check problematic files manually');
console.log('3. You may need to restart your development environment completely'); 