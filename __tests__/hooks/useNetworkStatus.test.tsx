import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import NetworkErrorHandler from '../../services/NetworkErrorHandler';

// Mock the NetworkErrorHandler
jest.mock('../../services/NetworkErrorHandler', () => {
  const mockInstance = {
    addConnectivityListener: jest.fn(),
    checkConnectivity: jest.fn(),
    executeWithRetry: jest.fn(),
    categorizeError: jest.fn(),
    formatErrorMessage: jest.fn(),
  };
  
  return {
    getInstance: jest.fn(() => mockInstance),
  };
});

describe('useNetworkStatus', () => {
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
    mockNetworkHandler.executeWithRetry.mockImplementation((fn) => fn());
    mockNetworkHandler.categorizeError.mockReturnValue({
      type: 'UNKNOWN',
      message: 'Test error',
      timestamp: Date.now(),
      retryable: true,
    });
    mockNetworkHandler.formatErrorMessage.mockReturnValue('Formatted error message');
  });
  
  test('returns initial connected state', async () => {
    mockNetworkHandler.checkConnectivity.mockResolvedValue(true);
    
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Initial state should be connected (default)
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isCheckingConnection).toBe(true);
    
    // Wait for the checkConnectivity promise to resolve
    await waitForNextUpdate();
    
    // After checking, should still be connected and not checking
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isCheckingConnection).toBe(false);
  });
  
  test('returns disconnected state when not connected', async () => {
    mockNetworkHandler.checkConnectivity.mockResolvedValue(false);
    
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Initial state should be connected (default)
    expect(result.current.isConnected).toBe(true);
    
    // Wait for the checkConnectivity promise to resolve
    await waitForNextUpdate();
    
    // After checking, should be disconnected
    expect(result.current.isConnected).toBe(false);
  });
  
  test('updates state when connectivity changes', async () => {
    mockNetworkHandler.checkConnectivity.mockResolvedValue(true);
    
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the checkConnectivity promise to resolve
    await waitForNextUpdate();
    
    // Initially connected
    expect(result.current.isConnected).toBe(true);
    
    // Simulate connectivity change
    act(() => {
      mockNetworkHandler.latestCallback(false);
    });
    
    // Should now be disconnected
    expect(result.current.isConnected).toBe(false);
    
    // Simulate connectivity restored
    act(() => {
      mockNetworkHandler.latestCallback(true);
    });
    
    // Should be connected again
    expect(result.current.isConnected).toBe(true);
  });
  
  test('checkConnection updates connection state', async () => {
    mockNetworkHandler.checkConnectivity.mockResolvedValueOnce(true);
    
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the initial checkConnectivity promise to resolve
    await waitForNextUpdate();
    
    // Now mock a disconnected state for the next check
    mockNetworkHandler.checkConnectivity.mockResolvedValueOnce(false);
    
    // Call checkConnection
    let checkResult: boolean | undefined;
    act(() => {
      result.current.checkConnection().then((res) => {
        checkResult = res;
      });
    });
    
    // Should be checking connection
    expect(result.current.isCheckingConnection).toBe(true);
    
    // Wait for the checkConnection promise to resolve
    await waitForNextUpdate();
    
    // Should now be disconnected and not checking
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isCheckingConnection).toBe(false);
    expect(checkResult).toBe(false);
  });
  
  test('executeWithRetry calls NetworkErrorHandler.executeWithRetry', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    mockNetworkHandler.executeWithRetry.mockResolvedValue('result');
    
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());
    
    // Wait for the initial checkConnectivity promise to resolve
    await waitForNextUpdate();
    
    // Call executeWithRetry
    let executeResult: any;
    await act(async () => {
      executeResult = await result.current.executeWithRetry(mockFn);
    });
    
    // Should call NetworkErrorHandler.executeWithRetry with the function
    expect(mockNetworkHandler.executeWithRetry).toHaveBeenCalledWith(mockFn);
    expect(executeResult).toBe('result');
  });
  
  test('formatErrorMessage calls NetworkErrorHandler methods', () => {
    const mockError = new Error('Test error');
    
    const { result } = renderHook(() => useNetworkStatus());
    
    // Call formatErrorMessage
    const message = result.current.formatErrorMessage(mockError);
    
    // Should call NetworkErrorHandler.categorizeError with the error
    expect(mockNetworkHandler.categorizeError).toHaveBeenCalledWith(mockError);
    
    // Should call NetworkErrorHandler.formatErrorMessage with the categorized error
    expect(mockNetworkHandler.formatErrorMessage).toHaveBeenCalled();
    
    // Should return the formatted message
    expect(message).toBe('Formatted error message');
  });
}); 