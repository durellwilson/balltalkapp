import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../contexts/NetworkContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeProvider';

const OfflineIndicator: React.FC = React.memo(() => {
  const { isConnected, isInternetReachable, showOfflineBanner, hideOfflineBanner } = useNetwork();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  
  const animation = useRef(new Animated.Value(0)).current;
  
  // Show/hide animation based on connection status
  useEffect(() => {
    const shouldShow = (!isConnected || isInternetReachable === false) && showOfflineBanner;
    
    Animated.timing(animation, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, isInternetReachable, showOfflineBanner, animation]);
  
  // If we're connected, don't render anything
  if ((isConnected && isInternetReachable !== false) || !showOfflineBanner) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: animation,
          backgroundColor: theme.error,
          paddingTop: insets.top > 0 ? insets.top : 10,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={24} color="#fff" />
        <Text style={styles.text}>You're offline</Text>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={hideOfflineBanner}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    padding: 5,
  },
});

export default OfflineIndicator; 