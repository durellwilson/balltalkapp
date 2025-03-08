import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import VocalIsolationService, {
  VocalIsolationMode,
  VocalIsolationOptions,
  VocalIsolationResult
} from '../../services/audio/VocalIsolationService';
import { DolbyOutputFormat } from '../../services/audio/DolbyMasteringService';

interface VocalIsolatorProps {
  audioUri: string;
  userId: string;
  onIsolationComplete?: (result: VocalIsolationResult) => void;
  projectId?: string;
  trackId?: string;
}

const VocalIsolator: React.FC<VocalIsolatorProps> = ({
  audioUri,
  userId,
  onIsolationComplete,
  projectId,
  trackId
}) => {
  // State for audio playback
  const [originalSound, setOriginalSound] = useState<Audio.Sound | null>(null);
  const [vocalsSound, setVocalsSound] = useState<Audio.Sound | null>(null);
  const [instrumentalSound, setInstrumentalSound] = useState<Audio.Sound | null>(null);
  
  const [isOriginalPlaying, setIsOriginalPlaying] = useState(false);
  const [isVocalsPlaying, setIsVocalsPlaying] = useState(false);
  const [isInstrumentalPlaying, setIsInstrumentalPlaying] = useState(false);
  
  // State for options
  const [options, setOptions] = useState<VocalIsolationOptions>(
    VocalIsolationService.getDefaultVocalIsolationOptions()
  );
  
  // State for results
  const [isolationResult, setIsolationResult] = useState<VocalIsolationResult | null>(null);
  
  // State for processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  
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
      setMessage('Failed to load original audio');
    }
  };
  
  // Load vocals sound
  const loadVocalsSound = async (uri: string) => {
    try {
      if (vocalsSound) {
        await vocalsSound.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsVocalsPlaying(status.isPlaying);
          
          // Stop playback when it reaches the end
          if (status.didJustFinish) {
            setIsVocalsPlaying(false);
          }
        }
      });
      
      setVocalsSound(sound);
    } catch (error) {
      console.error('Error loading vocals sound:', error);
      setMessage('Failed to load vocals audio');
    }
  };
  
  // Load instrumental sound
  const loadInstrumentalSound = async (uri: string) => {
    try {
      if (instrumentalSound) {
        await instrumentalSound.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsInstrumentalPlaying(status.isPlaying);
          
          // Stop playback when it reaches the end
          if (status.didJustFinish) {
            setIsInstrumentalPlaying(false);
          }
        }
      });
      
      setInstrumentalSound(sound);
    } catch (error) {
      console.error('Error loading instrumental sound:', error);
      setMessage('Failed to load instrumental audio');
    }
  };
  
  // Play/pause original sound
  const toggleOriginalPlayback = async () => {
    if (!originalSound) {
      await loadOriginalSound();
      return;
    }
    
    if (isOriginalPlaying) {
      await originalSound.pauseAsync();
    } else {
      // Pause other sounds if they're playing
      if (vocalsSound && isVocalsPlaying) {
        await vocalsSound.pauseAsync();
      }
      if (instrumentalSound && isInstrumentalPlaying) {
        await instrumentalSound.pauseAsync();
      }
      
      await originalSound.playAsync();
    }
  };
  
  // Play/pause vocals sound
  const toggleVocalsPlayback = async () => {
    if (!vocalsSound || !isolationResult?.vocalsFileUrl) return;
    
    if (isVocalsPlaying) {
      await vocalsSound.pauseAsync();
    } else {
      // Pause other sounds if they're playing
      if (originalSound && isOriginalPlaying) {
        await originalSound.pauseAsync();
      }
      if (instrumentalSound && isInstrumentalPlaying) {
        await instrumentalSound.pauseAsync();
      }
      
      await vocalsSound.playAsync();
    }
  };
  
  // Play/pause instrumental sound
  const toggleInstrumentalPlayback = async () => {
    if (!instrumentalSound || !isolationResult?.instrumentalFileUrl) return;
    
    if (isInstrumentalPlaying) {
      await instrumentalSound.pauseAsync();
    } else {
      // Pause other sounds if they're playing
      if (originalSound && isOriginalPlaying) {
        await originalSound.pauseAsync();
      }
      if (vocalsSound && isVocalsPlaying) {
        await vocalsSound.pauseAsync();
      }
      
      await instrumentalSound.playAsync();
    }
  };
  
  // Isolate vocals
  const isolateVocals = async () => {
    try {
      setIsProcessing(true);
      setMessage('Isolating vocals...');
      
      // Isolate vocals
      const result = await VocalIsolationService.isolateVocals(
        userId,
        audioUri,
        options,
        projectId,
        trackId
      );
      
      setIsolationResult(result);
      
      // Load isolated tracks
      if (result.vocalsFileUrl) {
        await loadVocalsSound(result.vocalsFileUrl);
      }
      
      if (result.instrumentalFileUrl) {
        await loadInstrumentalSound(result.instrumentalFileUrl);
      }
      
      setMessage('Vocal isolation completed successfully');
      
      // Call the callback if provided
      if (onIsolationComplete) {
        onIsolationComplete(result);
      }
    } catch (error) {
      console.error('Error isolating vocals:', error);
      setMessage('Failed to isolate vocals');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Update options
  const updateOptions = (updates: Partial<VocalIsolationOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };
  
  // Render options
  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.sectionTitle}>Isolation Options</Text>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Mode:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={options.mode}
            onValueChange={(value) => updateOptions({ mode: value })}
            style={styles.picker}
          >
            <Picker.Item label="Vocals Only" value={VocalIsolationMode.VOCALS_ONLY} />
            <Picker.Item label="Instrumental Only" value={VocalIsolationMode.INSTRUMENTAL_ONLY} />
            <Picker.Item label="Separate Tracks" value={VocalIsolationMode.SEPARATE_TRACKS} />
          </Picker>
        </View>
      </View>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Output Format:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={options.outputFormat}
            onValueChange={(value) => updateOptions({ outputFormat: value })}
            style={styles.picker}
          >
            <Picker.Item label="MP3" value={DolbyOutputFormat.MP3} />
            <Picker.Item label="WAV" value={DolbyOutputFormat.WAV} />
            <Picker.Item label="AAC" value={DolbyOutputFormat.AAC} />
          </Picker>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.isolateButton}
        onPress={isolateVocals}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Isolate Vocals</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Render player
  const renderPlayer = (
    uri: string | undefined,
    isPlaying: boolean,
    togglePlayback: () => void,
    label: string,
    disabled: boolean = false
  ) => (
    <View style={styles.playerContainer}>
      <Text style={[styles.playerLabel, disabled && styles.disabledText]}>{label}</Text>
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        disabled={disabled}
      >
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={48}
          color={disabled ? '#CCCCCC' : '#007AFF'}
        />
      </TouchableOpacity>
    </View>
  );
  
  // Render results
  const renderResults = () => {
    if (!isolationResult) return null;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Isolated Tracks</Text>
        
        <View style={styles.playersContainer}>
          {renderPlayer(
            audioUri,
            isOriginalPlaying,
            toggleOriginalPlayback,
            'Original',
            false
          )}
          
          {renderPlayer(
            isolationResult.vocalsFileUrl,
            isVocalsPlaying,
            toggleVocalsPlayback,
            'Vocals',
            !isolationResult.vocalsFileUrl
          )}
          
          {renderPlayer(
            isolationResult.instrumentalFileUrl,
            isInstrumentalPlaying,
            toggleInstrumentalPlayback,
            'Instrumental',
            !isolationResult.instrumentalFileUrl
          )}
        </View>
        
        {isolationResult.metrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsTitle}>Quality Metrics</Text>
            <Text style={styles.metricText}>
              Vocal Separation Quality: {(isolationResult.metrics.vocalSeparationQuality * 100).toFixed(1)}%
            </Text>
            <Text style={styles.metricText}>
              Vocal Presence: {(isolationResult.metrics.vocalPresence * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {renderOptions()}
      
      {message && (
        <Text style={styles.messageText}>{message}</Text>
      )}
      
      {renderResults()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
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
  isolateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 16,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  playerContainer: {
    alignItems: 'center',
    padding: 8,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  disabledText: {
    color: '#CCCCCC',
  },
  playButton: {
    padding: 8,
  },
  metricsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  metricText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
});

export default VocalIsolator; 