import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';

interface EqualizerBand {
  frequency: number;
  gain: number;
}

export default function SimpleEqualizer() {
  const [bands, setBands] = useState<EqualizerBand[]>([
    { frequency: 60, gain: 0 },
    { frequency: 230, gain: 0 },
    { frequency: 910, gain: 0 },
    { frequency: 3600, gain: 0 },
    { frequency: 14000, gain: 0 }
  ]);
  
  const updateBand = (index: number, gain: number) => {
    const newBands = [...bands];
    newBands[index].gain = gain;
    setBands(newBands);
    
    // Log the updated equalizer settings
    console.log('Equalizer settings updated:', newBands);
    
    // In a real implementation, this would update audio processing
    // For example: audioProcessor.setEqualizer(newBands);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Equalizer</Text>
      <Text style={styles.subtitle}>Adjust frequency bands to shape your sound</Text>
      
      {bands.map((band, index) => (
        <View key={index} style={styles.bandContainer}>
          <Text style={styles.frequencyText}>{band.frequency} Hz</Text>
          <Slider
            style={styles.slider}
            minimumValue={-12}
            maximumValue={12}
            step={0.1}
            value={band.gain}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#DDDDDD"
            onValueChange={(value) => updateBand(index, value)}
          />
          <Text style={styles.gainText}>{band.gain.toFixed(1)} dB</Text>
        </View>
      ))}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          Note: This is a UI demonstration. In a real implementation, these controls would be connected 
          to audio processing libraries.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  bandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  frequencyText: {
    width: 80,
    fontSize: 14,
    color: '#333',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  gainText: {
    width: 60,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  infoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e9e9e9',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
}); 