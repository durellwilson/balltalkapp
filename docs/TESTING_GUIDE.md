# BallTalk App Testing Guide

## Overview

This document provides guidelines for testing the BallTalk app, including unit testing, integration testing, and end-to-end testing strategies.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **Mock Service Worker**: API mocking
- **Detox**: End-to-end testing (future implementation)

## Types of Tests

### Unit Tests

Unit tests verify individual functions, hooks, and components in isolation. They are fast, reliable, and provide quick feedback during development.

#### When to Write Unit Tests

- For utility functions
- For custom hooks
- For pure UI components
- For business logic functions

#### Example Unit Test

```typescript
// Testing a utility function
import { formatDuration } from '../../utils/formatters';

describe('formatDuration', () => {
  test('formats milliseconds to MM:SS format', () => {
    expect(formatDuration(61000)).toBe('01:01');
    expect(formatDuration(3661000)).toBe('61:01');
    expect(formatDuration(0)).toBe('00:00');
  });
});
```

### Component Tests

Component tests verify that UI components render correctly and respond appropriately to user interactions.

#### When to Write Component Tests

- For reusable UI components
- For screen components with complex UI logic
- For components with user interactions

#### Example Component Test

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AudioPlayButton from '../../components/audio/AudioPlayButton';

describe('AudioPlayButton', () => {
  test('renders play icon when not playing', () => {
    const { getByTestId } = render(
      <AudioPlayButton isPlaying={false} onPress={() => {}} />
    );
    
    expect(getByTestId('play-icon')).toBeTruthy();
  });
  
  test('renders pause icon when playing', () => {
    const { getByTestId } = render(
      <AudioPlayButton isPlaying={true} onPress={() => {}} />
    );
    
    expect(getByTestId('pause-icon')).toBeTruthy();
  });
  
  test('calls onPress when button is pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <AudioPlayButton isPlaying={false} onPress={onPressMock} />
    );
    
    fireEvent.press(getByTestId('audio-play-button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Integration tests verify that multiple parts of the system work together correctly.

#### When to Write Integration Tests

- For critical user flows
- For data fetching components
- For components that interact with Firebase services
- For form submissions and validation

#### Example Integration Test

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AudioUploadForm from '../../components/audio/AudioUploadForm';
import { AuthProvider } from '../../contexts/auth';
import { mockAuth, mockStorage } from '../mocks/firebase-mocks';

// Mock the navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('AudioUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('uploads a file and displays success message', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <AudioUploadForm audioUri="file://test.mp3" duration={60000} />
      </AuthProvider>
    );
    
    // Fill out the form
    fireEvent.changeText(getByTestId('title-input'), 'Test Song');
    fireEvent.changeText(getByTestId('description-input'), 'Test Description');
    
    // Press the upload button
    fireEvent.press(getByTestId('upload-button'));
    
    // Wait for success message
    await waitFor(() => {
      expect(getByText('Upload successful!')).toBeTruthy();
      expect(mockStorage.ref).toHaveBeenCalled();
    });
  });
});
```

## Mocking Dependencies

The BallTalk app uses several external dependencies that need to be mocked for effective testing:

### Firebase Mocks

Firebase services are mocked in `__tests__/mocks/firebase-mocks.js`. Use these mocks for testing components that interact with Firebase.

### Expo Mocks

Expo components and APIs are mocked in `__tests__/mocks/expo-mocks.js`. These mocks are essential for testing components that use Expo functionality.

### Navigation Mocks

React Navigation is mocked in `__tests__/mocks/navigation-mocks.js`. Use these mocks for testing components that use navigation.

## Test Setup

Tests are configured in `jest.setup.js`. This file loads all necessary mocks and configures the test environment.

## Testing UI Components

When testing UI components, follow these guidelines:

1. **Add testID attributes**: Always add `testID` props to components that need to be tested.

2. **Test rendering**: Verify that components render correctly with different props.

3. **Test interactions**: Verify that components respond correctly to user interactions.

4. **Test error states**: Verify that components handle errors gracefully.

5. **Use snapshot tests sparingly**: Use snapshot tests only for stable components with minimal changes.

## Error Boundary Testing

The app includes an ErrorBoundary component for graceful error handling. When testing components that might throw errors:

1. Use the ErrorBoundary component in tests.
2. Verify that errors are caught and handled correctly.
3. Test that retry functionality works as expected.

## Running Tests

Run all tests:
```bash
npm run test:unit
```

Run a specific test file:
```bash
npm run test:unit -- path/to/test/file.test.tsx
```

Run tests with a specific pattern:
```bash
npm run test:unit -- -t "pattern"
```

## Code Coverage

To generate a code coverage report:
```bash
npm run test:unit -- --coverage
```

The report will be available in the `coverage` directory.

## Continuous Integration

Tests are automatically run on CI for all pull requests. Ensure all tests pass before merging.

## Best Practices

1. **Keep tests fast**: Tests should be fast and focused.
2. **Test behaviors, not implementation**: Focus on what the component does, not how it does it.
3. **Avoid implementation details**: Don't test implementation details that might change.
4. **Isolate tests**: Each test should be independent of others.
5. **Mock network requests**: Always mock network requests to avoid flaky tests.
6. **Write deterministic tests**: Tests should give the same result every time.
7. **Test error scenarios**: Always test how components behave when errors occur.
8. **Use real data structures**: Use realistic data structures for testing.
9. **Test accessibility**: Verify that components are accessible.
10. **Keep tests maintainable**: Refactor tests when the codebase changes. 