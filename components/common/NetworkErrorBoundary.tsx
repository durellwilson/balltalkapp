import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import NetworkErrorHandler from '../../services/NetworkErrorHandler';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  testID?: string;
}

/**
 * A component that displays a fallback UI when there is no network connectivity
 * and provides retry functionality when connectivity is restored.
 */
const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({
  children,
  onRetry,
  testID,
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  
  useEffect(() => {
    const networkHandler = NetworkErrorHandler.getInstance();
    
    // Subscribe to network connectivity changes
    const unsubscribe = networkHandler.addConnectivityListener((connected) => {
      setIsConnected(connected);
      
      // If connectivity is restored and we were retrying, trigger the retry
      if (connected && isRetrying) {
        handleRetry();
      }
    });
    
    // Check current connectivity status
    networkHandler.checkConnectivity().then(setIsConnected);
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [isRetrying]);
  
  const handleRetry = () => {
    setIsRetrying(true);
    
    // If we're already connected, trigger the retry immediately
    if (isConnected) {
      if (onRetry) {
        onRetry();
      }
      setIsRetrying(false);
    }
    // Otherwise, wait for connectivity to be restored (handled in the effect)
  };
  
  // If connected, render children
  if (isConnected) {
    return <>{children}</>;
  }
  
  // Otherwise, render the fallback UI
  return (
    <View style={styles.container} testID={testID || 'network-error-boundary'}>
      <Image 
        source={require('../../assets/images/no-connection.png')} 
        style={styles.image}
        testID="no-connection-image"
      />
      
      <Text style={styles.title}>No Internet Connection</Text>
      
      <Text style={styles.message}>
        Please check your internet connection and try again.
      </Text>
      
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRetry}
        disabled={isRetrying}
        testID="retry-connection-button"
      >
        <Ionicons 
          name={isRetrying ? "sync-circle" : "refresh"} 
          size={20} 
          color="#FFFFFF" 
          style={isRetrying ? styles.spinningIcon : undefined}
        />
        <Text style={styles.retryButtonText}>
          {isRetrying ? 'Waiting for Connection...' : 'Retry'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral100,
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.neutral900,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.neutral700,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  spinningIcon: {
    transform: [{ rotate: '45deg' }],
  },
});

export default NetworkErrorBoundary; 