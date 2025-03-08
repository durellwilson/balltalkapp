import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { firebaseApp } from './config/firebase';
import TestScreen from './screens/TestScreen';
import AudioUploadScreen from './screens/AudioUploadScreen';
import PendingUploadsScreen from './screens/PendingUploadsScreen';
import { AuthProvider } from './contexts/auth';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkErrorBoundary from './components/common/NetworkErrorBoundary';
import SyncService from './services/SyncService';
import AudioMasteringScreen from './screens/AudioMasteringScreen';
import SaveProcessedAudioScreen from './screens/SaveProcessedAudioScreen';

// Create the stack navigator
const Stack = createNativeStackNavigator();

// Create a Home screen component to let users navigate to different screens
const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BallTalk</Text>
      <Text style={styles.subtitle}>Audio Recording & Upload</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Audio Features</Text>
        <Text style={styles.cardText}>
          Record audio or upload audio files with our improved audio handling system.
        </Text>
        <Button 
          title="Upload Audio" 
          onPress={() => navigation.navigate('AudioUpload')}
        />
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offline Features</Text>
        <Text style={styles.cardText}>
          View and manage pending uploads that will sync when you're online.
        </Text>
        <Button 
          title="Pending Uploads" 
          onPress={() => navigation.navigate('PendingUploads')}
        />
      </View>
      
      <Button 
        title="Go to Test Screen" 
        onPress={() => navigation.navigate('Test')} 
      />
    </View>
  );
};

// App component wrapped with ErrorBoundary and NetworkErrorBoundary
export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize Firebase and other services
    const initializeApp = async () => {
      try {
        // Initialize SyncService for offline uploads
        SyncService.initialize().catch(err => {
          console.error('Failed to initialize sync service:', err);
        });
        
        // Simulate initialization delay
        setTimeout(() => {
          setInitialized(true);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
      }
    };

    initializeApp();
    
    // Clean up on unmount
    return () => {
      // Clean up SyncService
      SyncService.cleanup();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading BallTalk...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Log error to an error reporting service like Firebase Crashlytics
        console.error('App Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        
        // You could send this to a logging service in production
        if (!__DEV__) {
          // Example: firebase.crashlytics().recordError(error);
        }
      }}
    >
      <NetworkErrorBoundary
        onRetry={() => {
          // Reload the app when connectivity is restored
          console.log('Network connectivity restored, reloading app');
        }}
      >
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Home">
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Test" 
                  component={TestScreen}
                  options={{ title: "Testing" }}
                />
                <Stack.Screen 
                  name="AudioUpload" 
                  component={AudioUploadScreen}
                  options={{ title: "Upload Audio" }}
                />
                <Stack.Screen 
                  name="AudioMastering" 
                  component={AudioMasteringScreen}
                  options={{ title: "Master Your Audio" }}
                />
                <Stack.Screen 
                  name="SaveProcessedAudio" 
                  component={SaveProcessedAudioScreen}
                  options={{ title: "Save Processed Audio" }}
                />
                <Stack.Screen 
                  name="PendingUploads" 
                  component={PendingUploadsScreen}
                  options={{ title: "Pending Uploads" }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    fontSize: 16,
    color: '#ff3b30',
    marginVertical: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
}); 