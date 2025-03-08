import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '../contexts/auth';
import { auth, db, storage, firebaseApp } from '../src/lib/firebase';

export default function DebugScreen() {
  const { user, isLoading } = useAuth();
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [storageStatus, setStorageStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [authStatus, setAuthStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Check Firebase app initialization
    try {
      console.log('Firebase app initialization status:', firebaseApp ? 'success' : 'failed');
      setFirebaseStatus(firebaseApp ? 'connected' : 'error');
    } catch (error) {
      console.error('Firebase app check error:', error);
      setFirebaseStatus('error');
      setErrorDetails(error instanceof Error ? error.message : String(error));
    }

    // Check Firestore connection
    checkFirestore();

    // Check Auth connection
    checkAuth();

    // Check Storage connection
    checkStorage();
  }, []);

  const checkFirestore = async () => {
    try {
      // Try to get a document from Firestore
      const testCollection = db.collection('test_connection');
      const testDoc = await testCollection.doc('test').get();
      console.log('Firestore connection test:', testDoc ? 'success' : 'failed');
      setDbStatus('connected');
    } catch (error) {
      console.error('Firestore connection error:', error);
      setDbStatus('error');
    }
  };

  const checkAuth = async () => {
    try {
      const authInstance = auth();
      // Just check if auth instance exists
      console.log('Auth instance:', authInstance ? 'available' : 'unavailable');
      setAuthStatus(authInstance ? 'connected' : 'error');
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus('error');
    }
  };

  const checkStorage = async () => {
    try {
      // Try to list files in the root
      const storageRef = storage.ref('/');
      console.log('Storage reference:', storageRef ? 'available' : 'unavailable');
      setStorageStatus(storageRef ? 'connected' : 'error');
    } catch (error) {
      console.error('Storage check error:', error);
      setStorageStatus('error');
    }
  };

  const runAllChecks = () => {
    setFirebaseStatus('checking');
    setDbStatus('checking');
    setAuthStatus('checking');
    setStorageStatus('checking');
    setErrorDetails(null);
    
    // Re-run all checks
    try {
      console.log('Firebase app initialization status:', firebaseApp ? 'success' : 'failed');
      setFirebaseStatus(firebaseApp ? 'connected' : 'error');
    } catch (error) {
      console.error('Firebase app check error:', error);
      setFirebaseStatus('error');
      setErrorDetails(error instanceof Error ? error.message : String(error));
    }

    checkFirestore();
    checkAuth();
    checkStorage();
  };

  const getStatusColor = (status: 'checking' | 'connected' | 'error') => {
    switch (status) {
      case 'checking': return '#f5a623';
      case 'connected': return '#4cd964';
      case 'error': return '#ff3b30';
      default: return '#999';
    }
  };

  const getStatusText = (status: 'checking' | 'connected' | 'error') => {
    switch (status) {
      case 'checking': return 'Checking...';
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>BallTalk App Diagnostics</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Environment</Text>
        <Text style={styles.statusText}>Platform: {Platform.OS}</Text>
        <Text style={styles.statusText}>Version: {Platform.Version}</Text>
      </View>
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Firebase Status</Text>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Firebase App:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(firebaseStatus) }]}>
            {getStatusText(firebaseStatus)}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Firestore:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(dbStatus) }]}>
            {getStatusText(dbStatus)}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Authentication:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(authStatus) }]}>
            {getStatusText(authStatus)}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Storage:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(storageStatus) }]}>
            {getStatusText(storageStatus)}
          </Text>
        </View>
      </View>
      
      {errorDetails && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>{errorDetails}</Text>
        </View>
      )}
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Authentication Status</Text>
        <Text style={styles.statusText}>
          User: {isLoading ? 'Loading...' : (user ? `Logged in as ${user.email}` : 'Not logged in')}
        </Text>
        {user && (
          <>
            <Text style={styles.statusText}>User ID: {user.uid}</Text>
            <Text style={styles.statusText}>Name: {user.displayName || 'Not set'}</Text>
            <Text style={styles.statusText}>Role: {user.role || 'Not set'}</Text>
          </>
        )}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={runAllChecks}>
        <Text style={styles.buttonText}>Run All Checks Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  errorSection: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 