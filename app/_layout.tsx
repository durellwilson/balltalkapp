import React, { useEffect, useState, ErrorInfo, Component } from 'react';
import { Stack, Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { firebaseApp } from '../src/lib/firebase';

// Polyfill for setImmediate in web browsers
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  if (!window.setImmediate) {
    window.setImmediate = function(callback: Function, ...args: any[]) {
      return window.setTimeout(callback, 0, ...args);
    };
    window.clearImmediate = window.clearTimeout;
  }
}

// Error boundary component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.text}>{this.state.error?.message || 'Unknown error'}</Text>
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

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Initialize app
  useEffect(() => {
    console.log('RootLayout rendering');
    
    // Simple timeout to ensure everything is loaded
    const timer = setTimeout(() => {
      console.log('App ready');
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <FallbackComponent />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
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
  },
});
