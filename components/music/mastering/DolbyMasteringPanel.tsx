import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import DolbyMasteringService, { 
  DolbyMasteringProfile, 
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyMasteringOptions,
  DolbyPreviewResult,
  DolbyMasteringResult
} from '../../../services/audio/DolbyMasteringService';
import WaveformVisualizer from '../../studio/WaveformVisualizer';
import { Theme } from '../../../constants/Theme';

interface DolbyMasteringPanelProps {
  userId: string;
  projectId?: string;
  trackId?: string;
  onMasteringComplete?: (result: DolbyMasteringResult) => void;
  theme?: Theme;
}

const DolbyMasteringPanel: React.FC<DolbyMasteringPanelProps> = ({
  userId,
  projectId,
  trackId,
  onMasteringComplete,
  theme = Theme.DARK
}) => {
  // State for file selection
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  // State for mastering options
  const [masteringOptions, setMasteringOptions] = useState<DolbyMasteringOptions>({
    profile: DolbyMasteringProfile.BALANCED,
    outputFormat: DolbyOutputFormat.MP3,
    stereoEnhancement: DolbyStereoEnhancement.NONE,
    loudnessStandard: DolbyLoudnessStandard.STREAMING,
    preserveMetadata: true
  });
  
  // State for custom loudness
  const [customLoudness, setCustomLoudness] = useState<number>(-14);
  
  // State for previews
  const [previews, setPreviews] = useState<DolbyPreviewResult[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(-1);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  
  // State for mastering process
  const [isMastering, setIsMastering] = useState<boolean>(false);
  const [masteringResult, setMasteringResult] = useState<DolbyMasteringResult | null>(null);
  const [masteringError, setMasteringError] = useState<string | null>(null);
  
  // State for result playback
  const [resultSound, setResultSound] = useState<Audio.Sound | null>(null);
  const [isResultPlaying, setIsResultPlaying] = useState<boolean>(false);
  
  // Create service instance
  const masteringService = new DolbyMasteringService();
  
  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      if (previewSound) {
        previewSound.unloadAsync();
      }
      if (resultSound) {
        resultSound.unloadAsync();
      }
    };
  }, []);
  
  /**
   * Pick an audio file
   */
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
        setFileUri(result.uri);
        setUploadedFileUrl(null);
        setPreviews([]);
        setSelectedPreviewIndex(-1);
        setMasteringResult(null);
        setMasteringError(null);
      }
    } catch (error) {
      console.error('Error picking audio file:', error);
    }
  };
  
  /**
   * Upload the selected file
   */
  const uploadFile = async () => {
    if (!fileUri) {
      return;
    }
    
    try {
      const url = await masteringService.uploadAudioForMastering(userId, fileUri);
      setUploadedFileUrl(url);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      setMasteringError('Failed to upload file. Please try again.');
      return null;
    }
  };
  
  /**
   * Create previews for different profiles
   */
  const createPreviews = async () => {
    try {
      // Upload the file if not already uploaded
      let url = uploadedFileUrl;
      if (!url) {
        url = await uploadFile();
        if (!url) {
          return;
        }
      }
      
      // Create previews
      setPreviews([]);
      setSelectedPreviewIndex(-1);
      setMasteringError(null);
      
      const profiles = [
        DolbyMasteringProfile.BALANCED,
        DolbyMasteringProfile.WARM,
        DolbyMasteringProfile.BRIGHT
      ];
      
      const results = await masteringService.createMasteringPreviews(url, profiles);
      setPreviews(results);
      
      // Select the first preview
      if (results.length > 0) {
        setSelectedPreviewIndex(0);
      }
    } catch (error) {
      console.error('Error creating previews:', error);
      setMasteringError('Failed to create previews. Please try again.');
    }
  };
  
  /**
   * Play a preview
   * @param index Index of the preview to play
   */
  const playPreview = async (index: number) => {
    try {
      // Stop any playing sounds
      if (previewSound) {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
      }
      
      if (resultSound) {
        await resultSound.stopAsync();
        setIsResultPlaying(false);
      }
      
      // Load and play the preview
      const preview = previews[index];
      const { sound } = await Audio.Sound.createAsync(
        { uri: preview.previewUrl },
        { shouldPlay: true }
      );
      
      setPreviewSound(sound);
      setIsPreviewPlaying(true);
      setSelectedPreviewIndex(index);
      
      // Update mastering options with the selected profile
      setMasteringOptions({
        ...masteringOptions,
        profile: preview.profile
      });
      
      // Set up completion listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPreviewPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing preview:', error);
    }
  };
  
  /**
   * Stop the preview playback
   */
  const stopPreview = async () => {
    if (previewSound) {
      await previewSound.stopAsync();
      setIsPreviewPlaying(false);
    }
  };
  
  /**
   * Master the audio file
   */
  const masterAudio = async () => {
    try {
      // Upload the file if not already uploaded
      let url = uploadedFileUrl;
      if (!url) {
        url = await uploadFile();
        if (!url) {
          return;
        }
      }
      
      // Start mastering
      setIsMastering(true);
      setMasteringError(null);
      
      // Add custom loudness if needed
      const options: DolbyMasteringOptions = {
        ...masteringOptions
      };
      
      if (options.loudnessStandard === DolbyLoudnessStandard.CUSTOM) {
        options.customLoudness = customLoudness;
      }
      
      // Master the audio
      const result = await masteringService.masterAudio(
        userId,
        url,
        options,
        projectId,
        trackId
      );
      
      setMasteringResult(result);
      
      // Call the completion callback if provided
      if (onMasteringComplete) {
        onMasteringComplete(result);
      }
    } catch (error) {
      console.error('Error mastering audio:', error);
      setMasteringError('Failed to master audio. Please try again.');
    } finally {
      setIsMastering(false);
    }
  };
  
  /**
   * Play the mastered result
   */
  const playResult = async () => {
    if (!masteringResult) {
      return;
    }
    
    try {
      // Stop any playing sounds
      if (previewSound) {
        await previewSound.stopAsync();
        setIsPreviewPlaying(false);
      }
      
      if (resultSound) {
        await resultSound.stopAsync();
        await resultSound.unloadAsync();
      }
      
      // Load and play the result
      const { sound } = await Audio.Sound.createAsync(
        { uri: masteringResult.processedFileUrl },
        { shouldPlay: true }
      );
      
      setResultSound(sound);
      setIsResultPlaying(true);
      
      // Set up completion listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsResultPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing result:', error);
    }
  };
  
  /**
   * Stop the result playback
   */
  const stopResult = async () => {
    if (resultSound) {
      await resultSound.stopAsync();
      setIsResultPlaying(false);
    }
  };
  
  // Get theme colors
  const backgroundColor = theme === Theme.DARK ? '#1E1E1E' : '#FFFFFF';
  const textColor = theme === Theme.DARK ? '#FFFFFF' : '#000000';
  const cardColor = theme === Theme.DARK ? '#2A2A2A' : '#F0F0F0';
  const accentColor = '#8E44AD'; // Purple accent color
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Dolby.io Professional Mastering
      </Text>
      
      {/* File Selection */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          1. Select Audio File
        </Text>
        
        <TouchableOpacity
          style={styles.fileButton}
          onPress={pickAudioFile}
        >
          <Ionicons name="document-attach" size={24} color={accentColor} />
          <Text style={styles.fileButtonText}>
            {selectedFile ? selectedFile.name : 'Choose Audio File'}
          </Text>
        </TouchableOpacity>
        
        {fileUri && (
          <View style={styles.fileInfo}>
            <Text style={[styles.fileInfoText, { color: textColor }]}>
              Selected: {selectedFile?.name}
            </Text>
          </View>
        )}
      </View>
      
      {/* Preview Generation */}
      {fileUri && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            2. Generate Previews
          </Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={createPreviews}
            disabled={!fileUri}
          >
            <Text style={styles.actionButtonText}>
              Generate Mastering Previews
            </Text>
          </TouchableOpacity>
          
          {/* Preview Cards */}
          {previews.length > 0 && (
            <ScrollView horizontal style={styles.previewsContainer}>
              {previews.map((preview, index) => (
                <TouchableOpacity
                  key={preview.id}
                  style={[
                    styles.previewCard,
                    selectedPreviewIndex === index && styles.selectedPreviewCard
                  ]}
                  onPress={() => playPreview(index)}
                >
                  <Text style={styles.previewTitle}>
                    {preview.profile.charAt(0).toUpperCase() + preview.profile.slice(1)}
                  </Text>
                  
                  <View style={styles.previewMetrics}>
                    <Text style={styles.previewMetricText}>
                      Loudness: {preview.metrics.loudness.toFixed(1)} LUFS
                    </Text>
                    <Text style={styles.previewMetricText}>
                      Dynamics: {(preview.metrics.dynamics * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.previewMetricText}>
                      Width: {(preview.metrics.stereoWidth * 100).toFixed(0)}%
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playPreview(index)}
                  >
                    <Ionicons
                      name={isPreviewPlaying && selectedPreviewIndex === index ? "pause" : "play"}
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {isPreviewPlaying && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopPreview}
            >
              <Text style={styles.stopButtonText}>Stop Preview</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Mastering Options */}
      {previews.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            3. Mastering Options
          </Text>
          
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              Output Format:
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={masteringOptions.outputFormat}
                style={styles.picker}
                dropdownIconColor={textColor}
                onValueChange={(value) => setMasteringOptions({
                  ...masteringOptions,
                  outputFormat: value as DolbyOutputFormat
                })}
              >
                <Picker.Item label="MP3" value={DolbyOutputFormat.MP3} />
                <Picker.Item label="WAV" value={DolbyOutputFormat.WAV} />
                <Picker.Item label="AAC" value={DolbyOutputFormat.AAC} />
                <Picker.Item label="OGG" value={DolbyOutputFormat.OGG} />
              </Picker>
            </View>
          </View>
          
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              Stereo Enhancement:
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={masteringOptions.stereoEnhancement}
                style={styles.picker}
                dropdownIconColor={textColor}
                onValueChange={(value) => setMasteringOptions({
                  ...masteringOptions,
                  stereoEnhancement: value as DolbyStereoEnhancement
                })}
              >
                <Picker.Item label="None" value={DolbyStereoEnhancement.NONE} />
                <Picker.Item label="Tighten" value={DolbyStereoEnhancement.TIGHTEN} />
                <Picker.Item label="Widen" value={DolbyStereoEnhancement.WIDEN} />
              </Picker>
            </View>
          </View>
          
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              Loudness Standard:
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={masteringOptions.loudnessStandard}
                style={styles.picker}
                dropdownIconColor={textColor}
                onValueChange={(value) => setMasteringOptions({
                  ...masteringOptions,
                  loudnessStandard: value as DolbyLoudnessStandard
                })}
              >
                <Picker.Item label="Streaming (-14 LUFS)" value={DolbyLoudnessStandard.STREAMING} />
                <Picker.Item label="CD (-9 LUFS)" value={DolbyLoudnessStandard.CD} />
                <Picker.Item label="Broadcast (-23 LUFS)" value={DolbyLoudnessStandard.BROADCAST} />
                <Picker.Item label="Custom" value={DolbyLoudnessStandard.CUSTOM} />
              </Picker>
            </View>
          </View>
          
          {masteringOptions.loudnessStandard === DolbyLoudnessStandard.CUSTOM && (
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: textColor }]}>
                Custom Loudness: {customLoudness} LUFS
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-30}
                maximumValue={-6}
                step={0.5}
                value={customLoudness}
                onValueChange={setCustomLoudness}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor="#CCCCCC"
                thumbTintColor={accentColor}
              />
            </View>
          )}
          
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              Preserve Metadata:
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                masteringOptions.preserveMetadata && styles.toggleButtonActive
              ]}
              onPress={() => setMasteringOptions({
                ...masteringOptions,
                preserveMetadata: !masteringOptions.preserveMetadata
              })}
            >
              <Text style={styles.toggleButtonText}>
                {masteringOptions.preserveMetadata ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={masterAudio}
            disabled={isMastering}
          >
            {isMastering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>
                Master Audio
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Mastering Result */}
      {masteringResult && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            4. Mastering Result
          </Text>
          
          <View style={styles.resultInfo}>
            <Text style={[styles.resultInfoText, { color: textColor }]}>
              Profile: {masteringResult.profile.charAt(0).toUpperCase() + masteringResult.profile.slice(1)}
            </Text>
            <Text style={[styles.resultInfoText, { color: textColor }]}>
              Format: {masteringResult.outputFormat.toUpperCase()}
            </Text>
            <Text style={[styles.resultInfoText, { color: textColor }]}>
              Loudness: {masteringResult.metrics.loudness.toFixed(1)} LUFS
            </Text>
          </View>
          
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.playResultButton}
              onPress={isResultPlaying ? stopResult : playResult}
            >
              <Ionicons
                name={isResultPlaying ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
              />
              <Text style={styles.playResultButtonText}>
                {isResultPlaying ? 'Pause' : 'Play Result'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Error Message */}
      {masteringError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{masteringError}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E44AD',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  fileButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  fileInfo: {
    marginTop: 12,
  },
  fileInfoText: {
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#8E44AD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  previewsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  previewCard: {
    width: 160,
    height: 180,
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  selectedPreviewCard: {
    borderWidth: 2,
    borderColor: '#8E44AD',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewMetrics: {
    marginBottom: 8,
  },
  previewMetricText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  playButton: {
    backgroundColor: '#8E44AD',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  stopButton: {
    backgroundColor: '#E74C3C',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleButton: {
    backgroundColor: '#666666',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#8E44AD',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultInfo: {
    marginBottom: 16,
  },
  resultInfoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playResultButton: {
    backgroundColor: '#8E44AD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  playResultButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
});

export default DolbyMasteringPanel; 