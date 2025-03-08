import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { Platform } from 'react-native';

/**
 * User data structure from Google sign-in
 */
export interface GoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'athlete' | 'fan';
  isVerified?: boolean;
}

/**
 * Simple, direct Google sign-in function
 * This implementation prioritizes reliability and simplicity
 */
export const signInWithGoogle = async (role: 'athlete' | 'fan' = 'fan'): Promise<GoogleUser | null> => {
  try {
    console.log('[googleAuth] Starting Google sign-in process - SIMPLIFIED VERSION');
    
    // We'll focus only on web for simplicity
    if (Platform.OS !== 'web') {
      throw new Error('Mobile implementation requires additional setup. This function only works on web currently.');
    }
    
    // Initialize auth and provider
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    // Add scopes
    provider.addScope('profile');
    provider.addScope('email');
    
    // Try to get redirect result first
    let user;
    try {
      console.log('[googleAuth] Checking for redirect result...');
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        console.log('[googleAuth] Got user from redirect:', result.user.uid);
        user = result.user;
      }
    } catch (redirectError) {
      console.log('[googleAuth] No redirect result or error:', redirectError);
      // Continue to popup method
    }
    
    // If no user from redirect, try popup
    if (!user) {
      try {
        console.log('[googleAuth] Trying popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        user = result.user;
        console.log('[googleAuth] Got user from popup:', user.uid);
      } catch (popupError: any) {
        console.error('[googleAuth] Popup error:', popupError);
        
        // If popup is blocked or closed, try redirect
        if (
          popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request'
        ) {
          console.log('[googleAuth] Popup failed, trying redirect...');
          
          // Using redirect (this will reload the page)
          await signInWithRedirect(auth, provider);
          return null; // The page will reload, so we return null
        }
        
        throw popupError;
      }
    }
    
    // At this point we should have a user
    if (!user) {
      throw new Error('No user returned from Google authentication');
    }
    
    // Check if user document exists in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        console.log('[googleAuth] Creating new user document');
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          createdAt: serverTimestamp(),
          isVerified: false,
          provider: 'google'
        });
      }
      
      // Return user data
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: userDoc.exists() ? userDoc.data()?.role || role : role,
        isVerified: userDoc.exists() ? userDoc.data()?.isVerified || false : false
      };
    } catch (firestoreError) {
      console.error('[googleAuth] Firestore error:', firestoreError);
      
      // Return basic user info even if Firestore fails
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        isVerified: false
      };
    }
  } catch (error) {
    console.error('[googleAuth] Google sign-in error:', error);
    throw error;
  }
};

export default signInWithGoogle; 