/**
 * Full Studio Experience
 * 
 * This screen provides the complete studio experience with:
 * - Audio recording
 * - Audio processing and effects
 * - Mastering tools
 * - Upload capabilities
 * - Track browsing
 * 
 * It uses the Studiomigrated component for the main functionality.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { AudioProvider } from '../../contexts/AudioContext';
import Studiomigrated from '../../components/studio/Studiomigrated';

export default function FullStudioScreen() {
  return (
    <AudioProvider>
      <Stack.Screen
        options={{
          title: "Full Studio",
          headerLargeTitle: true,
        }}
      />
      <Studiomigrated />
    </AudioProvider>
  );
} 