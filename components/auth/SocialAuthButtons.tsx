import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';

interface SocialAuthButtonsProps {
  isSignUp?: boolean;
  onAuthStart?: () => void;
  onAuthEnd?: () => void;
  username?: string;
  role?: 'athlete' | 'fan';
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ 
  isSignUp = false, 
  onAuthStart, 
  onAuthEnd,
  username = '',
  role = 'fan'
}) => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = React.useState<'google' | 'apple' | null>(null);
  
  const handleGoogleAuth = async () => {
    try {
      setIsLoading('google');
      if (onAuthStart) onAuthStart();
      
      await signInWithGoogle(username, role);
      
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(null);
      if (onAuthEnd) onAuthEnd();
    }
  };
  
  const handleAppleAuth = async () => {
    try {
      setIsLoading('apple');
      if (onAuthStart) onAuthStart();
      
      await signInWithApple(username, role);
      
    } catch (error) {
      console.error('Apple auth error:', error);
    } finally {
      setIsLoading(null);
      if (onAuthEnd) onAuthEnd();
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>
      
      <TouchableOpacity 
        style={[styles.socialButton, styles.googleButton]} 
        onPress={handleGoogleAuth}
        disabled={isLoading !== null}
      >
        {isLoading === 'google' ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <AntDesign name="google" size={20} color="white" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>
              {isSignUp ? "Sign up with Google" : "Sign in with Google"}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {Platform.OS === 'ios' || Platform.OS === 'web' ? (
        <TouchableOpacity 
          style={[styles.socialButton, styles.appleButton]} 
          onPress={handleAppleAuth}
          disabled={isLoading !== null}
        >
          {isLoading === 'apple' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <AntDesign name="apple1" size={22} color="white" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>
                {isSignUp ? "Sign up with Apple" : "Sign in with Apple"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#666',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    height: 48,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SocialAuthButtons;
