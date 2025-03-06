import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth';

const Signup = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'athlete' | 'fan'>('fan');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Signing up as ${role} with username: ${username}`);
      
      // Use the auth context to sign up with username and role
      await signUp(email, password, username, role);

      Alert.alert('Success', `Account created successfully as a ${role}`);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Error', error instanceof Error ? error.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>BallTalk</Text>
        <Text style={styles.subtitle}>Create your account</Text>

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
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
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
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'fan' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('fan')}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'fan' && styles.roleButtonTextActive,
                ]}
              >
                Fan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'athlete' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('athlete')}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'athlete' && styles.roleButtonTextActive,
                ]}
              >
                Athlete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up with Email</Text>
          )}
        </TouchableOpacity>
        
        <SocialAuthButtons 
          isSignUp={true}
          onAuthStart={() => setIsLoading(true)}
          onAuthEnd={() => setIsLoading(false)}
          username={username}
          role={role}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
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
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333'
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%'
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  roleButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  roleButtonText: {
    fontWeight: '500',
    color: '#666'
  },
  roleButtonTextActive: {
    color: 'white'
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
  loginText: {
    color: '#007bff',
    fontWeight: 'bold'
  }
});

export default Signup;
