import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Hook for displaying toast notifications
 * Provides methods for showing toast messages with different types
 */
export const useToast = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Show a toast notification
   * @param message - Toast message
   * @param type - Toast type (success, error, info, warning)
   * @param duration - Duration in milliseconds
   */
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set the new toast
    setToast({ message, type, duration });
    setVisible(true);
    
    // Hide after duration
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      
      // Clear toast after animation
      setTimeout(() => {
        setToast(null);
      }, 300);
    }, duration);
    
    // Use native toast on web if available
    if (Platform.OS === 'web') {
      try {
        // Try to use the browser's toast notification if available
        if (typeof window !== 'undefined' && 'Notification' in window) {
          // This is just a fallback, in a real app you'd use a proper toast library
          console.log(`[${type.toUpperCase()}] ${message}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }
  };
  
  /**
   * Hide the current toast
   */
  const hideToast = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setVisible(false);
    
    // Clear toast after animation
    setTimeout(() => {
      setToast(null);
    }, 300);
  };
  
  return {
    toast,
    visible,
    showToast,
    hideToast,
  };
};

export default useToast; 