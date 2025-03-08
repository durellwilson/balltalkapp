import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioProcessor } from '../../hooks/useAudioProcessor';
import { usePresetManager } from '../../hooks/usePresetManager';
import { useAudio } from '../../contexts/AudioContext';
import { ThemeType } from '../../constants/Theme';

interface VocalControlsProps {
  userId: string;
  theme?: ThemeType;
}

const VocalControls: React.FC<VocalControlsProps> = ({ 
  userId,
  theme = ThemeType.DARK 
}) => {
  const { 
    vocalParams, 
    updateVocalParam,
    setMode,
    process,
    isProcessing,
    processingMode
  } = useAudioProcessor();
  
  const {
    vocalPresets,
    selectedVocalPresetId,
    applyVocalPreset
  } = usePresetManager(userId);
  
  const { setProcessingMode } = useAudio();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'deEsser' | 'eq' | 'compression' | 'reverb'>('deEsser');
  
  // Get theme colors
  const backgroundColor = theme === ThemeType.DARK ? '#2A2A2A' : '#F0F0F0';
  const textColor = theme === ThemeType.DARK ? '#FFFFFF' : '#000000';
  const accentColor = '#8E44AD'; // Purple accent color
  const sectionColor = theme === ThemeType.DARK ? '#3A3A3A' : '#E0E0E0';
  const inactiveTabColor = theme === ThemeType.DARK ? '#444444' : '#DDDDDD';
  
  // Handle processing mode change
  const handleSetVocalMode = () => {
    setProcessingMode('vocal');
    setMode('vocal');
  };
  
  // Handle preset selection
  const handlePresetSelect = async (presetId: string) => {
    await applyVocalPreset(presetId);
  };
  
  // Handle process button press
  const handleProcess = async () => {
    // Process the audio
    await process(userId);
  };
  
  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'deEsser':
        return (
          <View>
            <View style={styles.switchRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Enable De-Esser
              </Text>
              <Switch
                value={vocalParams.deEsser.enabled}
                onValueChange={(value) => updateVocalParam('deEsser', 'enabled', value)}
                trackColor={{ false: '#767577', true: '#D1C4E9' }}
                thumbColor={vocalParams.deEsser.enabled ? accentColor : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Frequency
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={3000}
                maximumValue={12000}
                step={100}
                value={vocalParams.deEsser.frequency}
                onValueChange={(value) => updateVocalParam('deEsser', 'frequency', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.deEsser.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {Math.round(vocalParams.deEsser.frequency)} Hz
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Threshold
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-30}
                maximumValue={0}
                step={0.5}
                value={vocalParams.deEsser.threshold}
                onValueChange={(value) => updateVocalParam('deEsser', 'threshold', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.deEsser.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.deEsser.threshold.toFixed(1)} dB
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Reduction
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={24}
                step={0.5}
                value={vocalParams.deEsser.reduction}
                onValueChange={(value) => updateVocalParam('deEsser', 'reduction', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.deEsser.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.deEsser.reduction.toFixed(1)} dB
              </Text>
            </View>
          </View>
        );
        
      case 'eq':
        return (
          <View>
            <View style={styles.switchRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Enable EQ
              </Text>
              <Switch
                value={vocalParams.eq.enabled}
                onValueChange={(value) => updateVocalParam('eq', 'enabled', value)}
                trackColor={{ false: '#767577', true: '#D1C4E9' }}
                thumbColor={vocalParams.eq.enabled ? accentColor : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Low Cut
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={500}
                step={1}
                value={vocalParams.eq.lowCut}
                onValueChange={(value) => updateVocalParam('eq', 'lowCut', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.eq.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {Math.round(vocalParams.eq.lowCut)} Hz
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Low Gain
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={0.5}
                value={vocalParams.eq.lowGain}
                onValueChange={(value) => updateVocalParam('eq', 'lowGain', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.eq.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.eq.lowGain.toFixed(1)} dB
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Mid Gain
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={0.5}
                value={vocalParams.eq.midGain}
                onValueChange={(value) => updateVocalParam('eq', 'midGain', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.eq.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.eq.midGain.toFixed(1)} dB
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                High Gain
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={0.5}
                value={vocalParams.eq.highGain}
                onValueChange={(value) => updateVocalParam('eq', 'highGain', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.eq.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.eq.highGain.toFixed(1)} dB
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Presence
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={0.5}
                value={vocalParams.eq.presence}
                onValueChange={(value) => updateVocalParam('eq', 'presence', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.eq.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.eq.presence.toFixed(1)} dB
              </Text>
            </View>
          </View>
        );
        
      case 'compression':
        return (
          <View>
            <View style={styles.switchRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Enable Compression
              </Text>
              <Switch
                value={vocalParams.compression.enabled}
                onValueChange={(value) => updateVocalParam('compression', 'enabled', value)}
                trackColor={{ false: '#767577', true: '#D1C4E9' }}
                thumbColor={vocalParams.compression.enabled ? accentColor : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Threshold
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-60}
                maximumValue={0}
                step={0.5}
                value={vocalParams.compression.threshold}
                onValueChange={(value) => updateVocalParam('compression', 'threshold', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.compression.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.compression.threshold.toFixed(1)} dB
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Ratio
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={0.1}
                value={vocalParams.compression.ratio}
                onValueChange={(value) => updateVocalParam('compression', 'ratio', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.compression.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.compression.ratio.toFixed(1)}:1
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Attack
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={100}
                step={0.1}
                value={vocalParams.compression.attack}
                onValueChange={(value) => updateVocalParam('compression', 'attack', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.compression.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.compression.attack.toFixed(1)} ms
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Release
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={1000}
                step={1}
                value={vocalParams.compression.release}
                onValueChange={(value) => updateVocalParam('compression', 'release', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.compression.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {Math.round(vocalParams.compression.release)} ms
              </Text>
            </View>
          </View>
        );
        
      case 'reverb':
        return (
          <View>
            <View style={styles.switchRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Enable Reverb
              </Text>
              <Switch
                value={vocalParams.reverb.enabled}
                onValueChange={(value) => updateVocalParam('reverb', 'enabled', value)}
                trackColor={{ false: '#767577', true: '#D1C4E9' }}
                thumbColor={vocalParams.reverb.enabled ? accentColor : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Amount
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={vocalParams.reverb.amount}
                onValueChange={(value) => updateVocalParam('reverb', 'amount', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.reverb.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {Math.round(vocalParams.reverb.amount)}%
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Size
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={vocalParams.reverb.size}
                onValueChange={(value) => updateVocalParam('reverb', 'size', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.reverb.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {Math.round(vocalParams.reverb.size)}%
              </Text>
            </View>
            
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: textColor }]}>
                Decay
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={10}
                step={0.1}
                value={vocalParams.reverb.decay}
                onValueChange={(value) => updateVocalParam('reverb', 'decay', value)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
                thumbTintColor={accentColor}
                disabled={!vocalParams.reverb.enabled}
              />
              <Text style={[styles.valueText, { color: textColor }]}>
                {vocalParams.reverb.decay.toFixed(1)} s
              </Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Vocal Processing
      </Text>
      
      {/* Processing mode button */}
      <TouchableOpacity
        style={[
          styles.modeButton,
          processingMode === 'vocal' ? { backgroundColor: accentColor } : { backgroundColor: inactiveTabColor }
        ]}
        onPress={handleSetVocalMode}
      >
        <Text style={[
          styles.modeButtonText,
          processingMode === 'vocal' ? { color: '#FFFFFF' } : { color: textColor }
        ]}>
          Activate Vocal Processing
        </Text>
      </TouchableOpacity>
      
      {/* Presets */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Presets
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.presetContainer}>
            {vocalPresets.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  selectedVocalPresetId === preset.id && { 
                    backgroundColor: accentColor,
                    borderColor: accentColor
                  }
                ]}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    selectedVocalPresetId === preset.id && { color: '#FFFFFF' }
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'deEsser' ? { backgroundColor: accentColor } : { backgroundColor: inactiveTabColor }
          ]}
          onPress={() => setActiveTab('deEsser')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'deEsser' ? { color: '#FFFFFF' } : { color: textColor }
          ]}>
            De-Esser
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'eq' ? { backgroundColor: accentColor } : { backgroundColor: inactiveTabColor }
          ]}
          onPress={() => setActiveTab('eq')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'eq' ? { color: '#FFFFFF' } : { color: textColor }
          ]}>
            EQ
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'compression' ? { backgroundColor: accentColor } : { backgroundColor: inactiveTabColor }
          ]}
          onPress={() => setActiveTab('compression')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'compression' ? { color: '#FFFFFF' } : { color: textColor }
          ]}>
            Comp
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'reverb' ? { backgroundColor: accentColor } : { backgroundColor: inactiveTabColor }
          ]}
          onPress={() => setActiveTab('reverb')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'reverb' ? { color: '#FFFFFF' } : { color: textColor }
          ]}>
            Reverb
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab content */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        {renderTabContent()}
      </View>
      
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
          {isProcessing ? 'Processing...' : 'Process Vocal'}
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
  modeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500'
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
    marginBottom: 8
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888888',
    marginRight: 8
  },
  presetButtonText: {
    fontSize: 14,
    color: '#888888'
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
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

export default VocalControls; 