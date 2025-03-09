import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  details: NetInfoState['details'];
  isCheckingConnection: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
}

/**
 * useNetwork Hook
 * 
 * Provides network connectivity information and methods to check connection.
 * 
 * @example
 * const { isConnected, isInternetReachable, checkConnection } = useNetwork();
 * 
 * // Check if we're online
 * if (!isConnected) {
 *   return <OfflineNotice />;
 * }
 * 
 * // Force a connection check
 * const handleRefresh = async () => {
 *   const isOnline = await checkConnection();
 *   if (isOnline) {
 *     loadData();
 *   }
 * };
 */
export const useNetwork = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    type: 'unknown',
    isConnected: true,
    isInternetReachable: true,
    details: null,
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  // Update network state when it changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState(state);
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      setNetworkState(state);
      setLastChecked(new Date());
    });
    
    return () => unsubscribe();
  }, []);
  
  // Function to manually check connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    
    try {
      const state = await NetInfo.fetch();
      setNetworkState(state);
      setLastChecked(new Date());
      
      return !!(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);
  
  // Determine if we're on WiFi
  const isWifi = networkState.type === 'wifi';
  
  // Determine if we're on cellular
  const isCellular = 
    networkState.type === 'cellular' || 
    networkState.type === '3g' || 
    networkState.type === '4g' || 
    networkState.type === '5g' || 
    networkState.type === 'edge' || 
    networkState.type === 'hspa' || 
    networkState.type === 'lte';
  
  return {
    isConnected: networkState.isConnected === true,
    isInternetReachable: networkState.isInternetReachable,
    type: networkState.type,
    isWifi,
    isCellular,
    details: networkState.details,
    isCheckingConnection,
    lastChecked,
    checkConnection,
  };
};

export default useNetwork; 