import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioProcessing } from '../../../contexts/AudioProcessingContext';

export default function LimiterControl() {
  const { state, updateSettings } = useAudioProcessing();
  const { 
    limiterEnabled, 
    limiterThreshold, 
    limiterRelease
  } = state.currentSettings;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Limiter</Text>
        <Switch
          value={limiterEnabled}
          onValueChange={(value) => updateSettings({ limiterEnabled: value })}
          trackColor={{ false: '#767577', true: '#4caf50' }}
          thumbColor={limiterEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      
      <View style={[styles.controlsContainer, !limiterEnabled && styles.disabledControls]}>
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Threshold</Text>
          <Slider
            style={styles.slider}
            minimumValue={-20}
            maximumValue={0}
            step={0.1}
            value={limiterThreshold}
            onValueChange={(value) => updateSettings({ limiterThreshold: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!limiterEnabled}
            thumbTintColor={limiterEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{limiterThreshold.toFixed(1)} dB</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Release</Text>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={1000}
            step={10}
            value={limiterRelease}
            onValueChange={(value) => updateSettings({ limiterRelease: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!limiterEnabled}
            thumbTintColor={limiterEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{limiterRelease.toFixed(0)} ms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    opacity: 1,
  },
  disabledControls: {
    opacity: 0.5,
  },
  controlRow: {
    marginBottom: 16,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666666',
  }
}); 