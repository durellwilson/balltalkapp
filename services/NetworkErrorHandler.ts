import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export enum NetworkErrorType {
  NO_CONNECTION = 'NO_CONNECTION',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  FIREBASE_AUTH_ERROR = 'FIREBASE_AUTH_ERROR',
  FIREBASE_FIRESTORE_ERROR = 'FIREBASE_FIRESTORE_ERROR',
  FIREBASE_STORAGE_ERROR = 'FIREBASE_STORAGE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface NetworkErrorDetails {
  type: NetworkErrorType;
  message: string;
  originalError?: any;
  timestamp: number;
  retryable: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 1.5,
  maxDelayMs: 10000,
};

/**
 * Network error handler service for detecting, categorizing, and handling network errors
 */
class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private isConnected: boolean = true;
  private unsubscribe: (() => void) | null = null;
  private listeners: Array<(isConnected: boolean) => void> = [];

  private constructor() {
    this.startNetworkMonitoring();
  }

  /**
   * Get the singleton instance of NetworkErrorHandler
   */
  public static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  /**
   * Start monitoring network connectivity
   */
  private startNetworkMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange);
  }

  /**
   * Handle network connectivity changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const wasConnected = this.isConnected;
    this.isConnected = !!state.isConnected;

    // Notify listeners only when connectivity status changes
    if (wasConnected !== this.isConnected) {
      this.notifyListeners();
    }
  };

  /**
   * Notify all registered listeners about connectivity changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  /**
   * Add a listener for network connectivity changes
   * @param listener Function to call when connectivity changes
   * @returns Function to remove the listener
   */
  public addConnectivityListener(listener: (isConnected: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.isConnected);
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if the device is currently connected to the internet
   * @returns Promise resolving to boolean indicating connectivity
   */
  public async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return !!netInfo.isConnected;
  }

  /**
   * Categorize an error into a NetworkErrorType
   * @param error The error to categorize
   * @returns NetworkErrorDetails object with categorized error
   */
  public categorizeError(error: any): NetworkErrorDetails {
    // Default error details
    const errorDetails: NetworkErrorDetails = {
      type: NetworkErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      originalError: error,
      timestamp: Date.now(),
      retryable: true,
    };

    // No connection errors
    if (!this.isConnected) {
      errorDetails.type = NetworkErrorType.NO_CONNECTION;
      errorDetails.message = 'No internet connection available';
      errorDetails.retryable = true;
      return errorDetails;
    }

    // Handle different error types
    if (error?.message?.includes('timeout') || error?.code === 'ECONNABORTED') {
      errorDetails.type = NetworkErrorType.TIMEOUT;
      errorDetails.message = 'Request timed out';
      errorDetails.retryable = true;
    } else if (error?.response?.status >= 500) {
      errorDetails.type = NetworkErrorType.SERVER_ERROR;
      errorDetails.message = `Server error: ${error.response.status}`;
      errorDetails.retryable = true;
    } else if (error?.code) {
      // Enhanced Firebase error handling
      if (error.code.startsWith('auth/')) {
        errorDetails.type = NetworkErrorType.FIREBASE_AUTH_ERROR;
        errorDetails.message = error.message || 'Authentication failed';
        errorDetails.retryable = ![
          'auth/user-disabled',
          'auth/invalid-credential',
          'auth/user-not-found',
          'auth/invalid-email'
        ].includes(error.code);
      } else if (error.code.startsWith('firestore/')) {
        errorDetails.type = NetworkErrorType.FIREBASE_FIRESTORE_ERROR;
        errorDetails.message = error.message || 'Database operation failed';
        errorDetails.retryable = ![
          'firestore/permission-denied',
          'firestore/not-found'
        ].includes(error.code);
      } else if (error.code.startsWith('storage/')) {
        errorDetails.type = NetworkErrorType.FIREBASE_STORAGE_ERROR;
        errorDetails.message = error.message || 'Storage operation failed';
        errorDetails.retryable = ![
          'storage/unauthorized',
          'storage/object-not-found'
        ].includes(error.code);
      }
    }

    return errorDetails;
  }

  /**
   * Execute a function with automatic retries on network errors
   * @param fn Function to execute that returns a Promise
   * @param config Retry configuration
   * @returns Promise resolving to the function's result
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;
    
    for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
      try {
        // Check connectivity before attempting
        const isConnected = await this.checkConnectivity();
        if (!isConnected) {
          await this.waitForConnectivity();
        }
        
        // Execute the function
        return await fn();
      } catch (error) {
        lastError = error;
        const errorDetails = this.categorizeError(error);
        
        // Don't retry if the error is not retryable
        if (!errorDetails.retryable) {
          throw error;
        }
        
        // Last attempt, don't delay just throw
        if (attempt === retryConfig.maxRetries - 1) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelayMs
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never happen due to the throw in the loop, but TypeScript needs it
    throw lastError;
  }

  /**
   * Wait for network connectivity to be restored
   * @param timeoutMs Maximum time to wait in milliseconds
   * @returns Promise that resolves when connectivity is restored
   */
  public waitForConnectivity(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this.isConnected) {
        resolve();
        return;
      }
      
      // Set timeout
      const timeout = setTimeout(() => {
        removeListener();
        reject(new Error('Timeout waiting for connectivity'));
      }, timeoutMs);
      
      // Add listener for connectivity changes
      const listener = (isConnected: boolean) => {
        if (isConnected) {
          removeListener();
          clearTimeout(timeout);
          resolve();
        }
      };
      
      // Add listener and store removal function
      const removeListener = this.addConnectivityListener(listener);
    });
  }

  /**
   * Format a user-friendly error message based on NetworkErrorDetails
   * @param errorDetails The error details to format
   * @returns User-friendly error message
   */
  public formatErrorMessage(errorDetails: NetworkErrorDetails): string {
    switch (errorDetails.type) {
      case NetworkErrorType.NO_CONNECTION:
        return 'No internet connection. Please check your network settings and try again.';
      
      case NetworkErrorType.TIMEOUT:
        return 'The request timed out. Please try again later.';
      
      case NetworkErrorType.SERVER_ERROR:
        return 'Our servers are experiencing issues. Please try again later.';
      
      case NetworkErrorType.FIREBASE_AUTH_ERROR:
        return 'Authentication failed. Please check your credentials and try again.';
      
      case NetworkErrorType.FIREBASE_FIRESTORE_ERROR:
        return 'Database operation failed. Please try again later.';
      
      case NetworkErrorType.FIREBASE_STORAGE_ERROR:
        return 'Storage operation failed. Please try again later.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

export default NetworkErrorHandler; 