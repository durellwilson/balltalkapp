import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import * as FileSystem from 'expo-file-system';
import SimpleRecordingService from '../../services/SimpleRecordingService';
import Slider from '@react-native-community/slider';
import AudioWaveform from './AudioWaveform';
import { useTheme } from '../../hooks/useTheme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withRepeat, 
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  ZoomIn,
  interpolateColor
} from 'react-native-reanimated';

// Audio constants for expo-av
const INTERRUPTION_MODE_IOS_DUCK_OTHERS = 1;
const INTERRUPTION_MODE_ANDROID_DUCK_OTHERS = 1;
const RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4 = 2;
const RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC = 3;
const RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC = 2;
const RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX = 127;

interface RecordingInterfaceProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  existingTrackUri?: string; // Add prop for existing track for overdubbing
  onLayerAdded?: (uri: string, duration: number) => void; // For multi-track layering
  showAdvancedControls?: boolean;
  theme?: any;
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
 * A professional recording interface with real-time visualization,
 * multi-track layering, and advanced controls.
 * 
 * @param {function} onRecordingComplete - Callback when recording is complete
 * @param {string} existingTrackUri - URI of existing track for overdubbing
 * @param {function} onLayerAdded - Callback when a layer is added
 * @param {boolean} showAdvancedControls - Whether to show advanced controls
 * @param {object} theme - Theme object
 * @returns {React.ReactElement} The RecordingInterface component
 */
const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  onRecordingComplete,
  existingTrackUri,
  onLayerAdded,
  showAdvancedControls = true,
  theme: propTheme
}) => {
  const { theme, isDark } = useTheme();
  
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
  const [layers, setLayers] = useState<RecordingResult[]>([]);
  const [activeLayer, setActiveLayer] = useState<number>(-1);
  const [isLayering, setIsLayering] = useState<boolean>(false);
  const [showLayerControls, setShowLayerControls] = useState<boolean>(false);
  const [recordingName, setRecordingName] = useState<string>('New Recording');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Web audio recording service
  const webRecordingServiceRef = useRef<SimpleRecordingService | null>(null);
  
  // Animation values
  const recordButtonScale = useSharedValue(1);
  const recordingPulse = useSharedValue(1);
  const waveformOpacity = useSharedValue(0);
  const controlsTranslateY = useSharedValue(50);
  const controlsOpacity = useSharedValue(1);
  const layersPanelHeight = useSharedValue(0);
  const waveformScale = useSharedValue(1);
  const recordButtonGlow = useSharedValue(0);
  
  // Initialize web recording service
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        console.log('Initializing web recording service in useEffect');
        webRecordingServiceRef.current = new SimpleRecordingService();
        
        // Check if recording is supported
        const isSupported = webRecordingServiceRef.current.isSupported();
        console.log('Recording supported:', isSupported);
        
        if (!isSupported) {
          setErrorMessage('Your browser does not support recording features. Please try Chrome or Firefox.');
        }
      } catch (error) {
        console.error('Failed to initialize web recording service:', error);
        setErrorMessage(`Failed to initialize recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return () => {
      if (Platform.OS === 'web' && webRecordingServiceRef.current) {
        console.log('Cleaning up web recording service in useEffect cleanup');
        webRecordingServiceRef.current.cleanup();
        webRecordingServiceRef.current = null;
      }
    };
  }, []);
  
  // Initialize audio session
  useEffect(() => {
    const initAudio = async () => {
      try {
        console.log('Initializing audio session...');
        
        // Initialize web recording service if on web platform
        if (Platform.OS === 'web') {
          console.log('Platform is web, initializing web recording service');
          
          if (!webRecordingServiceRef.current) {
            console.log('Creating new WebAudioRecordingService instance');
            webRecordingServiceRef.current = new SimpleRecordingService();
          }
          
          // Check if recording is supported in this browser
          const isSupported = webRecordingServiceRef.current.isSupported();
          console.log('Recording supported:', isSupported);
          
          if (!isSupported) {
            setErrorMessage('Your browser does not support recording features. Please try a different browser like Chrome or Firefox.');
            return;
          }
          
          // Request permissions for web
          console.log('Requesting microphone permissions');
          const permissionGranted = await webRecordingServiceRef.current.requestPermissions();
          console.log('Microphone permission granted:', permissionGranted);
          setMicrophonePermission(permissionGranted);
          
          if (!permissionGranted) {
            setErrorMessage('Microphone permission is required to record audio. Please allow microphone access and try again.');
            return;
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
            setErrorMessage('Microphone permission is required to record audio. Please allow microphone access in your device settings and try again.');
            return;
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
      console.log('Cleaning up RecordingInterface resources...');
      
      // Stop all timers and monitoring
      stopTimer();
      stopAudioLevelMonitoring();
      
      // Clean up recording resources
      if (Platform.OS === 'web') {
        if (webRecordingServiceRef.current) {
          try {
            // If still recording, stop it first
            if (isRecording) {
              webRecordingServiceRef.current.stopRecording().catch(err => {
                console.error('Error stopping recording during cleanup:', err);
              });
            }
            
            // Then clean up all resources
            webRecordingServiceRef.current.cleanup();
            webRecordingServiceRef.current = null;
          } catch (error) {
            console.error('Error cleaning up web recording service:', error);
          }
        }
      } else {
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(err => {
            console.error('Error stopping recording during cleanup:', err);
          });
          recordingRef.current = null;
        }
      }
      
      // Clean up playback resources
      if (playbackInstance) {
        playbackInstance.unloadAsync().catch(err => {
          console.error('Error unloading sound during cleanup:', err);
        });
        setPlaybackInstance(null);
      }
      
      // Reset all state
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      setAudioLevels(Array(30).fill(0));
      setRecordingUri(null);
    };
  }, []);

  /**
   * Start recording with enhanced animations and feedback
   */
  const startRecording = async () => {
    if (isRecording) {
      console.log('Already recording, ignoring startRecording call');
      return;
    }
    
    try {
      console.log('Starting recording process...');
      setErrorMessage(null);
      setIsProcessing(true);
      
      // Enhanced animations for recording start
      recordButtonScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
      
      // Add glow effect to record button
      recordButtonGlow.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      
      // Start pulse animation for recording indicator with improved timing
      recordingPulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      
      // Scale waveform for emphasis
      waveformScale.value = withSequence(
        withTiming(1.05, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      
      // Fade in waveform with improved timing
      waveformOpacity.value = withTiming(1, { 
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });
      
      // Slide up controls with more natural animation
      controlsTranslateY.value = withTiming(0, { 
        duration: 600,
        easing: Easing.out(Easing.back(1.5)) 
      });
      
      console.log('Starting recording...');
      
      if (Platform.OS === 'web') {
        // Web implementation
        try {
          console.log('Using web implementation for recording');
          
          // Ensure we have a recording service instance
          if (!webRecordingServiceRef.current) {
            console.log('Creating new WebAudioRecordingService instance');
            webRecordingServiceRef.current = new SimpleRecordingService();
          }
          
          // Check if recording is supported in this browser
          const isSupported = webRecordingServiceRef.current.isSupported();
          console.log('Recording supported:', isSupported);
          
          if (!isSupported) {
            throw new Error('Your browser does not support recording features');
          }
          
          // Request permissions if not already granted
          if (microphonePermission !== true) {
            console.log('Requesting microphone permissions');
            const permissionGranted = await webRecordingServiceRef.current.requestPermissions();
            console.log('Microphone permission granted:', permissionGranted);
            setMicrophonePermission(permissionGranted);
            
            if (!permissionGranted) {
              throw new Error('Microphone permission denied');
            }
          }
          
          // Start recording
          console.log('Calling webRecordingService.startRecording()');
          await webRecordingServiceRef.current.startRecording();
          
          // Update state and start monitoring
          console.log('Recording started successfully, updating UI state');
          setIsRecording(true);
          setIsPaused(false);
          startTimer();
          startAudioLevelMonitoring();
          
          console.log('Web recording started successfully');
        } catch (error) {
          console.error('Error starting web recording:', error);
          setErrorMessage(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Reset animations
          recordingPulse.value = 1;
          waveformOpacity.value = withTiming(0, { duration: 300 });
          controlsTranslateY.value = withTiming(50, { duration: 300 });
          controlsOpacity.value = withTiming(0, { duration: 300 });
        }
      } else {
        // Native implementation
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          
          const { recording } = await Audio.Recording.createAsync({
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
          });
          
          recordingRef.current = recording;
          setRecording(recording);
          setIsRecording(true);
          setIsPaused(false);
          startTimer();
          startAudioLevelMonitoring();
          
          console.log('Native recording started successfully');
        } catch (error) {
          console.error('Error starting native recording:', error);
          setErrorMessage(`Failed to start recording: ${error.message || 'Unknown error'}`);
          
          // Reset animations
          recordingPulse.value = 1;
          waveformOpacity.value = withTiming(0, { duration: 300 });
          controlsTranslateY.value = withTiming(50, { duration: 300 });
          controlsOpacity.value = withTiming(0, { duration: 300 });
        }
      }
    } catch (error) {
      console.error('General recording error:', error);
      setErrorMessage(`Recording error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset animations
      recordingPulse.value = 1;
      waveformOpacity.value = withTiming(0, { duration: 300 });
      controlsTranslateY.value = withTiming(50, { duration: 300 });
      controlsOpacity.value = withTiming(0, { duration: 300 });
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
        console.log('Cannot pause: not recording or already paused');
        return;
      }
      
      setIsProcessing(true);
      
      if (Platform.OS === 'web') {
        // Web recording pause
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        // Check if the browser supports pause/resume
        if (!webRecordingServiceRef.current.isSupported()) {
          throw new Error('Your browser does not support recording features');
        }
        
        await webRecordingServiceRef.current.pauseRecording();
        console.log('Web recording paused successfully');
      } else {
        // Native recording pause (not supported in Expo Audio)
        console.warn('Pause recording is not supported on native platforms');
        return;
      }
      
      // Stop timer but keep duration
      stopTimer();
      stopAudioLevelMonitoring();
      
      // Update UI state
      setIsPaused(true);
      
      // Animate pause state
      recordingPulse.value = 1; // Stop the pulse animation
      
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
   * Restarts both the timer and audio level monitoring
   */
  const resumeRecording = async () => {
    try {
      if (!isRecording || !isPaused) {
        console.log('Cannot resume: not recording or not paused');
        return;
      }
      
      setIsProcessing(true);
      
      if (Platform.OS === 'web') {
        // Web recording resume
        if (!webRecordingServiceRef.current) {
          throw new Error('Web recording service not initialized');
        }
        
        // Check if the browser supports pause/resume
        if (!webRecordingServiceRef.current.isSupported()) {
          throw new Error('Your browser does not support recording features');
        }
        
        await webRecordingServiceRef.current.resumeRecording();
        console.log('Web recording resumed successfully');
        
        // Restart the pulse animation
        recordingPulse.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1, // Infinite repeat
          true // Reverse
        );
      } else {
        // Native recording resume (not supported in Expo Audio)
        console.warn('Resume recording is not supported on native platforms');
        return;
      }
      
      // Restart timer and audio level monitoring
      startTimer();
      startAudioLevelMonitoring();
      
      // Update UI state
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
   * Stop recording with animation
   * Handles platform-specific recording stop and processing
   */
  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      setIsProcessing(true);
      
      // Stop animations
      recordingPulse.value = 1;
      
      // Animate completion
      waveformOpacity.value = withTiming(0.5, { duration: 300 });
      
      console.log('Stopping recording...');
      
      if (Platform.OS === 'web') {
        // Web implementation
        try {
          if (!webRecordingServiceRef.current) {
            throw new Error('Recording service not initialized');
          }
          
          // If recording is paused, resume it first before stopping
          if (isPaused) {
            try {
              await webRecordingServiceRef.current.resumeRecording();
              console.log('Resumed paused recording before stopping');
            } catch (resumeError) {
              console.warn('Could not resume before stopping:', resumeError);
              // Continue with stopping even if resume fails
            }
          }
          
          const result: RecordingResult = await webRecordingServiceRef.current.stopRecording();
          console.log('Web recording stopped successfully:', result);
          
          if (!result || !result.uri) {
            throw new Error('Recording failed: No audio data received');
          }
          
          setRecordingUri(result.uri);
          stopTimer();
          stopAudioLevelMonitoring();
          
          // Animate success
          waveformOpacity.value = withTiming(1, { duration: 500 });
          
          // Call the completion callback with the correct duration
          const finalDuration = result.duration || recordingDuration;
          console.log(`Recording completed with duration: ${finalDuration}s`);
          
          // Set the recording result
          setRecordingResult(result);
          
          if (onRecordingComplete) {
            onRecordingComplete(result.uri, finalDuration);
          }
        } catch (error) {
          console.error('Error stopping web recording:', error);
          setErrorMessage(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Native implementation
        try {
          if (!recordingRef.current) {
            throw new Error('No active recording found');
          }
          
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          console.log('Native recording stopped successfully:', uri);
          
          if (!uri) {
            throw new Error('Recording failed: No audio data received');
          }
          
          const info = await FileSystem.getInfoAsync(uri);
          console.log('Recording info:', info);
          
          setRecordingUri(uri);
          stopTimer();
          stopAudioLevelMonitoring();
          
          // Animate success
          waveformOpacity.value = withTiming(1, { duration: 500 });
          
          // Call the completion callback with the correct duration from our timer
          console.log(`Recording completed with duration: ${recordingDuration}s`);
          
          // Create and set the recording result
          const nativeResult: RecordingResult = {
            uri,
            duration: recordingDuration
          };
          setRecordingResult(nativeResult);
          
          if (onRecordingComplete) {
            onRecordingComplete(uri, recordingDuration);
          }
        } catch (error) {
          console.error('Error stopping native recording:', error);
          setErrorMessage(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('General error stopping recording:', error);
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setIsProcessing(false);
      
      // Reset audio mode
      if (Platform.OS !== 'web') {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (error) {
          console.error('Error resetting audio mode:', error);
        }
      }
    }
  };
  
  // Start monitoring audio levels
  const startAudioLevelMonitoring = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }
    
    levelIntervalRef.current = setInterval(() => {
      try {
        if (Platform.OS === 'web') {
          // Web implementation
          if (webRecordingServiceRef.current && isRecording && !isPaused) {
            const levels = webRecordingServiceRef.current.getAudioLevels();
            if (levels && levels.length > 0) {
              // Sample the levels to get a smaller array
              const sampledLevels = sampleArray(Array.from(levels), 30);
              setAudioLevels(sampledLevels);
            } else {
              // If no levels are available, generate placeholder levels
              // This helps provide visual feedback even if the actual levels can't be read
              const fallbackLevels = generateFallbackLevels();
              setAudioLevels(fallbackLevels);
            }
          }
        } else {
          // Native implementation
          // This would require a native implementation of audio level monitoring
          // For now, we'll just generate random levels for visualization
          const randomLevels = generateFallbackLevels();
          setAudioLevels(randomLevels);
        }
      } catch (error) {
        console.error('Error monitoring audio levels:', error);
        // Don't stop the interval on error, just use fallback levels
        const fallbackLevels = generateFallbackLevels();
        setAudioLevels(fallbackLevels);
      }
    }, 100);
  };
  
  // Generate fallback audio levels for visualization when actual levels aren't available
  const generateFallbackLevels = (): number[] => {
    // If recording is paused, return low-level values
    if (isPaused) {
      return Array(30).fill(0).map(() => Math.random() * 0.1);
    }
    
    // If recording is active, generate more dynamic values
    return Array(30).fill(0).map(() => {
      // Create a more natural-looking waveform with some peaks and valleys
      const base = Math.random() * 0.5; // Base level between 0 and 0.5
      const peak = Math.random() > 0.8 ? Math.random() * 0.5 : 0; // Occasional peaks
      return base + peak;
    });
  };
  
  // Helper function to sample an array to a smaller size
  const sampleArray = (array: number[], sampleSize: number): number[] => {
    if (!array || array.length === 0) {
      return Array(sampleSize).fill(0);
    }
    
    if (array.length <= sampleSize) return array;
    
    const result: number[] = [];
    const step = array.length / sampleSize;
    
    for (let i = 0; i < sampleSize; i++) {
      const index = Math.floor(i * step);
      if (index < array.length) {
        result.push(array[index]);
      } else {
        result.push(0); // Fallback for out of bounds
      }
    }
    
    return result;
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
      <Animated.View 
        style={[
          styles.visualization,
          useAnimatedStyle(() => ({
            transform: [{ scale: waveformScale.value }]
          }))
        ]}
      >
        {audioLevels.map((level, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.visualizationBar,
              { 
                height: `${Math.max(5, level * 100)}%`,
                backgroundColor: getBarColor(level),
                width: 4,
                marginHorizontal: 1,
                borderRadius: 2,
                opacity: isRecording ? withTiming(1, { duration: 100 }) : 0.5
              }
            ]}
          />
        ))}
      </Animated.View>
    );
  };
  
  // Get color for visualization bar based on level with smoother gradient
  const getBarColor = (level: number) => {
    if (level < 0.2) return theme.success;
    if (level < 0.4) return theme.info;
    if (level < 0.6) return theme.warning;
    if (level < 0.8) return theme.error;
    return '#FF3B30'; // Bright red for peak levels
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
  
  // Animated styles
  const recordButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: recordButtonScale.value }]
    };
  });
  
  const recordingIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: recordingPulse.value }],
      opacity: isRecording ? 1 : 0
    };
  });
  
  const waveformAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waveformOpacity.value
    };
  });
  
  const controlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: controlsTranslateY.value }],
      opacity: controlsOpacity.value
    };
  });
  
  /**
   * Add a new layer
   */
  const addLayer = async () => {
    if (!recordingResult) {
      Alert.alert('No Recording', 'You need to record something first before adding a layer.');
      return;
    }
    
    // Add current recording to layers
    setLayers(prev => [...prev, recordingResult]);
    
    // Notify parent component
    if (onLayerAdded) {
      onLayerAdded(recordingResult.uri, recordingResult.duration);
    }
    
    // Reset for next recording
    setRecordingResult(null);
    setRecordingDuration(0);
    setAudioLevels(Array(NUM_VISUALIZATION_BARS).fill(0));
    
    // Show layer controls
    setShowLayerControls(true);
    layersPanelHeight.value = withTiming(150, { duration: 500 });
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Haptics not available
      }
    }
  };
  
  /**
   * Remove a layer
   */
  const removeLayer = (index: number) => {
    setLayers(prev => prev.filter((_, i) => i !== index));
    
    if (layers.length <= 1) {
      setShowLayerControls(false);
      layersPanelHeight.value = withTiming(0, { duration: 300 });
    }
  };
  
  /**
   * Select a layer to edit
   */
  const selectLayer = (index: number) => {
    setActiveLayer(index);
    // Load the layer for editing/playback
    // This would involve more complex audio manipulation in a real app
  };
  
  /**
   * Render the layers panel for multi-track recording
   */
  const renderLayersPanel = () => {
    return (
      <Animated.View 
        style={[
          styles.layersPanel,
          useAnimatedStyle(() => ({
            height: layersPanelHeight.value,
            opacity: layersPanelHeight.value > 0 ? 1 : 0,
          }))
        ]}
      >
        <View style={styles.layersPanelHeader}>
          <Text style={[styles.layersPanelTitle, { color: theme.text }]}>Layers</Text>
          <TouchableOpacity 
            style={styles.closeLayersButton}
            onPress={() => {
              setShowLayerControls(false);
              layersPanelHeight.value = withTiming(0, { duration: 300 });
            }}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal style={styles.layersContainer}>
          {layers.map((layer, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.layerItem,
                activeLayer === index && styles.activeLayerItem,
                { borderColor: theme.border }
              ]}
              onPress={() => selectLayer(index)}
            >
              <Text style={[styles.layerName, { color: theme.text }]}>
                Layer {index + 1}
              </Text>
              <Text style={[styles.layerDuration, { color: theme.textSecondary }]}>
                {formatTime(layer.duration)}
              </Text>
              <TouchableOpacity 
                style={styles.removeLayerButton}
                onPress={() => removeLayer(index)}
              >
                <Ionicons name="close-circle" size={18} color={theme.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };
  
  // Enhanced render method with more professional UI
  return (
    <View style={styles.container}>
      {/* Recording name input */}
      {showNameInput && (
        <Animated.View 
          style={[styles.nameInputContainer, { entering: FadeIn.duration(300) }]}
        >
          <TextInput
            style={[styles.nameInput, { color: theme.text, borderColor: theme.border }]}
            value={recordingName}
            onChangeText={setRecordingName}
            placeholder="Recording Name"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          <TouchableOpacity 
            style={[styles.saveNameButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowNameInput(false)}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Main recording visualization */}
      <Animated.View 
        style={[
          styles.waveformContainer,
          useAnimatedStyle(() => ({
            opacity: waveformOpacity.value,
          }))
        ]}
      >
        {renderAudioVisualization()}
        
        {/* Recording time */}
        <Animated.View 
          style={[
            styles.timeContainer,
            useAnimatedStyle(() => ({
              opacity: controlsOpacity.value,
            }))
          ]}
        >
          <Text style={[styles.timeText, { color: theme.text }]}>
            {formatTime(recordingDuration)}
          </Text>
        </Animated.View>
      </Animated.View>
      
      {/* Layers panel for multi-track recording */}
      {renderLayersPanel()}
      
      {/* Recording controls */}
      <Animated.View 
        style={[
          styles.controlsContainer,
          useAnimatedStyle(() => ({
            transform: [{ translateY: controlsTranslateY.value }],
            opacity: controlsOpacity.value,
          }))
        ]}
      >
        {/* Main recording button with enhanced animations */}
        <Animated.View 
          style={[
            styles.recordButtonContainer,
            useAnimatedStyle(() => ({
              transform: [{ scale: recordButtonScale.value }],
              shadowOpacity: recordButtonGlow.value * 0.8,
              shadowRadius: 10 + (recordButtonGlow.value * 10),
            }))
          ]}
        >
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && !isPaused ? styles.stopButton : styles.recordButton,
              { backgroundColor: isRecording && !isPaused ? theme.error : theme.primary }
            ]}
            onPress={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
            disabled={isProcessing}
          >
            <Ionicons
              name={
                isProcessing ? "hourglass" :
                isRecording && !isPaused ? "pause" : 
                isPaused ? "play" : "mic"
              }
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Additional recording controls */}
        <View style={styles.additionalControls}>
          {isRecording || recordingResult ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: theme.secondary }]}
                onPress={stopRecording}
                disabled={isProcessing || (!isRecording && !recordingResult)}
              >
                <Ionicons name="stop" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              
              {recordingResult && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.success }]}
                  onPress={addLayer}
                >
                  <Ionicons name="layers" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {recordingResult && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.info }]}
                  onPress={() => setShowNameInput(true)}
                >
                  <Ionicons name="create" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {existingTrackUri && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.warning }]}
                  onPress={toggleOverdubMode}
                >
                  <Ionicons 
                    name={isOverdubMode ? "layers" : "add-circle"} 
                    size={22} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
              
              {showAdvancedControls && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.info }]}
                  onPress={() => {
                    // Toggle advanced settings
                    // This would show things like input selection, quality settings, etc.
                  }}
                >
                  <Ionicons name="settings" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Animated.View>
      
      {/* Volume control */}
      <Animated.View 
        style={[
          styles.volumeContainer,
          { entering: FadeIn.duration(500).delay(300) }
        ]}
      >
        <Ionicons name="volume-low" size={20} color={isDark ? '#CCCCCC' : '#666666'} />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={adjustVolume}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={isDark ? '#444444' : '#DDDDDD'}
          thumbTintColor={theme.primary}
        />
        <Ionicons name="volume-high" size={20} color={isDark ? '#CCCCCC' : '#666666'} />
      </Animated.View>
      
      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.processingText, { color: theme.text }]}>
            Processing Audio...
          </Text>
        </View>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <Animated.View 
          style={[styles.errorContainer, { entering: FadeIn.duration(300) }]}
        >
          <Ionicons name="alert-circle" size={24} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  nameInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  saveNameButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 8,
  },
  visualizationBar: {
    alignSelf: 'center',
    borderRadius: 2,
    minHeight: 3,
  },
  timeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  layersPanel: {
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  layersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  layersPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeLayersButton: {
    padding: 4,
  },
  layersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  layerItem: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginRight: 10,
    position: 'relative',
  },
  activeLayerItem: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  layerDuration: {
    fontSize: 12,
  },
  removeLayerButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordButtonContainer: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  additionalControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default RecordingInterface; 