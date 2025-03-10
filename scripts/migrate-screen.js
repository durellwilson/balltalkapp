#!/usr/bin/env node

/**
 * Screen Migration Script
 * 
 * This script helps migrate a screen from the screens directory to the app directory.
 * It will:
 * 1. Copy the screen file to the app directory
 * 2. Update the file to use Expo Router instead of React Navigation
 * 3. Update imports to point to the new locations
 * 
 * Usage:
 * node scripts/migrate-screen.js <source-file> <target-file>
 * 
 * Example:
 * node scripts/migrate-screen.js screens/StudioScreen.tsx app/(tabs)/studio.tsx
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check arguments
if (process.argv.length < 4) {
  console.error('Usage: node scripts/migrate-screen.js <source-file> <target-file>');
  process.exit(1);
}

const sourceFile = process.argv[2];
const targetFile = process.argv[3];

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file ${sourceFile} does not exist`);
  process.exit(1);
}

// Check if target directory exists
const targetDir = path.dirname(targetFile);
if (!fs.existsSync(targetDir)) {
  console.log(`Creating directory ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read source file
let content = fs.readFileSync(sourceFile, 'utf8');

// Replace React Navigation imports with Expo Router
content = content.replace(
  /import\s+{\s*([^}]*)\s*}\s+from\s+['"]@react-navigation\/([^'"]+)['"]/g,
  'import { $1 } from "expo-router"'
);

// Replace navigation props
content = content.replace(
  /const\s+{\s*navigation\s*,\s*route\s*}\s*=\s*props/g,
  'const router = useRouter()'
);
content = content.replace(
  /const\s+{\s*navigation\s*}\s*=\s*props/g,
  'const router = useRouter()'
);
content = content.replace(
  /const\s+{\s*route\s*}\s*=\s*props/g,
  'const params = useLocalSearchParams()'
);

// Replace navigation.navigate with router.push
content = content.replace(
  /navigation\.navigate\(['"]([^'"]+)['"](,\s*{([^}]+)})?\)/g,
  (match, screen, paramsGroup, params) => {
    if (params) {
      return `router.push({ pathname: '/${screen.toLowerCase()}', params: {${params}} })`;
    } else {
      return `router.push('/${screen.toLowerCase()}')`;
    }
  }
);

// Replace route.params with useLocalSearchParams
content = content.replace(
  /route\.params\.([\w]+)/g,
  'params.$1'
);

// Add Expo Router imports if not already present
if (!content.includes('expo-router')) {
  const importIndex = content.indexOf('import');
  content = content.slice(0, importIndex) + 
    'import { useRouter, useLocalSearchParams, Stack } from "expo-router";\n' + 
    content.slice(importIndex);
}

// Add Stack.Screen component if not already present
if (!content.includes('Stack.Screen')) {
  const returnIndex = content.indexOf('return (');
  if (returnIndex !== -1) {
    const openingBracketIndex = content.indexOf('(', returnIndex);
    const nextLineIndex = content.indexOf('\n', openingBracketIndex);
    
    content = content.slice(0, nextLineIndex + 1) + 
      '      <Stack.Screen\n' +
      '        options={{\n' +
      `          title: "${path.basename(sourceFile, '.tsx').replace('Screen', '')}",\n` +
      '        }}\n' +
      '      />\n' + 
      content.slice(nextLineIndex + 1);
  }
}

// Update the component name to match the file name
const componentName = path.basename(targetFile, '.tsx')
  .replace(/[^a-zA-Z0-9]/g, '')
  .replace(/^(.)/, (match, char) => char.toUpperCase());

content = content.replace(
  /export\s+default\s+function\s+(\w+)/,
  `export default function ${componentName}`
);
content = content.replace(
  /const\s+(\w+)\s*=\s*\(\)\s*=>/,
  `const ${componentName} = () =>`
);
content = content.replace(
  /export\s+default\s+(\w+)/,
  `export default ${componentName}`
);

// Write to target file
fs.writeFileSync(targetFile, content);

console.log(`Migrated ${sourceFile} to ${targetFile}`);
console.log('Please review the file and make any necessary adjustments.');
console.log('Remember to update any imports in other files that reference this screen.');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Review the migrated file');
console.log('2. Test the screen to ensure it works correctly');
console.log('3. Update imports in other files');
console.log('4. Remove the original file once migration is complete'); 