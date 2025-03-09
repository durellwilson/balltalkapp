import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioProcessor } from '../../hooks/useAudioProcessor';
import { usePresetManager } from '../../hooks/usePresetManager';
import { useAudio } from '../../contexts/AudioContext';
import { ThemeType } from '../../constants/Theme';

interface VocalControlsProps {
  userId: string;
  theme?: ThemeType;
  onProcessingComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

const VocalControls: React.FC<VocalControlsProps> = ({ 
  userId,
  theme = ThemeType.DARK,
  onProcessingComplete,
  onError
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
    applyVocalPreset,
    isLoadingPresets
  } = usePresetManager(userId);
  
  const { setProcessingMode, isInitialized, isLoading } = useAudio();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'deEsser' | 'eq' | 'compression' | 'reverb'>('deEsser');
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  
  // Get theme colors
  const backgroundColor = theme === ThemeType.DARK ? '#2A2A2A' : '#F0F0F0';
  const textColor = theme === ThemeType.DARK ? '#FFFFFF' : '#000000';
  const accentColor = '#8E44AD'; // Purple accent color
  const sectionColor = theme === ThemeType.DARK ? '#3A3A3A' : '#E0E0E0';
  const inactiveTabColor = theme === ThemeType.DARK ? '#444444' : '#DDDDDD';
  const errorColor = '#FF5252';
  const successColor = '#4CAF50';
  
  // Check if audio engine is initialized
  useEffect(() => {
    if (isInitialized && !isLoading) {
      setIsAudioReady(true);
    } else {
      setIsAudioReady(false);
    }
  }, [isInitialized, isLoading]);
  
  // Handle processing mode change
  const handleSetVocalMode = () => {
    try {
      setProcessingMode('vocal');
      setMode('vocal');
      console.log('Vocal processing mode activated');
    } catch (error) {
      console.error('Failed to set vocal processing mode:', error);
      setErrorMessage('Failed to set vocal processing mode');
      if (onError) onError('Failed to set vocal processing mode');
    }
  };
  
  // Handle preset selection
  const handlePresetSelect = async (presetId: string) => {
    try {
      await applyVocalPreset(presetId);
      console.log('Applied vocal preset:', presetId);
    } catch (error) {
      console.error('Failed to apply vocal preset:', error);
      setErrorMessage('Failed to apply vocal preset');
      if (onError) onError('Failed to apply vocal preset');
    }
  };
  
  // Handle process button press
  const handleProcess = async () => {
    if (!isAudioReady) {
      Alert.alert('Audio Not Ready', 'Please wait for the audio engine to initialize or load an audio file first.');
      return;
    }
    
    try {
      setProcessingStatus('processing');
      setErrorMessage('');
      
      // Ensure we're in vocal processing mode
      if (processingMode !== 'vocal') {
        handleSetVocalMode();
      }
      
      // Process the audio
      const result = await process(userId);
      
      if (result.success) {
        setProcessingStatus('success');
        console.log('Vocal processing completed successfully:', result);
        if (onProcessingComplete) onProcessingComplete(result);
        
        // Show success message
        Platform.OS === 'web' 
          ? alert('Vocal processing completed successfully!')
          : Alert.alert('Success', 'Vocal processing completed successfully!');
      } else {
        setProcessingStatus('error');
        setErrorMessage(result.error || 'Unknown error occurred during processing');
        console.error('Vocal processing failed:', result.error);
        if (onError) onError(result.error || 'Unknown error occurred during processing');
        
        // Show error message
        Platform.OS === 'web'
          ? alert(`Processing failed: ${result.error || 'Unknown error'}`)
          : Alert.alert('Processing Failed', result.error || 'Unknown error occurred during processing');
      }
    } catch (error) {
      setProcessingStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      console.error('Error during vocal processing:', error);
      if (onError) onError(errorMsg);
      
      // Show error message
      Platform.OS === 'web'
        ? alert(`Processing error: ${errorMsg}`)
        : Alert.alert('Processing Error', errorMsg);
    } finally {
      // Reset status after a delay
      setTimeout(() => {
        if (processingStatus !== 'processing') {
          setProcessingStatus('idle');
        }
      }, 3000);
    }
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
  
  // Render presets section
  const renderPresets = () => {
    if (isLoadingPresets) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading presets...</Text>
        </View>
      );
    }
    
    if (!vocalPresets || vocalPresets.length === 0) {
      return (
        <Text style={[styles.noPresetsText, { color: textColor }]}>
          No presets available
        </Text>
      );
    }
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
        {vocalPresets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              selectedVocalPresetId === preset.id && { backgroundColor: accentColor }
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
      </ScrollView>
    );
  };
  
  // Render status indicator
  const renderStatusIndicator = () => {
    if (processingStatus === 'processing' || isProcessing) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={[styles.statusText, { color: textColor }]}>
            Processing...
          </Text>
        </View>
      );
    }
    
    if (processingStatus === 'success') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={20} color={successColor} />
          <Text style={[styles.statusText, { color: successColor }]}>
            Processing completed
          </Text>
        </View>
      );
    }
    
    if (processingStatus === 'error') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle" size={20} color={errorColor} />
          <Text style={[styles.statusText, { color: errorColor }]}>
            {errorMessage || 'Processing failed'}
          </Text>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Vocal Processing</Text>
        {!isAudioReady && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#FFC107" />
            <Text style={styles.warningText}>Audio engine not ready</Text>
          </View>
        )}
      </View>
      
      {/* Presets */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Presets</Text>
        {renderPresets()}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {['deEsser', 'eq', 'compression', 'reverb'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab
                ? { backgroundColor: accentColor }
                : { backgroundColor: inactiveTabColor }
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : textColor }
              ]}
            >
              {tab === 'deEsser' ? 'De-Esser' : 
               tab === 'eq' ? 'EQ' : 
               tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab content */}
      <View style={[styles.section, { backgroundColor: sectionColor }]}>
        {renderTabContent()}
      </View>
      
      {/* Status indicator */}
      {renderStatusIndicator()}
      
      {/* Process button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          { backgroundColor: accentColor },
          (isProcessing || processingStatus === 'processing' || !isAudioReady) && { opacity: 0.7 }
        ]}
        onPress={handleProcess}
        disabled={isProcessing || processingStatus === 'processing' || !isAudioReady}
      >
        <Text style={styles.processButtonText}>
          {isProcessing || processingStatus === 'processing' ? 'Processing...' : 'Process Vocal'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FFC107',
    marginLeft: 4,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presetsScroll: {
    flexDirection: 'row',
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#555555',
    marginRight: 8,
  },
  presetButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueText: {
    fontSize: 12,
    textAlign: 'right',
  },
  processButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  noPresetsText: {
    textAlign: 'center',
    padding: 8,
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default VocalControls; 