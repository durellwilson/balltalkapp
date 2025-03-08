import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';

const AuthTester = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const testCreateAccount = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      // Get direct access to Firebase Auth
      const auth = getAuth();
      
      // First create a test user document in Firestore (this will test Firestore connectivity)
      const testDocRef = doc(db, 'test_auth', 'test_document');
      await setDoc(testDocRef, {
        message: 'Test authentication document',
        createdAt: serverTimestamp()
      });
      
      setResult(result => result + '✅ Firestore write successful\n');
      
      // Now try to read from Firestore
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        setResult(result => result + '✅ Firestore read successful\n');
      } else {
        setResult(result => result + '❌ Firestore read failed\n');
      }
      
      // Check if Auth service is accessible
      if (auth) {
        setResult(result => result + '✅ Firebase Auth service accessible\n');
        
        try {
          // Try to sign in with the test credentials
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          setResult(result => result + `✅ Sign in successful: ${user.uid}\n`);
          Alert.alert('Success', 'Authentication test passed');
        } catch (signInError: any) {
          // This is expected if the user doesn't exist
          setResult(result => result + `ℹ️ Sign in failed: ${signInError.code}\n`);
          
          // Not necessarily an error if the user just doesn't exist yet
          if (signInError.code === 'auth/user-not-found') {
            setResult(result => result + '✅ Auth service working correctly\n');
          } else {
            setResult(result => result + '❌ Auth service error\n');
          }
        }
      } else {
        setResult(result => result + '❌ Firebase Auth service NOT accessible\n');
      }
      
      // Final verdict
      setResult(result => result + '\n🔍 DIAGNOSTIC COMPLETE');
    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`);
      console.error('Auth test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Tester</Text>
      <Text style={styles.description}>
        This tool tests Firebase Auth and Firestore connectivity directly.
      </Text>
      
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      
      <Button
        title="Run Authentication Test"
        onPress={testCreateAccount}
        disabled={isLoading}
      />
      
      {isLoading && <ActivityIndicator style={styles.loader} />}
      
      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Test Results:</Text>
          <Text style={styles.result}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  loader: {
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  result: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
});

export default AuthTester; 