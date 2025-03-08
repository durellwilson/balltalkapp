import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioProcessor } from '../../hooks/useAudioProcessor';
import { usePresetManager } from '../../hooks/usePresetManager';
import { useAudio } from '../../contexts/AudioContext';
import { ThemeType } from '../../constants/Theme';

interface MasteringControlsProps {
  userId: string;
  theme?: ThemeType;
}

const MasteringControls: React.FC<MasteringControlsProps> = ({ 
  userId,
  theme = ThemeType.DARK 
}) => {
  const { 
    masteringParams, 
    updateMasteringParam,
    setMode,
    process,
    isProcessing,
    processingMode
  } = useAudioProcessor();
  
  const {
    masteringPresets,
    selectedMasteringPresetId,
    applyMasteringPreset,
    getDolbyMasteringOptions
  } = usePresetManager(userId);
  
  const { setProcessingMode } = useAudio();
  
  // Local state
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [useDolby, setUseDolby] = useState<boolean>(false);
  
  // Get theme colors
  const backgroundColor = theme === ThemeType.DARK ? '#2A2A2A' : '#F0F0F0';
  const textColor = theme === ThemeType.DARK ? '#FFFFFF' : '#000000';
  const accentColor = '#8E44AD'; // Purple accent color
  const sectionColor = theme === ThemeType.DARK ? '#3A3A3A' : '#E0E0E0';
  
  // Handle processing mode change
  const handleProcessingModeChange = (useDolby: boolean) => {
    setUseDolby(useDolby);
    setProcessingMode(useDolby ? 'dolby' : 'local');
    setMode(useDolby ? 'dolby' : 'local');
  };
  
  // Handle preset selection
  const handlePresetSelect = async (presetId: string) => {
    await applyMasteringPreset(presetId);
  };
  
  // Handle process button press
  const handleProcess = async () => {
    // Process the audio
    const options = useDolby ? { dolby: getDolbyMasteringOptions() } : undefined;
    await process(userId, options);
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Mastering
      </Text>
      
      {/* Processing mode toggle */}
      <View style={styles.modeContainer}>
        <Text style={[styles.modeLabel, { color: textColor }]}>
          Use Dolby.io Professional Mastering
        </Text>
        <Switch
          value={useDolby}
          onValueChange={handleProcessingModeChange}
          trackColor={{ false: '#767577', true: '#D1C4E9' }}
          thumbColor={useDolby ? accentColor : '#f4f3f4'}
        />
      </View>
      
      {/* Presets */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Presets
        </Text>
        <View style={styles.presetContainer}>
          {masteringPresets.slice(0, 3).map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                selectedMasteringPresetId === preset.id && { 
                  backgroundColor: accentColor,
                  borderColor: accentColor
                }
              ]}
              onPress={() => handlePresetSelect(preset.id)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  selectedMasteringPresetId === preset.id && { color: '#FFFFFF' }
                ]}
              >
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Basic controls */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Basic Controls
        </Text>
        
        {/* Loudness */}
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: textColor }]}>
            Loudness
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-24}
            maximumValue={0}
            step={0.1}
            value={masteringParams.loudness}
            onValueChange={(value) => updateMasteringParam('loudness', value)}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
            thumbTintColor={accentColor}
          />
          <Text style={[styles.valueText, { color: textColor }]}>
            {masteringParams.loudness.toFixed(1)} dB
          </Text>
        </View>
        
        {/* Clarity */}
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: textColor }]}>
            Clarity
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={masteringParams.clarity}
            onValueChange={(value) => updateMasteringParam('clarity', value)}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
            thumbTintColor={accentColor}
          />
          <Text style={[styles.valueText, { color: textColor }]}>
            {Math.round(masteringParams.clarity)}%
          </Text>
        </View>
        
        {/* Stereo Width */}
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: textColor }]}>
            Stereo Width
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={200}
            step={1}
            value={masteringParams.stereoWidth}
            onValueChange={(value) => updateMasteringParam('stereoWidth', value)}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
            thumbTintColor={accentColor}
          />
          <Text style={[styles.valueText, { color: textColor }]}>
            {Math.round(masteringParams.stereoWidth)}%
          </Text>
        </View>
      </View>
      
      {/* Advanced controls toggle */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={[styles.advancedToggleText, { color: textColor }]}>
          {showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls'}
        </Text>
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={textColor}
        />
      </TouchableOpacity>
      
      {/* Advanced controls */}
      {showAdvanced && (
        <View style={[styles.section, { backgroundColor: sectionColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Advanced Controls
          </Text>
          
          {/* Bass Boost */}
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: textColor }]}>
              Bass Boost
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-6}
              maximumValue={6}
              step={0.1}
              value={masteringParams.bassBoost}
              onValueChange={(value) => updateMasteringParam('bassBoost', value)}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
              thumbTintColor={accentColor}
            />
            <Text style={[styles.valueText, { color: textColor }]}>
              {masteringParams.bassBoost.toFixed(1)} dB
            </Text>
          </View>
          
          {/* High Boost */}
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: textColor }]}>
              High Boost
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-6}
              maximumValue={6}
              step={0.1}
              value={masteringParams.highBoost}
              onValueChange={(value) => updateMasteringParam('highBoost', value)}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
              thumbTintColor={accentColor}
            />
            <Text style={[styles.valueText, { color: textColor }]}>
              {masteringParams.highBoost.toFixed(1)} dB
            </Text>
          </View>
          
          {/* Compression */}
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: textColor }]}>
              Compression
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={masteringParams.compression}
              onValueChange={(value) => updateMasteringParam('compression', value)}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
              thumbTintColor={accentColor}
            />
            <Text style={[styles.valueText, { color: textColor }]}>
              {Math.round(masteringParams.compression)}%
            </Text>
          </View>
          
          {/* Limiter Threshold */}
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: textColor }]}>
              Limiter Threshold
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-12}
              maximumValue={0}
              step={0.1}
              value={masteringParams.limiterThreshold}
              onValueChange={(value) => updateMasteringParam('limiterThreshold', value)}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
              thumbTintColor={accentColor}
            />
            <Text style={[styles.valueText, { color: textColor }]}>
              {masteringParams.limiterThreshold.toFixed(1)} dB
            </Text>
          </View>
        </View>
      )}
      
      {/* Process button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          { backgroundColor: accentColor },
          isProcessing && { opacity: 0.7 }
        ]}
        onPress={handleProcess}
        disabled={isProcessing}
      >
        <Text style={styles.processButtonText}>
          {isProcessing ? 'Processing...' : 'Process Audio'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modeLabel: {
    fontSize: 16
  },
  section: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888888',
    marginRight: 8,
    marginBottom: 8
  },
  presetButtonText: {
    fontSize: 14,
    color: '#888888'
  },
  controlRow: {
    marginBottom: 16
  },
  controlLabel: {
    fontSize: 14,
    marginBottom: 8
  },
  slider: {
    width: '100%',
    height: 40
  },
  valueText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  advancedToggleText: {
    fontSize: 14,
    marginRight: 8
  },
  processButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  processButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default MasteringControls; 