import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import Slider from '@react-native-community/slider';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeIn
} from 'react-native-reanimated';

interface VocalEffectsProcessorProps {
  audioUri: string;
  onProcessingComplete: (processedUri: string) => void;
  onClose: () => void;
  theme?: any;
}

interface EffectPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  settings: {
    reverb: number;
    delay: number;
    pitch: number;
    compression: number;
    eq: number[];
    autotune: number;
  };
}

/**
 * VocalEffectsProcessor Component
 * 
 * A professional vocal effects processor that allows users to apply
 * various effects to their recordings.
 * 
 * @param {string} audioUri - The URI of the audio file to process
 * @param {function} onProcessingComplete - Callback when processing is complete
 * @param {function} onClose - Callback when the component is closed
 * @param {object} theme - Theme object
 * @returns {React.ReactElement} The VocalEffectsProcessor component
 */
const VocalEffectsProcessor: React.FC<VocalEffectsProcessorProps> = ({
  audioUri,
  onProcessingComplete,
  onClose,
  theme: propTheme
}) => {
  const { theme, isDark } = useTheme();
  const safeTheme = propTheme || theme;
  
  // State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customSettings, setCustomSettings] = useState({
    reverb: 0.2,
    delay: 0,
    pitch: 0,
    compression: 0.3,
    eq: [0, 0, 0, 0, 0],
    autotune: 0
  });
  
  // Effect presets
  const presets: EffectPreset[] = [
    {
      id: 'natural',
      name: 'Natural',
      icon: 'mic',
      description: 'Clean vocal with minimal processing',
      settings: {
        reverb: 0.1,
        delay: 0,
        pitch: 0,
        compression: 0.2,
        eq: [0, 0, 0, 0, 0],
        autotune: 0
      }
    },
    {
      id: 'studio',
      name: 'Studio',
      icon: 'headset',
      description: 'Professional studio sound',
      settings: {
        reverb: 0.3,
        delay: 0.1,
        pitch: 0,
        compression: 0.5,
        eq: [0.2, 0.1, 0, 0.1, 0.2],
        autotune: 0.1
      }
    },
    {
      id: 'concert',
      name: 'Concert',
      icon: 'musical-notes',
      description: 'Live concert hall sound',
      settings: {
        reverb: 0.6,
        delay: 0.2,
        pitch: 0,
        compression: 0.4,
        eq: [0.3, 0.1, 0, 0.2, 0.3],
        autotune: 0
      }
    },
    {
      id: 'autotune',
      name: 'Autotune',
      icon: 'pulse',
      description: 'Modern autotune effect',
      settings: {
        reverb: 0.2,
        delay: 0.1,
        pitch: 0,
        compression: 0.4,
        eq: [0.1, 0, 0, 0.1, 0.2],
        autotune: 0.8
      }
    },
    {
      id: 'radio',
      name: 'Radio',
      icon: 'radio',
      description: 'Classic radio broadcast sound',
      settings: {
        reverb: 0.1,
        delay: 0,
        pitch: 0,
        compression: 0.7,
        eq: [0.3, 0.1, -0.2, -0.3, -0.4],
        autotune: 0
      }
    },
    {
      id: 'telephone',
      name: 'Telephone',
      icon: 'call',
      description: 'Old telephone effect',
      settings: {
        reverb: 0,
        delay: 0,
        pitch: 0,
        compression: 0.8,
        eq: [-0.5, 0.2, 0.3, -0.2, -0.8],
        autotune: 0
      }
    }
  ];
  
  // Select a preset
  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setCustomSettings(preset.settings);
    }
  };
  
  // Apply effects
  const applyEffects = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, you would process the audio file
      // For this example, we'll just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return the processed URI
      onProcessingComplete(`${audioUri}?processed=true`);
    } catch (error) {
      console.error('Failed to process audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    // In a real implementation, you would play/pause the audio
    // For this example, we'll just toggle the state
  };
  
  // Render presets
  const renderPresets = () => {
    return (
      <View style={styles.presetsContainer}>
        <Text style={[styles.sectionTitle, { color: safeTheme.text }]}>
          Effect Presets
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {presets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                selectedPreset === preset.id && styles.selectedPresetButton,
                { 
                  backgroundColor: selectedPreset === preset.id 
                    ? safeTheme.primary 
                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' 
                }
              ]}
              onPress={() => selectPreset(preset.id)}
            >
              <Ionicons 
                name={preset.icon as any} 
                size={24} 
                color={selectedPreset === preset.id ? '#FFFFFF' : safeTheme.text} 
              />
              <Text 
                style={[
                  styles.presetName,
                  { color: selectedPreset === preset.id ? '#FFFFFF' : safeTheme.text }
                ]}
              >
                {preset.name}
              </Text>
              <Text 
                style={[
                  styles.presetDescription,
                  { color: selectedPreset === preset.id ? 'rgba(255, 255, 255, 0.8)' : safeTheme.textSecondary }
                ]}
                numberOfLines={2}
              >
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Render custom settings
  const renderCustomSettings = () => {
    return (
      <View style={styles.customSettingsContainer}>
        <Text style={[styles.sectionTitle, { color: safeTheme.text }]}>
          Custom Settings
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: safeTheme.text }]}>
            Reverb: {Math.round(customSettings.reverb * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={customSettings.reverb}
            onValueChange={value => setCustomSettings({...customSettings, reverb: value})}
            minimumTrackTintColor={safeTheme.primary}
            maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
            thumbTintColor={safeTheme.primary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: safeTheme.text }]}>
            Delay: {Math.round(customSettings.delay * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={customSettings.delay}
            onValueChange={value => setCustomSettings({...customSettings, delay: value})}
            minimumTrackTintColor={safeTheme.primary}
            maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
            thumbTintColor={safeTheme.primary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: safeTheme.text }]}>
            Pitch: {customSettings.pitch > 0 ? '+' : ''}{Math.round(customSettings.pitch * 12)} semitones
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={customSettings.pitch}
            onValueChange={value => setCustomSettings({...customSettings, pitch: value})}
            minimumTrackTintColor={safeTheme.warning}
            maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
            thumbTintColor={safeTheme.primary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: safeTheme.text }]}>
            Compression: {Math.round(customSettings.compression * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={customSettings.compression}
            onValueChange={value => setCustomSettings({...customSettings, compression: value})}
            minimumTrackTintColor={safeTheme.primary}
            maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
            thumbTintColor={safeTheme.primary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: safeTheme.text }]}>
            Autotune: {Math.round(customSettings.autotune * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={customSettings.autotune}
            onValueChange={value => setCustomSettings({...customSettings, autotune: value})}
            minimumTrackTintColor={safeTheme.primary}
            maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
            thumbTintColor={safeTheme.primary}
          />
        </View>
        
        <Text style={[styles.eqLabel, { color: safeTheme.text }]}>
          Equalizer
        </Text>
        <View style={styles.eqContainer}>
          {customSettings.eq.map((value, index) => (
            <View key={`eq-${index}`} style={styles.eqBand}>
              <Slider
                style={styles.eqSlider}
                minimumValue={-1}
                maximumValue={1}
                value={value}
                onValueChange={newValue => {
                  const newEq = [...customSettings.eq];
                  newEq[index] = newValue;
                  setCustomSettings({...customSettings, eq: newEq});
                }}
                minimumTrackTintColor={safeTheme.primary}
                maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
                thumbTintColor={safeTheme.primary}
                vertical
              />
              <Text style={[styles.eqBandLabel, { color: safeTheme.textSecondary }]}>
                {['Low', 'Mid-Low', 'Mid', 'Mid-High', 'High'][index]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={safeTheme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: safeTheme.text }]}>
          Vocal Effects
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.applyButton, 
            { backgroundColor: safeTheme.primary },
            isProcessing && { opacity: 0.7 }
          ]}
          onPress={applyEffects}
          disabled={isProcessing}
        >
          <Text style={styles.applyButtonText}>
            {isProcessing ? 'Processing...' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.waveformPlaceholder}>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: isPlaying ? safeTheme.warning : safeTheme.primary }
            ]}
            onPress={togglePlayback}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
        
        {renderPresets()}
        {renderCustomSettings()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  applyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  waveformPlaceholder: {
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetButton: {
    width: 140,
    height: 120,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPresetButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  presetDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  customSettingsContainer: {
    marginBottom: 20,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  eqLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  eqContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    marginBottom: 20,
  },
  eqBand: {
    alignItems: 'center',
    flex: 1,
  },
  eqSlider: {
    height: 120,
    width: 40,
  },
  eqBandLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default VocalEffectsProcessor; 