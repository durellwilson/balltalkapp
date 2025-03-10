#!/usr/bin/env node

/**
 * Component Extraction Script
 * 
 * This script helps extract reusable components from screens.
 * It will:
 * 1. Extract the component from the source file
 * 2. Create a new component file in the components directory
 * 3. Update the source file to import the new component
 * 
 * Usage:
 * node scripts/extract-component.js <source-file> <component-name> <target-directory>
 * 
 * Example:
 * node scripts/extract-component.js app/(tabs)/studio.tsx AudioPlayer components/audio
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check arguments
if (process.argv.length < 5) {
  console.error('Usage: node scripts/extract-component.js <source-file> <component-name> <target-directory>');
  process.exit(1);
}

const sourceFile = process.argv[2];
const componentName = process.argv[3];
const targetDir = process.argv[4];

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file ${sourceFile} does not exist`);
  process.exit(1);
}

// Check if target directory exists
if (!fs.existsSync(targetDir)) {
  console.log(`Creating directory ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read source file
const content = fs.readFileSync(sourceFile, 'utf8');

// Find the component definition
const componentRegex = new RegExp(`(const|function)\\s+${componentName}\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*{([\\s\\S]*?)return\\s*\\(([\\s\\S]*?)\\);([\\s\\S]*?)(}|\\);)`, 'g');
const functionComponentRegex = new RegExp(`function\\s+${componentName}\\s*\\(([^)]*)\\)\\s*{([\\s\\S]*?)return\\s*\\(([\\s\\S]*?)\\);([\\s\\S]*?)}`, 'g');

let componentMatch = componentRegex.exec(content);
let isFunctionComponent = false;

if (!componentMatch) {
  componentMatch = functionComponentRegex.exec(content);
  isFunctionComponent = true;
  
  if (!componentMatch) {
    console.error(`Component ${componentName} not found in ${sourceFile}`);
    process.exit(1);
  }
}

// Extract component parts
const componentProps = isFunctionComponent ? componentMatch[1] : componentMatch[2];
const componentBody = isFunctionComponent ? componentMatch[2] : componentMatch[3];
const componentJSX = isFunctionComponent ? componentMatch[3] : componentMatch[4];
const componentClosing = isFunctionComponent ? componentMatch[4] : componentMatch[5];

// Find imports in the source file
const importRegex = /import\s+.*?\s+from\s+['"].*?['"]/g;
const imports = content.match(importRegex) || [];

// Create the new component file
const targetFile = path.join(targetDir, `${componentName}.tsx`);
const relativePathToSource = path.relative(targetDir, path.dirname(sourceFile));

// Generate the component file content
let componentFileContent = `import React from 'react';
import { View, StyleSheet } from 'react-native';
${imports.join('\n')}

interface ${componentName}Props {
  ${componentProps.trim() ? componentProps : '// Add props here'}
}

${isFunctionComponent 
  ? `function ${componentName}(${componentProps}): React.ReactElement {${componentBody}return (${componentJSX});${componentClosing}}`
  : `const ${componentName}: React.FC<${componentName}Props> = (${componentProps}) => {${componentBody}return (${componentJSX});${componentClosing}}`
}

const styles = StyleSheet.create({
  // Add styles here
});

export default ${componentName};`;

// Write the component file
fs.writeFileSync(targetFile, componentFileContent);

// Update the source file to import the new component
const relativeImportPath = path.relative(path.dirname(sourceFile), targetFile).replace(/\\/g, '/').replace('.tsx', '');
const importStatement = `import ${componentName} from '${relativeImportPath.startsWith('.') ? relativeImportPath : './' + relativeImportPath}';`;

// Replace the component definition with the import and usage
const updatedContent = content.replace(
  isFunctionComponent 
    ? `function ${componentName}(${componentProps}) {${componentBody}return (${componentJSX});${componentClosing}}`
    : `const ${componentName} = (${componentProps}) => {${componentBody}return (${componentJSX});${componentClosing}}`,
  ''
);

// Add the import statement
const updatedContentWithImport = updatedContent.replace(
  /import.*?;(\s*)/,
  `$&\n${importStatement}$1`
);

// Write the updated source file
fs.writeFileSync(sourceFile, updatedContentWithImport);

console.log(`Extracted ${componentName} from ${sourceFile} to ${targetFile}`);
console.log('Please review both files and make any necessary adjustments.');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Review the extracted component file');
console.log('2. Update the component props interface');
console.log('3. Clean up any unused imports in both files');
console.log('4. Test the component to ensure it works correctly'); 