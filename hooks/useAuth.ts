import { useState, useEffect, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define auth state interface
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Define auth methods interface
export interface AuthMethods {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<User | null>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthMethods {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Clear any authentication errors
  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (
    email: string, 
    password: string,
    rememberMe: boolean = true
  ): Promise<User | null> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const auth = getAuth();
      
      // Set persistence based on rememberMe flag
      if (Platform.OS === 'web') {
        const persistenceType = rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
      } else {
        // For mobile, we'll use AsyncStorage to remember the user's choice
        await AsyncStorage.setItem('@auth_remember_me', rememberMe ? 'true' : 'false');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setState(prevState => ({ 
        ...prevState, 
        user: userCredential.user,
        loading: false
      }));
      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      
      setState(prevState => ({ 
        ...prevState, 
        error: errorMessage,
        loading: false
      }));
      return null;
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (
    email: string, 
    password: string,
    displayName: string
  ): Promise<User | null> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with the display name
      await updateProfile(userCredential.user, { displayName });
      
      setState(prevState => ({ 
        ...prevState, 
        user: userCredential.user,
        loading: false
      }));
      return userCredential.user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      setState(prevState => ({ 
        ...prevState, 
        error: errorMessage,
        loading: false
      }));
      return null;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const auth = getAuth();
      await firebaseSignOut(auth);
      
      // Clear any stored auth preferences
      if (Platform.OS !== 'web') {
        await AsyncStorage.removeItem('@auth_remember_me');
      }
      
      setState(prevState => ({ 
        ...prevState, 
        user: null,
        loading: false
      }));
    } catch (error: any) {
      console.error('Sign out error:', error);
      setState(prevState => ({ 
        ...prevState, 
        error: 'Failed to sign out. Please try again.',
        loading: false
      }));
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      
      setState(prevState => ({ ...prevState, loading: false }));
      return true;
    } catch (error: any) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setState(prevState => ({ 
        ...prevState, 
        error: errorMessage,
        loading: false
      }));
      return false;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      // Google sign-in is only available on web
      if (Platform.OS !== 'web') {
        setState(prevState => ({ 
          ...prevState, 
          error: 'Google sign-in is only available on web.',
          loading: false
        }));
        return null;
      }
      
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      setState(prevState => ({ 
        ...prevState, 
        user: userCredential.user,
        loading: false
      }));
      return userCredential.user;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      // Provide more specific error messages
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed before completing the sign-in.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked by the browser.';
      }
      
      setState(prevState => ({ 
        ...prevState, 
        error: errorMessage,
        loading: false
      }));
      return null;
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (
    displayName: string,
    photoURL?: string
  ): Promise<boolean> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently signed in.');
      }
      
      await updateProfile(user, { displayName, photoURL });
      
      // Update the local user state
      setState(prevState => ({ 
        ...prevState, 
        user: auth.currentUser,
        loading: false
      }));
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error);
      setState(prevState => ({ 
        ...prevState, 
        error: 'Failed to update profile. Please try again.',
        loading: false
      }));
      return false;
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState(prevState => ({ 
        ...prevState, 
        user,
        loading: false
      }));
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    updateUserProfile,
    clearError
  };
} 