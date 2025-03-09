# BallTalk Error Handling System

This document provides an overview of the error handling system implemented in the BallTalk app.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Introduction

The BallTalk error handling system is designed to provide a consistent, user-friendly approach to handling errors throughout the application. It includes:

- Standardized error classes
- Centralized error reporting
- User-friendly error messages
- Offline error handling
- Error boundaries for UI components
- Fallback UI components

## Architecture

The error handling system consists of several layers:

1. **Error Classes**: Custom error classes for different types of errors (`utils/errors.ts`)
2. **Error Reporting**: Centralized error reporting service (`utils/errorReporting.ts`)
3. **Error Messages**: Standardized error messages (`constants/errorMessages.ts`)
4. **Error Boundaries**: React error boundaries to catch UI errors (`components/ErrorBoundary.tsx`)
5. **Fallback Components**: UI components for error states (`components/fallbacks/`)
6. **Offline Support**: Handling offline scenarios (`contexts/OfflineContext.tsx`)

## Components

### Error Classes

```typescript
// utils/errors.ts
import { AppError, NetworkError, AuthError } from '../utils/errors';

// Create a network error
throw new NetworkError(
  'CONNECTION_FAILED',
  'Unable to connect to the server',
  originalError,
  'AuthService.login'
);
```

### Error Reporting

```typescript
// utils/errorReporting.ts
import { recordError, ErrorCategory } from '../utils/errorReporting';

try {
  // Some operation that might fail
} catch (error) {
  recordError(error, 'ComponentName.methodName', ErrorCategory.NETWORK);
}
```

### Error Messages

```typescript
// constants/errorMessages.ts
import { ERROR_MESSAGES, getErrorMessage } from '../constants/errorMessages';

// Get a message directly
const message = ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;

// Get a message based on error code and context
const message = getErrorMessage('auth/user-not-found', 'login');
```

### Error Boundaries

```tsx
// components/ErrorBoundary.tsx
import ErrorBoundary from '../components/ErrorBoundary';

// Wrap components with error boundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Fallback Components

```tsx
// components/fallbacks/EmptyState.tsx
import EmptyState from '../components/fallbacks/EmptyState';

// Show empty state
<EmptyState
  icon="cloud-offline"
  title="No connection"
  message="Please check your internet connection and try again"
  actionLabel="Retry"
  onAction={handleRetry}
/>
```

### Offline Support

```tsx
// contexts/OfflineContext.tsx
import { useOffline } from '../contexts/OfflineContext';

const { isOffline, checkConnection } = useOffline();

// Check if offline
if (isOffline) {
  return <OfflineNotice />;
}
```

## Usage Examples

### Handling API Calls

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const data = await api.getData();
    setData(data);
  } catch (error) {
    // Record the error
    recordError(error, 'Component.fetchData', ErrorCategory.NETWORK);
    
    // Set user-friendly error message
    setError(getErrorMessage(error.code, 'data'));
  } finally {
    setLoading(false);
  }
};
```

### Using withRetry HOC

```tsx
import { withRetry } from '../components/hoc/withRetry';

const ProfileWithRetry = withRetry(Profile);

// In your component
return (
  <ProfileWithRetry
    load={() => fetchUserProfile(userId)}
    renderContent={(data) => <Profile data={data} />}
    errorMessage="Couldn't load profile"
    loadingMessage="Loading profile..."
  />
);
```

### Handling Offline Scenarios

```tsx
import { useOffline } from '../contexts/OfflineContext';

const { isOffline, saveForOffline } = useOffline();

const handleSubmit = async (data) => {
  if (isOffline) {
    // Save for later when online
    await saveForOffline('form-submissions', data);
    showNotification('Your form will be submitted when you're back online');
    return;
  }
  
  // Normal online flow
  try {
    await api.submitForm(data);
    showSuccess('Form submitted successfully');
  } catch (error) {
    handleError(error);
  }
};
```

## Best Practices

1. **Always use try/catch for async operations**
   ```typescript
   try {
     await someAsyncOperation();
   } catch (error) {
     handleError(error);
   }
   ```

2. **Use appropriate error classes**
   ```typescript
   if (error.code === 'auth/user-not-found') {
     throw new AuthError('USER_NOT_FOUND', 'User not found', error);
   }
   ```

3. **Provide context in error reporting**
   ```typescript
   recordError(error, 'AuthService.login', ErrorCategory.AUTH);
   ```

4. **Use user-friendly error messages**
   ```typescript
   setErrorMessage(getErrorMessage(error.code, 'login'));
   ```

5. **Handle offline scenarios gracefully**
   ```typescript
   if (isOffline) {
     queueOperationForLater();
     return;
   }
   ```

6. **Use error boundaries for UI components**
   ```tsx
   <ErrorBoundary>
     <ComplexComponent />
   </ErrorBoundary>
   ```

7. **Test error scenarios**
   ```typescript
   test('handles network errors', async () => {
     // Mock a network error
     api.getData.mockRejectedValueOnce(new NetworkError('CONNECTION_FAILED', 'Connection failed'));
     
     // Call the function
     await expect(fetchData()).rejects.toThrow();
     
     // Verify error handling
     expect(recordError).toHaveBeenCalled();
   });
   ```

## Troubleshooting

### Common Issues

1. **Errors not being caught**
   - Ensure you're using try/catch blocks for async operations
   - Check that error boundaries are properly placed

2. **Incorrect error messages**
   - Verify that error codes are being correctly mapped to messages
   - Check that context is being provided when getting error messages

3. **Error reporting not working**
   - Ensure the error reporting service is properly initialized
   - Check that errors are being properly formatted

4. **Offline handling not working**
   - Verify that the OfflineProvider is properly set up
   - Check that network state is being correctly detected

### Debugging

1. **Enable verbose error logging**
   ```typescript
   // In development
   if (__DEV__) {
     console.error('[DEBUG] Full error:', error);
   }
   ```

2. **Check error reports**
   - Review error reports in your monitoring system
   - Look for patterns in errors

3. **Test offline scenarios**
   - Use browser dev tools to simulate offline mode
   - Test with airplane mode on devices

## Conclusion

By following these guidelines and using the provided components, you can ensure consistent, user-friendly error handling throughout the BallTalk app. This improves both the user experience and the maintainability of the codebase. 