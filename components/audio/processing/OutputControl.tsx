import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioProcessing } from '../../../contexts/AudioProcessingContext';

export default function OutputControl() {
  const { state, updateSettings } = useAudioProcessing();
  const { outputGain } = state.currentSettings;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Output</Text>
      
      <View style={styles.controlRow}>
        <Text style={styles.paramLabel}>Gain</Text>
        <Slider
          style={styles.slider}
          minimumValue={-60}
          maximumValue={12}
          step={0.5}
          value={outputGain}
          onValueChange={(value) => updateSettings({ outputGain: value })}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#000000"
          thumbTintColor="#2196F3"
        />
        <Text style={styles.valueText}>{outputGain.toFixed(1)} dB</Text>
      </View>
      
      <View style={styles.meterContainer}>
        <View style={styles.meter}>
          <View 
            style={[
              styles.meterFill, 
              { width: `${Math.min(100, (outputGain + 60) / 72 * 100)}%` },
              outputGain > 0 && styles.meterWarning
            ]} 
          />
        </View>
        <View style={styles.meterLabels}>
          <Text style={styles.meterLabel}>-60</Text>
          <Text style={styles.meterLabel}>-40</Text>
          <Text style={styles.meterLabel}>-20</Text>
          <Text style={styles.meterLabel}>0</Text>
          <Text style={[styles.meterLabel, styles.meterWarningText]}>+12</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
  meterContainer: {
    marginTop: 8,
  },
  meter: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  meterWarning: {
    backgroundColor: '#ff9800',
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  meterLabel: {
    fontSize: 10,
    color: '#666666',
  },
  meterWarningText: {
    color: '#ff9800',
  }
}); 