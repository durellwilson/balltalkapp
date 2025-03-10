/**
 * Fix All Script
 * 
 * This script runs all the fix scripts in the correct order.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting BallTalk App fixes...');

// Function to run a script
function runScript(scriptName) {
  console.log(`\n=== Running ${scriptName} ===`);
  try {
    execSync(`node ${path.join(__dirname, scriptName)}.js`, { stdio: 'inherit' });
    console.log(`✅ ${scriptName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${scriptName} failed:`, error.message);
    return false;
  }
}

// Run the scripts in order
const scripts = [
  'fix-navigation-paths',
  'fix-template-variables',
  'create-missing-screens'
];

let successCount = 0;
for (const script of scripts) {
  if (runScript(script)) {
    successCount++;
  }
}

console.log(`\n=== Fix All Summary ===`);
console.log(`${successCount}/${scripts.length} scripts completed successfully`);

if (successCount === scripts.length) {
  console.log('✅ All fixes applied successfully!');
} else {
  console.log('⚠️ Some fixes failed. Check the logs above for details.');
}

// Run the emergency fix script if needed
if (successCount < scripts.length) {
  console.log('\nAttempting to run emergency fix...');
  runScript('emergency-fix');
} 