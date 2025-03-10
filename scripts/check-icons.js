/**
 * Icon Check Script
 * 
 * This script scans the codebase for icon usage and checks for potential issues
 * such as missing imports, incorrect icon names, or inconsistent usage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon libraries used in the project
const iconLibraries = [
  '@expo/vector-icons',
  'react-native-vector-icons'
];

// Common icon sets
const iconSets = [
  'Ionicons',
  'MaterialIcons',
  'FontAwesome',
  'MaterialCommunityIcons',
  'Feather',
  'AntDesign',
  'Entypo',
  'EvilIcons',
  'Fontisto',
  'Foundation',
  'Octicons',
  'SimpleLineIcons',
  'Zocial'
];

// Function to get all TypeScript and JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      getAllFiles(filePath, fileList);
    } else if (
      (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) &&
      !file.includes('.d.ts')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to check if a file imports icon libraries
function checkIconImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  iconLibraries.forEach(library => {
    if (content.includes(`from '${library}'`) || content.includes(`from "${library}"`)) {
      imports.push(library);
    }
  });
  
  iconSets.forEach(iconSet => {
    if (content.includes(`import { ${iconSet}`) || content.includes(`import ${iconSet}`)) {
      imports.push(iconSet);
    }
  });
  
  return imports;
}

// Function to extract icon usage from a file
function extractIconUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const iconUsage = [];
  
  // Check for Ionicons usage
  const ioniconsRegex = /<Ionicons[^>]*name=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = ioniconsRegex.exec(content)) !== null) {
    iconUsage.push({
      type: 'Ionicons',
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Check for other icon sets
  iconSets.forEach(iconSet => {
    if (iconSet === 'Ionicons') return; // Already checked
    
    const regex = new RegExp(`<${iconSet}[^>]*name=["']([^"']+)["'][^>]*>`, 'g');
    while ((match = regex.exec(content)) !== null) {
      iconUsage.push({
        type: iconSet,
        name: match[1],
        line: content.substring(0, match.index).split('\n').length
      });
    }
  });
  
  return iconUsage;
}

// Function to check if Expo is installed and configured correctly
function checkExpoInstallation() {
  try {
    const expoVersion = execSync('npx expo --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Expo CLI version: ${expoVersion}`);
    
    // Check if @expo/vector-icons is installed
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies['@expo/vector-icons']) {
      console.log(`✅ @expo/vector-icons is installed: ${dependencies['@expo/vector-icons']}`);
    } else {
      console.error('❌ @expo/vector-icons is not installed in package.json');
    }
    
    // Check if expo-font is installed
    if (dependencies['expo-font']) {
      console.log(`✅ expo-font is installed: ${dependencies['expo-font']}`);
    } else {
      console.error('❌ expo-font is not installed in package.json');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking Expo installation:', error.message);
    return false;
  }
}

// Function to check if fonts are loaded correctly
function checkFontLoading() {
  const appFiles = [
    path.join(process.cwd(), 'App.tsx'),
    path.join(process.cwd(), 'app', '_layout.tsx')
  ];
  
  let fontLoadingFound = false;
  
  appFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('useFonts') || content.includes('loadAsync') || content.includes('Font.loadAsync')) {
        console.log(`✅ Font loading found in ${file}`);
        fontLoadingFound = true;
      }
    }
  });
  
  if (!fontLoadingFound) {
    console.error('❌ No font loading code found in App.tsx or app/_layout.tsx');
  }
  
  return fontLoadingFound;
}

// Main function
function main() {
  console.log('Checking icon usage in the codebase...');
  
  // Check Expo installation
  const expoInstalled = checkExpoInstallation();
  
  // Check font loading
  const fontsLoaded = checkFontLoading();
  
  // Get all files
  const files = getAllFiles(process.cwd());
  console.log(`Found ${files.length} TypeScript/JavaScript files to check`);
  
  // Check each file
  const filesWithIcons = [];
  const iconUsage = [];
  
  files.forEach(file => {
    const imports = checkIconImports(file);
    if (imports.length > 0) {
      filesWithIcons.push({
        file: path.relative(process.cwd(), file),
        imports
      });
      
      const icons = extractIconUsage(file);
      if (icons.length > 0) {
        iconUsage.push({
          file: path.relative(process.cwd(), file),
          icons
        });
      }
    }
  });
  
  console.log(`\nFound ${filesWithIcons.length} files with icon imports`);
  console.log(`Found ${iconUsage.reduce((acc, file) => acc + file.icons.length, 0)} icon usages`);
  
  // Check for potential issues
  const issues = [];
  
  iconUsage.forEach(file => {
    const fileImports = filesWithIcons.find(f => f.file === file.file)?.imports || [];
    
    file.icons.forEach(icon => {
      // Check if the icon set is imported
      if (!fileImports.includes(icon.type) && !fileImports.includes('@expo/vector-icons')) {
        issues.push({
          file: file.file,
          line: icon.line,
          message: `${icon.type} is used but not imported`
        });
      }
    });
  });
  
  if (issues.length > 0) {
    console.log('\n⚠️ Potential icon issues found:');
    issues.forEach(issue => {
      console.log(`${issue.file}:${issue.line} - ${issue.message}`);
    });
  } else {
    console.log('\n✅ No icon issues found');
  }
  
  // Summary
  console.log('\nSummary:');
  console.log(`- Expo installed: ${expoInstalled ? '✅' : '❌'}`);
  console.log(`- Fonts loaded: ${fontsLoaded ? '✅' : '❌'}`);
  console.log(`- Files with icon imports: ${filesWithIcons.length}`);
  console.log(`- Total icon usages: ${iconUsage.reduce((acc, file) => acc + file.icons.length, 0)}`);
  console.log(`- Potential issues: ${issues.length}`);
  
  // Recommendations
  console.log('\nRecommendations:');
  if (!expoInstalled) {
    console.log('- Install Expo CLI: npm install -g expo-cli');
  }
  if (!fontsLoaded) {
    console.log('- Add font loading code to App.tsx or app/_layout.tsx');
  }
  if (issues.length > 0) {
    console.log('- Fix the icon import issues listed above');
  }
  console.log('- Ensure @expo/vector-icons is installed: npm install @expo/vector-icons');
  console.log('- Ensure expo-font is installed: npm install expo-font');
  console.log('- Add font loading in your app entry point:');
  console.log(`
  import { useFonts } from 'expo-font';
  import { useEffect } from 'react';
  
  export default function App() {
    const [fontsLoaded] = useFonts({
      // Add your fonts here
    });
    
    if (!fontsLoaded) {
      return <AppLoading />;
    }
    
    return (
      // Your app
    );
  }
  `);
}

// Run the script
main(); 