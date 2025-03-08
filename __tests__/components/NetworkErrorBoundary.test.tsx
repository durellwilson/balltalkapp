import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import NetworkErrorBoundary from '../../components/common/NetworkErrorBoundary';
import NetworkErrorHandler from '../../services/NetworkErrorHandler';
import { Text } from 'react-native';

// Mock the NetworkErrorHandler
jest.mock('../../services/NetworkErrorHandler', () => {
  const mockInstance = {
    addConnectivityListener: jest.fn(),
    checkConnectivity: jest.fn(),
  };
  
  return {
    getInstance: jest.fn(() => mockInstance),
  };
});

// Mock the Image component for the no-connection image
jest.mock('../../assets/images/no-connection.png', () => 'no-connection-image');

describe('NetworkErrorBoundary', () => {
  let mockNetworkHandler: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock instance
    mockNetworkHandler = NetworkErrorHandler.getInstance();
    
    // Default mock implementations
    mockNetworkHandler.addConnectivityListener.mockImplementation((callback) => {
      // Store the callback for later use in tests
      mockNetworkHandler.latestCallback = callback;
      // Return a mock unsubscribe function
      return jest.fn();
    });
    
    mockNetworkHandler.checkConnectivity.mockResolvedValue(true);
  });
  
  test('renders children when connected', async () => {
    // Mock that we are connected
    mockNetworkHandler.checkConnectivity.mockResolvedValue(true);
    
    const { getByText, queryByTestId } = render(
      <NetworkErrorBoundary>
        <Text>Connected Content</Text>
      </NetworkErrorBoundary>
    );
    
    // Wait for the checkConnectivity promise to resolve
    await act(async () => {});
    
    // Should render children
    expect(getByText('Connected Content')).toBeTruthy();
    
    // Should not render the error UI
    expect(queryByTestId('network-error-boundary')).toBeNull();
  });
  
  test('renders error UI when not connected', async () => {
    // Mock that we are not connected
    mockNetworkHandler.checkConnectivity.mockResolvedValue(false);
    
    const { queryByText, getByTestId, getByText } = render(
      <NetworkErrorBoundary>
        <Text>Connected Content</Text>
      </NetworkErrorBoundary>
    );
    
    // Wait for the checkConnectivity promise to resolve
    await act(async () => {});
    
    // Should not render children
    expect(queryByText('Connected Content')).toBeNull();
    
    // Should render the error UI
    expect(getByTestId('network-error-boundary')).toBeTruthy();
    expect(getByText('No Internet Connection')).toBeTruthy();
    expect(getByText('Please check your internet connection and try again.')).toBeTruthy();
    expect(getByTestId('retry-connection-button')).toBeTruthy();
  });
  
  test('calls onRetry when retry button is pressed and connected', async () => {
    // Mock that we are not connected initially
    mockNetworkHandler.checkConnectivity.mockResolvedValue(false);
    
    const onRetryMock = jest.fn();
    
    const { getByTestId } = render(
      <NetworkErrorBoundary onRetry={onRetryMock}>
        <Text>Connected Content</Text>
      </NetworkErrorBoundary>
    );
    
    // Wait for the checkConnectivity promise to resolve
    await act(async () => {});
    
    // Simulate connectivity being restored
    act(() => {
      mockNetworkHandler.latestCallback(true);
    });
    
    // Press the retry button
    fireEvent.press(getByTestId('retry-connection-button'));
    
    // onRetry should be called
    expect(onRetryMock).toHaveBeenCalled();
  });
  
  test('waits for connectivity when retry button is pressed and not connected', async () => {
    // Mock that we are not connected
    mockNetworkHandler.checkConnectivity.mockResolvedValue(false);
    
    const onRetryMock = jest.fn();
    
    const { getByTestId, getByText } = render(
      <NetworkErrorBoundary onRetry={onRetryMock}>
        <Text>Connected Content</Text>
      </NetworkErrorBoundary>
    );
    
    // Wait for the checkConnectivity promise to resolve
    await act(async () => {});
    
    // Press the retry button
    fireEvent.press(getByTestId('retry-connection-button'));
    
    // Button text should change to waiting state
    expect(getByText('Waiting for Connection...')).toBeTruthy();
    
    // onRetry should not be called yet
    expect(onRetryMock).not.toHaveBeenCalled();
    
    // Simulate connectivity being restored
    act(() => {
      mockNetworkHandler.latestCallback(true);
    });
    
    // Now onRetry should be called
    expect(onRetryMock).toHaveBeenCalled();
  });
  
  test('updates UI when connectivity changes', async () => {
    // Mock that we are connected initially
    mockNetworkHandler.checkConnectivity.mockResolvedValue(true);
    
    const { getByText, queryByText, queryByTestId, getByTestId } = render(
      <NetworkErrorBoundary>
        <Text>Connected Content</Text>
      </NetworkErrorBoundary>
    );
    
    // Wait for the checkConnectivity promise to resolve
    await act(async () => {});
    
    // Should render children initially
    expect(getByText('Connected Content')).toBeTruthy();
    
    // Simulate connectivity being lost
    act(() => {
      mockNetworkHandler.latestCallback(false);
    });
    
    // Should now render the error UI
    expect(queryByText('Connected Content')).toBeNull();
    expect(getByTestId('network-error-boundary')).toBeTruthy();
    
    // Simulate connectivity being restored
    act(() => {
      mockNetworkHandler.latestCallback(true);
    });
    
    // Should render children again
    expect(getByText('Connected Content')).toBeTruthy();
    expect(queryByTestId('network-error-boundary')).toBeNull();
  });
}); 