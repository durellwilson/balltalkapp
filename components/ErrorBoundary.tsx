import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { recordError, ErrorCategory } from '../utils/errorReporting';
import { useAuth } from '../contexts/auth';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, stackTrace: string) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error details
    this.setState({ errorInfo });
    
    // Report to error tracking
    recordError(
      error, 
      'ErrorBoundary', 
      ErrorCategory.UI,
      {
        // We'll add user data in the ErrorBoundaryWrapper
      }
    );
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if props change and resetOnPropsChange is true
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps !== this.props
    ) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          
          {/* Show error details in development or if showDetails is true */}
          {(this.props.showDetails || __DEV__) && this.state.errorInfo && (
            <ScrollView style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Error Details:</Text>
              <Text style={styles.details}>
                {this.state.error?.toString()}
              </Text>
              <Text style={styles.detailsTitle}>Component Stack:</Text>
              <Text style={styles.details}>
                {this.state.errorInfo.componentStack}
              </Text>
            </ScrollView>
          )}
          
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper component that adds user context to the ErrorBoundary
export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryProps> = (props) => {
  const { user } = useAuth();
  
  // Add custom error handler that includes user data
  const handleError = (error: Error, stackTrace: string) => {
    // Add user context to the error
    const userData = user ? {
      userId: user.uid,
      userRole: user.role,
      isAnonymous: user.isAnonymous || false,
    } : undefined;
    
    // Record error with user context
    recordError(
      error,
      'ErrorBoundary',
      ErrorCategory.UI,
      userData
    );
    
    // Call the original onError if provided
    if (props.onError) {
      props.onError(error, stackTrace);
    }
  };
  
  return (
    <ErrorBoundary {...props} onError={handleError}>
      {props.children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: '90%',
  },
  detailsContainer: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  details: {
    fontSize: 12,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ErrorBoundaryWrapper; 