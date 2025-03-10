/**
 * Studio Screen - Recorder Interface
 * 
 * This is the main entry point for the Studio feature in the app directory structure.
 * It provides a simplified recorder interface with two modes:
 * 1. Basic Recorder - Simple audio recording with playback
 * 2. Layered Recorder - Advanced recording with multiple audio layers
 * 
 * For the full studio experience with audio processing, mastering, and uploads,
 * see the related screens:
 * - /app/audio-mastering.tsx
 * - /app/save-processed-audio.tsx
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import BasicRecorder from '../../components/audio/recorder/BasicRecorder';
import LayeredRecorder from '../../components/audio/recorder/LayeredRecorder';
import { SafeAreaView } from 'react-native-safe-area-context';

type RecordingMode = 'basic' | 'layered';

export default function StudioScreen() {
  const { theme } = useTheme();
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('layered');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Studio',
          headerStyle: {
            backgroundColor: theme.cardBackground,
          },
          headerTintColor: theme.text,
        }}
      />
      
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            recordingMode === 'basic' && [styles.activeMode, { borderColor: theme.primary }]
          ]}
          onPress={() => setRecordingMode('basic')}
        >
          <Ionicons 
            name="mic" 
            size={24} 
            color={recordingMode === 'basic' ? theme.primary : theme.text} 
          />
          <Text 
            style={[
              styles.modeText, 
              { color: recordingMode === 'basic' ? theme.primary : theme.text }
            ]}
          >
            Basic
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            recordingMode === 'layered' && [styles.activeMode, { borderColor: theme.primary }]
          ]}
          onPress={() => setRecordingMode('layered')}
        >
          <Ionicons 
            name="layers" 
            size={24} 
            color={recordingMode === 'layered' ? theme.primary : theme.text} 
          />
          <Text 
            style={[
              styles.modeText, 
              { color: recordingMode === 'layered' ? theme.primary : theme.text }
            ]}
          >
            Layered
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.recorderContainer}>
        {recordingMode === 'basic' ? (
          <BasicRecorder />
        ) : (
          <LayeredRecorder />
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>
          {recordingMode === 'basic' ? 'Basic Recording' : 'Layered Recording'}
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          {recordingMode === 'basic' 
            ? 'Record a single audio clip with instant playback.'
            : 'Create multiple audio layers and mix them together. Perfect for creating beats and layered vocals.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeMode: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  modeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  recorderContainer: {
    flex: 1,
  },
  infoContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 