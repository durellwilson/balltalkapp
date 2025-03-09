# BallTalk App - Error Handling Guide

This guide outlines the best practices for error handling in the BallTalk app. Following these guidelines will ensure a consistent, user-friendly approach to handling errors throughout the application.

## Table of Contents

1. [Error Handling Architecture](#error-handling-architecture)
2. [Error Classes](#error-classes)
3. [Error Reporting](#error-reporting)
4. [Error Boundaries](#error-boundaries)
5. [Fallback Components](#fallback-components)
6. [Offline Error Handling](#offline-error-handling)
7. [Best Practices](#best-practices)
8. [Testing Error Scenarios](#testing-error-scenarios)

## Error Handling Architecture

The BallTalk error handling system consists of several layers:

1. **Error Classes**: Custom error classes for different types of errors
2. **Error Reporting**: Centralized error reporting service
3. **Error Messages**: Standardized error messages
4. **Error Boundaries**: React error boundaries to catch UI errors
5. **Fallback Components**: UI components for error states
6. **Offline Support**: Handling offline scenarios

## Error Classes

We use custom error classes to categorize different types of errors:

```typescript
// utils/errors.ts

export class AppError extends Error {
  code: string;
  context: string;
  originalError?: Error;

  constructor(code: string, message: string, originalError?: Error, context?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context || 'unknown';
    this.originalError = originalError;
  }
}

export class NetworkError extends AppError {
  constructor(code: string, message: string, originalError?: Error, context?: string) {
    super(code, message, originalError, context);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(code: string, message: string, originalError?: Error, context?: string) {
    super(code, message, originalError, context);
    this.name = 'AuthError';
  }
}

export class DataError extends AppError {
  constructor(code: string, message: string, originalError?: Error, context?: string) {
    super(code, message, originalError, context);
    this.name = 'DataError';
  }
}

export class AudioError extends AppError {
  constructor(code: string, message: string, originalError?: Error, context?: string) {
    super(code, message, originalError, context);
    this.name = 'AudioError';
  }
}
```

### Usage Example

```typescript
import { NetworkError } from '../utils/errors';

try {
  // Some network operation
} catch (error) {
  throw new NetworkError(
    'CONNECTION_FAILED',
    'Unable to connect to the server',
    error,
    'AuthService.login'
  );
}
```

## Error Reporting

We use a centralized error reporting service to log errors:

```typescript
// utils/errorReporting.ts

export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  DATA = 'data',
  UI = 'ui',
  AUDIO = 'audio',
  UNKNOWN = 'unknown'
}

export interface ErrorReport {
  message: string;
  code?: string;
  context?: string;
  category: ErrorCategory;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

export function recordError(
  error: Error | unknown,
  context?: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  metadata?: Record<string, any>
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const appError = error instanceof AppError ? error : null;
  
  const report: ErrorReport = {
    message: errorObj.message,
    code: appError?.code,
    context: context || appError?.context || 'unknown',
    category,
    timestamp: new Date(),
    stack: errorObj.stack,
    metadata
  };
  
  // Log to console in development
  if (__DEV__) {
    console.error('Error Report:', report);
  }
  
  // In production, send to error reporting service
  // TODO: Implement production error reporting
}
```

### Usage Example

```typescript
import { recordError, ErrorCategory } from '../utils/errorReporting';

try {
  // Some operation that might fail
} catch (error) {
  recordError(error, 'ProfileScreen.updateProfile', ErrorCategory.DATA, {
    userId: user.id,
    action: 'profile_update'
  });
  
  // Show error to user
  showErrorToast('Failed to update profile');
}
```

## Error Boundaries

We use React Error Boundaries to catch and handle UI errors:

```tsx
// components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { recordError, ErrorCategory } from '../utils/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    recordError(error, 'ErrorBoundary', ErrorCategory.UI, {
      componentStack: errorInfo.componentStack
    });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
```

### Usage Example

```tsx
import ErrorBoundary from '../components/ErrorBoundary';
import ProfileContent from '../components/ProfileContent';
import ErrorFallback from '../components/fallbacks/ErrorFallback';

export default function ProfileScreen() {
  return (
    <ErrorBoundary fallback={<ErrorFallback message="Could not load profile" />}>
      <ProfileContent />
    </ErrorBoundary>
  );
}
```

## Fallback Components

We use fallback components to provide a consistent UI for error states:

```tsx
// components/fallbacks/ErrorFallback.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorFallbackProps {
  message?: string;
  icon?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({ 
  message = 'Something went wrong', 
  icon = 'alert-circle',
  onRetry
}: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={50} color="#FF3B30" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8'
  },
  icon: {
    marginBottom: 20
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
```

## Offline Error Handling

We handle offline scenarios with a dedicated context and components:

```tsx
// contexts/OfflineContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface OfflineContextType {
  isOffline: boolean;
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastOnlineAt: null,
  checkConnection: async () => true
});

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export default function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    
    // Initial check
    NetInfo.fetch().then(handleConnectivityChange);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnectivityChange = (state: NetInfoState) => {
    const offline = !state.isConnected;
    setIsOffline(offline);
    
    if (!offline && isOffline) {
      // We're back online after being offline
      setLastOnlineAt(new Date());
    }
  };

  const checkConnection = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  };

  return (
    <OfflineContext.Provider value={{ isOffline, lastOnlineAt, checkConnection }}>
      {children}
    </OfflineContext.Provider>
  );
}
```

### Offline Notice Component

```tsx
// components/fallbacks/OfflineNotice.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../../contexts/OfflineContext';

export default function OfflineNotice() {
  const { isOffline } = useOffline();
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1000
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
```

## Best Practices

1. **Use Try/Catch for Async Operations**
   ```typescript
   try {
     await someAsyncOperation();
   } catch (error) {
     handleError(error);
   }
   ```

2. **Categorize Errors**
   - Use appropriate error classes for different types of errors
   - Include context information in error objects

3. **Provide User-Friendly Messages**
   - Don't expose technical details to users
   - Offer actionable advice when possible

4. **Use Error Boundaries Strategically**
   - Wrap complex components with error boundaries
   - Provide appropriate fallback UIs

5. **Handle Offline Scenarios**
   - Check network status before operations that require connectivity
   - Queue operations for when connectivity is restored

6. **Log Errors for Debugging**
   - Use the centralized error reporting system
   - Include relevant context and metadata

7. **Test Error Scenarios**
   - Write tests for error cases
   - Simulate network failures and other error conditions

## Testing Error Scenarios

### Unit Testing Error Handling

```typescript
// __tests__/services/AuthService.test.ts

import AuthService from '../../services/AuthService';
import { AuthError } from '../../utils/errors';

describe('AuthService', () => {
  it('should throw AuthError when login fails', async () => {
    // Mock failed login
    jest.spyOn(firebase.auth(), 'signInWithEmailAndPassword').mockRejectedValue({
      code: 'auth/user-not-found'
    });
    
    const authService = new AuthService();
    
    await expect(authService.login('test@example.com', 'password'))
      .rejects
      .toThrow(AuthError);
  });
});
```

### Testing Error Boundaries

```tsx
// __tests__/components/ErrorBoundary.test.tsx

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws an error
const BuggyComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    
    // Check if fallback UI is rendered
    expect(getByText('Something went wrong')).toBeTruthy();
    
    // Test retry button
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);
    
    // After retry, it should show the error again
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
```

## Conclusion

Following these error handling guidelines will ensure a consistent, user-friendly approach to handling errors throughout the BallTalk app. By properly categorizing, reporting, and displaying errors, we can provide a better user experience and make debugging easier. 