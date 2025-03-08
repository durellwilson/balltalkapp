import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioProcessing, AudioProcessingSettings } from '../../../contexts/AudioProcessingContext';

export default function EqualizerControl() {
  const { state, updateSettings } = useAudioProcessing();
  const { eqBands } = state.currentSettings;
  
  const updateBand = (index: number, property: keyof typeof eqBands[0], value: number | boolean) => {
    const newBands = [...eqBands];
    newBands[index] = {
      ...newBands[index],
      [property]: value
    };
    
    updateSettings({ eqBands: newBands });
  };
  
  // Format frequency display
  const formatFrequency = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equalizer</Text>
      
      <View style={styles.bandsContainer}>
        {eqBands.map((band, index) => (
          <View key={index} style={styles.bandControl}>
            <View style={styles.bandHeader}>
              <Text style={styles.frequencyText}>{formatFrequency(band.frequency)}</Text>
              <Switch
                value={band.enabled}
                onValueChange={(value) => updateBand(index, 'enabled', value)}
                trackColor={{ false: '#767577', true: '#4caf50' }}
                thumbColor={band.enabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            
            <Slider
              style={styles.slider}
              minimumValue={-12}
              maximumValue={12}
              step={0.5}
              value={band.gain}
              onValueChange={(value) => updateBand(index, 'gain', value)}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#000000"
              disabled={!band.enabled}
              thumbTintColor={band.enabled ? '#2196F3' : '#cccccc'}
            />
            
            <Text style={[styles.gainText, !band.enabled && styles.disabledText]}>
              {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
            </Text>
            
            <Text style={styles.qLabel}>Q</Text>
            <Slider
              style={styles.qSlider}
              minimumValue={0.1}
              maximumValue={10}
              step={0.1}
              value={band.q}
              onValueChange={(value) => updateBand(index, 'q', value)}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#000000"
              disabled={!band.enabled}
              thumbTintColor={band.enabled ? '#2196F3' : '#cccccc'}
            />
            
            <Text style={[styles.qText, !band.enabled && styles.disabledText]}>
              {band.q.toFixed(1)}
            </Text>
          </View>
        ))}
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
  bandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bandControl: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  frequencyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  gainText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  qLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  qSlider: {
    width: '100%',
    height: 40,
  },
  qText: {
    textAlign: 'center',
  },
  disabledText: {
    color: '#999999',
  }
}); 