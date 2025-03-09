import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  showOfflineBanner: boolean;
  hideOfflineBanner: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  showOfflineBanner: false,
  hideOfflineBanner: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);
  
  // Use a ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize handleNetworkChange to prevent recreation on every render
  const handleNetworkChange = useCallback((state: NetInfoState) => {
    if (!isMountedRef.current) return;
    
    const newIsConnected = state.isConnected !== null ? state.isConnected : false;
    
    // Only update state if values have changed to prevent unnecessary rerenders
    if (newIsConnected !== isConnected) {
      setIsConnected(newIsConnected);
    }
    
    if (state.isInternetReachable !== isInternetReachable) {
      setIsInternetReachable(state.isInternetReachable);
    }
    
    if (state.type !== connectionType) {
      setConnectionType(state.type);
    }

    // Log network status for debugging
    console.log('[NetworkContext] Network state changed:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: Platform.OS === 'android' ? state.details : null
    });
  }, [isConnected, isInternetReachable, connectionType]);

  useEffect(() => {
    // Handle initial connection status
    const getNetworkInfo = async () => {
      try {
        const state = await NetInfo.fetch();
        handleNetworkChange(state);
      } catch (error) {
        console.error('[NetworkContext] Error fetching initial network state:', error);
      }
    };

    getNetworkInfo();

    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  // Update showOfflineBanner when connectivity changes in a separate effect
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Only update state if it would change - prevent unnecessary re-renders
    const shouldShowBanner = !isConnected || isInternetReachable === false;
    
    if (shouldShowBanner !== showOfflineBanner) {
      setShowOfflineBanner(shouldShowBanner);
    }
  }, [isConnected, isInternetReachable, showOfflineBanner]);

  // Memoize hideOfflineBanner to prevent recreation on every render
  const hideOfflineBanner = useCallback(() => {
    if (!isMountedRef.current) return;
    setShowOfflineBanner(false);
  }, []);

  // Memoize context value to prevent unnecessary rerenders 
  const contextValue = useMemo(() => ({
    isConnected,
    isInternetReachable,
    connectionType,
    showOfflineBanner,
    hideOfflineBanner,
  }), [isConnected, isInternetReachable, connectionType, showOfflineBanner, hideOfflineBanner]);

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
});

export default NetworkContext; 