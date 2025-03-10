import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { useFonts } from 'expo-font';
import { LogBox, Text, View } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineProvider from './contexts/OfflineContext';
import OfflineIndicator from './components/OfflineIndicator';
// Import Firebase configuration
import { firebaseApp } from './config/firebase.config';

// Import Expo Router
import { ExpoRoot } from 'expo-router';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type: Invalid prop `textStyle` of type `array` supplied to `Cell`',
  'Non-serializable values were found in the navigation state',
  // Add other warnings to ignore as needed
]);

/**
 * Main App component using Expo Router for navigation
 * This is the entry point for the application
 */
export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    // Add your fonts here if needed
  });

  // Show loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <SafeAreaProvider>
              <StatusBar style="auto" />
              <OfflineIndicator />
              {/* Use Expo Router as the main navigation system */}
              <ExpoRoot context={require.context('./app')} />
            </SafeAreaProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 