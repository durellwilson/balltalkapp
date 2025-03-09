import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error types for categorization
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  FIREBASE = 'FIREBASE',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  UI = 'UI',
  AUDIO = 'AUDIO',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

// Standard error structure
export interface AppError {
  id: string;
  category: ErrorCategory;
  message: string;
  originalError?: any;
  code?: string;
  context?: string;
  timestamp: string;
  deviceInfo?: {
    platform: string;
    version: string;
    isEmulator?: boolean;
  };
  userData?: {
    userId?: string;
    userRole?: string;
    isAnonymous?: boolean;
  };
}

// Generate a unique error ID
const generateErrorId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Get basic device info
const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version.toString(),
    // Add more device info as needed
  };
};

// Store errors locally for offline reporting
const storeErrorLocally = async (error: AppError): Promise<void> => {
  try {
    // Get existing errors
    const storedErrorsJson = await AsyncStorage.getItem('offline_errors');
    const storedErrors: AppError[] = storedErrorsJson ? JSON.parse(storedErrorsJson) : [];
    
    // Add new error and limit to 50 most recent
    storedErrors.push(error);
    if (storedErrors.length > 50) {
      storedErrors.shift(); // Remove oldest error
    }
    
    // Save back to storage
    await AsyncStorage.setItem('offline_errors', JSON.stringify(storedErrors));
  } catch (storageError) {
    console.error('Failed to store error locally:', storageError);
  }
};

// Main error recording function
export const recordError = async (
  error: any, 
  context = 'app', 
  category = ErrorCategory.UNKNOWN,
  userData?: AppError['userData']
): Promise<AppError> => {
  // Create structured error object
  const appError: AppError = {
    id: generateErrorId(),
    category,
    message: error?.message || 'An unknown error occurred',
    originalError: error,
    code: error?.code,
    context,
    timestamp: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    userData,
  };
  
  // Log to console in development
  if (__DEV__) {
    console.error(`[${appError.category}][${context}] ${appError.message}`, error);
  }
  
  // Store locally for potential offline reporting
  await storeErrorLocally(appError);
  
  // In production, send to Crashlytics if available
  if (!__DEV__) {
    try {
      // This is a placeholder - we'll implement actual Crashlytics integration later
      // crashlytics().recordError(error);
      
      // For now, just log to console in production too
      console.error(`[${appError.category}][${context}] ${appError.message}`);
    } catch (crashlyticsError) {
      console.error('Failed to record error to Crashlytics:', crashlyticsError);
    }
  }
  
  return appError;
};

// Function to send stored offline errors when back online
export const sendOfflineErrors = async (): Promise<void> => {
  try {
    const storedErrorsJson = await AsyncStorage.getItem('offline_errors');
    if (!storedErrorsJson) return;
    
    const storedErrors: AppError[] = JSON.parse(storedErrorsJson);
    if (storedErrors.length === 0) return;
    
    // In a real implementation, you would send these to your error tracking service
    console.log(`Sending ${storedErrors.length} stored errors`);
    
    // Clear stored errors after sending
    await AsyncStorage.removeItem('offline_errors');
  } catch (error) {
    console.error('Failed to send offline errors:', error);
  }
};

// Log important events (for analytics)
export const logEvent = (name: string, params: Record<string, any> = {}): void => {
  console.log(`[Event] ${name}:`, params);
  
  // In production, send to analytics service
  if (!__DEV__) {
    // This is a placeholder - we'll implement actual analytics integration later
    // analytics().logEvent(name, params);
  }
};

// Categorize errors based on their properties
export const categorizeError = (error: any): ErrorCategory => {
  if (!error) return ErrorCategory.UNKNOWN;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('connection') ||
      errorCode.includes('network')) {
    return ErrorCategory.NETWORK;
  }
  
  if (errorCode.startsWith('auth/') || 
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (errorCode.startsWith('firestore/') || 
      errorCode.startsWith('storage/') ||
      errorMessage.includes('firebase')) {
    return ErrorCategory.FIREBASE;
  }
  
  if (errorMessage.includes('permission') || 
      errorMessage.includes('access denied')) {
    return ErrorCategory.PERMISSION;
  }
  
  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  
  if (errorMessage.includes('audio') || 
      errorMessage.includes('recording') ||
      errorMessage.includes('playback')) {
    return ErrorCategory.AUDIO;
  }
  
  return ErrorCategory.UNKNOWN;
}; 