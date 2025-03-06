import { FirebaseUser } from '../contexts/auth';

/**
 * Authentication provider types
 */
export type AuthProvider = 'email' | 'google' | 'apple';

/**
 * Authentication credential interface
 */
export interface AuthCredential {
  email?: string;
  password?: string;
  username?: string;
  role?: 'athlete' | 'fan';
  providerType: AuthProvider;
  // For OAuth providers
  accessToken?: string;
  idToken?: string;
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  user: FirebaseUser;
  isNewUser: boolean;
  providerType: AuthProvider;
}

/**
 * Authentication error interface
 */
export interface AuthError {
  code: string;
  message: string;
  provider?: AuthProvider;
  // Additional details (e.g., for specific provider errors)
  details?: any;
}

/**
 * OAuth providers configuration
 */
export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  apple: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
}

// Auth util functions
export const formatAuthError = (error: any): AuthError => {
  if (error.code) {
    return {
      code: error.code,
      message: getAuthErrorMessage(error.code) || error.message,
      provider: error.provider
    };
  }
  
  return {
    code: 'auth/unknown',
    message: error.message || 'An unknown authentication error occurred'
  };
};

// Helper to get user-friendly auth error messages
export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: {[key: string]: string} = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
    'auth/popup-closed-by-user': 'Sign in was canceled. Please try again.',
    'auth/cancelled-popup-request': 'Sign in operation was cancelled.',
    'auth/network-request-failed': 'A network error occurred. Please check your connection and try again.',
    'auth/operation-not-allowed': 'This sign in method is not enabled. Please contact support.',
    'auth/web-storage-unsupported': 'This browser is not supported or 3rd party cookies and data may be blocked.',
    'auth/popup-blocked': 'Sign in popup was blocked by your browser. Please enable popups for this site.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',
    'auth/user-not-verified': 'Please verify your email address before signing in.'
  };
  
  return errorMessages[errorCode] || '';
};
