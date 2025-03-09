import React, { createContext, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { auth as firebaseAuth, db } from '../config/firebase.config';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';
import UserService from '../services/UserService';

// Define user role type
export type UserRole = 'athlete' | 'fan' | 'admin' | 'guest';

// Define extended user type with role
export interface ExtendedUser extends Omit<FirebaseUser, 'toJSON'> {
  role?: UserRole;
  username?: string;
  profileComplete?: boolean;
  lastLoginAt?: string;
  isOnline?: boolean;
  toJSON: () => object;
}

// Define types for our context
type User = ExtendedUser | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<{ displayName: string, role: UserRole, username: string }>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuthState: () => Promise<boolean>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  refreshUserData: async () => {},
  isAuthenticated: false,
  checkAuthState: async () => false,
});

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = React.memo(({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const appState = useRef(AppState.currentState);
  const userService = useRef(new UserService()).current;
  
  // Track mounted state
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<ExtendedUser | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Create extended user with Firestore data
        const extendedUser: ExtendedUser = {
          ...firebaseUser,
          role: userData.role || 'guest',
          username: userData.username || '',
          profileComplete: userData.profileComplete || false,
          lastLoginAt: userData.lastLoginAt || new Date().toISOString(),
        };
        
        return extendedUser;
      } else {
        // User document doesn't exist, create it with default values
        const newUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          role: 'guest',
          username: '',
          profileComplete: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };
        
        await setDoc(userDocRef, newUserData);
        
        // Return extended user with default values
        const extendedUser: ExtendedUser = {
          ...firebaseUser,
          role: 'guest',
          username: '',
          profileComplete: false,
        };
        
        return extendedUser;
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  // Update last login timestamp
  const updateLastLogin = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating last login:', err);
    }
  };

  // Check if user is already logged in
  const checkAuthState = async (): Promise<boolean> => {
    try {
      // Check if we have a cached auth state
      const cachedAuth = await AsyncStorage.getItem('auth_state');
      if (cachedAuth) {
        const { isLoggedIn, userId } = JSON.parse(cachedAuth);
        
        if (isLoggedIn && userId) {
          console.log('Found cached auth state, user is logged in:', userId);
          
          // Get cached user data
          const cachedUserData = await AsyncStorage.getItem(`user_${userId}`);
          if (cachedUserData) {
            console.log('Found cached user data');
            // We'll wait for the auth state listener to set the actual user
            return true;
          }
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error checking auth state:', err);
      return false;
    }
  };

  // Update user online status with debouncing
  const updateOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      if (!userId) return;
      
      console.log(`[AuthProvider] Updating user ${userId} online status: ${isOnline}`);
      await userService.updateUserOnlineStatus(userId, isOnline);
    } catch (error) {
      console.error('[AuthProvider] Error updating online status:', error);
    }
  }, []);

  // Handle app state changes to update online status
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;
    let lastStatus: boolean | null = null;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!user) return;
      
      // Clear any pending updates
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      // Determine new online status
      const newStatus = nextAppState === 'active';
      
      // Only update if status has changed
      if (lastStatus !== newStatus) {
        lastStatus = newStatus;
        
        // Debounce the update
        updateTimeout = setTimeout(() => {
          updateOnlineStatus(user.uid, newStatus);
        }, 1000); // Wait 1 second before updating
      }
    });
    
    return () => {
      subscription.remove();
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [user, updateOnlineStatus]);

  // Set up auth state listener
  useEffect(() => {
    // Set persistence to LOCAL on web
    if (Platform.OS === 'web') {
      setPersistence(firebaseAuth, browserLocalPersistence)
        .then(() => {
          console.log('Firebase auth persistence set to LOCAL');
        })
        .catch((error) => {
          console.error('Error setting persistence:', error);
        });
    }
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          console.log('User signed in:', firebaseUser.uid);
          
          // Set online status to true
          await updateOnlineStatus(firebaseUser.uid, true);
          
          // Update auth state in AsyncStorage
          await AsyncStorage.setItem('auth_state', JSON.stringify({
            isLoggedIn: true,
            userId: firebaseUser.uid,
            timestamp: Date.now()
          }));
          
          // Get cached user data first for quick loading
          const cachedUserData = await AsyncStorage.getItem(`user_${firebaseUser.uid}`);
          if (cachedUserData) {
            const parsedUser = JSON.parse(cachedUserData);
            setUser({
              ...firebaseUser,
              ...parsedUser
            } as ExtendedUser);
            setIsAuthenticated(true);
          }
          
          // Fetch fresh user data from Firestore
          const extendedUser = await fetchUserData(firebaseUser);
          
          if (extendedUser) {
            // Cache user data
            await AsyncStorage.setItem(
              `user_${firebaseUser.uid}`, 
              JSON.stringify({
                role: extendedUser.role,
                username: extendedUser.username,
                profileComplete: extendedUser.profileComplete,
                lastLoginAt: extendedUser.lastLoginAt
              })
            );
            
            // Update last login timestamp
            await updateLastLogin(firebaseUser.uid);
            
            // Add isOnline property to user object
            const extendedUserWithOnline = {
              ...extendedUser,
              isOnline: true
            };
            setUser(extendedUserWithOnline);
            setIsAuthenticated(true);
          } else {
            // Fallback to basic Firebase user if Firestore fetch fails
            setUser(firebaseUser as ExtendedUser);
            setIsAuthenticated(true);
          }
        } else {
          // User is signed out
          console.log('User signed out');
          setUser(null);
          setIsAuthenticated(false);
          
          // Update auth state in AsyncStorage
          await AsyncStorage.setItem('auth_state', JSON.stringify({
            isLoggedIn: false,
            timestamp: Date.now()
          }));
          
          // Clear cached user data
          const keys = await AsyncStorage.getAllKeys();
          const userKeys = keys.filter(key => key.startsWith('user_'));
          if (userKeys.length > 0) {
            await AsyncStorage.multiRemove(userKeys);
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error.message);
      setLoading(false);
      setInitializing(false);
      setIsAuthenticated(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      setError(null);
      setLoading(true);
      
      // Set persistence based on rememberMe flag (web only)
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : inMemoryPersistence);
      }
      
      console.log('Signing in with email:', email);
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('Sign in successful for user:', userCredential.user.uid);
      
      // User data will be fetched by the auth state listener
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Sign up function
  const signUp = async (email: string, password: string, role: UserRole, username?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name if username is provided
      if (username) {
        await updateProfile(firebaseUser, { displayName: username });
      }
      
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: username || '',
        role: role,
        username: username || '',
        profileComplete: !!username,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      console.log('User created successfully:', firebaseUser.uid);
      
      // User data will be fetched by the auth state listener
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set user offline before signing out
      if (user) {
        await updateOnlineStatus(user.uid, false);
      }
      
      await firebaseSignOut(firebaseAuth);
      console.log('User signed out successfully');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await sendPasswordResetEmail(firebaseAuth, email);
      console.log('Password reset email sent to:', email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateUserProfile = async (data: Partial<{ displayName: string, role: UserRole, username: string }>) => {
    try {
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      setError(null);
      setLoading(true);
      
      // Update Firebase Auth profile if displayName is provided
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      
      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      
      if (data.displayName) updateData.displayName = data.displayName;
      if (data.role) updateData.role = data.role;
      if (data.username) updateData.username = data.username;
      
      await updateDoc(userDocRef, updateData);
      
      // Update local user state
      setUser(prevUser => {
        if (!prevUser) return null;
        
        return {
          ...prevUser,
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.role && { role: data.role }),
          ...(data.username && { username: data.username }),
        };
      });
      
      // Update cached user data
      const cachedUserData = await AsyncStorage.getItem(`user_${user.uid}`);
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        await AsyncStorage.setItem(
          `user_${user.uid}`,
          JSON.stringify({
            ...parsedData,
            ...(data.role && { role: data.role }),
            ...(data.username && { username: data.username }),
          })
        );
      }
      
      console.log('User profile updated successfully');
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh user data from Firestore
  const refreshUserData = async () => {
    try {
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      setError(null);
      setLoading(true);
      
      const extendedUser = await fetchUserData(user);
      
      if (extendedUser) {
        // Cache user data
        await AsyncStorage.setItem(
          `user_${user.uid}`, 
          JSON.stringify({
            role: extendedUser.role,
            username: extendedUser.username,
            profileComplete: extendedUser.profileComplete,
            lastLoginAt: extendedUser.lastLoginAt
          })
        );
        
        // Set user state
        setUser(extendedUser);
        console.log('User data refreshed successfully');
      }
    } catch (err: any) {
      console.error('Refresh user data error:', err);
      setError(err.message || 'Failed to refresh user data');
    } finally {
      setLoading(false);
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Set user offline when component unmounts if user is logged in
      if (user) {
        updateOnlineStatus(user.uid, false).catch(err => {
          console.error('[AuthProvider] Error updating online status on unmount:', err);
        });
      }
    };
  }, [user]);

  // At the end, memoize the context value
  const authContextValue = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    refreshUserData,
    isAuthenticated,
    checkAuthState
  }), [user, loading, error, isAuthenticated]);
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {!initializing ? children : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </AuthContext.Provider>
  );
});
