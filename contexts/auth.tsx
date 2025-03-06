import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router, useSegments } from 'expo-router';
import { auth as importedAuth, db } from '../src/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  Auth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import AuthService, { FirebaseUser, AuthProvider as AuthProviderType } from '../services/AuthService';

// Export FirebaseUser type to make it available throughout the app
export type { FirebaseUser };

// Create the auth context
interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string, role?: 'athlete' | 'fan', provider?: AuthProviderType) => Promise<void>;
  signInWithGoogle: (username?: string, role?: 'athlete' | 'fan') => Promise<void>;
  signInWithApple: (username?: string, role?: 'athlete' | 'fan') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {}
});

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with email:", email);
      const firebaseUser = await AuthService.signInWithEmail(email, password);
      setUser(firebaseUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign up with email and password or other providers
  const signUp = async (
    email: string, 
    password: string, 
    username?: string, 
    role: 'athlete' | 'fan' = 'fan',
    provider: AuthProviderType = 'email'
  ) => {
    try {
      console.log(`Attempting to sign up with ${provider}:`, email, "username:", username, "role:", role);
      
      let firebaseUser;
      
      if (provider === 'email') {
        firebaseUser = await AuthService.signUpWithEmail(email, password, username, role);
      } else if (provider === 'google') {
        firebaseUser = await AuthService.signInWithGoogle(username, role);
      } else if (provider === 'apple') {
        firebaseUser = await AuthService.signInWithApple(username, role);
      }
      
      if (firebaseUser) {
        setUser(firebaseUser);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };
  
  // Sign in with Google
  const signInWithGoogle = async (username?: string, role: 'athlete' | 'fan' = 'fan') => {
    try {
      console.log("Attempting to sign in with Google");
      const firebaseUser = await AuthService.signInWithGoogle(username, role);
      setUser(firebaseUser);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };
  
  // Sign in with Apple
  const signInWithApple = async (username?: string, role: 'athlete' | 'fan' = 'fan') => {
    try {
      console.log("Attempting to sign in with Apple");
      const firebaseUser = await AuthService.signInWithApple(username, role);
      setUser(firebaseUser);
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Handle network connectivity - with platform check for React Native
  const [isOnline, setIsOnline] = useState(true); // Default to true to avoid blocking auth on startup

  useEffect(() => {
    // Only use navigator.onLine on web platform
    if (Platform.OS === 'web') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        console.log("Network connection restored");
        setIsOnline(true);
      };
      
      const handleOffline = () => {
        console.warn("Network connection lost");
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // For React Native, we'll assume online by default
      // In a real app, you would use NetInfo from @react-native-community/netinfo
      console.log("Running on React Native, assuming network is available");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    
    const setupAuthListener = async () => {
      console.log("Setting up auth state listener");

      if (!isOnline) {
        console.error("Cannot setup auth listener - offline");
        return;
      }

      if (Platform.OS === 'web') {
        // Web version
        const auth = importedAuth as Auth;
        
        try {
          // Verify Firebase connection
          await auth.currentUser?.getIdToken(true);
          console.log("Firebase connection verified");
        } catch (error) {
          console.error("Firebase connection error:", error);
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          console.log("Auth state changed - user logged in (web):", firebaseUser.uid);
          console.log("Firebase user data:", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          try {
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db as unknown as Firestore, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data from Firestore:", JSON.stringify(userData, null, 2));

              // Convert Firebase user to our FirebaseUser type with additional data
              const user: FirebaseUser = {
                uid: firebaseUser.uid || '',
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || userData.username,
                photoURL: firebaseUser.photoURL,
                role: userData.role || 'fan',
                username: userData.username
              };
              console.log("Setting user state with:", JSON.stringify(user, null, 2));
              setUser(user);
            } else {
              console.log("No user document found in Firestore, using basic Firebase user data");
              // If no additional data exists, use basic Firebase user data
              const user: FirebaseUser = {
                uid: firebaseUser.uid || '',
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
              };
              console.log("Setting user state with basic data:", JSON.stringify(user, null, 2));
              setUser(user);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to basic user data
            const user: FirebaseUser = {
              uid: firebaseUser.uid || '',
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            };
            console.log("Setting user state with fallback data due to error:", JSON.stringify(user, null, 2));
            setUser(user);
          }
        } else {
          console.log("Auth state changed - user logged out (web)");
          setUser(null);
        }
        setIsLoading(false);
      });
    } else {
      // React Native version
      unsubscribe = (importedAuth as any).onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          console.log("Auth state changed - user logged in (native):", firebaseUser.uid);
          try {
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db as unknown as Firestore, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data from Firestore:", JSON.stringify(userData, null, 2));

              // Convert Firebase user to our FirebaseUser type with additional data
              const user: FirebaseUser = {
                uid: firebaseUser.uid || '',
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || userData.username,
                photoURL: firebaseUser.photoURL,
                role: userData.role || 'fan',
                username: userData.username
              };
              console.log("Setting user state with:", JSON.stringify(user, null, 2));
              setUser(user);
            } else {
              console.log("No user document found in Firestore, using basic Firebase user data");
              // If no additional data exists, use basic Firebase user data
              const user: FirebaseUser = {
                uid: firebaseUser.uid || '',
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
              };
              console.log("Setting user state with basic data:", JSON.stringify(user, null, 2));
              setUser(user);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to basic user data
            const user: FirebaseUser = {
              uid: firebaseUser.uid || '',
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            };
            console.log("Setting user state with fallback data due to error:", JSON.stringify(user, null, 2));
            setUser(user);
          }
        } else {
          console.log("Auth state changed - user logged out (native)");
          setUser(null);
        }
        setIsLoading(false);
      });
    }

    };

    setupAuthListener();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isOnline]);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) {
      console.log("Routing check skipped - still loading");
      return;
    }

    console.log("Current segments:", segments);
    const inAuthGroup = segments[0] === '(auth)';
    console.log(`Routing check - user: ${user ? "authenticated" : "not authenticated"}, inAuthGroup: ${inAuthGroup}`);

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      console.log("User not authenticated, redirecting to login");
      router.replace('/login');
      console.log("Login redirect completed");
    } else if (user && inAuthGroup) {
      // Redirect to home if user is authenticated and trying to access auth pages
      console.log("User authenticated, redirecting to home");
      router.replace('/(tabs)');
      console.log("Home redirect completed");
    } else {
      console.log("No routing change needed");
    }
  }, [user, segments, isLoading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      signInWithApple, 
      signOut 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
