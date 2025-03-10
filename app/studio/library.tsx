/**
 * Audio Library Screen
 * 
 * This screen will provide access to the user's audio library.
 * It will be implemented in a future update.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function LibraryScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Audio Library',
        }}
      />
      <View style={styles.content}>
        <Ionicons name="library-outline" size={64} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>
          Coming Soon
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          The audio library feature is under development and will be available in a future update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
}); 