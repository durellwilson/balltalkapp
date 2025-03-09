/**
 * Custom Error Classes
 * 
 * This file defines custom error classes for different types of errors in the BallTalk app.
 * Using these classes helps with error categorization, handling, and reporting.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  code: string;
  originalError?: any;
  context?: string;
  
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /**
   * Get a JSON representation of the error for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        code: this.originalError.code,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'NetworkError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication-related errors
 */
export class AuthError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'AuthError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Data-related errors
 */
export class DataError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'DataError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DataError.prototype);
  }
}

/**
 * Firebase-related errors
 */
export class FirebaseError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'FirebaseError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FirebaseError.prototype);
  }
}

/**
 * Audio processing errors
 */
export class AudioError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'AudioError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AudioError.prototype);
  }
}

/**
 * UI-related errors
 */
export class UIError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'UIError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UIError.prototype);
  }
}

/**
 * Permission-related errors
 */
export class PermissionError extends AppError {
  constructor(code: string, message: string, originalError?: any, context?: string) {
    super(code, message, originalError, context);
    this.name = 'PermissionError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends AppError {
  validationErrors?: Record<string, string>;
  
  constructor(
    code: string, 
    message: string, 
    validationErrors?: Record<string, string>,
    originalError?: any, 
    context?: string
  ) {
    super(code, message, originalError, context);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
  
  /**
   * Get a JSON representation of the error for logging
   */
  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Helper function to create an appropriate error from a Firebase error
 */
export function createErrorFromFirebaseError(
  firebaseError: any, 
  context?: string
): AppError {
  const code = firebaseError.code || 'unknown';
  const message = firebaseError.message || 'An unknown error occurred';
  
  // Auth errors
  if (code.startsWith('auth/')) {
    return new AuthError(code, message, firebaseError, context);
  }
  
  // Firestore errors
  if (code.startsWith('firestore/')) {
    return new FirebaseError(code, message, firebaseError, context);
  }
  
  // Storage errors
  if (code.startsWith('storage/')) {
    return new FirebaseError(code, message, firebaseError, context);
  }
  
  // Network errors
  if (
    code === 'unavailable' || 
    code === 'deadline-exceeded' ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('connection')
  ) {
    return new NetworkError(code, message, firebaseError, context);
  }
  
  // Permission errors
  if (
    code === 'permission-denied' ||
    code === 'unauthorized' ||
    message.toLowerCase().includes('permission')
  ) {
    return new PermissionError(code, message, firebaseError, context);
  }
  
  // Default to generic app error
  return new AppError(code, message, firebaseError, context);
}

/**
 * Helper function to create an appropriate error from an HTTP error
 */
export function createErrorFromHttpError(
  httpError: any,
  context?: string
): AppError {
  const status = httpError.status || httpError.statusCode || 0;
  const code = httpError.code || `http_${status}`;
  const message = httpError.message || 'An HTTP error occurred';
  
  // Network errors
  if (status === 0 || status === 408 || status >= 500) {
    return new NetworkError(code, message, httpError, context);
  }
  
  // Authentication errors
  if (status === 401 || status === 403) {
    return new AuthError(code, message, httpError, context);
  }
  
  // Not found errors
  if (status === 404) {
    return new DataError(code, message, httpError, context);
  }
  
  // Validation errors
  if (status === 400 || status === 422) {
    return new ValidationError(code, message, httpError.validationErrors, httpError, context);
  }
  
  // Default to generic app error
  return new AppError(code, message, httpError, context);
} 