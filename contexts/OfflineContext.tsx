import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordError, ErrorCategory } from '../utils/errorReporting';

interface OfflineContextType {
  isOffline: boolean;
  hasOfflineData: boolean;
  isCheckingConnection: boolean;
  saveForOffline: <T>(key: string, data: T) => Promise<void>;
  getOfflineData: <T>(key: string) => Promise<T | null>;
  clearOfflineData: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  lastOnlineTime: Date | null;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  hasOfflineData: false,
  isCheckingConnection: false,
  saveForOffline: async () => {},
  getOfflineData: async () => null,
  clearOfflineData: async () => {},
  checkConnection: async () => false,
  lastOnlineTime: null,
});

/**
 * Hook to access the offline context
 */
export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: React.ReactNode;
}

/**
 * OfflineProvider Component
 * 
 * Provides offline state management and data persistence.
 * Tracks network connectivity and provides methods for offline data handling.
 * 
 * @example
 * <OfflineProvider>
 *   <App />
 * </OfflineProvider>
 */
export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  
  // Check for offline data on mount
  useEffect(() => {
    checkOfflineData();
    loadLastOnlineTime();
  }, []);
  
  // Subscribe to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleNetInfoChange);
    
    // Initial check
    NetInfo.fetch().then(handleNetInfoChange);
    
    return () => unsubscribe();
  }, []);
  
  // Handle network state changes
  const handleNetInfoChange = (state: NetInfoState) => {
    const offline = !(state.isConnected && state.isInternetReachable);
    setIsOffline(offline);
    
    // Update last online time when coming online
    if (!offline) {
      const now = new Date();
      setLastOnlineTime(now);
      saveLastOnlineTime(now);
    }
  };
  
  // Save the last time the device was online
  const saveLastOnlineTime = async (time: Date) => {
    try {
      await AsyncStorage.setItem('offline_last_online', time.toISOString());
    } catch (error) {
      recordError(error, 'OfflineContext', ErrorCategory.STORAGE);
    }
  };
  
  // Load the last time the device was online
  const loadLastOnlineTime = async () => {
    try {
      const timeString = await AsyncStorage.getItem('offline_last_online');
      if (timeString) {
        setLastOnlineTime(new Date(timeString));
      }
    } catch (error) {
      recordError(error, 'OfflineContext', ErrorCategory.STORAGE);
    }
  };
  
  // Check if we have any offline data
  const checkOfflineData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_data_'));
      setHasOfflineData(offlineKeys.length > 0);
    } catch (error) {
      recordError(error, 'OfflineContext.checkOfflineData', ErrorCategory.STORAGE);
    }
  };
  
  // Save data for offline use
  const saveForOffline = async <T,>(key: string, data: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(`offline_data_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      setHasOfflineData(true);
    } catch (error) {
      recordError(error, 'OfflineContext.saveForOffline', ErrorCategory.STORAGE);
    }
  };
  
  // Get offline data
  const getOfflineData = async <T,>(key: string): Promise<T | null> => {
    try {
      const storedData = await AsyncStorage.getItem(`offline_data_${key}`);
      if (!storedData) return null;
      
      const { data } = JSON.parse(storedData);
      return data as T;
    } catch (error) {
      recordError(error, 'OfflineContext.getOfflineData', ErrorCategory.STORAGE);
      return null;
    }
  };
  
  // Clear all offline data
  const clearOfflineData = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_data_'));
      
      if (offlineKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineKeys);
        setHasOfflineData(false);
      }
    } catch (error) {
      recordError(error, 'OfflineContext.clearOfflineData', ErrorCategory.STORAGE);
    }
  };
  
  // Check connection status
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    
    try {
      const state = await NetInfo.fetch();
      const isConnected = !!(state.isConnected && state.isInternetReachable);
      
      setIsOffline(!isConnected);
      
      if (isConnected) {
        const now = new Date();
        setLastOnlineTime(now);
        saveLastOnlineTime(now);
      }
      
      return isConnected;
    } catch (error) {
      recordError(error, 'OfflineContext.checkConnection', ErrorCategory.NETWORK);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);
  
  const contextValue: OfflineContextType = {
    isOffline,
    hasOfflineData,
    isCheckingConnection,
    saveForOffline,
    getOfflineData,
    clearOfflineData,
    checkConnection,
    lastOnlineTime,
  };
  
  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineProvider; 