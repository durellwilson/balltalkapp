import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../../hooks/useTheme';

interface AudioEffectsPanelProps {
  audioUri: string | null;
  onProcessed?: (processedUri: string) => void;
  onError?: (error: string) => void;
}

// Effect types and presets
const EFFECT_TYPES = {
  EQUALIZER: 'equalizer',
  COMPRESSION: 'compression',
  REVERB: 'reverb',
  DELAY: 'delay',
  NORMALIZE: 'normalize',
  LIMITER: 'limiter',
} as const;

const PRESETS = {
  DEFAULT: 'default',
  VOCAL: 'vocal',
  ACOUSTIC: 'acoustic',
  ELECTRIC: 'electric',
  DRUMS: 'drums',
  MASTER: 'master',
} as const;

// Default settings
const DEFAULT_SETTINGS = {
  eqBands: [
    { frequency: 100, gain: 0, q: 1.0, enabled: true },
    { frequency: 500, gain: 0, q: 1.0, enabled: true },
    { frequency: 2000, gain: 0, q: 1.0, enabled: true }
  ],
  compressorEnabled: false,
  compressorThreshold: -24,
  compressorRatio: 4,
  compressorAttack: 30,
  compressorRelease: 250,
  compressorMakeupGain: 0,
  reverbEnabled: false,
  reverbWet: 0.3,
  reverbDecay: 2.0,
  reverbPredelay: 100,
  limiterEnabled: true,
  limiterThreshold: -1.5,
  limiterRelease: 50,
  activeEffects: ['equalizer', 'limiter']
};

const AudioEffectsPanel: React.FC<AudioEffectsPanelProps> = ({
  audioUri,
  onProcessed,
  onError
}) => {
  const { theme, isDark } = useTheme();
  // Use local state instead of context to avoid dependency on external state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeEffect, setActiveEffect] = useState<string>(EFFECT_TYPES.EQUALIZER);
  const [activePreset, setActivePreset] = useState<string>(PRESETS.DEFAULT);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const windowWidth = Dimensions.get('window').width;
  const isWideScreen = windowWidth > 768;

  // Initialize sound when component mounts
  useEffect(() => {
    if (!audioUri) return;
    
    const loadSound = async () => {
      try {
        // Create sound object
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false }
        );
        
        setSound(newSound);
      } catch (error) {
        console.error('Error loading audio in effects panel:', error);
        onError?.('Failed to load audio');
      }
    };
    
    loadSound();
    
    return () => {
      // Clean up sound resources
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
      if (previewSound) {
        previewSound.unloadAsync().catch(console.error);
      }
    };
  }, [audioUri]);

  // Handle effect toggle
  const toggleEffect = (effectName: string) => {
    setSettings(prevSettings => {
      const activeEffects = prevSettings.activeEffects || [];
      const isActive = activeEffects.includes(effectName);
      
      let newActiveEffects;
      if (isActive) {
        newActiveEffects = activeEffects.filter(effect => effect !== effectName);
      } else {
        newActiveEffects = [...activeEffects, effectName];
      }
      
      return {
        ...prevSettings,
        activeEffects: newActiveEffects
      };
    });
  };
  
  // Apply audio effects and process the audio
  const processAudio = async () => {
    if (!audioUri) {
      onError?.('No audio loaded');
      return;
    }
    
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      // Stop any playback
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
      
      // Stop any preview
      if (previewSound) {
        await previewSound.unloadAsync();
        setPreviewSound(null);
        setPreviewMode(false);
      }
      
      // Process the audio
      // This is a placeholder for actual processing logic
      // In a real implementation, you would call your audio processing service here
      
      // Simulate processing
      for (let i = 0; i <= 10; i++) {
        setProcessingProgress(i / 10);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Return the processed URI (in a real implementation, this would be the actual processed file)
      onProcessed?.(audioUri);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      onError?.('Failed to process audio');
    }
  };

  // Preview the audio with effects applied
  const previewEffects = async () => {
    if (!audioUri) return;
    
    if (previewMode) {
      // Stop preview
      if (previewSound) {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
        setPreviewSound(null);
      }
      setPreviewMode(false);
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Stop any current playback
      if (sound && isPlaying) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
      
      // Create temporary processed version for preview
      // In a real implementation, you would apply effects in real-time or create a temporary processed file
      
      // For demo, just use the original audio
      const { sound: previewSoundObj } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPreviewMode(false);
          }
        }
      );
      
      setPreviewSound(previewSoundObj);
      setPreviewMode(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error previewing effects:', error);
      onError?.('Failed to preview effects');
      setIsProcessing(false);
    }
  };
  
  // Render helper for parameter sliders
  const renderSlider = (
    label: string, 
    value: number, 
    onValueChange: (value: number) => void,
    min: number = 0,
    max: number = 1,
    step: number = 0.01
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabelRow}>
        <Text style={[styles.sliderLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>
          {value.toFixed(2)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={theme.tint}
        maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
        thumbTintColor={theme.tint}
      />
    </View>
  );

  // Ensure settings has activeEffects to avoid 'includes' error
  const activeEffects = settings.activeEffects || [];

  // Render the active effect controls
  const renderEffectControls = () => {
    switch (activeEffect) {
      case EFFECT_TYPES.EQUALIZER:
        return (
          <View style={styles.effectControlsContainer}>
            <View style={styles.effectHeader}>
              <Text style={[styles.effectTitle, { color: theme.text }]}>Equalizer</Text>
              <Switch
                value={activeEffects.includes('equalizer')}
                onValueChange={() => toggleEffect('equalizer')}
                trackColor={{ false: '#767577', true: theme.tint }}
              />
            </View>
            
            {settings.eqBands && settings.eqBands.map((band, index) => (
              <View key={`eq-band-${index}`}>
                {renderSlider(`Band ${index + 1} (${band.frequency}Hz)`, band.gain, (value) => {
                  const newBands = [...settings.eqBands];
                  newBands[index] = { ...band, gain: value };
                  setSettings({ ...settings, eqBands: newBands });
                }, -12, 12, 0.5)}
              </View>
            ))}
          </View>
        );
        
      case EFFECT_TYPES.COMPRESSION:
        return (
          <View style={styles.effectControlsContainer}>
            <View style={styles.effectHeader}>
              <Text style={[styles.effectTitle, { color: theme.text }]}>Compression</Text>
              <Switch
                value={settings.compressorEnabled}
                onValueChange={() => setSettings({
                  ...settings,
                  compressorEnabled: !settings.compressorEnabled
                })}
                trackColor={{ false: '#767577', true: theme.tint }}
              />
            </View>
            
            {renderSlider('Threshold', settings.compressorThreshold, (value) => {
              setSettings({ ...settings, compressorThreshold: value });
            }, -60, 0, 1)}
            
            {renderSlider('Ratio', settings.compressorRatio, (value) => {
              setSettings({ ...settings, compressorRatio: value });
            }, 1, 20, 0.5)}
            
            {renderSlider('Attack', settings.compressorAttack, (value) => {
              setSettings({ ...settings, compressorAttack: value });
            }, 0, 100, 1)}
            
            {renderSlider('Release', settings.compressorRelease, (value) => {
              setSettings({ ...settings, compressorRelease: value });
            }, 10, 1000, 10)}
            
            {renderSlider('Makeup Gain', settings.compressorMakeupGain, (value) => {
              setSettings({ ...settings, compressorMakeupGain: value });
            }, 0, 24, 0.5)}
          </View>
        );
        
      case EFFECT_TYPES.REVERB:
        return (
          <View style={styles.effectControlsContainer}>
            <View style={styles.effectHeader}>
              <Text style={[styles.effectTitle, { color: theme.text }]}>Reverb</Text>
              <Switch
                value={settings.reverbEnabled}
                onValueChange={() => setSettings({
                  ...settings,
                  reverbEnabled: !settings.reverbEnabled
                })}
                trackColor={{ false: '#767577', true: theme.tint }}
              />
            </View>
            
            {renderSlider('Amount', settings.reverbWet, (value) => {
              setSettings({ ...settings, reverbWet: value });
            }, 0, 1, 0.01)}
            
            {renderSlider('Decay', settings.reverbDecay, (value) => {
              setSettings({ ...settings, reverbDecay: value });
            }, 0.1, 10, 0.1)}
            
            {renderSlider('Predelay', settings.reverbPredelay, (value) => {
              setSettings({ ...settings, reverbPredelay: value });
            }, 0, 500, 10)}
          </View>
        );
        
      default:
        return (
          <View style={styles.effectControlsContainer}>
            <Text style={[styles.effectTitle, { color: theme.text }]}>
              Select an effect from the menu
            </Text>
          </View>
        );
    }
  };

  // Render preset selector
  const renderPresets = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.presetsScrollView}
      contentContainerStyle={styles.presetsContainer}
    >
      {Object.values(PRESETS).map((preset) => (
        <TouchableOpacity
          key={preset}
          style={[
            styles.presetButton,
            activePreset === preset && styles.activePresetButton,
            activePreset === preset && { backgroundColor: theme.tint }
          ]}
          onPress={() => setActivePreset(preset)}
        >
          <Text 
            style={[
              styles.presetButtonText,
              activePreset === preset && styles.activePresetButtonText
            ]}
          >
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      {/* Header with title and presets */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Audio Effects</Text>
        {renderPresets()}
      </View>
      
      {/* Main content area with effects panel and controls */}
      <View style={styles.content}>
        {/* Effects menu sidebar */}
        <View style={[styles.effectsMenu, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
          {Object.values(EFFECT_TYPES).map((effectType) => (
            <TouchableOpacity
              key={effectType}
              style={[
                styles.effectMenuItem,
                activeEffect === effectType && styles.activeEffectMenuItem,
                activeEffect === effectType && { backgroundColor: theme.tint }
              ]}
              onPress={() => setActiveEffect(effectType)}
            >
              <MaterialIcons
                name={getEffectIcon(effectType)}
                size={24}
                color={activeEffect === effectType ? 'white' : theme.text}
              />
              {isWideScreen && (
                <Text 
                  style={[
                    styles.effectMenuItemText, 
                    { color: activeEffect === effectType ? 'white' : theme.text }
                  ]}
                >
                  {effectType.charAt(0).toUpperCase() + effectType.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Effect controls */}
        <ScrollView style={styles.controlsScrollView} contentContainerStyle={styles.controlsScrollContent}>
          {renderEffectControls()}
        </ScrollView>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.previewButton,
            previewMode && styles.stopButton,
            (isProcessing || !audioUri) && styles.disabledButton
          ]}
          onPress={previewEffects}
          disabled={isProcessing || !audioUri}
        >
          <Ionicons
            name={previewMode ? 'stop' : 'play'}
            size={20}
            color="white"
          />
          <Text style={styles.actionButtonText}>
            {previewMode ? 'Stop Preview' : 'Preview'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.applyButton,
            (isProcessing || !audioUri) && styles.disabledButton
          ]}
          onPress={processAudio}
          disabled={isProcessing || !audioUri}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.actionButtonText}>
                Processing ({Math.round(processingProgress * 100)}%)
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Apply Effects</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Helper function to get icon for each effect type
function getEffectIcon(effectType: string): string {
  switch (effectType) {
    case EFFECT_TYPES.EQUALIZER:
      return 'equalizer';
    case EFFECT_TYPES.COMPRESSION:
      return 'compress';
    case EFFECT_TYPES.REVERB:
      return 'waves';
    case EFFECT_TYPES.DELAY:
      return 'timelapse';
    case EFFECT_TYPES.NORMALIZE:
      return 'sort';
    case EFFECT_TYPES.LIMITER:
      return 'signal-cellular-alt';
    default:
      return 'settings';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  presetsScrollView: {
    maxHeight: 40,
  },
  presetsContainer: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activePresetButton: {
    backgroundColor: '#007AFF',
  },
  presetButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activePresetButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  effectsMenu: {
    width: 60,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  effectMenuItem: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeEffectMenuItem: {
    backgroundColor: '#007AFF',
  },
  effectMenuItemText: {
    fontSize: 12,
    marginTop: 4,
  },
  controlsScrollView: {
    flex: 1,
  },
  controlsScrollContent: {
    padding: 16,
  },
  effectControlsContainer: {
    marginBottom: 24,
  },
  effectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  effectTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
  },
  sliderValue: {
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  previewButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  applyButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Create a simpler implementation that doesn't rely on external context
export default function AudioEffectsPanelStandalone(props: AudioEffectsPanelProps) {
  return <AudioEffectsPanel {...props} />;
} 