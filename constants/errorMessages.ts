/**
 * Error Messages
 * 
 * This file contains standardized error messages for the BallTalk app.
 * Using these constants ensures consistency in error messaging across the app.
 */

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK: {
    CONNECTION_FAILED: 'Unable to connect to the server. Please check your internet connection and try again.',
    TIMEOUT: 'The request timed out. Please try again.',
    SERVER_ERROR: 'Something went wrong on our end. We\'re working to fix it.',
    OFFLINE: 'You\'re currently offline. Some features may not be available.',
    SLOW_CONNECTION: 'Your connection seems slow. This might take longer than usual.',
  },
  
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Incorrect email or password. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    PERMISSION_DENIED: 'You don\'t have permission to access this feature.',
    ACCOUNT_NOT_FOUND: 'We couldn\'t find an account with that email address.',
    WEAK_PASSWORD: 'Your password is too weak. Please use at least 8 characters with letters and numbers.',
    EMAIL_IN_USE: 'This email is already in use. Please try another or log in.',
    SOCIAL_AUTH_FAILED: 'Social login failed. Please try again or use email login.',
    VERIFICATION_REQUIRED: 'Please verify your email address before logging in.',
  },
  
  // Data errors
  DATA: {
    NOT_FOUND: 'The requested data could not be found.',
    INVALID_FORMAT: 'The data format is invalid.',
    LOAD_FAILED: 'Failed to load data. Please try again.',
    SAVE_FAILED: 'Failed to save data. Please try again.',
    DELETE_FAILED: 'Failed to delete data. Please try again.',
    SYNC_FAILED: 'Failed to sync data. Changes will be saved locally and synced when possible.',
  },
  
  // Studio errors
  STUDIO: {
    RECORDING_FAILED: 'Unable to start recording. Please check your microphone permissions.',
    PROCESSING_FAILED: 'Audio processing failed. Please try again with a different file.',
    SAVE_FAILED: 'Failed to save your project. Please try again.',
    UPLOAD_FAILED: 'Failed to upload audio. Please try again.',
    DOWNLOAD_FAILED: 'Failed to download audio. Please try again.',
    PLAYBACK_FAILED: 'Failed to play audio. The file may be corrupted.',
    COLLABORATION_FAILED: 'Failed to start collaboration session. Please try again.',
    PROJECT_CREATION_FAILED: 'Failed to create new project. Please try again.',
  },
  
  // Chat errors
  CHAT: {
    MESSAGE_SEND_FAILED: 'Failed to send message. It will be sent when you\'re back online.',
    LOAD_MESSAGES_FAILED: 'Failed to load messages. Please try again.',
    CREATE_CONVERSATION_FAILED: 'Failed to create conversation. Please try again.',
    MEDIA_UPLOAD_FAILED: 'Failed to upload media. Please try again with a smaller file.',
    GROUP_CREATE_FAILED: 'Failed to create group. Please try again.',
    USER_NOT_FOUND: 'User not found. They may have deleted their account.',
  },
  
  // Profile errors
  PROFILE: {
    UPDATE_FAILED: 'Failed to update profile. Please try again.',
    PHOTO_UPLOAD_FAILED: 'Failed to upload profile photo. Please try again with a different image.',
    LOAD_FAILED: 'Failed to load profile. Please try again.',
    VERIFICATION_FAILED: 'Verification submission failed. Please try again.',
  },
  
  // Content errors
  CONTENT: {
    LOAD_FAILED: 'Failed to load content. Please try again.',
    UPLOAD_FAILED: 'Failed to upload content. Please try again.',
    PUBLISH_FAILED: 'Failed to publish content. Please try again.',
    DELETE_FAILED: 'Failed to delete content. Please try again.',
    NOT_FOUND: 'The requested content could not be found.',
  },
  
  // Permission errors
  PERMISSION: {
    CAMERA_DENIED: 'Camera access is required for this feature. Please enable it in your device settings.',
    MICROPHONE_DENIED: 'Microphone access is required for this feature. Please enable it in your device settings.',
    STORAGE_DENIED: 'Storage access is required for this feature. Please enable it in your device settings.',
    LOCATION_DENIED: 'Location access is required for this feature. Please enable it in your device settings.',
    NOTIFICATIONS_DENIED: 'Notifications are disabled. You may miss important updates.',
  },
  
  // Generic errors
  GENERIC: {
    UNKNOWN_ERROR: 'Something went wrong. Please try again.',
    FEATURE_UNAVAILABLE: 'This feature is currently unavailable. Please try again later.',
    MAINTENANCE: 'We\'re currently performing maintenance. Please try again later.',
    VERSION_UNSUPPORTED: 'Please update your app to the latest version to use this feature.',
    RATE_LIMITED: 'You\'ve reached the limit for this action. Please try again later.',
  },
};

/**
 * Get an appropriate error message based on error code and context
 * 
 * @param errorCode The error code or type
 * @param context The context in which the error occurred
 * @returns A user-friendly error message
 */
export const getErrorMessage = (errorCode: string, context?: string): string => {
  // Firebase auth error codes
  if (errorCode.startsWith('auth/')) {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return ERROR_MESSAGES.AUTH.ACCOUNT_NOT_FOUND;
      case 'auth/wrong-password':
        return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
      case 'auth/weak-password':
        return ERROR_MESSAGES.AUTH.WEAK_PASSWORD;
      case 'auth/email-already-in-use':
        return ERROR_MESSAGES.AUTH.EMAIL_IN_USE;
      case 'auth/requires-recent-login':
        return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
      case 'auth/network-request-failed':
        return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
      default:
        return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
    }
  }
  
  // Firebase Firestore error codes
  if (errorCode.startsWith('firestore/')) {
    switch (errorCode) {
      case 'firestore/permission-denied':
        return ERROR_MESSAGES.AUTH.PERMISSION_DENIED;
      case 'firestore/unavailable':
        return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
      case 'firestore/not-found':
        return ERROR_MESSAGES.DATA.NOT_FOUND;
      default:
        return ERROR_MESSAGES.DATA.LOAD_FAILED;
    }
  }
  
  // Firebase Storage error codes
  if (errorCode.startsWith('storage/')) {
    switch (errorCode) {
      case 'storage/object-not-found':
        return ERROR_MESSAGES.DATA.NOT_FOUND;
      case 'storage/unauthorized':
        return ERROR_MESSAGES.AUTH.PERMISSION_DENIED;
      case 'storage/canceled':
        return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
      case 'storage/retry-limit-exceeded':
        return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
      default:
        return ERROR_MESSAGES.DATA.LOAD_FAILED;
    }
  }
  
  // Network error codes
  if (errorCode === 'network_error' || errorCode === 'connection_failed') {
    return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
  }
  
  if (errorCode === 'timeout') {
    return ERROR_MESSAGES.NETWORK.TIMEOUT;
  }
  
  // Context-specific fallbacks
  if (context) {
    switch (context.toLowerCase()) {
      case 'auth':
      case 'login':
      case 'register':
        return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
      
      case 'profile':
        return ERROR_MESSAGES.PROFILE.LOAD_FAILED;
      
      case 'studio':
      case 'recording':
        return ERROR_MESSAGES.STUDIO.RECORDING_FAILED;
      
      case 'chat':
      case 'message':
        return ERROR_MESSAGES.CHAT.MESSAGE_SEND_FAILED;
      
      case 'content':
        return ERROR_MESSAGES.CONTENT.LOAD_FAILED;
      
      default:
        return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
    }
  }
  
  // Default fallback
  return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
}; 