import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import * as FileSystem from 'expo-file-system';
import { useAppTheme } from '../../components/ThemeProvider';
import WebAudioRecordingService, { WebAudioRecordingService as WebAudioRecordingServiceClass } from '../../services/WebAudioRecordingService';
import { Slider } from '@react-native-community/slider';
import AudioWaveform from './AudioWaveform';
import { useTheme } from '../../contexts/theme';

// Audio constants for expo-av
const INTERRUPTION_MODE_IOS_DUCK_OTHERS = 1;
const INTERRUPTION_MODE_ANDROID_DUCK_OTHERS = 1;
const RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4 = 2;
const RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC = 3;
const RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC = 2;
const RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX = 127;

interface RecordingInterfaceProps {
  onRecordingComplete: (uri: string) => void;
  existingTrackUri?: string; // Add prop for existing track for overdubbing
}

// Add the RecordingResult interface to fix the linter errors
interface RecordingResult {
  uri: string;
  duration: number;
  audioBlob?: Blob; // Make this optional to handle both web and native platforms
  size?: number;
}

/**
 * RecordingInterface Component
 * 
 * A modern interface for recording audio with visualization and controls.
 * Uses platform-specific implementations for better web support.
 * 
 * @param {function} onRecordingComplete - Callback when recording is complete with URI and duration
 * @param {function} onCancel - Callback when recording is canceled
 * @returns {React.ReactElement} The RecordingInterface component
 */
const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  onRecordingComplete,
  existingTrackUri
}) => {
  const { theme, isDark } = useAppTheme();
  const { isDark: useThemeIsDark, theme: useThemeTheme } = useTheme();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(30).fill(0));
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<boolean | null>(null);
  const [volume, setVolume] = useState<number>(1.0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInstance, setPlaybackInstance] = useState<Audio.Sound | null>(null);
  const [overdubMode, setOverdubMode] = useState(false);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Web audio recording service
  const webRecordingServiceRef = useRef<WebAudioRecordingService | null>(null);
  
  // Initialize audio session
  useEffect(() => {
    const initAudio = async () => {
      try {
        console.log('Initializing audio session...');
        
        // Initialize web recording service if on web platform
        if (Platform.OS === 'web') {
          webRecordingServiceRef.current = new WebAudioRecordingServiceClass();
          
          // Request permissions for web
          const permissionGranted = await webRecordingServiceRef.current.requestPermissions();
          setMicrophonePermission(permissionGranted);
          
          if (!permissionGranted) {
            throw new Error('Microphone permission is required to record audio.');
          }
          
          console.log('Web audio recording service initialized successfully');
        } else {
          // Native platforms use Expo Audio
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          });
          
          // Request permissions for native platforms
          const { granted } = await Audio.requestPermissionsAsync();
          setMicrophonePermission(granted);
          
          if (!granted) {
            throw new Error('Microphone permission is required to record audio.');
          }
          
          console.log('Native audio recording initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        setErrorMessage(`Failed to initialize audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    initAudio();
    
    // Cleanup function
    return () => {
      stopTimer();
      stopAudioLevelMonitoring();
      
      // Clean up recording resources
      if (Platform.OS === 'web') {
        if (webRecordingServiceRef.current) {
          webRecordingServiceRef.current.cleanup();
        }
      } else {
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(err => {
            console.error('Error stopping recording during cleanup:', err);
          });
        }
      }
      
      // Clean up playback resources
      if (playbackInstance) {
        playbackInstance.unloadAsync().catch(err => {
          console.error('Error unloading sound during cleanup:', err);
        });
      }
    };
  }, []);

  /**
   * Start recording
   * Handles platform-specific recording start
   */
  const startRecording = async () => {
    try {
      if (isRecording) {
        console.warn('Already recording');
        return;
      }
      
      setIsProcessing(true);
      setErrorMessage(null);
      
      if (Platform.OS === 'web') {
        // Web recording
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        await webRecordingServiceRef.current.startRecording();
        console.log('Web recording started');
      } else {
        // Native recording
        const recordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        };
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(recordingOptions);
        await recording.startAsync();
        recordingRef.current = recording;
        setRecording(recording);
        console.log('Native recording started');
      }
      
      // Start timer and audio level monitoring
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      startTimer();
      startAudioLevelMonitoring();
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Pause recording
   * Only available on web platform
   */
  const pauseRecording = async () => {
    try {
      if (!isRecording || isPaused) {
        return;
      }
      
      setIsProcessing(true);
      
      if (Platform.OS === 'web') {
        // Web recording pause
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        await webRecordingServiceRef.current.pauseRecording();
        console.log('Web recording paused');
      } else {
        // Native recording pause (not supported in Expo Audio)
        console.warn('Pause recording is not supported on native platforms');
        return;
      }
      
      // Stop timer but keep duration
      stopTimer();
      stopAudioLevelMonitoring();
      
      setIsPaused(true);
      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      setErrorMessage(`Failed to pause recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Resume recording
   * Only available on web platform
   */
  const resumeRecording = async () => {
    try {
      if (!isRecording || !isPaused) {
        return;
      }
      
      setIsProcessing(true);
      
      if (Platform.OS === 'web') {
        // Web recording resume
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        await webRecordingServiceRef.current.resumeRecording();
        console.log('Web recording resumed');
      } else {
        // Native recording resume (not supported in Expo Audio)
        console.warn('Resume recording is not supported on native platforms');
        return;
      }
      
      // Restart timer from current duration
      startTimer();
      startAudioLevelMonitoring();
      
      setIsPaused(false);
      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      setErrorMessage(`Failed to resume recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Stop recording
   * Handles platform-specific recording stop and processing
   */
  const stopRecording = async () => {
    try {
      if (!isRecording) {
        console.warn('Not recording');
        return;
      }
      
      setIsProcessing(true);
      
      // Stop timer and audio level monitoring
      stopTimer();
      stopAudioLevelMonitoring();
      
      let result: RecordingResult;
      
      if (Platform.OS === 'web') {
        // Web recording stop
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        result = await webRecordingServiceRef.current.stopRecording();
        console.log('Web recording stopped:', result);
      } else {
        // Native recording stop
        if (!recordingRef.current) {
          throw new Error('No active recording');
        }
        
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        
        if (!uri) {
          throw new Error('Recording URI is null');
        }
        
        // Get file info for size
        const fileInfo = await FileSystem.getInfoAsync(uri);
        
        result = {
          uri,
          duration: recordingDuration,
          size: fileInfo.size || 0
        };
        
        console.log('Native recording stopped:', result);
      }
      
      // Set recording URI and reset state
      setRecordingUri(result.uri);
      setIsRecording(false);
      setIsPaused(false);
      
      // Call the completion callback
      onRecordingComplete(result.uri);
      
      console.log('Recording completed successfully');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setErrorMessage(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRecording(false);
      setIsPaused(false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Start monitoring audio levels
  const startAudioLevelMonitoring = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }
    
    if (Platform.OS === 'web') {
      // Web implementation using WebAudioRecordingService
      levelIntervalRef.current = setInterval(() => {
        const dataArray = WebAudioRecordingService.getAudioLevels();
        
        if (!dataArray) return;
        
        // Calculate average level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Normalize to 0-1 range
        const normalizedLevel = average / 255;
        
        // Update audio levels
        setAudioLevels(prevLevels => {
          const newLevels = [...prevLevels];
          newLevels.shift();
          newLevels.push(normalizedLevel);
          return newLevels;
        });
      }, 100);
    } else {
      // Native implementation - simulate levels for now
      // In a real implementation, we would use the native APIs to get actual levels
      levelIntervalRef.current = setInterval(() => {
        const randomLevel = Math.random() * 0.5 + 0.1; // Random value between 0.1 and 0.6
        setAudioLevels(prevLevels => {
          const newLevels = [...prevLevels];
          newLevels.shift();
          newLevels.push(randomLevel);
          return newLevels;
        });
      }, 100);
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Render audio visualization
  const renderAudioVisualization = () => {
    return (
      <View style={styles.visualization}>
        {audioLevels.map((level, index) => (
          <View 
            key={index} 
            style={[
              styles.visualizationBar,
              { 
                height: `${Math.max(5, level * 100)}%`,
                backgroundColor: getBarColor(level),
                opacity: isRecording ? 1 : 0.5
              }
            ]}
          />
        ))}
      </View>
    );
  };
  
  // Get color for visualization bar based on level
  const getBarColor = (level: number) => {
    if (level < 0.2) return theme.success;
    if (level < 0.4) return theme.info;
    if (level < 0.6) return theme.warning;
    return theme.error;
  };
  
  // Adjust recording volume (web only)
  const adjustVolume = async (value: number) => {
    setVolume(value);
    // In a real implementation, we would adjust the recording volume
    // This is not directly supported in Expo Audio, but could be implemented
    // using native modules or Web Audio API
  };
  
  const toggleOverdubMode = () => {
    if (!existingTrackUri) {
      Alert.alert('No Track Available', 'You need to have an existing track to use overdub mode.');
      return;
    }
    setOverdubMode(!overdubMode);
  };
  
  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset duration
    setRecordingDuration(0);
    
    // Start a new timer that updates every second
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const stopAudioLevelMonitoring = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
  };
  
  // Render the component
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onRecordingComplete} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Record Audio</Text>
      </View>
      
      <View style={[styles.visualizationContainer, { backgroundColor: theme.cardBackground }]}>
        {renderAudioVisualization()}
      </View>
      
      <Text style={[styles.timer, { color: theme.text }]}>
        {formatTime(recordingDuration)}
      </Text>
      
      {Platform.OS === 'web' && (
        <View style={styles.volumeContainer}>
          <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={adjustVolume}
            minimumTrackTintColor={theme.tint}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.tint}
          />
          <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
        </View>
      )}
      
      {errorMessage && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        {existingTrackUri && (
          <TouchableOpacity 
            style={[
              styles.overdubButton, 
              overdubMode ? styles.overdubButtonActive : null,
              { borderColor: theme.tint }
            ]} 
            onPress={toggleOverdubMode}
          >
            <Ionicons 
              name="layers" 
              size={20} 
              color={overdubMode ? '#FFFFFF' : theme.tint} 
            />
            <Text style={[
              styles.overdubButtonText,
              overdubMode ? styles.overdubButtonTextActive : { color: theme.tint }
            ]}>
              Overdub Mode {overdubMode ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        )}

        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.processingText, { color: theme.text }]}>Processing recording...</Text>
          </View>
        ) : isRecording ? (
          <View style={styles.recordingControls}>
            {isPaused ? (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: theme.tint }]}
                onPress={resumeRecording}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: theme.warning }]}
                onPress={pauseRecording}
              >
                <Ionicons name="pause" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: theme.error }]}
              onPress={stopRecording}
            >
              <Ionicons name="square" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: theme.error }]}
            onPress={startRecording}
            disabled={microphonePermission === false}
          >
            <Ionicons name="mic" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.instructions, { color: theme.textSecondary }]}>
        {isRecording
          ? isPaused
            ? 'Recording paused. Tap play to continue.'
            : 'Recording in progress. Tap stop when finished.'
          : microphonePermission === false
            ? 'Microphone permission denied. Please enable it in your browser settings.'
            : 'Tap the microphone button to start recording.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  visualizationContainer: {
    height: 200,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  visualization: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  visualizationBar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
    height: 40,
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    textAlign: 'center',
    fontSize: 16,
  },
  overdubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  overdubButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  overdubButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  overdubButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default RecordingInterface; 