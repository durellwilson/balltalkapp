# BallTalk App Routing Fix Plan

## Current Issues
1. **Dual Routing Systems**: The app is using both React Navigation (in App.tsx) and Expo Router (in /app directory)
2. **Conflicting Imports**: App.tsx imports screens from /app directory, which are meant for Expo Router
3. **Duplicate Screens**: Many screens exist in both /screens and /app directories
4. **Inconsistent Navigation**: Some parts of the app use stack navigation, others use tab navigation

## Solution Approach

### Option 1: Migrate Fully to Expo Router
1. Remove React Navigation stack navigator from App.tsx
2. Update App.tsx to use Expo Router as the main navigation system
3. Consolidate all screens into the /app directory
4. Remove duplicate screens from /screens directory

### Option 2: Migrate Fully to React Navigation
1. Keep React Navigation in App.tsx
2. Move all screens from /app directory to /screens
3. Remove Expo Router configuration
4. Update all navigation references

## Recommended Approach: Option 1 (Expo Router)

Expo Router is more modern and provides better integration with Expo. It also supports file-based routing which is easier to maintain.

## Implementation Steps

### Step 1: Update App.tsx
```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { useFonts } from 'expo-font';
import { LogBox } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineProvider from './contexts/OfflineContext';
import OfflineNotice from './components/fallbacks/OfflineNotice';
// Import Firebase configuration
import { firebaseApp } from './config/firebase';

// Import Expo Router
import { ExpoRoot } from 'expo-router';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type: Invalid prop `textStyle` of type `array` supplied to `Cell`',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [fontsLoaded] = useFonts({
    // Add your fonts here if needed
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <SafeAreaProvider>
              <StatusBar style="auto" />
              <OfflineNotice />
              <ExpoRoot context={require.context('./app')} />
            </SafeAreaProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Step 2: Ensure Proper Expo Router Configuration
1. Verify that the /app/_layout.tsx file exists and is properly configured
2. Ensure that the /app/index.tsx file exists and redirects to the appropriate screen
3. Verify that the /app/(tabs)/_layout.tsx file is properly configured for tab navigation

### Step 3: Clean Up Duplicate Screens
1. Identify all screens in /screens that have duplicates in /app
2. Verify that the /app versions are complete and functional
3. Remove the duplicate screens from /screens

### Step 4: Update Navigation References
1. Update all navigation references to use Expo Router's `useRouter` and `Link` components
2. Replace `navigation.navigate()` calls with `router.push()`
3. Update deep links to use the Expo Router path format

### Step 5: Test Navigation
1. Test all navigation paths in the app
2. Verify that all screens are accessible
3. Test deep linking
4. Test authentication flows

## Testing Plan
1. Test app startup
2. Test tab navigation
3. Test screen transitions
4. Test authentication flows
5. Test deep linking
6. Test offline behavior

## Rollback Plan
If issues arise, we can revert to the previous navigation system by:
1. Restoring the original App.tsx
2. Restoring any deleted screens
3. Updating navigation references to use React Navigation again 