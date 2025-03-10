/**
 * Studio Layout
 * 
 * This layout provides consistent navigation for all studio-related screens.
 * It uses a stack navigator instead of tabs to maintain the main tab bar.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function StudioLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.background,
        }
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Studio',
        }}
      />
      <Stack.Screen
        name="mastering"
        options={{
          title: 'Audio Mastering',
        }}
      />
      <Stack.Screen
        name="library"
        options={{
          title: 'Audio Library',
        }}
      />
      <Stack.Screen
        name="batch-processing"
        options={{
          title: 'Batch Processing',
        }}
      />
      <Stack.Screen
        name="dolby-demo"
        options={{
          title: 'Dolby Audio Demo',
        }}
      />
      <Stack.Screen
        name="vocal-isolation"
        options={{
          title: 'Vocal Isolation',
        }}
      />
      <Stack.Screen
        name="audio-mastering"
        options={{
          title: 'Audio Mastering',
        }}
      />
      <Stack.Screen
        name="audio-upload"
        options={{
          title: 'Audio Upload',
        }}
      />
      <Stack.Screen
        name="recordings"
        options={{
          title: 'Recordings',
        }}
      />
      <Stack.Screen
        name="songs"
        options={{
          title: 'Songs',
        }}
      />
      <Stack.Screen
        name="song-detail"
        options={{
          title: 'Song Details',
        }}
      />
      <Stack.Screen
        name="shared-tracks"
        options={{
          title: 'Shared Tracks',
        }}
      />
      <Stack.Screen
        name="save-processed-audio"
        options={{
          title: 'Save Processed Audio',
        }}
      />
      <Stack.Screen
        name="podcasts"
        options={{
          title: 'Podcasts',
        }}
      />
      <Stack.Screen
        name="full"
        options={{
          title: 'Full View',
        }}
      />
      <Stack.Screen
        name="test"
        options={{
          title: 'Test',
        }}
      />
      <Stack.Screen
        name="studio-workspace"
        options={{
          title: 'Studio Workspace',
        }}
      />
    </Stack>
  );
} 