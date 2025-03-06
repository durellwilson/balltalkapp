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
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth';

const Login = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // For demo purposes - pre-filled credentials
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  // Handle automatic redirects if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Attempting to sign in with:', email);
      await signIn(email, password);
      console.log('Sign in successful');
      // The auth context will automatically redirect to the main app
    } catch (error: any) {
      console.error('Login error:', error);

      // Extract error message
      let message = 'Invalid email or password';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            message = 'The email address is not valid.';
            break;
          case 'auth/user-disabled':
            message = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            message = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            message = 'Incorrect password.';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Please check your connection.';
            break;
          default:
            message = error.message || 'An error occurred during sign in.';
        }
      }

      setErrorMessage(message);
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };
  
  const loginWithDemoAccount = (type: 'athlete' | 'fan') => {
    if (type === 'athlete') {
      setEmail('athlete@example.com');
      setPassword('password123');
    } else {
      setEmail('fan@example.com');
      setPassword('password123');
    }
    // Manually trigger login after a short delay to let the UI update
    setTimeout(() => {
      handleLogin();
    }, 500);
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.fanHubButton}
          onPress={() => router.push('/fan-hub')}
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
  }
});

export default Login;
