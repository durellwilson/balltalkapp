#!/usr/bin/env node

/**
 * Scan Deprecated Methods Script
 * 
 * This script scans the codebase for deprecated methods, APIs, and patterns.
 * It helps identify code that should be updated to use modern alternatives.
 * 
 * Usage:
 *   node scripts/scan-deprecated.js [--fix] [--verbose]
 * 
 * Options:
 *   --fix       Attempt to automatically fix some issues (experimental)
 *   --verbose   Show more detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Convert fs methods to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

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

// Patterns to search for
const DEPRECATED_PATTERNS = [
  // React lifecycle methods
  {
    pattern: /componentWillMount\s*\(/g,
    name: 'componentWillMount',
    replacement: 'componentDidMount or useEffect',
    severity: 'high',
    description: 'componentWillMount is deprecated. Use componentDidMount or useEffect hook instead.',
  },
  {
    pattern: /componentWillReceiveProps\s*\(/g,
    name: 'componentWillReceiveProps',
    replacement: 'getDerivedStateFromProps or useEffect',
    severity: 'high',
    description: 'componentWillReceiveProps is deprecated. Use static getDerivedStateFromProps or useEffect hook instead.',
  },
  {
    pattern: /componentWillUpdate\s*\(/g,
    name: 'componentWillUpdate',
    replacement: 'componentDidUpdate or useEffect',
    severity: 'high',
    description: 'componentWillUpdate is deprecated. Use componentDidUpdate or useEffect hook instead.',
  },
  
  // Firebase v8 patterns
  {
    pattern: /firebase\.firestore\(\)/g,
    name: 'firebase.firestore()',
    replacement: 'getFirestore()',
    severity: 'high',
    description: 'Firebase v8 API is deprecated. Use Firebase v9 modular API instead.',
  },
  {
    pattern: /firebase\.auth\(\)/g,
    name: 'firebase.auth()',
    replacement: 'getAuth()',
    severity: 'high',
    description: 'Firebase v8 API is deprecated. Use Firebase v9 modular API instead.',
  },
  {
    pattern: /firebase\.storage\(\)/g,
    name: 'firebase.storage()',
    replacement: 'getStorage()',
    severity: 'high',
    description: 'Firebase v8 API is deprecated. Use Firebase v9 modular API instead.',
  },
  
  // Firestore queries without indexes
  {
    pattern: /\.where\([^)]+\)\.orderBy\([^)]+\)\.limit\(/g,
    name: 'Unsupported Firestore query without index',
    replacement: 'Add a composite index or simplify the query',
    severity: 'high',
    description: 'Firestore queries with where() + orderBy() + limit() require a composite index.',
  },
  
  // Expo deprecated APIs
  {
    pattern: /Permissions\.askAsync/g,
    name: 'Expo Permissions.askAsync',
    replacement: 'requestPermissionsAsync from specific modules',
    severity: 'medium',
    description: 'Expo Permissions.askAsync is deprecated. Use requestPermissionsAsync from specific modules instead.',
  },
  {
    pattern: /import.*AppLoading.*from.*expo/g,
    name: 'Expo AppLoading',
    replacement: 'SplashScreen.preventAutoHideAsync()',
    severity: 'medium',
    description: 'Expo AppLoading is deprecated. Use SplashScreen.preventAutoHideAsync() instead.',
  },
  
  // React Navigation v4 patterns
  {
    pattern: /createStackNavigator\(\s*{/g,
    name: 'React Navigation v4 createStackNavigator',
    replacement: 'React Navigation v6 createStackNavigator',
    severity: 'medium',
    description: 'React Navigation v4 API is deprecated. Update to React Navigation v6.',
  },
  
  // Deprecated React Native components
  {
    pattern: /import.*SwipeableListView.*from.*react-native/g,
    name: 'SwipeableListView',
    replacement: 'react-native-gesture-handler',
    severity: 'medium',
    description: 'SwipeableListView is deprecated. Use react-native-gesture-handler instead.',
  },
  {
    pattern: /import.*ListView.*from.*react-native/g,
    name: 'ListView',
    replacement: 'FlatList or SectionList',
    severity: 'high',
    description: 'ListView is deprecated. Use FlatList or SectionList instead.',
  },
  
  // Unsafe style patterns
  {
    pattern: /flex:\s*-1/g,
    name: 'Negative flex values',
    replacement: 'Positive flex values with different parent layout',
    severity: 'low',
    description: 'Negative flex values can cause inconsistent layouts across platforms.',
  },
  
  // Deprecated fetch patterns
  {
    pattern: /new\s+Request\(/g,
    name: 'new Request()',
    replacement: 'fetch()',
    severity: 'low',
    description: 'The Request constructor is less commonly used. Consider using fetch() directly.',
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

// Scan a file for deprecated patterns
const scanFile = async (filePath) => {
  try {
    const content = await readFile(filePath, 'utf8');
    const issues = [];
    
    for (const { pattern, name, replacement, severity, description } of DEPRECATED_PATTERNS) {
      const matches = content.match(pattern);
      
      if (matches) {
        issues.push({
          pattern: name,
          count: matches.length,
          replacement,
          severity,
          description,
        });
      }
    }
    
    return { filePath, issues };
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return { filePath, issues: [], error: error.message };
  }
};

// Format the results
const formatResults = (results) => {
  const issuesByFile = results.filter(result => result.issues.length > 0);
  
  if (issuesByFile.length === 0) {
    console.log('✅ No deprecated patterns found!');
    return;
  }
  
  console.log(`\n🔍 Found deprecated patterns in ${issuesByFile.length} files:\n`);
  
  // Group by severity
  const highSeverity = [];
  const mediumSeverity = [];
  const lowSeverity = [];
  
  for (const { filePath, issues } of issuesByFile) {
    for (const issue of issues) {
      const item = { filePath, ...issue };
      
      if (issue.severity === 'high') {
        highSeverity.push(item);
      } else if (issue.severity === 'medium') {
        mediumSeverity.push(item);
      } else {
        lowSeverity.push(item);
      }
    }
  }
  
  // Print high severity issues
  if (highSeverity.length > 0) {
    console.log(`\n🔴 HIGH SEVERITY ISSUES (${highSeverity.length}):`);
    for (const issue of highSeverity) {
      console.log(`  - ${issue.filePath}`);
      console.log(`    • ${issue.pattern} (${issue.count} occurrences)`);
      console.log(`      Replace with: ${issue.replacement}`);
      if (verbose) {
        console.log(`      ${issue.description}`);
      }
    }
  }
  
  // Print medium severity issues
  if (mediumSeverity.length > 0) {
    console.log(`\n🟠 MEDIUM SEVERITY ISSUES (${mediumSeverity.length}):`);
    for (const issue of mediumSeverity) {
      console.log(`  - ${issue.filePath}`);
      console.log(`    • ${issue.pattern} (${issue.count} occurrences)`);
      console.log(`      Replace with: ${issue.replacement}`);
      if (verbose) {
        console.log(`      ${issue.description}`);
      }
    }
  }
  
  // Print low severity issues
  if (lowSeverity.length > 0) {
    console.log(`\n🟡 LOW SEVERITY ISSUES (${lowSeverity.length}):`);
    for (const issue of lowSeverity) {
      console.log(`  - ${issue.filePath}`);
      console.log(`    • ${issue.pattern} (${issue.count} occurrences)`);
      console.log(`      Replace with: ${issue.replacement}`);
      if (verbose) {
        console.log(`      ${issue.description}`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`  Total files with issues: ${issuesByFile.length}`);
  console.log(`  High severity issues: ${highSeverity.length}`);
  console.log(`  Medium severity issues: ${mediumSeverity.length}`);
  console.log(`  Low severity issues: ${lowSeverity.length}`);
  
  // Generate report file
  const reportContent = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFilesWithIssues: issuesByFile.length,
      highSeverityIssues: highSeverity.length,
      mediumSeverityIssues: mediumSeverity.length,
      lowSeverityIssues: lowSeverity.length,
    },
    issues: {
      high: highSeverity,
      medium: mediumSeverity,
      low: lowSeverity,
    },
  };
  
  fs.writeFileSync(
    'deprecated-methods-report.json', 
    JSON.stringify(reportContent, null, 2)
  );
  
  console.log('\n📝 Report saved to deprecated-methods-report.json');
};

// Main function
const main = async () => {
  console.log('🔍 Scanning for deprecated methods and patterns...');
  
  const files = getFilesToScan();
  console.log(`Found ${files.length} files to scan`);
  
  const results = await Promise.all(files.map(scanFile));
  
  formatResults(results);
  
  if (shouldFix) {
    console.log('\n🔧 Attempting to fix issues (experimental)...');
    // Implement auto-fixing logic here
    console.log('Auto-fixing is not yet implemented');
  }
};

// Run the script
main().catch(error => {
  console.error('Error running scan-deprecated script:', error);
  process.exit(1);
}); 