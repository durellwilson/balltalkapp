import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  Alert,
  Platform 
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { signInWithGoogle } from '../../services/auth/googleAuth';
import { useAuth } from '../../contexts/auth';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  style?: any;
  buttonText?: string;
  role?: 'athlete' | 'fan';
}

/**
 * A button component that handles Google sign-in
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  style,
  buttonText = 'Sign in with Google',
  role = 'fan'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, signInWithGoogle: contextSignInWithGoogle } = useAuth();
  
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('[GoogleSignInButton] Starting Google sign-in process...');
    
    try {
      // First try the direct utility function
      let googleUser = null;
      let error = null;
      
      try {
        console.log('[GoogleSignInButton] Attempting direct sign-in with Google...');
        googleUser = await signInWithGoogle(role);
        console.log('[GoogleSignInButton] Direct Google sign-in successful!', googleUser?.uid);
      } catch (directError) {
        console.error('[GoogleSignInButton] Direct sign-in failed:', directError);
        error = directError;
        
        // If direct method fails, try context method
        try {
          console.log('[GoogleSignInButton] Trying context signInWithGoogle...');
          await contextSignInWithGoogle(undefined, role);
          console.log('[GoogleSignInButton] Context Google sign-in completed');
          error = null; // Clear error if context method succeeds
        } catch (contextError) {
          console.error('[GoogleSignInButton] Context sign-in also failed:', contextError);
          // Keep original error if both methods fail
        }
      }
      
      if (error) {
        throw error; // Re-throw if both methods failed
      }
      
      console.log('[GoogleSignInButton] Google sign-in successful!');
      
      // Show success message
      Alert.alert(
        'Sign-in Successful',
        'You have successfully signed in with Google.',
        [{ text: 'OK' }]
      );
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('[GoogleSignInButton] Google sign-in error:', error);
      
      // Format user-friendly error message
      let errorMessage = 'An error occurred during Google sign-in';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this website.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in window was closed before completing the process.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Google Sign-In Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      // Call the onError callback if provided
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If user is already signed in, show a different state
  if (user) {
    return (
      <View style={[styles.button, styles.disabledButton, style]}>
        <AntDesign name="google" size={20} color="#888" style={styles.icon} />
        <Text style={styles.disabledText}>Already signed in</Text>
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
      accessibilityLabel={buttonText}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <AntDesign name="google" size={24} color="white" style={styles.icon} />
          <Text style={styles.text}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4', // Google blue
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        outlineStyle: 'none',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: '#3367d6',
        }
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#E8EAED',
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  icon: {
    marginRight: 12,
  },
});

export default GoogleSignInButton; 