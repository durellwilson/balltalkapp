import React, { Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import StudioInterface from '../../components/studio/StudioInterface';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/auth';
import { Button } from '../../components/themed';

/**
 * StudioScreen Component
 * 
 * The main screen for the studio feature, providing audio recording, editing,
 * and processing capabilities. Only accessible to users with the 'athlete' role.
 * 
 * @returns {React.ReactElement} The StudioScreen component
 */
export default function StudioScreen() {
  const { isDark, theme } = useTheme();
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';
  
  // Fallback component for when StudioInterface is loading
  const StudioFallback = () => (
    <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
      <ActivityIndicator size="large" color={theme?.tint || '#007AFF'} />
    </View>
  );
  
  // If user is not an athlete, show access denied message
  if (!isAthlete) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Studio Access Restricted
        </Text>
        <Text style={[styles.message, isDark && styles.messageDark]}>
          The Studio feature is only available to athlete accounts.
        </Text>
        <Button
          title="Go to Home"
          onPress={() => router.replace('/(tabs)/')}
          style={styles.button}
        />
      </View>
    );
  }
  
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFF',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  messageDark: {
    color: '#AAA',
  },
  button: {
    minWidth: 150,
  }
});
