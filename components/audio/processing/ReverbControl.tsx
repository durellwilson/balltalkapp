import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { ReverbSettings } from './AudioEffectsPanel';

interface ReverbControlProps {
  settings: ReverbSettings;
  onChange: (settings: ReverbSettings) => void;
  isActive: boolean;
}

/**
 * Component for controlling reverb settings
 */
const ReverbControl: React.FC<ReverbControlProps> = ({
  settings,
  onChange,
  isActive
}) => {
  const handleAmountChange = (value: number) => {
    onChange({ ...settings, amount: value });
  };
  
  const handleDecayChange = (value: number) => {
    onChange({ ...settings, decay: value });
  };
  
  const handleDampingChange = (value: number) => {
    onChange({ ...settings, damping: value });
  };
  
  // Get a description of the current reverb settings
  const getReverbDescription = () => {
    if (settings.amount < 0.2) return 'Subtle Room';
    if (settings.amount < 0.4) return 'Small Room';
    if (settings.amount < 0.6) return 'Medium Room';
    if (settings.amount < 0.8) return 'Large Hall';
    return 'Cathedral';
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        <View style={[
          styles.reverbVisual,
          isActive ? styles.activeVisual : styles.inactiveVisual,
          { opacity: settings.amount }
        ]}>
          <Text style={styles.reverbDescription}>
            {isActive ? getReverbDescription() : 'Reverb Disabled'}
          </Text>
        </View>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Amount</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={settings.amount}
          onValueChange={handleAmountChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.amount * 100)}%</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Decay</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={10}
          step={0.1}
          value={settings.decay}
          onValueChange={handleDecayChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{settings.decay.toFixed(1)}s</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Damping</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={settings.damping}
          onValueChange={handleDampingChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.damping * 100)}%</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Reverb simulates the sound of different acoustic spaces, from small rooms to large halls.
        </Text>
        <Text style={styles.infoText}>
          • Amount: Controls the wet/dry mix of the effect
        </Text>
        <Text style={styles.infoText}>
          • Decay: How long the reverb tail lasts
        </Text>
        <Text style={styles.infoText}>
          • Damping: How quickly high frequencies decay
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  visualizer: {
    height: 120,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reverbVisual: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeVisual: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  inactiveVisual: {
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  reverbDescription: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    width: 70,
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
  infoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 4,
  },
});

export default ReverbControl; 