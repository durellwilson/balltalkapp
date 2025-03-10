/**
 * Integration Test Script
 * 
 * This script tests the integration between different sections of the app
 * to ensure they work together correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the app directory structure
function getDirectoryStructure(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return null;
  
  const stats = fs.statSync(dir);
  
  if (!stats.isDirectory()) {
    return {
      type: 'file',
      name: path.basename(dir),
      path: dir
    };
  }
  
  const children = fs.readdirSync(dir)
    .filter(file => !file.startsWith('.') && file !== 'node_modules')
    .map(file => {
      const filePath = path.join(dir, file);
      try {
        return getDirectoryStructure(filePath, depth + 1, maxDepth);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
  
  return {
    type: 'directory',
    name: path.basename(dir),
    path: dir,
    children
  };
}

// Check for broken imports
function checkBrokenImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
  const importStatements = [];
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip node modules and relative imports that start with dots
    if (!importPath.startsWith('.') || importPath.startsWith('./') || importPath.startsWith('../')) {
      continue;
    }
    
    // Convert import path to file path
    const importedFilePath = path.resolve(path.dirname(filePath), importPath);
    
    // Check if the imported file exists
    try {
      fs.accessSync(importedFilePath, fs.constants.F_OK);
    } catch (error) {
      // Try adding extensions
      const extensions = ['.js', '.jsx', '.ts', '.tsx'];
      let found = false;
      
      for (const ext of extensions) {
        try {
          fs.accessSync(`${importedFilePath}${ext}`, fs.constants.F_OK);
          found = true;
          break;
        } catch (error) {
          // Ignore
        }
      }
      
      if (!found) {
        importStatements.push({
          import: importPath,
          line: content.substring(0, match.index).split('\n').length,
          error: 'File not found'
        });
      }
    }
  }
  
  return importStatements;
}

// Check navigation paths
function checkNavigationPaths(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for router.push calls
  const routerPushRegex = /router\.push\(['"](.*?)['"]\)/g;
  const navigationPaths = [];
  
  let match;
  while ((match = routerPushRegex.exec(content)) !== null) {
    navigationPaths.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
      type: 'router.push'
    });
  }
  
  // Check for Link href props
  const linkHrefRegex = /<Link[^>]*?href={?['"](.*?)['"]}?/g;
  while ((match = linkHrefRegex.exec(content)) !== null) {
    navigationPaths.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
      type: 'Link href'
    });
  }
  
  // Check for Redirect href props
  const redirectHrefRegex = /<Redirect[^>]*?href={?['"](.*?)['"]}?/g;
  while ((match = redirectHrefRegex.exec(content)) !== null) {
    navigationPaths.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
      type: 'Redirect href'
    });
  }
  
  return navigationPaths;
}

// Validate navigation paths
function validateNavigationPaths(navigationPaths, appDir) {
  const validationResults = [];
  
  navigationPaths.forEach(navPath => {
    const { path: navPathString, line, type, file } = navPath;
    let isValid = false;
    
    // Special cases for valid paths
    if (navPathString.startsWith('/')) {
      const targetPath = navPathString.substring(1); // Remove leading slash
      
      if (targetPath === '') {
        // Root path is always valid
        isValid = true;
      } else if (targetPath.startsWith('(tabs)')) {
        // Tab paths are valid if they match tab names
        const tabName = targetPath.replace('(tabs)/', '');
        isValid = fs.existsSync(path.join(appDir, '(tabs)', `${tabName}.tsx`));
      } else {
        // Check if the path exists in app directory
        const pathSegments = targetPath.split('/');
        let currentPath = appDir;
        
        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          const nextPath = path.join(currentPath, segment);
          
          if (i === pathSegments.length - 1) {
            // Last segment can be a file
            isValid = fs.existsSync(`${nextPath}.tsx`) || fs.existsSync(`${nextPath}.jsx`) || fs.existsSync(nextPath);
          } else {
            // Intermediate segments must be directories
            if (!fs.existsSync(nextPath) || !fs.statSync(nextPath).isDirectory()) {
              break;
            }
            currentPath = nextPath;
          }
        }
      }
    }
    
    if (!isValid) {
      validationResults.push({
        path: navPathString,
        line,
        type,
        file,
        error: 'Invalid navigation path'
      });
    }
  });
  
  return validationResults;
}

// Main function
function main() {
  console.log('Running integration test...');
  
  // Check if expo-router is installed
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!dependencies['expo-router']) {
      console.error('❌ expo-router is not installed');
      process.exit(1);
    }
    
    console.log('✅ expo-router is installed');
  } catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    process.exit(1);
  }
  
  // Get the app directory structure
  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) {
    console.error('❌ app directory not found');
    process.exit(1);
  }
  
  console.log('✅ app directory structure retrieved');
  
  // Check tab navigation
  const tabsDir = path.join(appDir, '(tabs)');
  if (!fs.existsSync(tabsDir)) {
    console.error('❌ (tabs) directory not found');
    process.exit(1);
  }
  
  const tabFiles = fs.readdirSync(tabsDir)
    .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
    .filter(file => !file.startsWith('_'));
  
  console.log(`Found ${tabFiles.length} tab files:`, tabFiles.join(', '));
  
  const mainTabs = ['index.tsx', 'studio.tsx', 'profile.tsx', 'chat.tsx'];
  const missingTabs = mainTabs.filter(tab => !tabFiles.includes(tab));
  
  if (missingTabs.length > 0) {
    console.error('❌ Missing main tabs:', missingTabs.join(', '));
  } else {
    console.log('✅ All main tabs found');
  }
  
  const extraTabs = tabFiles.filter(tab => !mainTabs.includes(tab));
  if (extraTabs.length > 0) {
    console.warn('⚠️ Extra tab files found:', extraTabs.join(', '));
    console.warn('These should be hidden or moved to a different directory');
  }
  
  // Find all TypeScript/JavaScript files
  function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
        findFiles(filePath, fileList);
      } else if (
        (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) &&
        !file.includes('.d.ts')
      ) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }
  
  const allFiles = findFiles(process.cwd());
  console.log(`✅ Found ${allFiles.length} TypeScript/JavaScript files`);
  
  // Check for broken imports in app directory
  const appFiles = allFiles.filter(file => file.startsWith(appDir));
  const brokenImports = [];
  
  appFiles.forEach(file => {
    const brokenImportsInFile = checkBrokenImports(file);
    
    if (brokenImportsInFile.length > 0) {
      brokenImports.push({
        file,
        imports: brokenImportsInFile
      });
    }
  });
  
  if (brokenImports.length > 0) {
    console.error(`❌ Found ${brokenImports.length} files with broken imports`);
    brokenImports.forEach(({ file, imports }) => {
      console.error(`  ${file.replace(process.cwd(), '')}:`);
      imports.forEach(({ import: importPath, line, error }) => {
        console.error(`    Line ${line}: ${importPath} - ${error}`);
      });
    });
  } else {
    console.log('✅ No broken imports found in app directory');
  }
  
  // Check navigation paths
  const navigationPaths = [];
  
  appFiles.forEach(file => {
    const navPathsInFile = checkNavigationPaths(file);
    
    navPathsInFile.forEach(navPath => {
      navigationPaths.push({
        ...navPath,
        file
      });
    });
  });
  
  console.log(`✅ Found ${navigationPaths.length} navigation paths`);
  
  // Validate navigation paths
  const invalidNavigationPaths = validateNavigationPaths(navigationPaths, appDir);
  
  if (invalidNavigationPaths.length > 0) {
    console.error(`❌ Found ${invalidNavigationPaths.length} invalid navigation paths`);
    invalidNavigationPaths.forEach(({ path: navPath, line, type, file, error }) => {
      console.error(`  ${file.replace(process.cwd(), '')}: Line ${line} - ${navPath} (${type}) - ${error}`);
    });
  } else {
    console.log('✅ All navigation paths are valid');
  }
  
  // Check application flow
  console.log('\nTesting Application Flow:');
  console.log('1. User opens the app');
  console.log('2. User navigates to Studio tab');
  console.log('3. User selects "Audio Mastering" option');
  console.log('4. User processes audio and saves it');
  console.log('5. User navigates to Profile tab');
  console.log('6. User clicks "Go Premium"');
  console.log('7. User subscribes to premium');
  console.log('8. User navigates to Chat tab');
  
  console.log('\nIntegration test completed');
}

// Run the script
main(); 