import React from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

/**
 * ChatTab component that redirects to the chat functionality
 * This ensures the chat tab is properly linked to the chat screens
 */
export default function ChatTab() {
  // Use useFocusEffect to navigate only when the tab is focused
  // This prevents the infinite loop of redirects
  useFocusEffect(
    React.useCallback(() => {
      // Navigate to chat screen when this tab is focused
      router.replace('/chat');
      
      // No cleanup needed
      return () => {};
    }, [])
  );
  
  // Return an empty view - the navigation happens via the effect
  return <View />;
}
