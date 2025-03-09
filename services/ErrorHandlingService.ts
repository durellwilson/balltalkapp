/**
 * ErrorHandlingService
 * 
 * A centralized service for error handling, logging, retry strategies,
 * and recovery mechanisms across the application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  FIREBASE = 'firebase',
  AUDIO_PROCESSING = 'audio_processing',
  FILE_SYSTEM = 'file_system',
  PERMISSIONS = 'permissions',
  UNKNOWN = 'unknown',
  MEDIA = 'media',
}

// Error levels
export enum ErrorLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Error context
export interface ErrorContext {
  component?: string;
  function?: string;
  userId?: string;
  additionalData?: Record<string, any>;
  feature?: string;
}

// Error log entry
export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  type: ErrorType;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context?: ErrorContext;
  handled: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
}

// Retry options
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  exponential?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

// Default retry options
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  exponential: true,
};

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: ErrorLogEntry[] = [];
  private errorListeners: ((error: ErrorLogEntry) => void)[] = [];
  private maxLogEntries = 1000;
  private logsDirectory = `${FileSystem.cacheDirectory}/error_logs`;
  private currentLogFile = '';
  
  // Private constructor for singleton pattern
  private constructor() {
    this.initializeErrorLog();
  }
  
  // Get singleton instance
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }
  
  // Initialize error log from storage
  private async initializeErrorLog(): Promise<void> {
    try {
      // Create logs directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.logsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.logsDirectory, { intermediates: true });
      }
      
      // Create new log file for this session
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.currentLogFile = `${this.logsDirectory}/error_log_${timestamp}.json`;
      
      // Try to load cached logs from AsyncStorage
      const cachedLogData = await AsyncStorage.getItem('error_log_cache');
      if (cachedLogData) {
        this.errorLog = JSON.parse(cachedLogData);
        
        // Trim log if it's too large
        if (this.errorLog.length > this.maxLogEntries) {
          this.errorLog = this.errorLog.slice(-this.maxLogEntries);
        }
        
        // Save to file system
        await this.persistErrorLog();
      }
      
      console.log('Error log initialized');
    } catch (error) {
      console.error('Failed to initialize error log:', error);
    }
  }
  
  // Persist error log to storage
  private async persistErrorLog(): Promise<void> {
    try {
      // Cache recent logs to AsyncStorage for quick access
      const recentLogs = this.errorLog.slice(-100);
      await AsyncStorage.setItem('error_log_cache', JSON.stringify(recentLogs));
      
      // Save full log to file
      if (this.currentLogFile) {
        await FileSystem.writeAsStringAsync(
          this.currentLogFile,
          JSON.stringify(this.errorLog),
          { encoding: FileSystem.EncodingType.UTF8 }
        );
      }
    } catch (error) {
      console.error('Failed to persist error log:', error);
    }
  }
  
  /**
   * Log an error
   * @param error - The error to log
   * @param type - The type of error
   * @param level - The severity level
   * @param context - Additional context about the error
   * @returns The error log entry
   */
  public logError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    level: ErrorLevel = ErrorLevel.ERROR,
    context?: ErrorContext
  ): ErrorLogEntry {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    const entry: ErrorLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      level,
      message: errorMessage,
      stack: errorStack,
      context,
      handled: false,
      recoveryAttempted: false,
    };
    
    // Add to log
    this.errorLog.push(entry);
    
    // Trim log if it's too large
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.shift();
    }
    
    // Notify listeners
    this.notifyErrorListeners(entry);
    
    // Persist log
    this.persistErrorLog().catch(console.error);
    
    // Also log to console for development
    if (level === ErrorLevel.FATAL) {
      console.error(`[FATAL] ${type}:`, errorMessage, context);
    } else if (level === ErrorLevel.ERROR) {
      console.error(`[ERROR] ${type}:`, errorMessage, context);
    } else if (level === ErrorLevel.WARNING) {
      console.warn(`[WARN] ${type}:`, errorMessage, context);
    } else {
      console.info(`[INFO] ${type}:`, errorMessage, context);
    }
    
    return entry;
  }
  
  /**
   * Mark an error as handled
   * @param errorId - The ID of the error to mark as handled
   * @param recoveryAttempted - Whether recovery was attempted
   * @param recoverySuccessful - Whether recovery was successful
   */
  public markErrorHandled(
    errorId: string, 
    recoveryAttempted: boolean = false, 
    recoverySuccessful?: boolean
  ): void {
    const errorIndex = this.errorLog.findIndex(entry => entry.id === errorId);
    if (errorIndex !== -1) {
      this.errorLog[errorIndex] = {
        ...this.errorLog[errorIndex],
        handled: true,
        recoveryAttempted,
        recoverySuccessful,
      };
      
      this.persistErrorLog().catch(console.error);
    }
  }
  
  /**
   * Get recent error logs
   * @param count - Number of recent logs to retrieve
   * @param type - Optional filter by error type
   * @param level - Optional filter by error level
   * @returns Array of error log entries
   */
  public getRecentLogs(
    count: number = 50,
    type?: ErrorType,
    level?: ErrorLevel
  ): ErrorLogEntry[] {
    let filtered = this.errorLog;
    
    if (type) {
      filtered = filtered.filter(entry => entry.type === type);
    }
    
    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }
    
    return filtered.slice(-count).reverse();
  }
  
  /**
   * Subscribe to error notifications
   * @param listener - Function to call when an error occurs
   * @returns Unsubscribe function
   */
  public subscribeToErrors(listener: (error: ErrorLogEntry) => void): () => void {
    this.errorListeners.push(listener);
    
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all error listeners
   * @param error - The error log entry
   */
  private notifyErrorListeners(error: ErrorLogEntry): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    }
  }
  
  /**
   * Clear all error logs
   */
  public async clearErrorLogs(): Promise<void> {
    this.errorLog = [];
    await AsyncStorage.removeItem('error_log_cache');
    
    if (this.currentLogFile) {
      try {
        await FileSystem.deleteAsync(this.currentLogFile);
      } catch (error) {
        console.error('Failed to delete error log file:', error);
      }
    }
  }
  
  /**
   * Execute a function with retry logic
   * @param fn - The function to execute
   * @param options - Retry options
   * @returns The result of the function
   */
  public async withRetry<T>(
    fn: () => Promise<T>, 
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const retryOptions: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < retryOptions.maxAttempts) {
      try {
        if (attempt > 0) {
          // Calculate delay with exponential backoff if enabled
          const delay = retryOptions.exponential
            ? retryOptions.delayMs * Math.pow(2, attempt - 1)
            : retryOptions.delayMs;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Notify about retry
          retryOptions.onRetry?.(attempt, lastError!);
        }
        
        // Execute the function
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log retry attempt
        this.logError(
          `Retry attempt ${attempt + 1}/${retryOptions.maxAttempts} failed: ${lastError.message}`,
          ErrorType.UNKNOWN,
          ErrorLevel.INFO,
          { function: 'withRetry', additionalData: { attempt, maxAttempts: retryOptions.maxAttempts } }
        );
        
        attempt++;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('All retry attempts failed');
  }
  
  /**
   * Handle network errors with standardized recovery
   * @param error - The network error
   * @param context - Error context
   * @returns Error log entry
   */
  public handleNetworkError(error: Error, context?: ErrorContext): ErrorLogEntry {
    const entry = this.logError(error, ErrorType.NETWORK, ErrorLevel.ERROR, context);
    
    // Add network-specific error handling here
    // For example, check for offline status and show appropriate UI
    
    this.markErrorHandled(entry.id, true, false);
    return entry;
  }
  
  /**
   * Handle authentication errors with standardized recovery
   * @param error - The authentication error
   * @param context - Error context
   * @returns Error log entry
   */
  public handleAuthError(error: Error, context?: ErrorContext): ErrorLogEntry {
    const entry = this.logError(error, ErrorType.AUTHENTICATION, ErrorLevel.ERROR, context);
    
    // Add auth-specific error handling here
    // For example, redirect to login screen
    
    this.markErrorHandled(entry.id, true, false);
    return entry;
  }
  
  /**
   * Handle Firebase errors with standardized recovery
   * @param error - The Firebase error
   * @param context - Error context
   * @returns Error log entry
   */
  public handleFirebaseError(error: Error, context?: ErrorContext): ErrorLogEntry {
    const entry = this.logError(error, ErrorType.FIREBASE, ErrorLevel.ERROR, context);
    
    // Add Firebase-specific error handling here
    
    this.markErrorHandled(entry.id, true, false);
    return entry;
  }
  
  /**
   * Handle audio recording errors with standardized recovery
   * @param error - The recording error
   * @param context - Error context
   * @returns Error log entry
   */
  public handleRecordingError(error: Error, context?: ErrorContext): ErrorLogEntry {
    const entry = this.logError(
      error, 
      ErrorType.MEDIA, 
      ErrorLevel.ERROR, 
      {
        ...context,
        feature: 'audio_recording',
      }
    );
    
    // Add recording-specific recovery suggestions
    const recoveryStrategy = this.determineRecordingRecoveryStrategy(error, context);
    
    this.markErrorHandled(entry.id, recoveryStrategy.attempted, recoveryStrategy.successful);
    
    // Return error for further handling if needed
    return entry;
  }
  
  /**
   * Handle audio processing errors with standardized recovery
   * @param error - The processing error
   * @param context - Error context
   * @returns Error log entry
   */
  public handleAudioProcessingError(error: Error, context?: ErrorContext): ErrorLogEntry {
    const entry = this.logError(
      error, 
      ErrorType.MEDIA, 
      ErrorLevel.ERROR, 
      {
        ...context,
        feature: 'audio_processing',
      }
    );
    
    // Add processing-specific recovery suggestions
    const recoveryStrategy = this.determineAudioProcessingRecoveryStrategy(error, context);
    
    this.markErrorHandled(entry.id, recoveryStrategy.attempted, recoveryStrategy.successful);
    
    // Return error for further handling if needed
    return entry;
  }
  
  /**
   * Determine recovery strategy for recording errors
   * @private
   */
  private determineRecordingRecoveryStrategy(error: Error, context?: ErrorContext): { 
    attempted: boolean; 
    successful: boolean;
    message: string;
  } {
    // Check error type
    if (error.message.includes('Permission')) {
      return {
        attempted: true,
        successful: false,
        message: 'Microphone permission denied. Please grant permission in device settings.'
      };
    } else if (error.message.includes('Interrupted') || error.message.includes('interrupt')) {
      return {
        attempted: true,
        successful: true,
        message: 'Recording was interrupted. Try again after closing other apps using audio.'
      };
    } else if (error.message.includes('Output format') || error.message.includes('encoding')) {
      return {
        attempted: true,
        successful: false,
        message: 'Audio format issue. Try using a different recording quality setting.'
      };
    } else if (error.message.includes('memory') || error.message.includes('storage')) {
      return {
        attempted: true,
        successful: false,
        message: 'Not enough storage space. Free up space and try again.'
      };
    } else {
      return {
        attempted: false,
        successful: false,
        message: 'Unknown recording error. Please restart the app and try again.'
      };
    }
  }
  
  /**
   * Determine recovery strategy for audio processing errors
   * @private
   */
  private determineAudioProcessingRecoveryStrategy(error: Error, context?: ErrorContext): { 
    attempted: boolean; 
    successful: boolean;
    message: string;
  } {
    // Check error type
    if (error.message.includes('decode') || error.message.includes('corrupt')) {
      return {
        attempted: true,
        successful: false,
        message: 'Audio file is corrupted. Try recording again.'
      };
    } else if (error.message.includes('network') || error.message.includes('connect')) {
      return {
        attempted: true,
        successful: false,
        message: 'Network connection issue. Processing will be retried when online.'
      };
    } else if (error.message.includes('timeout')) {
      return {
        attempted: true,
        successful: false,
        message: 'Processing timed out. Try a shorter recording or retry later.'
      };
    } else {
      return {
        attempted: false,
        successful: false,
        message: 'Unknown processing error. Please try again with different settings.'
      };
    }
  }
  
  /**
   * Get user-friendly error message for audio recording and processing
   * @param error - The error log entry
   * @returns User-friendly error message
   */
  public getAudioErrorMessage(errorId: string): string {
    const error = this.errorLog.find(entry => entry.id === errorId);
    
    if (!error) {
      return 'An unknown error occurred.';
    }
    
    if (error.context?.feature === 'audio_recording') {
      const recovery = this.determineRecordingRecoveryStrategy(new Error(error.message), error.context);
      return recovery.message;
    } else if (error.context?.feature === 'audio_processing') {
      const recovery = this.determineAudioProcessingRecoveryStrategy(new Error(error.message), error.context);
      return recovery.message;
    }
    
    return 'An error occurred during audio handling. Please try again.';
  }
  
  /**
   * Check if a feature should be degraded based on error history
   * @param feature - The feature name
   * @param threshold - Error count threshold before degrading
   * @param timeWindowMs - Time window to consider errors in milliseconds
   * @returns Whether the feature should be degraded
   */
  public shouldDegradeFeature(
    feature: string, 
    threshold: number = 3, 
    timeWindowMs: number = 60 * 60 * 1000 // 1 hour
  ): boolean {
    const now = Date.now();
    const cutoff = now - timeWindowMs;
    
    // Count recent errors for this feature
    const recentErrors = this.errorLog.filter(entry => 
      entry.timestamp >= cutoff && 
      entry.context?.additionalData?.feature === feature
    );
    
    return recentErrors.length >= threshold;
  }
  
  /**
   * Generate a diagnostic report for troubleshooting
   * @returns Diagnostic report as a string
   */
  public async generateDiagnosticReport(): Promise<string> {
    try {
      const recentErrors = this.getRecentLogs(10);
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        isConnected: true, // You would use NetInfo here to check actual connection status
      };
      
      const report = {
        timestamp: new Date().toISOString(),
        device: deviceInfo,
        recentErrors,
        // Add other relevant diagnostic information here
      };
      
      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('Failed to generate diagnostic report:', error);
      return JSON.stringify({ error: 'Failed to generate diagnostic report' });
    }
  }
}

// Export a singleton instance
export default ErrorHandlingService.getInstance(); 