import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnError?: boolean;
  testID?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component trees.
 * 
 * Renders a fallback UI instead of crashing the whole app when an error occurs.
 * Can optionally report errors to an analytics service.
 * 
 * @example
 * <ErrorBoundary onError={(error) => logErrorToService(error)}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update error info in state
    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }

    // Reset error state if resetOnError is true
    if (this.props.resetOnError) {
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }, 2000);
    }
  }

  handleRestart = async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        // For native platforms, use Expo Updates to reload the app
        await Updates.reloadAsync();
      } else {
        // For web, simply reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to restart app:', error);
    }
  };

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  renderDefaultFallback(): ReactNode {
    const { error } = this.state;
    
    return (
      <View style={styles.container} testID={this.props.testID || 'error-boundary-fallback'}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          {error?.message || 'An unexpected error occurred'}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={this.handleRetry}
            testID="retry-button"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.restartButton]} 
            onPress={this.handleRestart}
            testID="restart-button"
          >
            <Ionicons name="power" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Restart App</Text>
          </TouchableOpacity>
        </View>
        
        {__DEV__ && this.state.errorInfo && (
          <View style={styles.devInfoContainer}>
            <Text style={styles.devInfoTitle}>Developer Information:</Text>
            <Text style={styles.devInfo}>{this.state.errorInfo.componentStack}</Text>
          </View>
        )}
      </View>
    );
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || this.renderDefaultFallback();
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral100,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral900,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.neutral700,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  restartButton: {
    backgroundColor: Colors.accent3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  devInfoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.neutral200,
    borderRadius: 8,
    width: '100%',
    maxHeight: 200,
  },
  devInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.neutral800,
    marginBottom: 8,
  },
  devInfo: {
    fontSize: 12,
    color: Colors.neutral700,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ErrorBoundary; 