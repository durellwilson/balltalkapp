import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  async function handleLogin() {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully:', userCredential.user.uid);
      setSuccess(true);
      // In a real app, navigation would be handled by an auth state listener
      // navigation.navigate('Home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to BallTalk</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Login successful!</Text> : null}
        
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <Button
            title="Login"
            onPress={handleLogin}
            disabled={loading}
          />
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>Firebase Auth initialized: {auth ? '✅' : '❌'}</Text>
        <Text style={styles.infoText}>
          Note: This is a test login screen. In a real app, you would have proper navigation
          and user state management.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    fontSize: 16,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 16,
    fontSize: 14,
  },
  success: {
    color: '#388e3c',
    marginBottom: 16,
    fontSize: 14,
  },
  loader: {
    marginVertical: 16,
  },
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
}); 