import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import MasteringService from '../../../services/audio/MasteringService';
import { 
  MasteringOptions, 
  MasteringResult, 
  MASTERING_PROFILES 
} from '../../../models/audio/MasteringModels';
import WaveformVisualizer from '../../studio/WaveformVisualizer';
import { Theme } from '../../../constants/Theme';

interface MasteringPanelProps {
  userId: string;
  projectId?: string;
  trackId?: string;
  onMasteringComplete?: (result: MasteringResult) => void;
  theme?: Theme;
}

const MasteringPanel: React.FC<MasteringPanelProps> = ({
  userId,
  projectId,
  trackId,
  onMasteringComplete,
  theme = Theme.DARK
}) => {
  // State for file selection
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  
  // State for mastering options
  const [masteringOptions, setMasteringOptions] = useState<MasteringOptions>({
    targetLoudness: -14,
    enhanceStereoImage: true,
    profileName: 'balanced',
    dynamicProcessing: {
      compression: 50,
      limitingThreshold: -0.3,
      noiseReduction: 20
    },
    equalization: {
      lowBoost: 0,
      midBoost: 0,
      highBoost: 0,
      lowCutFrequency: 30,
      highCutFrequency: 20000
    },
    outputFormat: {
      fileFormat: 'wav',
      sampleRate: 44100,
      bitDepth: 24
    }
  });
  
  // State for mastering process
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [masteringResult, setMasteringResult] = useState<MasteringResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for audio playback
  const [originalSound, setOriginalSound] = useState<Audio.Sound | null>(null);
  const [processedSound, setProcessedSound] = useState<Audio.Sound | null>(null);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingProcessed, setIsPlayingProcessed] = useState(false);
  
  // State for selected profile
  const [selectedProfile, setSelectedProfile] = useState<string>('BALANCED');
  
  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      if (originalSound) {
        originalSound.unloadAsync();
      }
      if (processedSound) {
        processedSound.unloadAsync();
      }
    };
  }, []);
  
  // Update mastering options when profile changes
  useEffect(() => {
    const profile = MASTERING_PROFILES[selectedProfile as keyof typeof MASTERING_PROFILES];
    if (profile) {
      setMasteringOptions({
        ...masteringOptions,
        targetLoudness: profile.targetLoudness,
        enhanceStereoImage: profile.enhanceStereoImage,
        profileName: profile.name,
        dynamicProcessing: profile.dynamicProcessing,
        equalization: profile.equalization
      });
    }
  }, [selectedProfile]);
  
  // Handle file selection
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
        setFileUri(result.uri);
        setError(null);
        
        // Unload any existing sounds
        if (originalSound) {
          await originalSound.unloadAsync();
          setOriginalSound(null);
        }
        if (processedSound) {
          await processedSound.unloadAsync();
          setProcessedSound(null);
        }
        
        // Reset mastering result
        setMasteringResult(null);
        
        // Load the original sound
        loadOriginalSound(result.uri);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      setError('Error selecting file. Please try again.');
    }
  };
  
  // Load original sound
  const loadOriginalSound = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setOriginalSound(sound);
    } catch (err) {
      console.error('Error loading sound:', err);
      setError('Error loading audio file. Please try a different file.');
    }
  };
  
  // Load processed sound
  const loadProcessedSound = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setProcessedSound(sound);
    } catch (err) {
      console.error('Error loading processed sound:', err);
      setError('Error loading processed audio. Please try again.');
    }
  };
  
  // Play original sound
  const playOriginalSound = async () => {
    if (!originalSound) return;
    
    try {
      // Stop processed sound if playing
      if (isPlayingProcessed && processedSound) {
        await processedSound.stopAsync();
        setIsPlayingProcessed(false);
      }
      
      if (isPlayingOriginal) {
        await originalSound.stopAsync();
        setIsPlayingOriginal(false);
      } else {
        await originalSound.replayAsync();
        setIsPlayingOriginal(true);
        
        // Listen for playback status updates
        originalSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingOriginal(false);
          }
        });
      }
    } catch (err) {
      console.error('Error playing original sound:', err);
      setError('Error playing audio. Please try again.');
    }
  };
  
  // Play processed sound
  const playProcessedSound = async () => {
    if (!processedSound) return;
    
    try {
      // Stop original sound if playing
      if (isPlayingOriginal && originalSound) {
        await originalSound.stopAsync();
        setIsPlayingOriginal(false);
      }
      
      if (isPlayingProcessed) {
        await processedSound.stopAsync();
        setIsPlayingProcessed(false);
      } else {
        await processedSound.replayAsync();
        setIsPlayingProcessed(true);
        
        // Listen for playback status updates
        processedSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingProcessed(false);
          }
        });
      }
    } catch (err) {
      console.error('Error playing processed sound:', err);
      setError('Error playing audio. Please try again.');
    }
  };
  
  // Start mastering process
  const handleStartMastering = async () => {
    if (!fileUri) {
      setError('Please select an audio file first.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      
      // Stop any playing sounds
      if (originalSound && isPlayingOriginal) {
        await originalSound.stopAsync();
        setIsPlayingOriginal(false);
      }
      if (processedSound && isPlayingProcessed) {
        await processedSound.stopAsync();
        setIsPlayingProcessed(false);
      }
      
      // Call mastering service
      const result = await MasteringService.masterTrack(
        fileUri,
        masteringOptions,
        userId,
        projectId,
        trackId,
        (progressValue) => setProgress(progressValue)
      );
      
      // Set result and load processed sound
      setMasteringResult(result);
      loadProcessedSound(result.processedFileUrl);
      
      // Call onMasteringComplete callback if provided
      if (onMasteringComplete) {
        onMasteringComplete(result);
      }
    } catch (err) {
      console.error('Error during mastering:', err);
      setError('Error during mastering process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Render profile selection buttons
  const renderProfileButtons = () => {
    return (
      <View style={styles.profilesContainer}>
        <Text style={[styles.sectionTitle, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
          Mastering Profile
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilesScroll}>
          {Object.keys(MASTERING_PROFILES).map((profileKey) => (
            <TouchableOpacity
              key={profileKey}
              style={[
                styles.profileButton,
                selectedProfile === profileKey && styles.selectedProfileButton,
                { backgroundColor: theme === Theme.DARK ? '#333' : '#e0e0e0' }
              ]}
              onPress={() => setSelectedProfile(profileKey)}
            >
              <Text
                style={[
                  styles.profileButtonText,
                  selectedProfile === profileKey && styles.selectedProfileButtonText,
                  { color: theme === Theme.DARK ? '#fff' : '#000' }
                ]}
              >
                {profileKey.charAt(0) + profileKey.slice(1).toLowerCase().replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Render advanced options
  const renderAdvancedOptions = () => {
    return (
      <View style={styles.advancedOptionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
          Advanced Options
        </Text>
        
        {/* Target Loudness */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Target Loudness: {masteringOptions.targetLoudness} LUFS
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-18}
            maximumValue={-9}
            step={0.5}
            value={masteringOptions.targetLoudness}
            onValueChange={(value) => setMasteringOptions({
              ...masteringOptions,
              targetLoudness: value
            })}
            minimumTrackTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
            maximumTrackTintColor={theme === Theme.DARK ? '#555' : '#ccc'}
            thumbTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
          />
        </View>
        
        {/* Compression */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Compression: {masteringOptions.dynamicProcessing?.compression}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={masteringOptions.dynamicProcessing?.compression || 50}
            onValueChange={(value) => setMasteringOptions({
              ...masteringOptions,
              dynamicProcessing: {
                ...masteringOptions.dynamicProcessing!,
                compression: value
              }
            })}
            minimumTrackTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
            maximumTrackTintColor={theme === Theme.DARK ? '#555' : '#ccc'}
            thumbTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
          />
        </View>
        
        {/* Low Boost */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Low Boost: {masteringOptions.equalization?.lowBoost} dB
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-12}
            maximumValue={12}
            step={0.5}
            value={masteringOptions.equalization?.lowBoost || 0}
            onValueChange={(value) => setMasteringOptions({
              ...masteringOptions,
              equalization: {
                ...masteringOptions.equalization!,
                lowBoost: value
              }
            })}
            minimumTrackTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
            maximumTrackTintColor={theme === Theme.DARK ? '#555' : '#ccc'}
            thumbTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
          />
        </View>
        
        {/* Mid Boost */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Mid Boost: {masteringOptions.equalization?.midBoost} dB
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-12}
            maximumValue={12}
            step={0.5}
            value={masteringOptions.equalization?.midBoost || 0}
            onValueChange={(value) => setMasteringOptions({
              ...masteringOptions,
              equalization: {
                ...masteringOptions.equalization!,
                midBoost: value
              }
            })}
            minimumTrackTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
            maximumTrackTintColor={theme === Theme.DARK ? '#555' : '#ccc'}
            thumbTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
          />
        </View>
        
        {/* High Boost */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            High Boost: {masteringOptions.equalization?.highBoost} dB
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-12}
            maximumValue={12}
            step={0.5}
            value={masteringOptions.equalization?.highBoost || 0}
            onValueChange={(value) => setMasteringOptions({
              ...masteringOptions,
              equalization: {
                ...masteringOptions.equalization!,
                highBoost: value
              }
            })}
            minimumTrackTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
            maximumTrackTintColor={theme === Theme.DARK ? '#555' : '#ccc'}
            thumbTintColor={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
          />
        </View>
        
        {/* Stereo Enhancement */}
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Enhance Stereo Image
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              masteringOptions.enhanceStereoImage ? styles.toggleButtonActive : {},
              { backgroundColor: theme === Theme.DARK ? '#333' : '#e0e0e0' }
            ]}
            onPress={() => setMasteringOptions({
              ...masteringOptions,
              enhanceStereoImage: !masteringOptions.enhanceStereoImage
            })}
          >
            <Text
              style={[
                styles.toggleButtonText,
                masteringOptions.enhanceStereoImage ? styles.toggleButtonTextActive : {},
                { color: theme === Theme.DARK ? '#fff' : '#000' }
              ]}
            >
              {masteringOptions.enhanceStereoImage ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render comparison section
  const renderComparisonSection = () => {
    if (!masteringResult) return null;
    
    return (
      <View style={styles.comparisonContainer}>
        <Text style={[styles.sectionTitle, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
          Before & After Comparison
        </Text>
        
        <View style={styles.waveformsContainer}>
          <View style={styles.waveformSection}>
            <Text style={[styles.waveformLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              Original
            </Text>
            <WaveformVisualizer
              waveformData={masteringResult.waveformDataBefore}
              height={80}
              width="100%"
              color={theme === Theme.DARK ? '#4a90e2' : '#2196F3'}
              style={styles.waveform}
            />
            <TouchableOpacity
              style={[
                styles.playButton,
                { backgroundColor: theme === Theme.DARK ? '#333' : '#e0e0e0' }
              ]}
              onPress={playOriginalSound}
              disabled={!originalSound}
            >
              <Ionicons
                name={isPlayingOriginal ? 'pause' : 'play'}
                size={24}
                color={theme === Theme.DARK ? '#fff' : '#000'}
              />
              <Text style={[styles.playButtonText, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
                {isPlayingOriginal ? 'Pause' : 'Play'} Original
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.waveformSection}>
            <Text style={[styles.waveformLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              Mastered
            </Text>
            <WaveformVisualizer
              waveformData={masteringResult.waveformDataAfter}
              height={80}
              width="100%"
              color="#4CAF50"
              style={styles.waveform}
            />
            <TouchableOpacity
              style={[
                styles.playButton,
                { backgroundColor: theme === Theme.DARK ? '#333' : '#e0e0e0' }
              ]}
              onPress={playProcessedSound}
              disabled={!processedSound}
            >
              <Ionicons
                name={isPlayingProcessed ? 'pause' : 'play'}
                size={24}
                color={theme === Theme.DARK ? '#fff' : '#000'}
              />
              <Text style={[styles.playButtonText, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
                {isPlayingProcessed ? 'Pause' : 'Play'} Mastered
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              Loudness
            </Text>
            <Text style={[styles.metricValue, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              {masteringResult.processingMetadata.averageLoudness.toFixed(1)} LUFS
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              Dynamic Range
            </Text>
            <Text style={[styles.metricValue, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              {masteringResult.processingMetadata.dynamicRange.toFixed(1)} dB
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              Stereo Width
            </Text>
            <Text style={[styles.metricValue, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
              {masteringResult.processingMetadata.stereoWidth}%
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: theme === Theme.DARK ? '#1a1a1a' : '#f5f5f5' }
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
        Professional Audio Mastering
      </Text>
      
      <View style={styles.fileSelectionContainer}>
        <TouchableOpacity
          style={[
            styles.selectFileButton,
            { backgroundColor: theme === Theme.DARK ? '#333' : '#e0e0e0' }
          ]}
          onPress={handleSelectFile}
          disabled={isProcessing}
        >
          <Ionicons
            name="document-outline"
            size={24}
            color={theme === Theme.DARK ? '#fff' : '#000'}
          />
          <Text style={[styles.selectFileButtonText, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Select Audio File
          </Text>
        </TouchableOpacity>
        
        {selectedFile && (
          <Text style={[styles.selectedFileName, { color: theme === Theme.DARK ? '#fff' : '#000' }]}>
            Selected: {selectedFile.name}
          </Text>
        )}
      </View>
      
      {renderProfileButtons()}
      
      {renderAdvancedOptions()}
      
      <TouchableOpacity
        style={[
          styles.masterButton,
          isProcessing && styles.masterButtonDisabled,
          { backgroundColor: theme === Theme.DARK ? '#4a90e2' : '#2196F3' }
        ]}
        onPress={handleStartMastering}
        disabled={isProcessing || !fileUri}
      >
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.masterButtonText}>
              Processing... {progress.toFixed(0)}%
            </Text>
          </View>
        ) : (
          <Text style={styles.masterButtonText}>
            Master Track
          </Text>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {renderComparisonSection()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  fileSelectionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectFileButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedFileName: {
    fontSize: 14,
    marginTop: 8,
  },
  profilesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profilesScroll: {
    flexDirection: 'row',
  },
  profileButton: {
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedProfileButton: {
    backgroundColor: '#4a90e2',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedProfileButtonText: {
    color: '#fff',
  },
  advancedOptionsContainer: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    width: '40%',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 4,
    width: 60,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4a90e2',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  masterButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  masterButtonDisabled: {
    opacity: 0.7,
  },
  masterButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  comparisonContainer: {
    marginTop: 20,
  },
  waveformsContainer: {
    marginBottom: 20,
  },
  waveformSection: {
    marginBottom: 20,
  },
  waveformLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  waveform: {
    marginBottom: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MasteringPanel; 