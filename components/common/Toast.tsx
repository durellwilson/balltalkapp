import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence
} from 'react-native-reanimated';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  duration?: number;
}

/**
 * Toast Component
 * 
 * Displays toast notifications with different types and animations
 * 
 * @param {boolean} visible - Whether the toast is visible
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info, warning)
 * @param {function} onClose - Callback when toast is closed
 * @param {number} duration - Duration in milliseconds
 * @returns {React.ReactElement} The Toast component
 */
const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  const { theme, isDark } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  
  useEffect(() => {
    if (visible) {
      // Animate in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      
      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const hideToast = () => {
    // Animate out
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(-20, { duration: 300 });
    
    // Call onClose after animation completes
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  };
  
  // Get icon and color based on type
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: theme.success || '#34C759',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: theme.error || '#FF3B30',
          backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: theme.warning || '#FFCC00',
          backgroundColor: isDark ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 204, 0, 0.1)',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          color: theme.info || '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
        };
    }
  };
  
  const { icon, color, backgroundColor } = getIconAndColor();
  
  if (!visible && opacity.value === 0) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        styles.container,
        useAnimatedStyle(() => ({
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        })),
        { backgroundColor },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.message, { color: theme.text }]}>
          {message}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
        <Ionicons name="close" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast; 