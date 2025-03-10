#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting import path fixes...');

const projectRoot = process.cwd();

// Define the problematic imports and their replacements
const importMappings = [
  // Profile components
  { old: '../../components/profile/AthleteProfileCard', new: '@/components/profile/AthleteProfileCard' },
  { old: '../../components/profile/FanProfileView', new: '@/components/profile/FanProfileView' },
  
  // Constants
  { old: '../../constants', new: '@/constants' },
  { old: '../../constants/Colors', new: '@/constants/Colors' },
  
  // Themed components
  { old: '../../components/themed', new: '@/components/themed' },
  
  // Hooks
  { old: '../hooks/useAuth', new: '@/hooks/useAuth' },
  
  // Other components
  { old: '../components/FirebaseVerification', new: '@/components/FirebaseVerification' },
  { old: '../components/audio/EnhancedWaveform', new: '@/components/audio/EnhancedWaveform' },
  { old: '../components/audio/recorder/AudioRecorder', new: '@/components/audio/recorder/AudioRecorder' },
  { old: '../components/studio/SharedTracksView', new: '@/components/studio/SharedTracksView' },
  
  // Contexts
  { old: '../contexts/AudioProcessingContext', new: '@/contexts/AudioProcessingContext' },
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
  
  for (const { old, new: newPath } of importMappings) {
    // Look for import statements
    const importRegex = new RegExp(`import\\s+(?:{[^}]*}|[^{};]*)\\s+from\\s+['"]${old.replace(/\//g, '\\/')}['"]`, 'g');
    const requireRegex = new RegExp(`require\\(['"]${old.replace(/\//g, '\\/')}['"]\\)`, 'g');
    
    // Replace import statements
    const newContent = content
      .replace(importRegex, match => match.replace(old, newPath))
      .replace(requireRegex, match => match.replace(old, newPath));
    
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

// Create or update babel.config.js to support module aliases
const babelConfigPath = path.join(projectRoot, 'babel.config.js');
let babelConfig = fs.existsSync(babelConfigPath) 
  ? fs.readFileSync(babelConfigPath, 'utf8')
  : 'module.exports = function(api) { api.cache(true); return { presets: ["babel-preset-expo"] }; };';

// Check if module-resolver is already configured
if (!babelConfig.includes('module-resolver')) {
  console.log('📝 Updating babel.config.js to support module aliases...');
  
  // Add module-resolver plugin
  const newBabelConfig = babelConfig.replace(
    /return\s*{/,
    `return {
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './.',
          },
        },
      ],`
  );
  
  fs.writeFileSync(babelConfigPath, newBabelConfig);
  console.log('✅ Updated babel.config.js');
  
  // Check if module-resolver is installed
  try {
    require.resolve('babel-plugin-module-resolver');
    console.log('✅ babel-plugin-module-resolver is already installed');
  } catch (error) {
    console.log('📦 Installing babel-plugin-module-resolver...');
    execSync('npm install --save-dev babel-plugin-module-resolver', { stdio: 'inherit' });
    console.log('✅ Installed babel-plugin-module-resolver');
  }
}

// Create or update tsconfig.json to support path aliases
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
let tsconfig = fs.existsSync(tsconfigPath)
  ? JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  : { compilerOptions: { strict: true } };

// Add path mappings
if (!tsconfig.compilerOptions) {
  tsconfig.compilerOptions = {};
}

if (!tsconfig.compilerOptions.paths) {
  console.log('📝 Updating tsconfig.json to support path aliases...');
  
  tsconfig.compilerOptions.baseUrl = '.';
  tsconfig.compilerOptions.paths = {
    '@/*': ['./*']
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log('✅ Updated tsconfig.json');
}

console.log('\n🎉 Import path fixes complete!');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Restart your Metro bundler with `npx expo start --clear`');
console.log('2. If you encounter any issues, check the specific file and update the import paths manually');
console.log('3. Continue with the remaining tasks in the ROUTING-FIX-PLAN.md file'); 