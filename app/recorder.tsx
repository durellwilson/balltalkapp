
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import BasicRecorder from '../components/audio/BasicRecorder';

export default function RecorderScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Audio Recorder' }} />
      <BasicRecorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
