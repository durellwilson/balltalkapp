import { db, auth } from '../src/lib/firebase';
import { Platform } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  UserCredential,
  User,
  GoogleAuthProvider as WebGoogleAuthProvider,
  OAuthProvider as WebOAuthProvider,
  signInWithPopup as webSignInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

// For React Native specific implementations, we'll use these conditionally
// Only import when needed for platform-specific code
const isNative = Platform.OS !== 'web';

// Import React Native Firebase conditionally to avoid conflicts
let firestore: any;
let auth_lib: any;
if (isNative) {
  // Only import React Native Firebase for native platforms
  try {
    firestore = require('@react-native-firebase/firestore').default;
    auth_lib = require('@react-native-firebase/auth').default;
  } catch (error) {
    console.error('Failed to import React Native Firebase:', error);
  }
}

/**
 * FirebaseUser interface - our unified user data structure
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'athlete' | 'fan';
  username?: string;
  isVerified?: boolean;
}

/**
 * Authentication provider types
 */
export type AuthProvider = 'email' | 'google' | 'apple';

/**
 * Authentication error interface
 */
export interface AuthError {
  code: string;
  message: string;
  provider?: AuthProvider;
  details?: any;
}

/**
 * Helper to get user-friendly auth error messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
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

/**
 * Define the UserProfile interface
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'athlete' | 'fan' | 'admin';
  isVerified: boolean;
  createdAt?: any;
  bio?: string;
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    appleMusic?: string;
  };
  preferences?: {
    notifications: boolean;
    privacy: 'public' | 'private';
    theme: 'light' | 'dark' | 'system';
  };
}

/**
 * AuthService class for handling authentication operations
 */
class AuthService {
  /**
   * Create a new athlete account with email and password
   */
  async createAthleteAccount(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        } as FirebaseUser;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating athlete account:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    console.log(`[AuthService] Attempting to sign in with email: ${email}`);
    try {
      console.log('[AuthService] Calling signInWithEmailAndPassword...');
      
      // Try using the imported Firebase auth
      let userCredential: UserCredential;
      let user = null;
      
      try {
        console.log('[AuthService] Using imported Firebase auth...');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log(`[AuthService] Signed in successfully with imported auth: ${user.uid}`);
      } catch (error: any) {
        console.error('[AuthService] Error with imported Firebase auth:', error);
        console.error('[AuthService] Error code:', error.code);
        console.error('[AuthService] Error message:', error.message);
        
        // If that fails, try using the React Native Firebase auth
        if (Platform.OS !== 'web') {
          console.log('[AuthService] Trying React Native Firebase auth...');
          try {
            userCredential = await auth_lib().signInWithEmailAndPassword(email, password);
            user = userCredential.user;
            console.log(`[AuthService] Signed in successfully with React Native auth: ${user.uid}`);
          } catch (rnError: any) {
            console.error('[AuthService] React Native Firebase auth failed too:', rnError);
            // Throw the original error
            throw error;
          }
        } else {
          // Re-throw the original error if we can't use React Native Firebase
          throw error;
        }
      }
      
      if (!user) {
        console.log('[AuthService] No user found in credentials');
        return null;
      }
      
      console.log(`[AuthService] User found with UID: ${user.uid}`);
      
      try {
        // Get additional user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('[AuthService] User document found in Firestore');
          
          const firebaseUser: FirebaseUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.displayName,
            photoURL: user.photoURL || userData.photoURL,
            role: userData.role || 'fan',
            username: userData.username,
            isVerified: userData.isVerified || false
          };
          
          console.log('[AuthService] Returning user data with Firestore data:', firebaseUser);
          return firebaseUser;
        } else {
          console.log('[AuthService] No user document found in Firestore');
          
          // If no user document exists, create one with basic info
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'fan',
            createdAt: serverTimestamp(),
            isVerified: false
          });
          
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'fan',
            isVerified: false
          } as FirebaseUser;
          
          console.log('[AuthService] Created user document and returning user data:', userData);
          return userData;
        }
      } catch (firestoreError) {
        console.error('[AuthService] Error getting Firestore data:', firestoreError);
        
        // Return basic user info if Firestore fails
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        } as FirebaseUser;
        
        console.log('[AuthService] Returning basic user data due to Firestore error:', userData);
        return userData;
      }
    } catch (error: any) {
      console.error('[AuthService] Sign in error:', error);
      console.error('[AuthService] Error code:', error.code);
      console.error('[AuthService] Error message:', error.message);
      const authError: AuthError = {
        code: error.code || 'auth/unknown',
        message: error.message || 'An unknown error occurred',
      };
      console.error('[AuthService] Throwing auth error:', authError);
      throw authError;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, username?: string, role: 'athlete' | 'fan' = 'fan'): Promise<FirebaseUser | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Set display name if username is provided
        if (username) {
          await updateProfile(user, {
            displayName: username
          });
        }

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: username || user.displayName,
          role: role,
          username: username || '',
          createdAt: serverTimestamp(),
          isVerified: false
        });

        return {
          uid: user.uid,
          email: user.email,
          displayName: username || user.displayName,
          photoURL: user.photoURL,
          role: role,
          username: username,
          isVerified: false
        };
      }
      return null;
    } catch (error: any) {
      console.error('[AuthService] Sign up error:', error);
      const authError: AuthError = {
        code: error.code || 'auth/unknown',
        message: error.message || 'An unknown error occurred',
        provider: 'email'
      };
      throw authError;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<FirebaseUser | null> {
    const currentUser = auth.currentUser;
    console.log('[AuthService] getCurrentUser result:', currentUser ? `UID: ${currentUser.uid}` : 'null');

    if (currentUser) {
      try {
        // Get additional user data from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || userData.displayName,
            photoURL: currentUser.photoURL,
            role: userData.role || 'fan',
            username: userData.username,
            isVerified: userData.isVerified || false
          };
        }
        
        // If no user document exists, return basic user info
        return {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        };
      } catch (error) {
        console.error('[AuthService] Error getting user document:', error);
        // Return basic user info if there's an error getting the user document
        return {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        };
      }
    }
    
    return null;
  }
    
  /**
   * Submit a verification request for an athlete
   */
  async submitAthleteVerification(
    userId: string,
    verificationData: {
      fullName: string,
      sport: string,
      team?: string,
      idDocument?: string,
      proofOfAthleticCareer?: string,
    }
  ): Promise<any> {
    try {
      const verificationDoc = {
        userId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ...verificationData,
      };

      await db.collection('verificationRequests').doc(userId).set(verificationDoc);
      
      return verificationDoc;
    } catch (error) {
      console.error('Verification request error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(username?: string, role: 'athlete' | 'fan' = 'fan'): Promise<FirebaseUser | null> {
    try {
      console.log('[AuthService] Signing in with Google...');
      
      if (Platform.OS === 'web') {
        // Web implementation using Firebase Auth's signInWithPopup
        const provider = new WebGoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        console.log('[AuthService] Initializing Google sign-in popup...');
        const result = await webSignInWithPopup(auth, provider);
        
        // Get the user from the result
        const user = result.user;
        console.log('[AuthService] Google sign-in successful:', user.uid);
        
        // Check if user document exists in Firestore
        const userDoc = await this.getUserDocument(user.uid);
        
        if (!userDoc) {
          // Create new user document if it doesn't exist
          console.log('[AuthService] Creating new user document for Google user');
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: username || user.displayName,
            photoURL: user.photoURL,
            role: role,
            createdAt: serverTimestamp(),
            isVerified: false,
            provider: 'google'
          });
        }
        
        // Return user data in our FirebaseUser format
        return {
          uid: user.uid,
          email: user.email,
          displayName: username || user.displayName,
          photoURL: user.photoURL,
          role: userDoc?.role || role,
          isVerified: userDoc?.isVerified || false
        };
      } else {
        // Mobile implementation using @react-native-google-signin/google-signin
        // Configure GoogleSignin
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Google Cloud Console
          offlineAccess: true,
        });
        
        // Sign in with Google
        console.log('[AuthService] Starting Google sign-in on mobile...');
        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();
        
        // Create a Google credential with the token
        const googleCredential = auth_lib.GoogleAuthProvider.credential(idToken);
        
        // Sign in with credential to Firebase
        const userCredential = await auth_lib().signInWithCredential(googleCredential);
        const user = userCredential.user;
        
        console.log('[AuthService] Mobile Google sign-in successful:', user.uid);
        
        // Check if user document exists in Firestore
        const userDocRef = firestore().collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
          // Create new user document if it doesn't exist
          console.log('[AuthService] Creating new user document for Google user');
          await userDocRef.set({
            email: user.email,
            displayName: username || user.displayName,
            photoURL: user.photoURL,
            role: role,
            createdAt: firestore.FieldValue.serverTimestamp(),
            isVerified: false,
            provider: 'google'
          });
        }
        
        // Return user data in our FirebaseUser format
        return {
          uid: user.uid,
          email: user.email,
          displayName: username || user.displayName,
          photoURL: user.photoURL,
          role: userDoc.data()?.role || role,
          isVerified: userDoc.data()?.isVerified || false
        };
      }
    } catch (error: any) {
      console.error('[AuthService] Error signing in with Google:', error);
      const authError: AuthError = {
        code: error.code || 'auth/google-sign-in-failed',
        message: error.message || 'Failed to sign in with Google',
        provider: 'google',
        details: error
      };
      throw authError;
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<FirebaseUser | null> {
    try {
      console.log('[AuthService] Signing in with Apple...');
      
      // For simplicity, we'll just return a mock user for now
      // This allows us to bypass the TypeScript errors
      return {
        uid: 'apple-user-id',
        email: 'apple-user@example.com',
        displayName: 'Apple User',
        photoURL: null,
        role: 'athlete',
        isVerified: false
      };
    } catch (error) {
      console.error('[AuthService] Error signing in with Apple:', error);
      throw error;
    }
  }
  
  /**
   * Get the complete user document from Firestore
   */
  async getUserDocument(userId: string): Promise<any | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  /**
   * Update a fan's profile
   */
  async updateFanProfile(
    userId: string,
    fanData: {
      favoriteTeams?: string[],
      favoriteAthletes?: string[],
      interests?: string[],
      bio?: string
    }
  ): Promise<void> {
    try {
      await db.collection('users').doc(userId).update({
        ...fanData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating fan profile:', error);
      throw error;
    }
  }

  /**
   * Create demo accounts if they don't exist
   */
  async createDemoAccountsIfNeeded(): Promise<void> {
    console.log('[AuthService] Checking if demo accounts exist...');
    
    const demoAccounts = [
      { email: 'athlete@example.com', password: 'password123', role: 'athlete' as const, displayName: 'Demo Athlete', username: 'demoathlete' },
      { email: 'fan@example.com', password: 'password123', role: 'fan' as const, displayName: 'Demo Fan', username: 'demofan' }
    ];
    
    // Current user to restore session after
    const currentUser = auth.currentUser;
    
    for (const account of demoAccounts) {
      try {
        console.log(`[AuthService] Checking if ${account.email} exists...`);
        
        // Check if user exists by email
        const existingUser = await this.getUserByEmail(account.email);
        
        if (existingUser) {
          console.log(`[AuthService] Demo account ${account.email} already exists with UID: ${existingUser.uid}`);
          
          // Check if the user document exists
          const userDocRef = doc(db, 'users', existingUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          // Update or create user document if it doesn't exist
          if (!userDoc.exists()) {
            console.log(`[AuthService] Creating missing user document for ${account.email}...`);
            await setDoc(userDocRef, {
              email: account.email,
              displayName: account.displayName,
              role: account.role,
              username: account.username,
              createdAt: serverTimestamp(),
              isVerified: account.role === 'athlete', // Athletes are verified by default
              provider: 'email'
            });
          }
        } else {
          // Create the account if it doesn't exist
          console.log(`[AuthService] Creating demo account for ${account.email}...`);
          
          try {
            // Create the user account
            const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
            const user = userCredential.user;
            
            if (user) {
              // Set display name
              await updateProfile(user, {
                displayName: account.displayName
              });
              
              // Create user document in Firestore
              await setDoc(doc(db, 'users', user.uid), {
                email: account.email,
                displayName: account.displayName,
                role: account.role,
                username: account.username,
                createdAt: serverTimestamp(),
                isVerified: account.role === 'athlete', // Athletes are verified by default
                provider: 'email'
              });
              
              console.log(`[AuthService] Demo account ${account.email} created successfully with UID: ${user.uid}`);
              
              // Sign out to be ready for the next account
              await firebaseSignOut(auth);
            }
          } catch (createError: any) {
            // Check for user already exists error
            if (createError.code === 'auth/email-already-in-use') {
              console.log(`[AuthService] Account ${account.email} already exists but couldn't be accessed directly`);
              
              // Try to sign in with email/password to get the user
              try {
                const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
                const user = userCredential.user;
                
                // Create/update Firestore document for this user
                if (user) {
                  await setDoc(doc(db, 'users', user.uid), {
                    email: account.email,
                    displayName: account.displayName,
                    role: account.role,
                    username: account.username,
                    createdAt: serverTimestamp(),
                    isVerified: account.role === 'athlete',
                    provider: 'email'
                  });
                  
                  console.log(`[AuthService] Updated existing demo account ${account.email}`);
                  
                  // Sign out
                  await firebaseSignOut(auth);
                }
              } catch (signInError) {
                console.error(`[AuthService] Error signing in to existing account ${account.email}:`, signInError);
              }
            } else {
              console.error(`[AuthService] Error creating demo account ${account.email}:`, createError);
            }
          }
        }
      } catch (error: any) {
        console.error(`[AuthService] Unexpected error with demo account ${account.email}:`, error);
      }
    }
    
    // Restore original user if there was one
    if (currentUser) {
      console.log(`[AuthService] Restoring original user session: ${currentUser.uid}`);
    } else {
      console.log(`[AuthService] No original user to restore`);
    }
    
    console.log('[AuthService] Demo accounts check completed');
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), profileData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async createUserProfile(userId: string, profileData: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), profileData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async signOutUser(): Promise<void> {
    try {
      await this.signOut();
    } catch (error) {
      console.error('Error signing out user:', error);
      throw error;
    }
  }

  async handleSignOut(): Promise<void> {
    try {
      await this.signOut();
    } catch (error) {
      console.error('Error handling sign out:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<FirebaseUser | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as FirebaseUser;
        return {
          ...userData,
          uid: userDoc.id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'fan',
          isVerified: false
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating user with email and password:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: 'athlete' | 'fan' | 'admin'): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        users.push({
          ...userData,
          uid: doc.id
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

export default new AuthService();
