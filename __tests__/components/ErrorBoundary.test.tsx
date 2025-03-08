import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { Text } from 'react-native';

// Mock expo-updates
jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn().mockResolvedValue(undefined),
}));

// Component that throws an error
const ErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text testID="normal-component">No error</Text>;
};

// Silence console.error during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <Text testID="test-child">Test Child</Text>
      </ErrorBoundary>
    );

    expect(getByTestId('test-child')).toBeTruthy();
  });

  test('renders fallback UI when an error occurs', () => {
    // Suppress React's error boundary warning in test
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    // ErrorBoundary should show fallback UI
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    // The error message should be displayed
    expect(getByTestId('error-boundary-fallback')).toHaveTextContent('Test error');
    // The original component should not be rendered
    expect(queryByTestId('normal-component')).toBeNull();

    spy.mockRestore();
  });

  test('renders custom fallback when provided', () => {
    // Suppress React's error boundary warning in test
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    const CustomFallback = () => <Text testID="custom-fallback">Custom Error UI</Text>;

    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    // Custom fallback should be rendered
    expect(getByTestId('custom-fallback')).toBeTruthy();
    // Default fallback should not be rendered
    expect(queryByTestId('error-boundary-fallback')).toBeNull();

    spy.mockRestore();
  });

  test('calls onError callback when an error occurs', () => {
    // Suppress React's error boundary warning in test
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    const handleError = jest.fn();

    render(
      <ErrorBoundary onError={handleError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    // onError should be called with the error
    expect(handleError).toHaveBeenCalled();
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(handleError.mock.calls[0][0].message).toBe('Test error');

    spy.mockRestore();
  });

  test('resets error state when retry button is pressed', () => {
    // Suppress React's error boundary warning in test
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    // Use a component that can toggle whether it throws an error
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      // After first render, stop throwing errors
      React.useEffect(() => {
        setShouldThrow(false);
      }, []);
      
      if (shouldThrow) {
        throw new Error('Initial error');
      }
      
      return <Text testID="fixed-component">Component fixed</Text>;
    };

    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // ErrorBoundary should show fallback UI first
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    
    // Press retry button
    fireEvent.press(getByTestId('retry-button'));
    
    // Now the fixed component should be rendered
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
    expect(getByTestId('fixed-component')).toBeTruthy();

    spy.mockRestore();
  });
}); 