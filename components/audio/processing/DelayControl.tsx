import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { DelaySettings } from './AudioEffectsPanel';

interface DelayControlProps {
  settings: DelaySettings;
  onChange: (settings: DelaySettings) => void;
  isActive: boolean;
}

/**
 * Component for controlling delay settings
 */
const DelayControl: React.FC<DelayControlProps> = ({
  settings,
  onChange,
  isActive
}) => {
  const handleTimeChange = (value: number) => {
    onChange({ ...settings, time: value });
  };
  
  const handleFeedbackChange = (value: number) => {
    onChange({ ...settings, feedback: value });
  };
  
  const handleMixChange = (value: number) => {
    onChange({ ...settings, mix: value });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        <View style={[
          styles.delayVisual,
          isActive ? styles.activeVisual : styles.inactiveVisual
        ]}>
          <View style={[
            styles.delayLine,
            { width: `${Math.min(90, settings.time * 100)}%` },
            isActive ? styles.activeDelayLine : styles.inactiveDelayLine
          ]} />
          <View style={[
            styles.feedbackLine,
            { width: `${Math.min(80, settings.feedback * 100)}%`, opacity: settings.mix },
            isActive ? styles.activeFeedbackLine : styles.inactiveFeedbackLine
          ]} />
        </View>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Time</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={settings.time}
          onValueChange={handleTimeChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{(settings.time * 1000).toFixed(0)} ms</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Feedback</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={0.9}
          step={0.01}
          value={settings.feedback}
          onValueChange={handleFeedbackChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.feedback * 100)}%</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Mix</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={settings.mix}
          onValueChange={handleMixChange}
          minimumTrackTintColor={isActive ? '#007AFF' : '#CCCCCC'}
          maximumTrackTintColor="#EEEEEE"
          thumbTintColor={isActive ? '#007AFF' : '#AAAAAA'}
          disabled={!isActive}
        />
        <Text style={styles.valueText}>{Math.round(settings.mix * 100)}%</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Delay creates echoes of the original sound.
        </Text>
        <Text style={styles.infoText}>
          • Time: Controls the delay time between echoes
        </Text>
        <Text style={styles.infoText}>
          • Feedback: How much of the delayed signal is fed back into the delay
        </Text>
        <Text style={styles.infoText}>
          • Mix: Balances between the dry (original) and wet (delayed) signal
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
  delayVisual: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
  },
  activeVisual: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  inactiveVisual: {
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  delayLine: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  activeDelayLine: {
    backgroundColor: '#007AFF',
  },
  inactiveDelayLine: {
    backgroundColor: '#CCCCCC',
  },
  feedbackLine: {
    height: 4,
    borderRadius: 2,
  },
  activeFeedbackLine: {
    backgroundColor: '#34C759',
  },
  inactiveFeedbackLine: {
    backgroundColor: '#CCCCCC',
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

export default DelayControl; 