/**
 * Fix Template Variables Script
 * 
 * This script fixes template variables that weren't properly replaced in the codebase.
 * It looks for patterns like ${screenName.toLowerCase()} and replaces them with appropriate values.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the template variables to fix
const templateVariables = [
  { pattern: '\\${screenName\\.toLowerCase\\(\\)}', replacement: 'screen' },
  { pattern: '\\${newPath}', replacement: '/screen' },
  { pattern: '\\${screen\\.toLowerCase\\(\\)}', replacement: 'screen' }
];

// Function to fix a single file
function fixFile(filePath) {
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply fixes
  for (const template of templateVariables) {
    // Create a regex to match the template variable
    const regex = new RegExp(template.pattern, 'g');
    
    // Check if the template variable exists in the file
    if (regex.test(content)) {
      // Get the screen name from the file path
      const screenName = path.basename(filePath, path.extname(filePath));
      
      // Replace with the appropriate value
      let replacement = template.replacement;
      replacement = replacement.replace('screen', screenName);
      
      // Replace the template variable
      const newContent = content.replace(regex, replacement);
      
      // Check if content was modified
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`Fixed template variable in ${filePath}: ${template.pattern} -> ${replacement}`);
      }
    }
  }
  
  // Save file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Find all TypeScript and JavaScript files in the app directory
const files = glob.sync('app/**/*.{ts,tsx,js,jsx}');

// Fix each file
let totalFixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    totalFixed++;
  }
}

console.log(`Fixed template variables in ${totalFixed} files.`); 