#!/usr/bin/env node

/**
 * Error Handling Verification Script
 * 
 * This script verifies that the error handling system is properly implemented
 * throughout the codebase. It checks for:
 * 
 * 1. Proper use of try/catch blocks
 * 2. Error reporting calls
 * 3. Error boundary usage
 * 4. Offline handling
 * 
 * Usage:
 *   node scripts/verify-error-handling.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Convert fs methods to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
  '.expo',
  '.firebase',
  'firebase-export-*',
];

// File extensions to scan
const INCLUDED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
];

// Patterns to check for
const PATTERNS = [
  {
    name: 'try/catch blocks',
    pattern: /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{/g,
    good: true,
  },
  {
    name: 'error reporting',
    pattern: /recordError\s*\(/g,
    good: true,
  },
  {
    name: 'error boundaries',
    pattern: /<ErrorBoundary[^>]*>/g,
    good: true,
  },
  {
    name: 'offline handling',
    pattern: /useOffline\s*\(\s*\)/g,
    good: true,
  },
  {
    name: 'empty catch blocks',
    pattern: /catch\s*\([^)]*\)\s*{\s*}/g,
    good: false,
  },
  {
    name: 'console.error without recordError',
    pattern: /console\.error\s*\([^;]*(?!recordError)[^;]*;/g,
    good: false,
  },
  {
    name: 'alert without proper error handling',
    pattern: /Alert\.alert\s*\(\s*['"]Error['"]/g,
    good: false,
  },
];

// Get all files to scan
const getFilesToScan = () => {
  try {
    // Use git to list all tracked files
    const gitOutput = execSync('git ls-files', { encoding: 'utf-8' });
    const allFiles = gitOutput.split('\n').filter(Boolean);
    
    // Filter files by extension and exclude directories
    return allFiles.filter(file => {
      const ext = path.extname(file);
      const dir = path.dirname(file);
      
      const isIncludedExtension = INCLUDED_EXTENSIONS.includes(ext);
      const isExcludedDir = EXCLUDED_DIRS.some(excluded => 
        dir === excluded || dir.startsWith(`${excluded}/`)
      );
      
      return isIncludedExtension && !isExcludedDir;
    });
  } catch (error) {
    // Fallback to scanning all files if git command fails
    console.warn('Git command failed, falling back to scanning all files');
    return scanDirectory('.');
  }
};

// Recursively scan a directory for files
const scanDirectory = (dir) => {
  const results = [];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        results.push(...scanDirectory(fullPath));
      }
    } else {
      const ext = path.extname(entry.name);
      if (INCLUDED_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
};

// Scan a file for patterns
const scanFile = async (filePath) => {
  try {
    const content = await readFile(filePath, 'utf8');
    const results = {};
    
    for (const { name, pattern, good } of PATTERNS) {
      const matches = content.match(pattern);
      
      if (matches) {
        results[name] = {
          count: matches.length,
          good,
        };
      }
    }
    
    return { filePath, results };
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return { filePath, results: {}, error: error.message };
  }
};

// Format the results
const formatResults = (results) => {
  const fileResults = results.filter(result => Object.keys(result.results).length > 0);
  
  if (fileResults.length === 0) {
    console.log('No patterns found in any files.');
    return;
  }
  
  // Count occurrences of each pattern
  const patternCounts = {};
  const goodPatterns = {};
  const badPatterns = {};
  
  for (const { filePath, results: fileResults } of fileResults) {
    for (const [patternName, { count, good }] of Object.entries(fileResults)) {
      patternCounts[patternName] = (patternCounts[patternName] || 0) + count;
      
      if (good) {
        goodPatterns[patternName] = (goodPatterns[patternName] || 0) + count;
      } else {
        badPatterns[patternName] = (badPatterns[patternName] || 0) + count;
        
        // Log bad pattern occurrences
        console.log(`\n🔴 Found ${count} instances of '${patternName}' in ${filePath}`);
      }
    }
  }
  
  // Print summary
  console.log('\n📊 SUMMARY:');
  console.log('  Good patterns:');
  for (const [pattern, count] of Object.entries(goodPatterns)) {
    console.log(`    ✅ ${pattern}: ${count} occurrences`);
  }
  
  console.log('\n  Bad patterns:');
  for (const [pattern, count] of Object.entries(badPatterns)) {
    console.log(`    ❌ ${pattern}: ${count} occurrences`);
  }
  
  // Calculate coverage
  const tryCatchCount = goodPatterns['try/catch blocks'] || 0;
  const errorReportingCount = goodPatterns['error reporting'] || 0;
  const errorBoundaryCount = goodPatterns['error boundaries'] || 0;
  const offlineHandlingCount = goodPatterns['offline handling'] || 0;
  
  const emptyCatchCount = badPatterns['empty catch blocks'] || 0;
  const consoleErrorCount = badPatterns['console.error without recordError'] || 0;
  const alertCount = badPatterns['alert without proper error handling'] || 0;
  
  const errorHandlingScore = calculateScore(
    tryCatchCount,
    errorReportingCount,
    errorBoundaryCount,
    offlineHandlingCount,
    emptyCatchCount,
    consoleErrorCount,
    alertCount
  );
  
  console.log(`\n🏆 Error Handling Score: ${errorHandlingScore}%`);
  
  if (errorHandlingScore < 70) {
    console.log('\n⚠️  Error handling needs improvement!');
    console.log('   Consider addressing the bad patterns and adding more error reporting.');
  } else if (errorHandlingScore < 90) {
    console.log('\n👍 Error handling is good, but could be better.');
    console.log('   Consider adding more error boundaries and offline handling.');
  } else {
    console.log('\n🎉 Excellent error handling!');
  }
  
  // Generate report file
  const reportContent = {
    timestamp: new Date().toISOString(),
    summary: {
      goodPatterns,
      badPatterns,
      score: errorHandlingScore,
    },
    details: fileResults,
  };
  
  fs.writeFileSync(
    'error-handling-report.json', 
    JSON.stringify(reportContent, null, 2)
  );
  
  console.log('\n📝 Report saved to error-handling-report.json');
};

// Calculate an error handling score
const calculateScore = (
  tryCatchCount,
  errorReportingCount,
  errorBoundaryCount,
  offlineHandlingCount,
  emptyCatchCount,
  consoleErrorCount,
  alertCount
) => {
  // Base score from good patterns
  let score = 0;
  
  // Add points for good patterns
  if (tryCatchCount > 0) score += 30;
  if (errorReportingCount > 0) score += 30;
  if (errorBoundaryCount > 0) score += 20;
  if (offlineHandlingCount > 0) score += 20;
  
  // Subtract points for bad patterns
  if (emptyCatchCount > 0) score -= Math.min(20, emptyCatchCount * 5);
  if (consoleErrorCount > 0) score -= Math.min(20, consoleErrorCount * 2);
  if (alertCount > 0) score -= Math.min(20, alertCount * 2);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
};

// Main function
const main = async () => {
  console.log('🔍 Verifying error handling implementation...');
  
  const files = getFilesToScan();
  console.log(`Found ${files.length} files to scan`);
  
  const results = await Promise.all(files.map(scanFile));
  
  formatResults(results);
};

// Run the script
main().catch(error => {
  console.error('Error running verify-error-handling script:', error);
  process.exit(1);
}); 