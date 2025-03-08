import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MaterialIcons } from '@expo/vector-icons';

interface NetworkStatusIndicatorProps {
  pendingUploads?: number;
  isSyncing?: boolean;
  onSyncPress?: () => void;
  showWhenOnline?: boolean;
}

/**
 * Component to display network status and pending uploads
 * 
 * @param props Component props
 * @returns JSX.Element
 * 
 * @example
 * <NetworkStatusIndicator 
 *   pendingUploads={3} 
 *   isSyncing={false} 
 *   onSyncPress={handleSync} 
 * />
 */
export default function NetworkStatusIndicator({
  pendingUploads = 0,
  isSyncing = false,
  onSyncPress,
  showWhenOnline = false
}: NetworkStatusIndicatorProps) {
  const { isConnected: isOnline } = useNetworkStatus();
  
  // Don't show anything when online with no pending uploads unless showWhenOnline is true
  if (isOnline && pendingUploads === 0 && !showWhenOnline) {
    return null;
  }
  
  return (
    <View style={[
      styles.container,
      isOnline ? styles.onlineContainer : styles.offlineContainer
    ]}>
      <View style={styles.statusRow}>
        <MaterialIcons 
          name={isOnline ? "cloud-done" : "cloud-off"} 
          size={20} 
          color={isOnline ? "#fff" : "#333"} 
        />
        <Text style={[
          styles.statusText,
          isOnline ? styles.onlineText : styles.offlineText
        ]}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </Text>
      </View>
      
      {pendingUploads > 0 && (
        <View style={styles.uploadRow}>
          <Text style={[
            styles.pendingText,
            isOnline ? styles.onlineText : styles.offlineText
          ]}>
            {pendingUploads} pending upload{pendingUploads !== 1 ? 's' : ''}
          </Text>
          
          {isOnline && onSyncPress && !isSyncing && (
            <TouchableOpacity onPress={onSyncPress} style={styles.syncButton}>
              <Text style={styles.syncText}>Sync Now</Text>
            </TouchableOpacity>
          )}
          
          {isSyncing && (
            <ActivityIndicator 
              size="small" 
              color={isOnline ? "#fff" : "#333"} 
              style={styles.syncingIndicator} 
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
  },
  onlineContainer: {
    backgroundColor: '#2196f3',
  },
  offlineContainer: {
    backgroundColor: '#ffcc00',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  onlineText: {
    color: '#ffffff',
  },
  offlineText: {
    color: '#333333',
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  pendingText: {
    fontSize: 14,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  syncText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncingIndicator: {
    marginLeft: 10,
  },
}); 