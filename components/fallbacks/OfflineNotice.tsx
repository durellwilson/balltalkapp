import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineNoticeProps {
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * OfflineNotice Component
 * 
 * Displays a banner when the device is offline.
 * Optionally shows a retry button to attempt reconnection.
 * 
 * @example
 * <OfflineNotice showRetry onRetry={() => checkConnection()} />
 */
const OfflineNotice: React.FC<OfflineNoticeProps> = ({ 
  onRetry, 
  showRetry = false 
}) => {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  
  // Don't show anything if we're connected
  if (netInfo.isConnected === true) {
    return null;
  }
  
  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top > 0 ? insets.top : 10 }
    ]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={24} color="white" />
        <Text style={styles.text}>No internet connection</Text>
        
        {showRetry && onRetry && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default OfflineNotice; 