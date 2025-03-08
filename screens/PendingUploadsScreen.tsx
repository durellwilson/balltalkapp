import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOfflineUpload } from '../hooks/useOfflineUpload';
import NetworkStatusIndicator from '../components/common/NetworkStatusIndicator';
import { formatDistanceToNow } from 'date-fns';

/**
 * Screen to view and manage pending uploads
 */
export default function PendingUploadsScreen() {
  const navigation = useNavigation();
  const { 
    pendingUploadsList, 
    pendingUploads,
    isOnline, 
    isSyncing, 
    syncNow,
    refreshPendingUploads
  } = useOfflineUpload();
  
  // Refresh pending uploads when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshPendingUploads();
    });
    
    return unsubscribe;
  }, [navigation, refreshPendingUploads]);
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="cloud-done" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No pending uploads</Text>
      <Text style={styles.emptySubtext}>
        {isOnline 
          ? 'All your uploads are complete!' 
          : 'You\'re offline. Uploads will sync when you reconnect.'}
      </Text>
    </View>
  );
  
  // Render a pending upload item
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
          {item.fileName}
        </Text>
        <Text style={styles.fileSize}>
          {formatFileSize(item.fileSize)}
        </Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>
          Created: {formatTimestamp(item.metadata.createdAt)}
        </Text>
        {item.lastAttempt && (
          <Text style={styles.detailText}>
            Last attempt: {formatTimestamp(item.lastAttempt)}
          </Text>
        )}
        <Text style={styles.detailText}>
          Attempts: {item.attempts}
        </Text>
      </View>
      
      <View style={styles.itemFooter}>
        <Text style={[
          styles.statusText,
          item.attempts >= 5 ? styles.statusFailed : styles.statusPending
        ]}>
          {item.attempts >= 5 ? 'Failed' : 'Pending'}
        </Text>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <NetworkStatusIndicator 
        pendingUploads={pendingUploads}
        isSyncing={isSyncing}
        onSyncPress={syncNow}
        showWhenOnline={true}
      />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Pending Uploads</Text>
        
        {pendingUploads > 0 && isOnline && (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={syncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>Sync All</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={pendingUploadsList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={pendingUploadsList.length === 0 ? { flex: 1 } : {}}
        refreshing={isSyncing}
        onRefresh={refreshPendingUploads}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  itemDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#ffcc00',
    color: '#333',
  },
  statusFailed: {
    backgroundColor: '#f44336',
    color: '#fff',
  },
}); 