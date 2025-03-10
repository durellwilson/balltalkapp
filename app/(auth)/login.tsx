import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import InitializeDemoAccounts from '../../components/auth/InitializeDemoAccounts';
import AuthTester from '../../components/auth/AuthTester';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { auth } from '../../src/lib/firebase';
import { 
  UserCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { FontAwesome5 } from '@expo/vector-icons';

// Test function to check if Firebase auth is working
const testFirebaseAuth = () => {
  console.log('[Login] Testing Firebase auth...');
  try {
    const currentUser = auth.currentUser;
    console.log('[Login] Current user:', currentUser ? `UID: ${currentUser.uid}` : 'null');
    
    // Check if we can access auth methods
    console.log('[Login] Auth methods available:', {
      signInWithEmailAndPassword: typeof signInWithEmailAndPassword === 'function' ? '✓' : '✗',
      createUserWithEmailAndPassword: typeof createUserWithEmailAndPassword === 'function' ? '✓' : '✗',
      signOut: typeof signOut === 'function' ? '✓' : '✗'
    });
    
    return true;
  } catch (error) {
    console.error('[Login] Firebase auth test failed:', error);
    return false;
  }
};

const Login = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState<'athlete' | 'fan'>('athlete');

  // For demo purposes - pre-filled credentials
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  // Redirect to main app if already logged in
  useEffect(() => {
    // Test Firebase auth
    const authWorking = testFirebaseAuth();
    console.log('[Login] Firebase auth working:', authWorking);
    
    if (user) {
      // Delay navigation to ensure Root Layout is mounted
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [user]);

  // app/(auth)/login.tsx
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both email and password');
    return;
  }

  setIsLoading(true);
  setErrorMessage('');

  try {
    console.log(`[Login] Attempting to sign in as ${userType} with: ${email}`);
    
    // Try direct Firebase auth first
    const auth = getAuth();
    
    try {
      console.log('[Login] Trying direct Firebase auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`[Login] Direct Firebase auth successful: ${user.uid}`);
      
      // Update Firestore document if needed
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log(`[Login] Creating missing user document for ${user.email}...`);
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || email.split('@')[0],
            role: userType, // Set the role based on user selection
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          // Update the role if it's different
          const userData = userDoc.data();
          if (userData.role !== userType) {
            console.log(`[Login] Updating user role from ${userData.role} to ${userType}`);
            await setDoc(userDocRef, { 
              role: userType,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      } catch (firestoreError) {
        console.error('[Login] Error updating Firestore:', firestoreError);
        // Continue anyway since auth was successful
      }
      
      // Redirect based on user type
      if (userType === 'fan') {
        router.replace('/(tabs)/fan-profile');
      } else {
        router.replace('/(tabs)');
      }
    } catch (directAuthError) {
      console.error('[Login] Direct Firebase auth failed:', directAuthError);
      
      // If direct auth fails, try using the auth context
      try {
        console.log('[Login] Trying auth context signIn...');
        await signIn(email, password);
        console.log('[Login] Auth context signIn successful');
      } catch (contextError) {
        console.error('[Login] Auth context signIn failed:', contextError);
        handleLoginError(contextError);
      }
    }
  } catch (error) {
    console.error('[Login] Login error:', error);
    handleLoginError(error);
  } finally {
    setIsLoading(false);
  }
};

const handleLoginError = (error: any) => {
  console.error('[Login] Login error:', error);
  
  let message = 'Invalid email or password';
  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-email': message = 'The email address is not valid.'; break;
      case 'auth/user-disabled': message = 'This user account has been disabled.'; break;
      case 'auth/user-not-found': message = 'No account found with this email.'; break;
      case 'auth/wrong-password': message = 'Incorrect password.'; break;
      case 'auth/network-request-failed': message = 'Network error. Please check your connection.'; break;
      case 'auth/invalid-credential': message = 'Invalid login credentials. Please check your email and password.'; break;
      default: message = error.message || 'An error occurred during sign in.';
    }
  }

  setErrorMessage(message);
  Alert.alert('Login Failed', message);
};

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };
  
  const loginWithDemoAccount = (type: 'athlete' | 'fan') => {
    console.log(`[Login] Logging in with demo account: ${type}`);
    setIsLoading(true);
    setErrorMessage('');
    
    const email = type === 'athlete' ? 'athlete@example.com' : 'fan@example.com';
    const password = 'password123';
    
    // Set the email and password in the state
    setEmail(email);
    setPassword(password);
    
    // Try to sign in directly with Firebase
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential: UserCredential) => {
        console.log(`[Login] Demo login successful with UID: ${userCredential.user.uid}`);
        // Force a page refresh on web to ensure the auth state is updated
        if (Platform.OS === 'web') {
          window.location.reload();
        }
      })
      .catch((error: any) => {
        console.error(`[Login] Demo login failed:`, error);
        setErrorMessage(`Failed to log in with demo account: ${error.message}`);
        Alert.alert('Login Failed', `Could not log in with demo account. Error: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>BallTalk</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign In with Email</Text>
          )}
        </TouchableOpacity>
        
        <SocialAuthButtons 
          isSignUp={false}
          onAuthStart={() => setIsLoading(true)}
          onAuthEnd={() => setIsLoading(false)}
        />

        {/* Add standalone Google Sign-In button */}
        <View style={styles.standaloneButtons}>
          <Text style={styles.dividerText}>OR USE DIRECT SIGN IN</Text>
          <GoogleSignInButton 
            buttonText="Direct Google Sign-In"
            onSuccess={() => {
              Alert.alert('Success', 'Google sign-in successful!');
              router.replace('/(tabs)');
            }}
            onError={(error) => {
              console.error('Google sign-in failed:', error);
              Alert.alert('Error', error.message || 'Google sign-in failed');
            }}
            style={styles.standaloneButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.fanHubButton}
          onPress={() => router.push('/chat/fan-hub')}
          disabled={isLoading}
        >
          <Text style={styles.fanHubButtonText}>Join Fan Hub</Text>
        </TouchableOpacity>
        
        {/* Demo accounts section */}
        <TouchableOpacity 
          style={styles.demoToggle}
          onPress={() => setShowDemoOptions(!showDemoOptions)}
        >
          <Text style={styles.demoToggleText}>
            {showDemoOptions ? 'Hide Demo Accounts' : 'Show Demo Accounts'}
          </Text>
        </TouchableOpacity>
        
        {showDemoOptions && (
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Accounts</Text>
            <Text style={styles.demoSubtitle}>For testing purposes only</Text>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => loginWithDemoAccount('athlete')}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Login as Athlete</Text>
              <Text style={styles.demoCredentials}>athlete@example.com / password123</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => loginWithDemoAccount('fan')}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Login as Fan</Text>
              <Text style={styles.demoCredentials}>fan@example.com / password123</Text>
            </TouchableOpacity>
            
            {/* Debug tool to initialize demo accounts */}
            <InitializeDemoAccounts />
            
            {/* Direct Firebase auth tester */}
            <View style={styles.divider} />
            <Text style={styles.demoSubtitle}>Advanced Diagnostics</Text>
            <AuthTester />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  buttonDisabled: {
    backgroundColor: '#7fb5f2'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20
  },
  footerText: {
    color: '#666'
  },
  signUpText: {
    color: '#007bff',
    fontWeight: 'bold'
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center'
  },
  fanHubButton: {
    marginTop: 10,
    backgroundColor: '#00529b',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  fanHubButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Demo account styles
  demoToggle: {
    marginTop: 40,
    padding: 10,
  },
  demoToggleText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  demoContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  demoButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  demoCredentials: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  standaloneButtons: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  dividerText: {
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  standaloneButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  userTypeSelector: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    width: '45%',
  },
  athleteButton: {
    backgroundColor: '#007AFF',
  },
  fanButton: {
    backgroundColor: '#34C759',
  },
  userTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loginPrompt: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default Login;
