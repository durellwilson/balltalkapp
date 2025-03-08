import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { firebaseDb as db } from '../config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export default function FirebaseVerification() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking Firebase connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirestore = async () => {
      try {
        const q = query(collection(db, 'users'), limit(1));
        const snapshot = await getDocs(q);
        console.log('Firestore connected successfully:', snapshot.docs.length);
        setStatus('success');
        setMessage(`Firestore connected successfully. Found ${snapshot.docs.length} users.`);
      } catch (error) {
        console.error('Firestore error:', error);
        setStatus('error');
        setMessage('Failed to connect to Firestore');
        setError(error instanceof Error ? error.message : String(error));
      }
    };
    
    testFirestore();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Verification</Text>
      
      <View style={[styles.card, status === 'error' ? styles.errorCard : null]}>
        <Text style={styles.statusText}>
          Status: {status === 'loading' ? 'Checking...' : status === 'success' ? 'Connected ✅' : 'Error ❌'}
        </Text>
        <Text style={styles.messageText}>{message}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>Firebase initialized: {db ? '✅' : '❌'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorCard: {
    backgroundColor: '#fff8f8',
    borderColor: '#ffdddd',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 