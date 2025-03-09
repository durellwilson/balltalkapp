#!/usr/bin/env node

/**
 * Test script for navigation components
 * 
 * This script runs the tests for navigation components to ensure 
 * they render without errors, with special focus on tab navigation.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Console colors for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Define test patterns
const testPatterns = [
  'TabNavigation',
  // Add more navigation test patterns if needed
];

// Function to check for common navigation errors in the codebase
function checkForNavigationErrors() {
  console.log(`${colors.cyan}Checking for common navigation errors in the codebase...${colors.reset}`);
  
  const errors = [];
  
  // Check for tabs with both href and tabBarButton
  try {
    const tabsLayoutFile = path.join(process.cwd(), 'app', '(tabs)', '_layout.tsx');
    if (fs.existsSync(tabsLayoutFile)) {
      const content = fs.readFileSync(tabsLayoutFile, 'utf8');
      
      // Use regex to find potential instances of both href and tabBarButton in the same options block
      const optionsBlocks = content.match(/options=\{\{[^}]*\}\}/g) || [];
      
      optionsBlocks.forEach((block, index) => {
        if (block.includes('href') && block.includes('tabBarButton')) {
          errors.push(`Potential conflict in tab options block #${index + 1}: Using both href and tabBarButton`);
        }
      });
    }
  } catch (error) {
    console.error(`${colors.red}Error checking for navigation errors: ${error.message}${colors.reset}`);
  }
  
  return errors;
}

// Run the tests
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}====== RUNNING NAVIGATION TESTS ======${colors.reset}\n`);
  
  // First check for common errors
  const errors = checkForNavigationErrors();
  if (errors.length > 0) {
    console.log(`${colors.yellow}Found ${errors.length} potential navigation issues:${colors.reset}`);
    errors.forEach(error => console.log(`- ${error}`));
    console.log(`${colors.yellow}These issues may cause runtime errors. Consider fixing them.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}No common navigation issues detected.${colors.reset}\n`);
  }
  
  // Run the tests
  try {
    console.log(`${colors.cyan}Running navigation tests...${colors.reset}`);
    
    const testCommand = `npx jest ${testPatterns.join(' ')} --verbose`;
    console.log(`Executing: ${testCommand}\n`);
    
    execSync(testCommand, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log(`\n${colors.green}${colors.bright}Navigation tests completed successfully.${colors.reset}`);
    return 0;
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Navigation tests failed:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    return 1;
  }
}

// Run the main function
main().then(exitCode => {
  process.exit(exitCode);
}); 