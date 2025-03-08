import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioProcessing } from '../../../contexts/AudioProcessingContext';

export default function CompressorControl() {
  const { state, updateSettings } = useAudioProcessing();
  const { 
    compressorEnabled, 
    compressorThreshold, 
    compressorRatio, 
    compressorAttack, 
    compressorRelease,
    compressorMakeupGain
  } = state.currentSettings;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compressor</Text>
        <Switch
          value={compressorEnabled}
          onValueChange={(value) => updateSettings({ compressorEnabled: value })}
          trackColor={{ false: '#767577', true: '#4caf50' }}
          thumbColor={compressorEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      
      <View style={[styles.controlsContainer, !compressorEnabled && styles.disabledControls]}>
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Threshold</Text>
          <Slider
            style={styles.slider}
            minimumValue={-60}
            maximumValue={0}
            step={1}
            value={compressorThreshold}
            onValueChange={(value) => updateSettings({ compressorThreshold: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!compressorEnabled}
            thumbTintColor={compressorEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{compressorThreshold.toFixed(1)} dB</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Ratio</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={20}
            step={0.1}
            value={compressorRatio}
            onValueChange={(value) => updateSettings({ compressorRatio: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!compressorEnabled}
            thumbTintColor={compressorEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{compressorRatio.toFixed(1)}:1</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Attack</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={compressorAttack}
            onValueChange={(value) => updateSettings({ compressorAttack: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!compressorEnabled}
            thumbTintColor={compressorEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{compressorAttack.toFixed(1)} ms</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Release</Text>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={1000}
            step={10}
            value={compressorRelease}
            onValueChange={(value) => updateSettings({ compressorRelease: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!compressorEnabled}
            thumbTintColor={compressorEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{compressorRelease.toFixed(0)} ms</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.paramLabel}>Makeup Gain</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={24}
            step={0.5}
            value={compressorMakeupGain}
            onValueChange={(value) => updateSettings({ compressorMakeupGain: value })}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            disabled={!compressorEnabled}
            thumbTintColor={compressorEnabled ? '#2196F3' : '#cccccc'}
          />
          <Text style={styles.valueText}>{compressorMakeupGain.toFixed(1)} dB</Text>
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