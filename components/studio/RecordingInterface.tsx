import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import * as FileSystem from 'expo-file-system';
import { useAppTheme } from '../../components/ThemeProvider';
import WebAudioRecordingService from '../../services/WebAudioRecordingService';
import Slider from '@react-native-community/slider';
import AudioWaveform from './AudioWaveform';
import { useTheme } from '../../hooks/useTheme';

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
  
  // Initialize audio session
  useEffect(() => {
    const initAudio = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      const tryInitialize = async () => {
        try {
          console.log('Initializing audio session...');
          
          if (Platform.OS !== 'web') {
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
          } else {
            // Web platform - check if MediaRecorder is available
            if (!window.MediaRecorder) {
              throw new Error('MediaRecorder is not supported in this browser');
            }
            
            // Request permissions for web
            try {
              const result = await WebAudioRecordingService.requestPermissions();
              setMicrophonePermission(result);
              
              if (!result) {
                throw new Error('Microphone permission is required to record audio.');
              }
            } catch (permError) {
              console.error('Error requesting microphone permissions:', permError);
              throw new Error('Failed to request microphone permissions.');
            }
          }
          
          console.log('Audio session initialized successfully');
          return true;
        } catch (error) {
          console.error(`Audio initialization attempt ${retryCount + 1} failed:`, error);
          return false;
        }
      };
      
      while (retryCount < maxRetries) {
        const success = await tryInitialize();
        if (success) return;
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying audio initialization (attempt ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
      
      setErrorMessage('Failed to initialize audio after multiple attempts. Please check your microphone permissions and try again.');
    };
    
    initAudio();
    
    // Clean up on unmount
    return () => {
      stopRecording();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      
      // Clean up web audio if needed
      if (Platform.OS === 'web') {
        WebAudioRecordingService.cleanup();
        
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
        }
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);
  
  // Start recording
  const startRecording = async () => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);
      
      // Validate microphone permissions first
      if (microphonePermission !== true) {
        setErrorMessage('Microphone permission is required to record audio.');
        return;
      }
      
      // Set recording state
      setIsProcessing(true);
      
      if (Platform.OS !== 'web') {
        // Native platform recording
        try {
          console.log('Starting recording on native platform...');
          
          // Create recording object
          const recording = new Audio.Recording();
          recordingRef.current = recording;
          
          // Prepare recording with high quality settings
          await recording.prepareToRecordAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
            },
            ios: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
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
          });
          
          // Start recording
          await recording.startAsync();
          setRecording(recording);
          
          // Start timer and audio level monitoring
          startTimer();
          startAudioLevelMonitoring();
          
          // Update state
          setIsRecording(true);
          setIsPaused(false);
          
          console.log('Recording started successfully on native platform');
        } catch (nativeError) {
          console.error('Error starting native recording:', nativeError);
          
          // Attempt to clean up any partial recording
          if (recordingRef.current) {
            try {
              await recordingRef.current.stopAndUnloadAsync();
            } catch (cleanupError) {
              console.error('Error cleaning up failed recording:', cleanupError);
            }
            recordingRef.current = null;
          }
          
          throw new Error(`Failed to start recording: ${nativeError.message || 'Unknown error'}`);
        }
      } else {
        // Web platform recording
        try {
          console.log('Starting recording on web platform...');
          
          // Start web recording
          const result = await WebAudioRecordingService.startRecording();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to start web recording');
          }
          
          // Start timer and audio level monitoring
          startTimer();
          startAudioLevelMonitoring();
          
          // Update state
          setIsRecording(true);
          setIsPaused(false);
          
          console.log('Recording started successfully on web platform');
        } catch (webError) {
          console.error('Error starting web recording:', webError);
          throw new Error(`Failed to start web recording: ${webError.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Recording failed to start:', error);
      setErrorMessage(`Failed to start recording: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Pause recording
  const pauseRecording = async () => {
    if (!isRecording || isPaused) return;
    
    try {
      console.log('Pausing recording...');
      
      if (Platform.OS === 'web') {
        // Web implementation
        await WebAudioRecordingService.pauseRecording();
      } else {
        // Native implementation
        if (recordingRef.current) {
          await recordingRef.current.pauseAsync();
        }
      }
      
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Pause audio level monitoring
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      
      setIsPaused(true);
      console.log('Recording paused successfully');
    } catch (error: any) {
      console.error('Error pausing recording:', error);
      setErrorMessage(`Failed to pause recording: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Resume recording
  const resumeRecording = async () => {
    if (!isRecording || !isPaused) return;
    
    try {
      console.log('Resuming recording...');
      
      if (Platform.OS === 'web') {
        // Web implementation
        await WebAudioRecordingService.resumeRecording();
      } else {
        // Native implementation
        if (recordingRef.current) {
          await recordingRef.current.startAsync();
        }
      }
      
      // Resume the timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Resume audio level monitoring
      startAudioLevelMonitoring();
      
      setIsPaused(false);
      console.log('Recording resumed successfully');
    } catch (error: any) {
      console.error('Error resuming recording:', error);
      setErrorMessage(`Failed to resume recording: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      setIsProcessing(true);
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = null;
      }
      
      let recordingResult: RecordingResult | null = null;
      
      if (Platform.OS !== 'web') {
        // Native platform recording
        try {
          if (!recordingRef.current) {
            throw new Error('No active recording found');
          }
          
          // Stop recording
          await recordingRef.current.stopAndUnloadAsync();
          
          // Get recording URI
          const uri = recordingRef.current.getURI();
          if (!uri) {
            throw new Error('Failed to get recording URI');
          }
          
          // Get recording status for duration
          const status = await recordingRef.current.getStatusAsync();
          const durationMillis = status.durationMillis || 0;
          
          // Create result
          recordingResult = {
            uri,
            duration: durationMillis / 1000, // Convert to seconds
          };
          
          console.log('Native recording stopped successfully:', recordingResult);
        } catch (nativeError) {
          console.error('Error stopping native recording:', nativeError);
          throw new Error(`Failed to stop recording: ${nativeError.message || 'Unknown error'}`);
        } finally {
          // Clean up recording reference
          recordingRef.current = null;
        }
      } else {
        // Web platform recording
        try {
          // Stop web recording
          const result = await WebAudioRecordingService.stopRecording();
          
          if (!result.success || !result.audioBlob || !result.audioUrl) {
            throw new Error(result.error || 'Failed to stop web recording');
          }
          
          // Create result
          recordingResult = {
            uri: result.audioUrl,
            duration: recordingDuration,
            audioBlob: result.audioBlob
          };
          
          console.log('Web recording stopped successfully:', recordingResult);
        } catch (webError) {
          console.error('Error stopping web recording:', webError);
          throw new Error(`Failed to stop web recording: ${webError.message || 'Unknown error'}`);
        } finally {
          // Clean up web audio resources
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
          
          if (audioContextRef.current) {
            try {
              await audioContextRef.current.close();
            } catch (closeError) {
              console.error('Error closing audio context:', closeError);
            }
            audioContextRef.current = null;
            analyserRef.current = null;
          }
          
          WebAudioRecordingService.cleanup();
        }
      }
      
      // Reset UI state
      setIsRecording(false);
      setIsPaused(false);
      
      // Validate recording result
      if (!recordingResult || !recordingResult.uri) {
        throw new Error('Failed to get valid recording result');
      }
      
      // Set recording URI and call completion handler
      setRecordingUri(recordingResult.uri);
      
      // Call the completion handler with the recording URI
      if (onRecordingComplete) {
        onRecordingComplete(recordingResult.uri);
      }
      
      console.log('Recording completed successfully');
    } catch (error) {
      console.error('Error in stopRecording:', error);
      setErrorMessage(`Failed to complete recording: ${error.message || 'Unknown error'}`);
      
      // Reset UI state on error
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
    
    if (Platform.OS === 'web' && analyserRef.current) {
      // Web implementation using Web Audio API
      levelIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
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