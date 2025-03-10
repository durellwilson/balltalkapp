import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { useTheme } from '../../hooks/useTheme';
import { useNetwork } from '../../contexts/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth, storage } from '../../config/firebase';
import MessageService from '../../services/MessageService';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatDiagnostics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isConnected, isInternetReachable } = useNetwork();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<{
    name: string;
    status: 'success' | 'warning' | 'error' | 'pending';
    message: string;
  }[]>([]);
  
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  const runDiagnostics = async () => {
    setLoading(true);
    setDiagnosticResults([]);
    
    // Check authentication
    const authCheck = {
      name: 'Authentication',
      status: 'pending' as const,
      message: 'Checking authentication status...'
    };
    setDiagnosticResults(prev => [...prev, authCheck]);
    
    if (!user) {
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Authentication' 
            ? { ...item, status: 'error', message: 'Not authenticated. Please log in.' }
            : item
        )
      );
    } else {
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Authentication' 
            ? { ...item, status: 'success', message: `Authenticated as ${user.email}` }
            : item
        )
      );
    }
    
    // Check network connectivity
    const networkCheck = {
      name: 'Network Connectivity',
      status: 'pending' as const,
      message: 'Checking network status...'
    };
    setDiagnosticResults(prev => [...prev, networkCheck]);
    
    if (!isConnected) {
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Network Connectivity' 
            ? { ...item, status: 'error', message: 'No network connection detected.' }
            : item
        )
      );
    } else if (!isInternetReachable) {
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Network Connectivity' 
            ? { ...item, status: 'warning', message: 'Connected to network but internet may not be reachable.' }
            : item
        )
      );
    } else {
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Network Connectivity' 
            ? { ...item, status: 'success', message: 'Connected to network with internet access.' }
            : item
        )
      );
    }
    
    // Check Firebase connection
    const firebaseCheck = {
      name: 'Firebase Connection',
      status: 'pending' as const,
      message: 'Checking Firebase connection...'
    };
    setDiagnosticResults(prev => [...prev, firebaseCheck]);
    
    try {
      // Try to access Firestore
      const testDoc = doc(db, 'system', 'status');
      await getDoc(testDoc);
      
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Firebase Connection' 
            ? { ...item, status: 'success', message: 'Successfully connected to Firebase.' }
            : item
        )
      );
    } catch (error) {
      console.error('Firebase connection error:', error);
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Firebase Connection' 
            ? { ...item, status: 'error', message: `Failed to connect to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}` }
            : item
        )
      );
    }
    
    // Check if user has conversations
    if (user) {
      const conversationsCheck = {
        name: 'User Conversations',
        status: 'pending' as const,
        message: 'Checking user conversations...'
      };
      setDiagnosticResults(prev => [...prev, conversationsCheck]);
      
      try {
        const conversations = await MessageService.getUserConversations(user.uid);
        
        if (conversations.length === 0) {
          setDiagnosticResults(prev => 
            prev.map(item => 
              item.name === 'User Conversations' 
                ? { ...item, status: 'warning', message: 'No conversations found for this user.' }
                : item
            )
          );
        } else {
          setDiagnosticResults(prev => 
            prev.map(item => 
              item.name === 'User Conversations' 
                ? { ...item, status: 'success', message: `Found ${conversations.length} conversations.` }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Error checking conversations:', error);
        setDiagnosticResults(prev => 
          prev.map(item => 
            item.name === 'User Conversations' 
              ? { ...item, status: 'error', message: `Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}` }
              : item
          )
        );
      }
    }
    
    // Check local storage
    const storageCheck = {
      name: 'Local Storage',
      status: 'pending' as const,
      message: 'Checking local storage...'
    };
    setDiagnosticResults(prev => [...prev, storageCheck]);
    
    try {
      await AsyncStorage.setItem('chat_diagnostics_test', 'test_value');
      const testValue = await AsyncStorage.getItem('chat_diagnostics_test');
      
      if (testValue === 'test_value') {
        setDiagnosticResults(prev => 
          prev.map(item => 
            item.name === 'Local Storage' 
              ? { ...item, status: 'success', message: 'Local storage is working correctly.' }
              : item
          )
        );
        await AsyncStorage.removeItem('chat_diagnostics_test');
      } else {
        setDiagnosticResults(prev => 
          prev.map(item => 
            item.name === 'Local Storage' 
              ? { ...item, status: 'warning', message: 'Local storage test failed.' }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Local storage error:', error);
      setDiagnosticResults(prev => 
        prev.map(item => 
          item.name === 'Local Storage' 
            ? { ...item, status: 'error', message: `Local storage error: ${error instanceof Error ? error.message : 'Unknown error'}` }
            : item
        )
      );
    }
    
    setLoading(false);
  };
  
  const clearChatCache = async () => {
    try {
      setLoading(true);
      
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter chat-related keys
      const chatKeys = keys.filter(key => 
        key.startsWith('user_conversations_') || 
        key.startsWith('chat_') || 
        key.startsWith('message_')
      );
      
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
        Alert.alert('Success', `Cleared ${chatKeys.length} chat-related cache items.`);
      } else {
        Alert.alert('Info', 'No chat cache found to clear.');
      }
    } catch (error) {
      console.error('Error clearing chat cache:', error);
      Alert.alert('Error', `Failed to clear chat cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      await auth.signOut();
      Alert.alert('Success', 'Signed out successfully. Please sign in again to refresh your authentication.');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', `Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const renderStatusIcon = (status: 'success' | 'warning' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color={theme.success} />;
      case 'warning':
        return <Ionicons name="alert-circle" size={24} color={theme.warning} />;
      case 'error':
        return <Ionicons name="close-circle" size={24} color={theme.error} />;
      case 'pending':
        return <ActivityIndicator size="small" color={theme.primary} />;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Chat Diagnostics</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Diagnostic Results</Text>
        
        {diagnosticResults.map((result, index) => (
          <View 
            key={index} 
            style={[
              styles.resultItem, 
              { 
                backgroundColor: theme.card,
                borderLeftColor: 
                  result.status === 'success' ? theme.success :
                  result.status === 'warning' ? theme.warning :
                  result.status === 'error' ? theme.error :
                  theme.border
              }
            ]}
          >
            <View style={styles.resultHeader}>
              <Text style={[styles.resultName, { color: theme.text }]}>{result.name}</Text>
              {renderStatusIcon(result.status)}
            </View>
            <Text style={[styles.resultMessage, { color: theme.textSecondary }]}>{result.message}</Text>
          </View>
        ))}
        
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={runDiagnostics}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Run Diagnostics Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.warning }]}
          onPress={clearChatCache}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Chat Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.error }]}
          onPress={signOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Out & Refresh Auth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.info }]}
          onPress={() => router.push('/chat')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Return to Chat</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Running diagnostics...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 14,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 