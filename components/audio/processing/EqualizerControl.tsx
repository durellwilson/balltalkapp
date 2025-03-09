import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { EqualizerSettings } from './AudioEffectsPanel';

interface EqualizerControlProps {
  settings: EqualizerSettings;
  onChange: (settings: EqualizerSettings) => void;
  isActive: boolean;
}

/**
 * Component for controlling equalizer settings
 */
const EqualizerControl: React.FC<EqualizerControlProps> = ({
  settings,
  onChange,
  isActive
}) => {
  const handleLowGainChange = (value: number) => {
    onChange({ ...settings, lowGain: value });
  };
  
  const handleMidGainChange = (value: number) => {
    onChange({ ...settings, midGain: value });
  };
  
  const handleHighGainChange = (value: number) => {
    onChange({ ...settings, highGain: value });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Low</Text>
        <Slider
          style={styles.slider}
          minimumValue={-12}
          maximumValue={12}
          step={0.5}
          value={settings.lowGain}
          onValueChange={handleLowGainChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{settings.lowGain.toFixed(1)} dB</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Mid</Text>
        <Slider
          style={styles.slider}
          minimumValue={-12}
          maximumValue={12}
          step={0.5}
          value={settings.midGain}
          onValueChange={handleMidGainChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{settings.midGain.toFixed(1)} dB</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>High</Text>
        <Slider
          style={styles.slider}
          minimumValue={-12}
          maximumValue={12}
          step={0.5}
          value={settings.highGain}
          onValueChange={handleHighGainChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{settings.highGain.toFixed(1)} dB</Text>
      </View>
      
      <View style={styles.visualizer}>
        <View style={[
          styles.band, 
          { height: `${Math.min(100, 50 + settings.lowGain * 4)}%` },
          isActive ? styles.activeBand : styles.inactiveBand
        ]} />
        <View style={[
          styles.band, 
          { height: `${Math.min(100, 50 + settings.midGain * 4)}%` },
          isActive ? styles.activeBand : styles.inactiveBand
        ]} />
        <View style={[
          styles.band, 
          { height: `${Math.min(100, 50 + settings.highGain * 4)}%` },
          isActive ? styles.activeBand : styles.inactiveBand
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valueText: {
    width: 60,
    textAlign: 'right',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  visualizer: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  band: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  activeBand: {
    backgroundColor: '#007AFF',
  },
  inactiveBand: {
    backgroundColor: '#CCCCCC',
  },
});

export default EqualizerControl; 