import { useState, useEffect, useCallback } from 'react';
import NetworkErrorHandler from '../services/NetworkErrorHandler';

interface UseNetworkStatusResult {
  isConnected: boolean;
  isCheckingConnection: boolean;
  checkConnection: () => Promise<boolean>;
  executeWithRetry: <T>(fn: () => Promise<T>) => Promise<T>;
  formatErrorMessage: (error: any) => string;
}

/**
 * Hook for components to access network status and handle network errors
 * 
 * @returns Object with network status and utility functions
 * 
 * @example
 * const { isConnected, executeWithRetry } = useNetworkStatus();
 * 
 * // Use in a component
 * if (!isConnected) {
 *   return <Text>No internet connection</Text>;
 * }
 * 
 * // Use with async function
 * const handleSubmit = async () => {
 *   try {
 *     await executeWithRetry(() => uploadData(formData));
 *     // Success
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const [isConnected, setIsConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  useEffect(() => {
    const networkHandler = NetworkErrorHandler.getInstance();
    
    // Check initial connection status
    setIsCheckingConnection(true);
    networkHandler.checkConnectivity()
      .then(setIsConnected)
      .finally(() => setIsCheckingConnection(false));
    
    // Subscribe to network status changes
    const unsubscribe = networkHandler.addConnectivityListener(setIsConnected);
    
    // Clean up subscription
    return unsubscribe;
  }, []);
  
  /**
   * Check the current network connection status
   * @returns Promise resolving to boolean indicating if connected
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    try {
      const networkHandler = NetworkErrorHandler.getInstance();
      const connected = await networkHandler.checkConnectivity();
      setIsConnected(connected);
      return connected;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);
  
  /**
   * Execute a function with automatic retries on network errors
   * @param fn Function to execute
   * @returns Promise resolving to the function result
   */
  const executeWithRetry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const networkHandler = NetworkErrorHandler.getInstance();
    return networkHandler.executeWithRetry(fn);
  }, []);
  
  /**
   * Format an error into a user-friendly message
   * @param error The error to format
   * @returns User-friendly error message
   */
  const formatErrorMessage = useCallback((error: any): string => {
    const networkHandler = NetworkErrorHandler.getInstance();
    const errorDetails = networkHandler.categorizeError(error);
    return networkHandler.formatErrorMessage(errorDetails);
  }, []);
  
  return {
    isConnected,
    isCheckingConnection,
    checkConnection,
    executeWithRetry,
    formatErrorMessage,
  };
}

export default useNetworkStatus; 