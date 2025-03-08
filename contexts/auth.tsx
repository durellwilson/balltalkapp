import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth as firebaseAuth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Define types for our context
type User = FirebaseUser | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error.message);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignOut(firebaseAuth);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Provide a dummy user for testing
  // This is useful for testing the app without requiring Firebase auth
  const dummyUser = {
    uid: 'dummy-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    // Add other necessary properties to pass type checks
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({
      token: '',
      signInProvider: '',
      claims: {},
      expirationTime: '',
      issuedAtTime: '',
      authTime: ''
    }),
    reload: async () => {},
    toJSON: () => ({})
  } as FirebaseUser;

  return (
    <AuthContext.Provider
      value={{
        // For testing purposes, always provide a dummy user
        // In production, you would use: user
        user: dummyUser,
        loading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
