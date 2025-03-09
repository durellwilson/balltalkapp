/**
 * Comprehensive test runner script
 * 
 * This script automates testing of all aspects of the BallTalk app,
 * including Firebase integration, audio processing, authentication, 
 * and navigation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Test results
const testResults = {
  unit: { success: false, time: 0, message: '' },
  firebase: { success: false, time: 0, message: '' },
  audio: { success: false, time: 0, message: '' },
  dolby: { success: false, time: 0, message: '' },
  frontend: { success: false, time: 0, message: '' },
  backend: { success: false, time: 0, message: '' },
};

// Create output directory
const outputDir = path.join(__dirname, '../test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Timestamp for this test run
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(outputDir, `test-run-${timestamp}.log`);

// Log function that both logs to console and to file
function log(message, color = null) {
  // Log to console with color if specified
  if (color) {
    console.log(`${color}${message}${colors.reset}`);
  } else {
    console.log(message);
  }
  
  // Also log to file without color codes
  const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
  fs.appendFileSync(logFile, `${cleanMessage}\n`);
}

// Run a test and capture the result
function runTest(name, command, options = {}) {
  const startTime = Date.now();
  log(`\n${colors.bright}${colors.fg.blue}Running ${name} tests...${colors.reset}`);
  log(`Command: ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });
    
    if (options.silent) {
      log(output);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    testResults[name] = { 
      success: true, 
      time: duration, 
      message: `${name} tests passed in ${duration.toFixed(2)}s` 
    };
    
    log(`${colors.fg.green}✓ ${name} tests passed in ${duration.toFixed(2)}s${colors.reset}`);
    return true;
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    testResults[name] = { 
      success: false, 
      time: duration, 
      message: `${name} tests failed: ${error.message}` 
    };
    
    log(`${colors.fg.red}✗ ${name} tests failed in ${duration.toFixed(2)}s${colors.reset}`);
    log(`Error: ${error.message}`);
    
    if (options.exitOnFail) {
      process.exit(1);
    }
    
    return false;
  }
}

// Print test summary
function printSummary() {
  log(`\n${colors.bright}${colors.fg.cyan}=== Test Summary ===${colors.reset}`);
  
  let allPassed = true;
  let totalTime = 0;
  
  for (const [name, result] of Object.entries(testResults)) {
    if (result.time > 0) { // Only show tests that were run
      const icon = result.success ? '✓' : '✗';
      const color = result.success ? colors.fg.green : colors.fg.red;
      log(`${color}${icon} ${name}: ${result.message}${colors.reset}`);
      totalTime += result.time;
      
      if (!result.success) {
        allPassed = false;
      }
    }
  }
  
  log(`\n${colors.bright}Total test time: ${totalTime.toFixed(2)}s${colors.reset}`);
  
  if (allPassed) {
    log(`\n${colors.fg.green}${colors.bright}All tests passed!${colors.reset}`);
  } else {
    log(`\n${colors.fg.red}${colors.bright}Some tests failed!${colors.reset}`);
  }
  
  // Generate HTML report
  generateHtmlReport();
  
  return allPassed;
}

// Generate HTML test report
function generateHtmlReport() {
  const reportPath = path.join(outputDir, `test-report-${timestamp}.html`);
  
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BallTalk Test Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #007AFF;
        border-bottom: 2px solid #007AFF;
        padding-bottom: 10px;
      }
      .summary {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      .test-group {
        margin-bottom: 30px;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }
      .test-header {
        padding: 15px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
      }
      .test-body {
        padding: 15px;
      }
      .success {
        color: #28a745;
      }
      .failure {
        color: #dc3545;
      }
      .time {
        color: #6c757d;
        font-size: 0.9em;
      }
      .success-bg {
        background-color: #d4edda;
      }
      .failure-bg {
        background-color: #f8d7da;
      }
    </style>
  </head>
  <body>
    <h1>BallTalk Test Report</h1>
    
    <div class="summary">
      <h2>Summary</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total Test Time: ${Object.values(testResults).reduce((acc, result) => acc + result.time, 0).toFixed(2)}s</p>
      <p class="${Object.values(testResults).every(r => r.time === 0 || r.success) ? 'success' : 'failure'}">
        ${Object.values(testResults).every(r => r.time === 0 || r.success) ? 'All tests passed!' : 'Some tests failed!'}
      </p>
    </div>
    
    <div class="tests">
      ${Object.entries(testResults)
        .filter(([_, result]) => result.time > 0)
        .map(([name, result]) => `
          <div class="test-group">
            <div class="test-header ${result.success ? 'success-bg' : 'failure-bg'}">
              <span>${name.toUpperCase()} Tests</span>
              <span class="${result.success ? 'success' : 'failure'}">
                ${result.success ? 'PASSED' : 'FAILED'} <span class="time">(${result.time.toFixed(2)}s)</span>
              </span>
            </div>
            <div class="test-body">
              <pre>${result.message}</pre>
            </div>
          </div>
        `).join('')}
    </div>
  </body>
  </html>
  `;
  
  fs.writeFileSync(reportPath, html);
  log(`\nHTML test report generated: ${reportPath}`);
}

// Main function
async function main() {
  log(`${colors.bright}${colors.fg.cyan}=== BallTalk Comprehensive Test Runner ===${colors.reset}`);
  log(`Starting tests at: ${new Date().toLocaleString()}`);
  
  // Run unit tests
  runTest('unit', 'npm run test:unit');
  
  // Run Firebase tests
  runTest('firebase', 'npm run test:firebase');
  
  // Run audio tests
  runTest('audio', 'npm run test:audio');
  
  // Run Dolby API tests
  runTest('dolby', 'npm run test:dolby');
  
  // Run backend tests
  runTest('backend', 'npm run test:backend');
  
  // Print summary
  const allPassed = printSummary();
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the main function
main().catch(error => {
  log(`${colors.fg.red}${colors.bright}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 