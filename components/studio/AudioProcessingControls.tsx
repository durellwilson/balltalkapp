import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Slider,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';

interface AudioProcessingControlsProps {
  onProcess: (options: any) => void;
  isProcessing: boolean;
  progress: number;
  isDark?: boolean;
}

/**
 * AudioProcessingControls Component
 * 
 * A comprehensive set of controls for audio processing and effects.
 * 
 * @param {function} onProcess - Callback function when processing is requested
 * @param {boolean} isProcessing - Whether audio is currently being processed
 * @param {number} progress - Processing progress (0-1)
 * @param {boolean} isDark - Whether to use dark mode styling
 * @returns {React.ReactElement} The AudioProcessingControls component
 */
const AudioProcessingControls: React.FC<AudioProcessingControlsProps> = ({
  onProcess,
  isProcessing,
  progress,
  isDark = false,
}) => {
  const { theme } = useTheme();
  
  // Track metadata
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  
  // Effect settings
  const [effects, setEffects] = useState({
    normalize: true,
    compression: false,
    reverb: false,
    eq: false,
    fadeIn: false,
    fadeOut: true,
  });
  
  // Effect parameters
  const [parameters, setParameters] = useState({
    compressionThreshold: -20,
    compressionRatio: 4,
    reverbAmount: 0.3,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    fadeInDuration: 1.0, // seconds
    fadeOutDuration: 1.5, // seconds
  });
  
  // Toggle an effect
  const toggleEffect = (effect: keyof typeof effects) => {
    setEffects({
      ...effects,
      [effect]: !effects[effect],
    });
  };
  
  // Update a parameter value
  const updateParameter = (param: keyof typeof parameters, value: number) => {
    setParameters({
      ...parameters,
      [param]: value,
    });
  };
  
  // Handle processing request
  const handleProcess = () => {
    // Validate title
    if (!title.trim()) {
      alert('Please enter a title for your track');
      return;
    }
    
    // Prepare processing options
    const processingOptions = {
      title,
      genre: genre || 'Other',
      description,
      effects: {
        ...effects,
      },
      parameters: {
        ...parameters,
      },
    };
    
    // Call the processing function
    onProcess(processingOptions);
  };
  
  // Render a slider control
  const renderSlider = (
    label: string,
    param: keyof typeof parameters,
    min: number,
    max: number,
    step: number,
    disabled: boolean = false,
    unit: string = ''
  ) => {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabelContainer}>
          <Text style={[styles.sliderLabel, isDark && styles.textLight, disabled && styles.disabledText]}>
            {label}
          </Text>
          <Text style={[styles.sliderValue, isDark && styles.textLight, disabled && styles.disabledText]}>
            {parameters[param].toFixed(1)}{unit}
          </Text>
        </View>
        {Platform.OS === 'web' ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={parameters[param]}
            disabled={disabled}
            onChange={(e) => updateParameter(param, parseFloat(e.target.value))}
            style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}
          />
        ) : (
          <Slider
            style={styles.slider}
            minimumValue={min}
            maximumValue={max}
            step={step}
            value={parameters[param]}
            onValueChange={(value) => updateParameter(param, value)}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor="#CCCCCC"
            thumbTintColor={theme.primary}
            disabled={disabled}
          />
        )}
      </View>
    );
  };
  
  // Render an effect toggle
  const renderEffectToggle = (
    label: string,
    effect: keyof typeof effects,
    icon: string
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.effectToggle,
          effects[effect] && styles.effectToggleActive,
          isDark && styles.effectToggleDark,
          effects[effect] && isDark && styles.effectToggleActiveDark,
        ]}
        onPress={() => toggleEffect(effect)}
        disabled={isProcessing}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={effects[effect] ? '#fff' : isDark ? '#fff' : '#333'}
        />
        <Text
          style={[
            styles.effectToggleText,
            effects[effect] && styles.effectToggleTextActive,
            isDark && styles.textLight,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Track Metadata Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Track Information
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, isDark && styles.textLight]}>Title *</Text>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter track title"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            editable={!isProcessing}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, isDark && styles.textLight]}>Genre</Text>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            value={genre}
            onChangeText={setGenre}
            placeholder="Enter genre (e.g., Hip Hop, R&B)"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            editable={!isProcessing}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, isDark && styles.textLight]}>Description</Text>
          <TextInput
            style={[styles.textArea, isDark && styles.textInputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter track description"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            multiline
            numberOfLines={3}
            editable={!isProcessing}
          />
        </View>
      </View>
      
      {/* Effects Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Audio Effects
        </Text>
        
        <View style={styles.effectsGrid}>
          {renderEffectToggle('Normalize', 'normalize', 'pulse')}
          {renderEffectToggle('Compression', 'compression', 'contract')}
          {renderEffectToggle('Reverb', 'reverb', 'water')}
          {renderEffectToggle('EQ', 'eq', 'options')}
          {renderEffectToggle('Fade In', 'fadeIn', 'trending-up')}
          {renderEffectToggle('Fade Out', 'fadeOut', 'trending-down')}
        </View>
      </View>
      
      {/* Effect Parameters Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Effect Parameters
        </Text>
        
        {/* Compression parameters */}
        {effects.compression && (
          <View style={styles.parameterGroup}>
            <Text style={[styles.parameterGroupTitle, isDark && styles.textLight]}>
              Compression
            </Text>
            {renderSlider('Threshold', 'compressionThreshold', -60, 0, 1, isProcessing, ' dB')}
            {renderSlider('Ratio', 'compressionRatio', 1, 20, 0.5, isProcessing, ':1')}
          </View>
        )}
        
        {/* Reverb parameters */}
        {effects.reverb && (
          <View style={styles.parameterGroup}>
            <Text style={[styles.parameterGroupTitle, isDark && styles.textLight]}>
              Reverb
            </Text>
            {renderSlider('Amount', 'reverbAmount', 0, 1, 0.05, isProcessing)}
          </View>
        )}
        
        {/* EQ parameters */}
        {effects.eq && (
          <View style={styles.parameterGroup}>
            <Text style={[styles.parameterGroupTitle, isDark && styles.textLight]}>
              Equalizer
            </Text>
            {renderSlider('Low', 'eqLow', -12, 12, 0.5, isProcessing, ' dB')}
            {renderSlider('Mid', 'eqMid', -12, 12, 0.5, isProcessing, ' dB')}
            {renderSlider('High', 'eqHigh', -12, 12, 0.5, isProcessing, ' dB')}
          </View>
        )}
        
        {/* Fade parameters */}
        {(effects.fadeIn || effects.fadeOut) && (
          <View style={styles.parameterGroup}>
            <Text style={[styles.parameterGroupTitle, isDark && styles.textLight]}>
              Fades
            </Text>
            {effects.fadeIn && renderSlider('Fade In', 'fadeInDuration', 0, 5, 0.1, isProcessing, 's')}
            {effects.fadeOut && renderSlider('Fade Out', 'fadeOutDuration', 0, 5, 0.1, isProcessing, 's')}
          </View>
        )}
        
        {/* No effects selected message */}
        {!effects.compression && !effects.reverb && !effects.eq && !effects.fadeIn && !effects.fadeOut && (
          <Text style={[styles.noEffectsText, isDark && styles.textLight]}>
            Select effects above to adjust their parameters
          </Text>
        )}
      </View>
      
      {/* Process Button */}
      <View style={styles.processButtonContainer}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.processingText, isDark && styles.textLight]}>
              Processing... {Math.round(progress * 100)}%
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.processButton}
            onPress={handleProcess}
          >
            <Text style={styles.processButtonText}>Process Audio</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  textLight: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#555',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textInputDark: {
    borderColor: '#444',
    backgroundColor: '#333',
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectToggle: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  effectToggleDark: {
    backgroundColor: '#333',
  },
  effectToggleActive: {
    backgroundColor: Colors.PRIMARY,
  },
  effectToggleActiveDark: {
    backgroundColor: Colors.PRIMARY,
  },
  effectToggleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  effectToggleTextActive: {
    color: '#fff',
  },
  parameterGroup: {
    marginBottom: 16,
  },
  parameterGroupTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#555',
  },
  sliderValue: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  disabledText: {
    opacity: 0.5,
  },
  noEffectsText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: 20,
  },
  processButtonContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  processButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  processingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme => theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme => theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  savePresetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme => theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default AudioProcessingControls; 