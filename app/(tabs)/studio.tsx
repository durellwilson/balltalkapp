import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Studio Tab - Simple implementation with direct navigation options
 * Links to the consolidated studio features in the /app/studio directory
 */
export default function StudioTab() {
  const router = useRouter();
  
  const studioOptions = [
    {
      title: 'Recording Studio',
      icon: 'mic' as keyof typeof Ionicons.glyphMap,
      route: '/studio',
      description: 'Record and layer audio tracks'
    },
    {
      title: 'Audio Mastering',
      icon: 'pulse',
      route: '/studio/mastering',
      description: 'Professional sound enhancement'
    },
    {
      title: 'Vocal Isolation',
      icon: 'mic-outline',
      route: '/studio/vocal-isolation',
      description: 'Separate vocals from music'
    },
    {
      title: 'Save & Export',
      icon: 'save',
      route: '/studio/save-processed-audio',
      description: 'Save and export your audio'
    },
    {
      title: 'Audio Library',
      icon: 'library',
      route: '/studio/library',
      description: 'Browse and manage your tracks'
    },
    {
      title: 'Batch Processing',
      icon: 'layers',
      route: '/studio/batch',
      description: 'Process multiple files at once'
    },
    {
      title: 'Dolby Audio Demo',
      icon: 'musical-notes',
      route: '/studio/dolby',
      description: 'Experience Dolby audio technology'
    }
  ];
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Studio',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>
          Audio Production Tools
        </Text>
        
        <View style={styles.optionsContainer}>
          {studioOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={() => router.push(option.route)}
            >
              <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={32} color="#007AFF" />
              <Text style={styles.optionTitle}>
                {option.title}
              </Text>
              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  optionCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});
