import React, { Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import StudioInterface from '../../components/studio/StudioInterface';
import { useTheme } from '../../hooks/useTheme';

/**
 * StudioScreen Component
 * 
 * The main screen for the studio feature, providing audio recording, editing,
 * and processing capabilities.
 * 
 * @returns {React.ReactElement} The StudioScreen component
 */
export default function StudioScreen() {
  const { isDark, theme } = useTheme();
  
  // Fallback component for when StudioInterface is loading
  const StudioFallback = () => (
    <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
      <ActivityIndicator size="large" color={theme?.tint || '#007AFF'} />
    </View>
  );
  
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen
        options={{
          title: 'Studio',
          headerShown: false,
        }}
      />
      
      <Suspense fallback={<StudioFallback />}>
        <StudioInterface />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
