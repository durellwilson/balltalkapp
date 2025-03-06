import { db, auth } from '../src/lib/firebase';
import { doc, setDoc, getDoc, firestore } from '@react-native-firebase/firestore';
 

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
 * AuthService class for handling authentication operations
 */
class AuthService {
  /**
   * Create a new athlete account with email and password
   */
  async createAthleteAccount(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        } as FirebaseUser;
      }
      return null;

    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'auth/unknown',
        message: error.message || 'An unknown error occurred',
      };
      throw authError;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
          return {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
          } as FirebaseUser;
      }
      return null;
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'auth/unknown',
        message: error.message || 'An unknown error occurred',
      };
      throw authError;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, username?: string, role: 'athlete' | 'fan' = 'fan'): Promise<FirebaseUser | null> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        if (username) {
          await user.updateProfile({ displayName: username });
        }

                // Store additional user data in Firestore
                const userData: Omit<FirebaseUser, 'isVerified'> & { isVerified: boolean } = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || username || '',
                    photoURL: user.photoURL || null,
                    role: role,
                    isVerified: false
                }

        await setDoc(doc(db, 'users', user.uid), userData);

        return userData;
      }
      return null

    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'auth/unknown',
        message: error.message || 'An unknown error occurred',
      };
      throw authError;
        }
    }

      /**
   * Sign out the current user
   */
    async signOut(): Promise<void> {
        try {
            await auth().signOut();
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Get the current user
     */
    async getCurrentUser(): Promise<FirebaseUser | null> {
        const user = auth().currentUser;

        if (user) {
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() as Omit<FirebaseUser, 'isVerified'> & { isVerified: boolean };
            if (userDoc.exists) {                
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || userData?.username || null,
                    photoURL: user.photoURL || userData?.photoURL || null,
                    role: userData.role || 'fan',  // Default to 'fan' if not specified
                    username: userData.username,
                    isVerified: userData.isVerified || false
                } as FirebaseUser;
            } else {
                
                // If no additional data exists, use basic Firebase user data
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL || null,
                    role: 'fan', // Default to 'fan'
                    isVerified: false
                } as FirebaseUser;
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
            const verificationDoc: { [key: string]: any } = {
                userId,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                ...verificationData,
            };


            const docRef = await setDoc(
                doc(db, 'verificationRequests', userId),
                verificationDoc,
            );
            
            return verificationDoc;

        } catch (error) {
            console.error('Verification request error:', error);
            throw error;
        }
    }

    async signInWithGoogle(username: string, role: 'athlete' | 'fan'): Promise<FirebaseUser | null> {
        console.log("signInWithGoogle called with username:", username, "and role:", role);
        return null;
    }

    async signInWithApple(username: string, role: 'athlete' | 'fan'): Promise<FirebaseUser | null> {
        console.log("signInWithApple called with username:", username, "and role:", role);
        return null;
    }





    /**
     * Get the complete user document from Firestore
     */
    async getUserDocument(userId: string): Promise<any | null> {
        try {

            // Get a reference to the user document
            const userRef = doc(db, 'users', userId);

            // Get the document from Firestore
            const userDoc = await getDoc(userRef);

            if (userDoc.exists) {
                return userDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user document:', error);
            throw error;
        }
    }

    /**
     * Update fan profile with additional information
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
            // Get a reference to the user document
            const userRef = doc(db, 'users', userId);

            // Update only the provided fields
            const updateData: { [key: string]: any } = {};

            if (fanData.favoriteTeams !== undefined) updateData.favoriteTeams = fanData.favoriteTeams;
            if (fanData.favoriteAthletes !== undefined) updateData.favoriteAthletes = fanData.favoriteAthletes;
            if (fanData.interests !== undefined) updateData.interests = fanData.interests;
            if (fanData.bio !== undefined) updateData.bio = fanData.bio;

            // Add a lastUpdated timestamp
            updateData.lastUpdated = new Date().toISOString()

            // Update the document in Firestore
            await setDoc(userRef, updateData, { merge: true });
        } catch (error) {
            console.error('Fan profile update error:', error);
            throw error;
        }
    }
}

export default new AuthService()
