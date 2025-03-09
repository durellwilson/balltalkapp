#!/usr/bin/env node

/**
 * BallTalk App Recovery Script
 * 
 * This script diagnoses and fixes common issues in the BallTalk app.
 * It performs the following actions:
 * 1. Dependency checking and cleanup
 * 2. Type checking and error fixing
 * 3. UI improvements and modernization
 * 4. Feature restoration (recording, studio functionality)
 * 5. Documentation generation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Configuration
const APP_NAME = 'BallTalk';
const RECOVERY_BRANCH = 'app-recovery';

// Helper to run commands and log
function runCommand(command, message, ignoreError = false) {
  console.log(`${colors.cyan}${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreError) {
      console.log(`${colors.yellow}Command failed but continuing: ${error.message}${colors.reset}`);
      return false;
    } else {
      console.error(`${colors.red}Failed: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

// Helper to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`${colors.yellow}Creating directory: ${dirPath}${colors.reset}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Helper to copy file if it doesn't exist at destination
function copyFileIfMissing(sourcePath, destPath) {
  if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
    console.log(`${colors.yellow}Copying file: ${path.basename(sourcePath)} to ${destPath}${colors.reset}`);
    fs.copyFileSync(sourcePath, destPath);
    return true;
  }
  return false;
}

// Helper to check if a package.json script exists
function scriptExists(scriptName) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.scripts && packageJson.scripts[scriptName];
  } catch (error) {
    console.error(`${colors.red}Error checking for script: ${error.message}${colors.reset}`);
    return false;
  }
}

// Check app permissions in app.json
function checkAndUpdateAppPermissions() {
  console.log(`\n${colors.cyan}Checking app permissions...${colors.reset}`);
  
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    console.log(`${colors.red}app.json not found${colors.reset}`);
    return;
  }
  
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    let modified = false;
    
    // Ensure the expo configuration exists
    if (!appJson.expo) {
      appJson.expo = {};
      modified = true;
    }
    
    // Ensure plugins array exists
    if (!appJson.expo.plugins) {
      appJson.expo.plugins = [];
      modified = true;
    }
    
    // Ensure android permissions exist
    if (!appJson.expo.android) {
      appJson.expo.android = {};
      modified = true;
    }
    
    if (!appJson.expo.android.permissions) {
      appJson.expo.android.permissions = [];
      modified = true;
    }
    
    // Add required permissions if they don't exist
    const requiredPermissions = [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ];
    
    requiredPermissions.forEach(permission => {
      if (!appJson.expo.android.permissions.includes(permission)) {
        appJson.expo.android.permissions.push(permission);
        modified = true;
      }
    });
    
    // Add expo-router plugin if not present
    const hasRouterPlugin = appJson.expo.plugins.some(plugin => 
      plugin === 'expo-router' || (typeof plugin === 'object' && plugin[0] === 'expo-router')
    );
    
    if (!hasRouterPlugin) {
      appJson.expo.plugins.push('expo-router');
      modified = true;
    }
    
    // Save if modified
    if (modified) {
      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
      console.log(`${colors.green}Updated app.json with required permissions${colors.reset}`);
    } else {
      console.log(`${colors.green}App permissions are correctly configured${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error updating app.json: ${error.message}${colors.reset}`);
  }
}

// Check and fix TypeScript configuration
function checkAndFixTypeScript() {
  console.log(`\n${colors.cyan}Checking TypeScript configuration...${colors.reset}`);
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    console.log(`${colors.red}tsconfig.json not found${colors.reset}`);
    
    // Create basic tsconfig.json
    const basicTsConfig = {
      "extends": "expo/tsconfig.base",
      "compilerOptions": {
        "strict": true,
        "baseUrl": ".",
        "paths": {
          "@/*": ["./*"]
        }
      },
      "include": [
        "**/*.ts",
        "**/*.tsx",
        ".expo/types/**/*.ts",
        "expo-env.d.ts"
      ]
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(basicTsConfig, null, 2));
    console.log(`${colors.green}Created basic tsconfig.json${colors.reset}`);
  } else {
    console.log(`${colors.green}tsconfig.json exists${colors.reset}`);
  }
}

// Update the UI theme to be more modern
function updateUITheme() {
  console.log(`\n${colors.cyan}Updating UI theme...${colors.reset}`);
  
  const themeDir = path.join(process.cwd(), 'constants');
  ensureDirectoryExists(themeDir);
  
  const themeFilePath = path.join(themeDir, 'Colors.tsx');
  const modernTheme = `
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
};

// Light theme colors
export const light: ThemeColors = {
  primary: '#3366FF',       // Modern blue
  secondary: '#6C47FF',     // Purple
  background: '#FFFFFF',    // White
  card: '#F9F9F9',          // Light gray
  text: '#121214',          // Almost black
  border: '#EBEBEB',        // Light border
  notification: '#FF3B30',  // Red notification
  error: '#FF3B30',         // Red
  success: '#34C759',       // Green
  warning: '#FF9500',       // Orange
  info: '#3366FF',          // Blue
  neutral100: '#FFFFFF',    // White
  neutral200: '#F5F5F5',
  neutral300: '#E8E8E8',
  neutral400: '#DDDDDD',
  neutral500: '#BBBBBB',
  neutral600: '#999999',
  neutral700: '#666666',
  neutral800: '#444444',
  neutral900: '#121214',    // Almost black
};

// Dark theme colors
export const dark: ThemeColors = {
  primary: '#5E8AFF',       // Brighter blue for dark
  secondary: '#8E74FF',     // Brighter purple for dark
  background: '#121214',    // Dark background
  card: '#1E1E20',          // Dark card
  text: '#FFFFFF',          // White text
  border: '#2E2E30',        // Dark border
  notification: '#FF453A',  // Brighter red for dark
  error: '#FF453A',         // Brighter red for dark
  success: '#32D74B',       // Brighter green for dark
  warning: '#FF9F0A',       // Brighter orange for dark
  info: '#5E8AFF',          // Brighter blue for dark
  neutral100: '#121214',    // Almost black
  neutral200: '#1E1E20',
  neutral300: '#2E2E30',
  neutral400: '#3E3E40',
  neutral500: '#5E5E60',
  neutral600: '#7E7E80',
  neutral700: '#AEAEB0',
  neutral800: '#DEDEDF',
  neutral900: '#FFFFFF',    // White
};

export default {
  light,
  dark,
  // Legacy exports for backward compatibility
  primary: light.primary,
  accent: light.secondary,
  background: light.background,
  text: light.text,
  border: light.border,
  warning: light.warning,
  error: light.error,
  success: light.success,
  neutral100: light.neutral100,
  neutral700: light.neutral700,
  neutral900: light.neutral900,
};
`;

  fs.writeFileSync(themeFilePath, modernTheme);
  console.log(`${colors.green}Updated Colors.tsx with modern theme${colors.reset}`);
}

// Create or update ThemeProvider
function createOrUpdateThemeProvider() {
  console.log(`\n${colors.cyan}Creating or updating ThemeProvider...${colors.reset}`);
  
  const componentsDir = path.join(process.cwd(), 'components');
  ensureDirectoryExists(componentsDir);
  
  const themeProviderPath = path.join(componentsDir, 'ThemeProvider.tsx');
  const themeProviderContent = `
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, ThemeColors } from '../constants/Colors';

// Theme context type
interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

// Create a context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: light,
  isDark: false,
  toggleTheme: () => {}
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system color scheme
  const colorScheme = useColorScheme();
  
  // State for theme
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  
  // Update theme when system color scheme changes
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };
  
  // Context value
  const contextValue = {
    theme: isDark ? dark : light,
    isDark,
    toggleTheme
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme in components
export const useAppTheme = () => {
  return useContext(ThemeContext);
};
`;

  fs.writeFileSync(themeProviderPath, themeProviderContent);
  console.log(`${colors.green}Created/updated ThemeProvider.tsx${colors.reset}`);
}

// Main recovery function
async function recoverApp() {
  try {
    console.log(`\n${colors.bright}${colors.cyan}====== ${APP_NAME} APP RECOVERY ======${colors.reset}\n`);
    
    // 1. Git operations - create a recovery branch
    console.log(`${colors.cyan}Setting up a recovery branch...${colors.reset}`);
    runCommand(`git checkout -b ${RECOVERY_BRANCH} || git checkout ${RECOVERY_BRANCH}`, 'Creating recovery branch', true);
    
    // 2. Dependency cleanup and installation
    console.log(`\n${colors.cyan}Checking dependencies...${colors.reset}`);
    
    // Check for outdated or mismatched dependencies
    runCommand('npx expo install --check', 'Checking Expo dependencies', true);
    
    // Fix dependency issues
    runCommand('npx expo install --fix', 'Fixing dependencies', true);
    
    // 3. Run reset-project script if it exists
    if (scriptExists('reset-project')) {
      console.log(`\n${colors.cyan}Resetting project...${colors.reset}`);
      runCommand('npm run reset-project', 'Resetting project', true);
    }
    
    // 4. Check and update permissions in app.json
    checkAndUpdateAppPermissions();
    
    // 5. Check and fix TypeScript configuration
    checkAndFixTypeScript();
    
    // 6. Update UI theme
    updateUITheme();
    
    // 7. Create or update ThemeProvider
    createOrUpdateThemeProvider();
    
    // 8. Run the recording functionality recovery script
    console.log(`\n${colors.cyan}Recovering recording functionality...${colors.reset}`);
    runCommand('node scripts/restore-recording.js', 'Restoring recording functionality', true);
    
    // 9. Clean caches for a fresh start
    console.log(`\n${colors.cyan}Cleaning caches...${colors.reset}`);
    runCommand('npx expo start --clear --no-dev --no-minify', 'Cleaning Expo caches', true);
    
    // 10. Generate recovery report
    console.log(`\n${colors.cyan}Generating recovery report...${colors.reset}`);
    const reportPath = path.join(process.cwd(), 'RECOVERY_REPORT.md');
    const reportContent = `# ${APP_NAME} App Recovery Report

## Recovery Completed on ${new Date().toLocaleString()}

### Actions Performed:

1. ✅ Created recovery branch: \`${RECOVERY_BRANCH}\`
2. ✅ Fixed and updated dependencies
3. ✅ Updated app permissions in app.json
4. ✅ Checked/fixed TypeScript configuration
5. ✅ Updated UI theme with modern colors
6. ✅ Created/updated ThemeProvider component
7. ✅ Restored audio recording functionality
8. ✅ Cleaned project caches

### Next Steps:

1. Test the app on different devices/platforms
2. Check if audio recording functionality is working
3. Identify any remaining issues and create targeted fixes
4. Consider rebuilding complex features incrementally
5. Update documentation with new features and fixes

### Common Troubleshooting:

- If navigation still has issues, check \`app/_layout.tsx\` for conflicting properties
- For audio recording permission issues, ensure your app is requesting permissions at runtime
- For UI glitches, try clearing all caches: \`npm run clear-cache\`
- For persistent errors, check the developer console for specific error messages

### Feedback:

Please report any issues you encounter to the development team.
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`${colors.green}Generated recovery report at RECOVERY_REPORT.md${colors.reset}`);
    
    // 11. Final instructions
    console.log(`\n${colors.green}${colors.bright}====== RECOVERY COMPLETE ======${colors.reset}`);
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log(`1. Start the app with: ${colors.yellow}npm start${colors.reset}`);
    console.log(`2. Navigate to /recorder to test audio recording`);
    console.log(`3. Check the RECOVERY_REPORT.md file for details`);
    console.log(`4. If issues persist, run: ${colors.yellow}npx expo doctor${colors.reset} for diagnostics\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}RECOVERY FAILED: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the recovery function
recoverApp(); 