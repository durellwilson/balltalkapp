import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import AudioEnhancementOptions from './AudioEnhancementOptions';
import AudioAnalysisVisualization from './AudioAnalysisVisualization';
import DolbyMasteringService, {
  DolbyMasteringOptions,
  DolbyEnhancementOptions,
  DolbyMasteringResult,
  DolbyEnhancementResult,
  DolbyAnalysisResult
} from '../../services/audio/DolbyMasteringService';

interface AudioEnhancerProps {
  audioUri: string;
  userId: string;
  onEnhancementComplete?: (enhancedAudioUri: string) => void;
  projectId?: string;
  trackId?: string;
}

const AudioEnhancer: React.FC<AudioEnhancerProps> = ({
  audioUri,
  userId,
  onEnhancementComplete,
  projectId,
  trackId
}) => {
  // State for audio playback
  const [originalSound, setOriginalSound] = useState<Audio.Sound | null>(null);
  const [enhancedSound, setEnhancedSound] = useState<Audio.Sound | null>(null);
  const [isOriginalPlaying, setIsOriginalPlaying] = useState(false);
  const [isEnhancedPlaying, setIsEnhancedPlaying] = useState(false);

  // State for options
  const [masteringOptions, setMasteringOptions] = useState<DolbyMasteringOptions>(
    DolbyMasteringService.getDefaultMasteringOptions()
  );
  const [enhancementOptions, setEnhancementOptions] = useState<DolbyEnhancementOptions>(
    DolbyMasteringService.getDefaultEnhancementOptions()
  );

  // State for results
  const [masteringResult, setMasteringResult] = useState<DolbyMasteringResult | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<DolbyEnhancementResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DolbyAnalysisResult | null>(null);

  // State for processing
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'enhanced'>('original');

  // Load original sound
  useEffect(() => {
    loadOriginalSound();
    analyzeAudio();

    return () => {
      // Clean up sounds when component unmounts
      if (originalSound) {
        originalSound.unloadAsync();
      }
      if (enhancedSound) {
        enhancedSound.unloadAsync();
      }
    };
  }, [audioUri]);

  // Load original sound
  const loadOriginalSound = async () => {
    try {
      if (originalSound) {
        await originalSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsOriginalPlaying(status.isPlaying);
          
          // Stop playback when it reaches the end
          if (status.didJustFinish) {
            setIsOriginalPlaying(false);
          }
        }
      });

      setOriginalSound(sound);
    } catch (error) {
      console.error('Error loading original sound:', error);
      Alert.alert('Error', 'Failed to load original audio');
    }
  };

  // Load enhanced sound
  const loadEnhancedSound = async (uri: string) => {
    try {
      if (enhancedSound) {
        await enhancedSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsEnhancedPlaying(status.isPlaying);
          
          // Stop playback when it reaches the end
          if (status.didJustFinish) {
            setIsEnhancedPlaying(false);
          }
        }
      });

      setEnhancedSound(sound);
    } catch (error) {
      console.error('Error loading enhanced sound:', error);
      Alert.alert('Error', 'Failed to load enhanced audio');
    }
  };

  // Play/pause original sound
  const toggleOriginalPlayback = async () => {
    if (!originalSound) return;

    if (isOriginalPlaying) {
      await originalSound.pauseAsync();
    } else {
      // Pause enhanced sound if it's playing
      if (enhancedSound && isEnhancedPlaying) {
        await enhancedSound.pauseAsync();
      }
      await originalSound.playAsync();
    }
  };

  // Play/pause enhanced sound
  const toggleEnhancedPlayback = async () => {
    if (!enhancedSound) return;

    if (isEnhancedPlaying) {
      await enhancedSound.pauseAsync();
    } else {
      // Pause original sound if it's playing
      if (originalSound && isOriginalPlaying) {
        await originalSound.pauseAsync();
      }
      await enhancedSound.playAsync();
    }
  };

  // Analyze audio
  const analyzeAudio = async () => {
    try {
      setIsAnalyzing(true);
      
      const result = await DolbyMasteringService.analyzeAudio(
        userId,
        audioUri,
        projectId,
        trackId
      );
      
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing audio:', error);
      Alert.alert('Error', 'Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Master audio
  const masterAudio = async () => {
    try {
      setIsMastering(true);
      
      const result = await DolbyMasteringService.masterAudio(
        userId,
        audioUri,
        masteringOptions,
        projectId,
        trackId
      );
      
      setMasteringResult(result);
      loadEnhancedSound(result.processedFileUrl);
      setActiveTab('enhanced');
      
      if (onEnhancementComplete) {
        onEnhancementComplete(result.processedFileUrl);
      }
    } catch (error) {
      console.error('Error mastering audio:', error);
      Alert.alert('Error', 'Failed to master audio');
    } finally {
      setIsMastering(false);
    }
  };

  // Enhance audio
  const enhanceAudio = async () => {
    try {
      setIsEnhancing(true);
      
      const result = await DolbyMasteringService.enhanceAudio(
        userId,
        audioUri,
        enhancementOptions,
        projectId,
        trackId
      );
      
      setEnhancementResult(result);
      loadEnhancedSound(result.processedFileUrl);
      setActiveTab('enhanced');
      
      if (onEnhancementComplete) {
        onEnhancementComplete(result.processedFileUrl);
      }
    } catch (error) {
      console.error('Error enhancing audio:', error);
      Alert.alert('Error', 'Failed to enhance audio');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Render audio player
  const renderAudioPlayer = (
    uri: string | null,
    isPlaying: boolean,
    togglePlayback: () => void,
    label: string
  ) => {
    return (
      <View style={styles.playerContainer}>
        <Text style={styles.playerLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayback}
          disabled={!uri}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={48}
            color={uri ? '#007AFF' : '#CCCCCC'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Render audio comparison
  const renderAudioComparison = () => {
    const enhancedUri = masteringResult?.processedFileUrl || enhancementResult?.processedFileUrl;
    
    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'original' && styles.activeTab]}
            onPress={() => setActiveTab('original')}
          >
            <Text style={[styles.tabText, activeTab === 'original' && styles.activeTabText]}>
              Original
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'enhanced' && styles.activeTab]}
            onPress={() => setActiveTab('enhanced')}
            disabled={!enhancedUri}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'enhanced' && styles.activeTabText,
                !enhancedUri && styles.disabledTabText
              ]}
            >
              Enhanced
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.playerRow}>
          {activeTab === 'original' ? (
            renderAudioPlayer(audioUri, isOriginalPlaying, toggleOriginalPlayback, 'Original Audio')
          ) : (
            renderAudioPlayer(enhancedUri, isEnhancedPlaying, toggleEnhancedPlayback, 'Enhanced Audio')
          )}
        </View>
        
        {activeTab === 'original' && analysisResult && (
          <AudioAnalysisVisualization 
            metrics={analysisResult.metrics} 
            title="Original Audio Analysis"
          />
        )}
        
        {activeTab === 'enhanced' && (masteringResult || enhancementResult) && (
          <AudioAnalysisVisualization 
            metrics={masteringResult?.metrics || enhancementResult?.metrics} 
            title="Enhanced Audio Analysis"
            showAdvancedMetrics
          />
        )}
      </View>
    );
  };

  // Render enhancement options
  const renderEnhancementOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Enhancement Options</Text>
        
        <AudioEnhancementOptions
          onMasteringOptionsChange={setMasteringOptions}
          onEnhancementOptionsChange={setEnhancementOptions}
          initialMasteringOptions={masteringOptions}
          initialEnhancementOptions={enhancementOptions}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.masterButton]}
            onPress={masterAudio}
            disabled={isMastering}
          >
            {isMastering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Master Audio</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.enhanceButton]}
            onPress={enhanceAudio}
            disabled={isEnhancing}
          >
            {isEnhancing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Enhance Audio</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing audio...</Text>
        </View>
      ) : (
        <>
          {renderAudioComparison()}
          {renderEnhancementOptions()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  comparisonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 16,
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
  disabledTabText: {
    color: '#CCCCCC',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  playButton: {
    padding: 8,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  masterButton: {
    backgroundColor: '#007AFF',
  },
  enhanceButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AudioEnhancer; 