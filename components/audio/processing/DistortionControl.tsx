import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { DistortionSettings } from './AudioEffectsPanel';

interface DistortionControlProps {
  settings: DistortionSettings;
  onChange: (settings: DistortionSettings) => void;
  isActive: boolean;
}

/**
 * Component for controlling distortion settings
 */
const DistortionControl: React.FC<DistortionControlProps> = ({
  settings,
  onChange,
  isActive
}) => {
  const handleAmountChange = (value: number) => {
    onChange({ ...settings, amount: value });
  };
  
  const handleToneChange = (value: number) => {
    onChange({ ...settings, tone: value });
  };
  
  // Get a description of the current distortion settings
  const getDistortionDescription = () => {
    if (settings.amount < 0.2) return 'Subtle Drive';
    if (settings.amount < 0.4) return 'Warm Overdrive';
    if (settings.amount < 0.6) return 'Classic Distortion';
    if (settings.amount < 0.8) return 'Heavy Distortion';
    return 'Extreme Fuzz';
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        <View style={[
          styles.distortionVisual,
          isActive ? styles.activeVisual : styles.inactiveVisual
        ]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.distortionLine,
                { 
                  height: 2 + Math.random() * settings.amount * 20,
                  backgroundColor: isActive 
                    ? `rgba(255, ${Math.max(0, 100 - settings.amount * 100)}, 0, ${settings.tone})` 
                    : '#CCCCCC'
                }
              ]} 
            />
          ))}
          <Text style={[
            styles.distortionDescription,
            { color: isActive ? '#FF3B30' : '#999999' }
          ]}>
            {isActive ? getDistortionDescription() : 'Distortion Disabled'}
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
          minimumTrackTintColor={isActive ? '#FF3B30' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#FF3B30' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.amount * 100)}%</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Tone</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={settings.tone}
          onValueChange={handleToneChange}
          minimumTrackTintColor={isActive ? '#FF3B30' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#FF3B30' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.tone * 100)}%</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Distortion adds harmonics to the signal, creating a gritty or fuzzy sound.
        </Text>
        <Text style={styles.infoText}>
          • Amount: Controls the intensity of the distortion effect
        </Text>
        <Text style={styles.infoText}>
          • Tone: Adjusts the tonal character from dark (low) to bright (high)
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
  distortionVisual: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  activeVisual: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  inactiveVisual: {
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  distortionLine: {
    width: 3,
    borderRadius: 1.5,
  },
  distortionDescription: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 4,
  },
});

export default DistortionControl; 