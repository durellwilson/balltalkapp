import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import {
  DolbyMasteringProfile,
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyNoiseReductionLevel,
  DolbyMasteringOptions,
  DolbyEnhancementOptions
} from '../../services/audio/DolbyMasteringService';

interface AudioEnhancementOptionsProps {
  onMasteringOptionsChange: (options: DolbyMasteringOptions) => void;
  onEnhancementOptionsChange: (options: DolbyEnhancementOptions) => void;
  initialMasteringOptions?: Partial<DolbyMasteringOptions>;
  initialEnhancementOptions?: Partial<DolbyEnhancementOptions>;
}

const AudioEnhancementOptions: React.FC<AudioEnhancementOptionsProps> = ({
  onMasteringOptionsChange,
  onEnhancementOptionsChange,
  initialMasteringOptions = {},
  initialEnhancementOptions = {}
}) => {
  // Mastering options state
  const [masteringOptions, setMasteringOptions] = useState<DolbyMasteringOptions>({
    profile: initialMasteringOptions.profile || DolbyMasteringProfile.BALANCED,
    outputFormat: initialMasteringOptions.outputFormat || DolbyOutputFormat.MP3,
    stereoEnhancement: initialMasteringOptions.stereoEnhancement || DolbyStereoEnhancement.NONE,
    loudnessStandard: initialMasteringOptions.loudnessStandard || DolbyLoudnessStandard.STREAMING,
    customLoudness: initialMasteringOptions.customLoudness || -14,
    preserveMetadata: initialMasteringOptions.preserveMetadata !== undefined ? initialMasteringOptions.preserveMetadata : true
  });

  // Enhancement options state
  const [enhancementOptions, setEnhancementOptions] = useState<DolbyEnhancementOptions>({
    noiseReduction: initialEnhancementOptions.noiseReduction || DolbyNoiseReductionLevel.MEDIUM,
    outputFormat: initialEnhancementOptions.outputFormat || DolbyOutputFormat.MP3,
    preserveMetadata: initialEnhancementOptions.preserveMetadata !== undefined ? initialEnhancementOptions.preserveMetadata : true
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<'mastering' | 'enhancement'>('mastering');

  // Update mastering options
  const updateMasteringOptions = (updates: Partial<DolbyMasteringOptions>) => {
    const newOptions = { ...masteringOptions, ...updates };
    setMasteringOptions(newOptions);
    onMasteringOptionsChange(newOptions);
  };

  // Update enhancement options
  const updateEnhancementOptions = (updates: Partial<DolbyEnhancementOptions>) => {
    const newOptions = { ...enhancementOptions, ...updates };
    setEnhancementOptions(newOptions);
    onEnhancementOptionsChange(newOptions);
  };

  // Render mastering options
  const renderMasteringOptions = () => (
    <View style={styles.optionsContainer}>
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Profile:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={masteringOptions.profile}
            onValueChange={(value) => updateMasteringOptions({ profile: value })}
            style={styles.picker}
          >
            <Picker.Item label="Balanced" value={DolbyMasteringProfile.BALANCED} />
            <Picker.Item label="Warm" value={DolbyMasteringProfile.WARM} />
            <Picker.Item label="Bright" value={DolbyMasteringProfile.BRIGHT} />
            <Picker.Item label="Aggressive" value={DolbyMasteringProfile.AGGRESSIVE} />
            <Picker.Item label="Bass Heavy" value={DolbyMasteringProfile.BASS_HEAVY} />
            <Picker.Item label="High Clarity" value={DolbyMasteringProfile.HIGH_CLARITY} />
            <Picker.Item label="Pop" value={DolbyMasteringProfile.POP} />
            <Picker.Item label="Rock" value={DolbyMasteringProfile.ROCK} />
            <Picker.Item label="Hip Hop" value={DolbyMasteringProfile.HIP_HOP} />
            <Picker.Item label="Electronic" value={DolbyMasteringProfile.ELECTRONIC} />
            <Picker.Item label="Jazz" value={DolbyMasteringProfile.JAZZ} />
            <Picker.Item label="Classical" value={DolbyMasteringProfile.CLASSICAL} />
            <Picker.Item label="Folk" value={DolbyMasteringProfile.FOLK} />
            <Picker.Item label="Country" value={DolbyMasteringProfile.COUNTRY} />
          </Picker>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Output Format:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={masteringOptions.outputFormat}
            onValueChange={(value) => updateMasteringOptions({ outputFormat: value })}
            style={styles.picker}
          >
            <Picker.Item label="MP3" value={DolbyOutputFormat.MP3} />
            <Picker.Item label="WAV" value={DolbyOutputFormat.WAV} />
            <Picker.Item label="AAC" value={DolbyOutputFormat.AAC} />
          </Picker>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Stereo Enhancement:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={masteringOptions.stereoEnhancement}
            onValueChange={(value) => updateMasteringOptions({ stereoEnhancement: value })}
            style={styles.picker}
          >
            <Picker.Item label="None" value={DolbyStereoEnhancement.NONE} />
            <Picker.Item label="Tighten" value={DolbyStereoEnhancement.TIGHTEN} />
            <Picker.Item label="Widen" value={DolbyStereoEnhancement.WIDEN} />
          </Picker>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Loudness Standard:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={masteringOptions.loudnessStandard}
            onValueChange={(value) => updateMasteringOptions({ loudnessStandard: value })}
            style={styles.picker}
          >
            <Picker.Item label="Streaming (-14 LUFS)" value={DolbyLoudnessStandard.STREAMING} />
            <Picker.Item label="CD (-9 LUFS)" value={DolbyLoudnessStandard.CD} />
            <Picker.Item label="Broadcast (-23 LUFS)" value={DolbyLoudnessStandard.BROADCAST} />
            <Picker.Item label="Custom" value={DolbyLoudnessStandard.CUSTOM} />
          </Picker>
        </View>
      </View>

      {masteringOptions.loudnessStandard === DolbyLoudnessStandard.CUSTOM && (
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Custom Loudness:</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={-30}
              maximumValue={-6}
              step={0.5}
              value={masteringOptions.customLoudness || -14}
              onValueChange={(value) => updateMasteringOptions({ customLoudness: value })}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCCCCC"
            />
            <Text style={styles.sliderValue}>{masteringOptions.customLoudness} LUFS</Text>
          </View>
        </View>
      )}

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Preserve Metadata:</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => updateMasteringOptions({ preserveMetadata: !masteringOptions.preserveMetadata })}
        >
          <Ionicons
            name={masteringOptions.preserveMetadata ? 'checkmark-circle' : 'circle-outline'}
            size={24}
            color={masteringOptions.preserveMetadata ? '#007AFF' : '#CCCCCC'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render enhancement options
  const renderEnhancementOptions = () => (
    <View style={styles.optionsContainer}>
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Noise Reduction:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={enhancementOptions.noiseReduction}
            onValueChange={(value) => updateEnhancementOptions({ noiseReduction: value })}
            style={styles.picker}
          >
            <Picker.Item label="None" value={DolbyNoiseReductionLevel.NONE} />
            <Picker.Item label="Low" value={DolbyNoiseReductionLevel.LOW} />
            <Picker.Item label="Medium" value={DolbyNoiseReductionLevel.MEDIUM} />
            <Picker.Item label="High" value={DolbyNoiseReductionLevel.HIGH} />
          </Picker>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Output Format:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={enhancementOptions.outputFormat}
            onValueChange={(value) => updateEnhancementOptions({ outputFormat: value })}
            style={styles.picker}
          >
            <Picker.Item label="MP3" value={DolbyOutputFormat.MP3} />
            <Picker.Item label="WAV" value={DolbyOutputFormat.WAV} />
            <Picker.Item label="AAC" value={DolbyOutputFormat.AAC} />
          </Picker>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Preserve Metadata:</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => updateEnhancementOptions({ preserveMetadata: !enhancementOptions.preserveMetadata })}
        >
          <Ionicons
            name={enhancementOptions.preserveMetadata ? 'checkmark-circle' : 'circle-outline'}
            size={24}
            color={enhancementOptions.preserveMetadata ? '#007AFF' : '#CCCCCC'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mastering' && styles.activeTab]}
          onPress={() => setActiveTab('mastering')}
        >
          <Text style={[styles.tabText, activeTab === 'mastering' && styles.activeTabText]}>
            Mastering
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enhancement' && styles.activeTab]}
          onPress={() => setActiveTab('enhancement')}
        >
          <Text style={[styles.tabText, activeTab === 'enhancement' && styles.activeTabText]}>
            Enhancement
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'mastering' ? renderMasteringOptions() : renderEnhancementOptions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  pickerContainer: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  sliderContainer: {
    flex: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
  },
  toggleButton: {
    flex: 2,
    alignItems: 'flex-start',
  },
});

export default AudioEnhancementOptions; 