import React, { useEffect, useState, ErrorInfo, Component } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
// Import Firebase configuration
import { firebaseApp } from '../config/firebase.config';
import { ThemeProvider } from '../components/ThemeProvider';
import * as Font from 'expo-font';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// Import the NetworkErrorBoundary component
import NetworkErrorBoundary from '../components/common/NetworkErrorBoundary';
import { NetworkProvider } from '../contexts/NetworkContext';
import OfflineIndicator from '../components/OfflineIndicator';
import { AuthProvider } from '../contexts/auth';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

// Add direct CDN link for web
if (Platform.OS === 'web') {
  // Add Ionicons CSS to head
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/ionicons@5.5.1/dist/css/ionicons.min.css';
  document.head.appendChild(link);
  
  // Add Material Icons CSS to head
  const materialLink = document.createElement('link');
  materialLink.rel = 'stylesheet';
  materialLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
  document.head.appendChild(materialLink);
}

// Polyfill for setImmediate in web browsers
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  if (!window.setImmediate) {
    window.setImmediate = function(callback: (...args: any[]) => void, ...args: any[]) {
      return window.setTimeout(callback, 0, ...args);
    } as any; // Use 'any' to bypass strict type checking

    window.clearImmediate = (handle) => {
      window.clearTimeout(handle as number); // Cast handle to number
    }; // No need for 'as any' here
  }
  
  // Add global error handler for uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection:', event.reason);
    // Prevent the default browser behavior (console error)
    event.preventDefault();
  });
}

// Error boundary component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Only set state if we don't already have an error to prevent infinite loops
    if (!this.state.hasError) {
      this.setState({ errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.text}>{this.state.error?.message || 'Unknown error'}</Text>
          {__DEV__ && this.state.errorInfo && (
            <Text style={styles.errorDetails}>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

// Simple fallback component
function FallbackComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BallTalk</Text>
      <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      <Text style={styles.text}>Loading app...</Text>
    </View>
  );
}

// Pure router component to prevent re-renders from affecting the router
class RouterComponent extends React.PureComponent {
  render() {
    return <Slot />;
  }
}

// ProviderStack creates the proper nesting of providers without causing re-render loops
function ProviderStack({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Main root layout - the top level component
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize app with static init function
  useEffect(() => {
    async function prepare() {
      try {
        console.log('Loading resources...');
        
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialIcons.font,
        });
        
        // Verify Firebase is initialized
        if (firebaseApp) {
          console.log('Firebase initialized in RootLayout');
        } else {
          console.error('Firebase initialization failed in RootLayout');
        }
        
        // Artificially delay for a smoother experience
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        console.log('App ready');
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Handle layout effect with stable references
  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <FallbackComponent />;
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ProviderStack>
          <NetworkErrorBoundary>
            <RouterComponent />
          </NetworkErrorBoundary>
          <OfflineIndicator />
        </ProviderStack>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    maxWidth: '90%',
    maxHeight: 200,
  },
});
