import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetworkErrorHandler from '../../services/NetworkErrorHandler';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  testID?: string;
}

/**
 * NetworkErrorContent - displays the error UI when there's no connection
 */
const NetworkErrorContent = React.memo(({ 
  isRetrying, 
  onRetry 
}: { 
  isRetrying: boolean; 
  onRetry: () => void;
}) => {
  // Style memoization
  const retryButtonStyle = useMemo(() => [
    styles.retryButton,
    isRetrying && styles.retryButtonDisabled
  ], [isRetrying]);
  
  const iconStyle = useMemo(() => 
    isRetrying ? styles.spinningIcon : undefined, 
    [isRetrying]
  );
  
  return (
    <View style={styles.container} testID="network-error-boundary">
      <View style={styles.iconContainer} testID="no-connection-icon">
        <Ionicons name="cloud-offline" size={80} color={Colors.warning} />
      </View>
      
      <Text style={styles.title}>No Internet Connection</Text>
      
      <Text style={styles.message}>
        Please check your internet connection and try again.
      </Text>
      
      <TouchableOpacity 
        style={retryButtonStyle} 
        onPress={onRetry}
        disabled={isRetrying}
        testID="retry-connection-button"
      >
        <Ionicons 
          name={isRetrying ? "sync-circle" : "refresh"} 
          size={20} 
          color="#FFFFFF" 
          style={iconStyle}
        />
        <Text style={styles.retryButtonText}>
          {isRetrying ? 'Waiting for Connection...' : 'Retry'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

/**
 * A boundary component that displays a fallback UI when there's no network connectivity
 */
const NetworkErrorBoundary = ({ children, onRetry, testID }: NetworkErrorBoundaryProps) => {
  // Maintain connectivity state with stable references
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Single NetworkErrorHandler instance using ref to prevent recreation
  const networkHandlerRef = useRef<NetworkErrorHandler>();
  if (!networkHandlerRef.current) {
    networkHandlerRef.current = NetworkErrorHandler.getInstance();
  }
  
  // Mounted state tracking
  const isMountedRef = useRef(true);
  
  // On unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle connectivity changes
  useEffect(() => {
    const handler = networkHandlerRef.current;
    if (!handler) return;
    
    // Safe state setter to prevent updates after unmount
    const safeSetState = (connected: boolean) => {
      if (isMountedRef.current) {
        setIsConnected(connected);
      }
    };
    
    // Check current connectivity status first
    handler.checkConnectivity().then(safeSetState);
    
    // Subscribe to connectivity changes
    const unsubscribe = handler.addConnectivityListener((connected) => {
      if (!isMountedRef.current) return;
      
      safeSetState(connected);
      
      // Handle successful connection during retry state
      if (connected && isMountedRef.current) {
        // Use functional update to access the latest state
        setIsRetrying(currentIsRetrying => {
          if (currentIsRetrying && onRetry) {
            onRetry();
          }
          return currentIsRetrying ? false : currentIsRetrying;
        });
      }
    });
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [onRetry]);
  
  // Handle retry press
  const handleRetry = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsRetrying(true);
    
    if (isConnected && onRetry) {
      onRetry();
      setIsRetrying(false);
    }
  }, [isConnected, onRetry]);
  
  // If connected, render children
  if (isConnected) {
    return <>{children}</>;
  }
  
  // Otherwise, show error content
  return <NetworkErrorContent isRetrying={isRetrying} onRetry={handleRetry} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral100,
    padding: 20,
  },
  iconContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 75,
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
  retryButtonDisabled: {
    opacity: 0.7,
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