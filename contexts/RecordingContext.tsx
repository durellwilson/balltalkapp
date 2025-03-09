import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorHandlingService from '../services/ErrorHandlingService';
import WebAudioRecordingService from '../services/WebAudioRecordingService';
import AudioMonitoringService from '../services/AudioMonitoringService';
import { LogLevel } from '../models/monitoring/MonitoringModels';

// Recording quality presets
export enum RecordingQuality {
  LOW = 'low',
  STANDARD = 'standard',
  HIGH = 'high',
  STUDIO = 'studio'
}

// Recording format options
export enum RecordingFormat {
  M4A = 'm4a',
  WAV = 'wav',
  MP3 = 'mp3',
  WEBM = 'webm'
}

// Recording state enum
export enum RecordingState {
  IDLE = 'idle',
  REQUESTING_PERMISSION = 'requesting_permission',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RECORDING = 'recording',
  PAUSED = 'paused',
  PROCESSING = 'processing',
  PLAYBACK = 'playback',
  ERROR = 'error',
  COMPLETED = 'completed'
}

// Recording settings interface
export interface RecordingSettings {
  quality: RecordingQuality;
  format: RecordingFormat;
  autoStopAfterSeconds: number;
  maxLoudnessDb: number;
  noiseReductionEnabled: boolean;
  autoSaveEnabled: boolean;
  showVisualization: boolean;
  uploadAfterRecording: boolean;
}

// Default recording settings
const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  quality: RecordingQuality.HIGH,
  format: Platform.OS === 'web' ? RecordingFormat.WEBM : RecordingFormat.M4A,
  autoStopAfterSeconds: 300, // 5 minutes
  maxLoudnessDb: 0,
  noiseReductionEnabled: true,
  autoSaveEnabled: true,
  showVisualization: true,
  uploadAfterRecording: false
};

// Recording metadata interface
export interface RecordingMetadata {
  id: string;
  filename: string;
  uri: string;
  durationMs: number;
  sizeBytes: number;
  format: RecordingFormat;
  quality: RecordingQuality;
  createdAt: number;
  updatedAt: number;
  processingApplied: string[];
  waveformData?: number[];
}

// Recording context type
interface RecordingContextType {
  // State
  recordingState: RecordingState;
  recordingUri: string | null;
  recordingDuration: number;
  recordingError: Error | null;
  audioLevels: number[];
  isPermissionGranted: boolean;
  metadata: RecordingMetadata | null;
  settings: RecordingSettings;
  playbackPosition: number;
  playbackDuration: number;
  
  // Methods
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  playRecording: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  seekToPosition: (positionMillis: number) => Promise<void>;
  applyNoiseReduction: () => Promise<void>;
  exportRecording: (format?: RecordingFormat) => Promise<string | null>;
  updateSettings: (newSettings: Partial<RecordingSettings>) => void;
  resetRecordingState: () => void;
  getErrorFeedback: () => string;
  retryLastOperation: () => Promise<void>;
}

// Create the context
const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

// Props interface for the provider
interface RecordingProviderProps {
  children: ReactNode;
}

// Provider component
export const RecordingProvider: React.FC<RecordingProviderProps> = ({ children }) => {
  // Core recording state
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingError, setRecordingError] = useState<Error | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [settings, setSettings] = useState<RecordingSettings>(DEFAULT_RECORDING_SETTINGS);
  
  // Playback state
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const webRecordingServiceRef = useRef<any>(Platform.OS === 'web' ? new WebAudioRecordingService() : null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const errorHandlingService = useRef(ErrorHandlingService.getInstance());
  const lastOperationRef = useRef<string>('');
  
  // Track if the component is mounted
  const isMountedRef = useRef(true);
  const monitoringService = useRef(AudioMonitoringService.getInstance());
  
  // Clean up on unmount
  useEffect(() => {
    monitoringService.current.log(LogLevel.INFO, 'RecordingProvider mounted');
    
    return () => {
      // Mark component as unmounted to prevent setState after unmount
      isMountedRef.current = false;
      
      // Clean up resources
      cleanupResources();
      
      monitoringService.current.log(LogLevel.INFO, 'RecordingProvider unmounted');
    };
  }, []);
  
  // Safe setState functions that check if component is still mounted
  const safeSetState = <T extends any>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: React.SetStateAction<T>) => {
      if (isMountedRef.current) {
        setter(value);
      }
    };
  };
  
  const safeSetRecordingState = safeSetState(setRecordingState);
  const safeSetRecordingUri = safeSetState(setRecordingUri);
  const safeSetRecordingDuration = safeSetState(setRecordingDuration);
  const safeSetRecordingError = safeSetState(setRecordingError);
  const safeSetAudioLevels = safeSetState(setAudioLevels);
  const safeSetMetadata = safeSetState(setMetadata);
  const safeSetPlaybackPosition = safeSetState(setPlaybackPosition);
  const safeSetPlaybackDuration = safeSetState(setPlaybackDuration);
  
  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('recording_settings');
        if (savedSettings && isMountedRef.current) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load recording settings:', error);
      }
    };
    
    loadSettings();
    
    // Clean up on unmount
    return () => {
      cleanupResources();
    };
  }, []);
  
  // Initialize recording when settings change
  useEffect(() => {
    // Save settings whenever they change
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('recording_settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save recording settings:', error);
      }
    };
    
    saveSettings();
  }, [settings]);
  
  // Handle recording duration timer
  useEffect(() => {
    if (recordingState === RecordingState.RECORDING) {
      // Start a timer to update duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          // Check if we need to auto-stop
          if (settings.autoStopAfterSeconds > 0 && prev >= settings.autoStopAfterSeconds) {
            stopRecording().catch(handleError);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      // Clear timer when not recording
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recordingState, settings.autoStopAfterSeconds]);
  
  // Error handling
  const handleError = (error: Error, operation: string = 'unknown') => {
    console.error(`Recording error during ${operation}:`, error);
    
    // Log the error with our error service
    errorHandlingService.current.handleRecordingError(error, {
      operation,
      recordingState: recordingState,
      settings: settings
    });
    
    // Also log with monitoring service
    monitoringService.current.logError(error, operation, {
      recordingState,
      settings
    });
    
    // Only update state if still mounted
    if (isMountedRef.current) {
      safeSetRecordingError(error);
      safeSetRecordingState(RecordingState.ERROR);
    }
    
    lastOperationRef.current = operation;
  };
  
  // Clean up resources with improved memory management
  const cleanupResources = async () => {
    // Stop any ongoing recording
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording during cleanup:', error);
      }
      
      // Clear the reference
      recordingRef.current = null;
    }
    
    // Stop any ongoing playback
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('Error stopping playback during cleanup:', error);
      }
      
      // Clear the reference
      soundRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clean up web recording if applicable
    if (Platform.OS === 'web' && webRecordingServiceRef.current) {
      webRecordingServiceRef.current.cleanup();
      
      // Clear references to any MediaStreams or AudioContext
      if (webRecordingServiceRef.current.mediaStream) {
        const tracks = webRecordingServiceRef.current.mediaStream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      if (webRecordingServiceRef.current.audioContext && 
          typeof webRecordingServiceRef.current.audioContext.close === 'function') {
        await webRecordingServiceRef.current.audioContext.close();
      }
    }
    
    // Clear state
    if (isMountedRef.current) {
      // Clear any file references
      safeSetRecordingUri(null);
      safeSetMetadata(null);
    }
    
    // Log cleanup
    monitoringService.current.log(LogLevel.INFO, 'Cleaned up recording resources');
  };
  
  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    
    try {
      if (Platform.OS === 'web') {
        // Web permissions
        const granted = await webRecordingServiceRef.current.requestPermissions();
        setIsPermissionGranted(granted);
        return granted;
      } else {
        // Native permissions
        const { granted } = await Audio.requestPermissionsAsync();
        setIsPermissionGranted(granted);
        return granted;
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'requestPermissions');
      return false;
    }
  };
  
  // Initialize audio session
  const initializeAudioSession = async (): Promise<boolean> => {
    setRecordingState(RecordingState.INITIALIZING);
    
    try {
      if (Platform.OS !== 'web') {
        // Native platforms use Expo Audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        });
      } else {
        // Web platform initialization
        await webRecordingServiceRef.current.initialize({
          sampleRate: getQualitySampleRate(settings.quality),
          numberOfChannels: settings.quality === RecordingQuality.LOW ? 1 : 2,
          noiseSuppression: settings.noiseReductionEnabled,
        });
      }
      
      setRecordingState(RecordingState.READY);
      return true;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'initializeAudio');
      return false;
    }
  };
  
  // Get recording options based on quality setting
  const getRecordingOptions = (): Audio.RecordingOptions => {
    const sampleRate = getQualitySampleRate(settings.quality);
    const numberOfChannels = settings.quality === RecordingQuality.LOW ? 1 : 2;
    const bitRate = getQualityBitRate(settings.quality);
    
    return {
      android: {
        extension: settings.format === RecordingFormat.WAV ? '.wav' : '.m4a',
        outputFormat: settings.format === RecordingFormat.WAV 
          ? Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT 
          : Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: settings.format === RecordingFormat.WAV 
          ? Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT
          : Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: sampleRate,
        numberOfChannels: numberOfChannels,
        bitRate: bitRate,
      },
      ios: {
        extension: settings.format === RecordingFormat.WAV ? '.wav' : '.m4a',
        outputFormat: settings.format === RecordingFormat.WAV 
          ? Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM
          : Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
        sampleRate: sampleRate,
        numberOfChannels: numberOfChannels,
        bitRate: bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: settings.format === RecordingFormat.WEBM 
          ? 'audio/webm' 
          : 'audio/mp4',
        bitsPerSecond: bitRate,
      },
    };
  };
  
  // Helper for sample rate based on quality
  const getQualitySampleRate = (quality: RecordingQuality): number => {
    switch (quality) {
      case RecordingQuality.LOW:
        return 22050;
      case RecordingQuality.STANDARD:
        return 44100;
      case RecordingQuality.HIGH:
        return 48000;
      case RecordingQuality.STUDIO:
        return 96000;
      default:
        return 44100;
    }
  };
  
  // Helper for bit rate based on quality
  const getQualityBitRate = (quality: RecordingQuality): number => {
    switch (quality) {
      case RecordingQuality.LOW:
        return 64000; // 64 kbps
      case RecordingQuality.STANDARD:
        return 128000; // 128 kbps
      case RecordingQuality.HIGH:
        return 256000; // 256 kbps
      case RecordingQuality.STUDIO:
        return 320000; // 320 kbps
      default:
        return 128000;
    }
  };
  
  // Generate a unique filename for the recording
  const generateFilename = (): string => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const format = settings.format;
    return `recording_${timestamp}.${format}`;
  };
  
  // Create recording metadata
  const createMetadata = (uri: string, durationMs: number, sizeBytes: number): RecordingMetadata => {
    const filename = uri.split('/').pop() || generateFilename();
    const processingApplied = [];
    
    if (settings.noiseReductionEnabled) {
      processingApplied.push('noise_reduction');
    }
    
    return {
      id: new Date().getTime().toString(),
      filename,
      uri,
      durationMs,
      sizeBytes,
      format: settings.format,
      quality: settings.quality,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      processingApplied,
    };
  };
  
  // API Methods
  
  // Start recording
  const startRecording = async (): Promise<void> => {
    try {
      // Reset state
      safeSetRecordingUri(null);
      safeSetRecordingDuration(0);
      safeSetRecordingError(null);
      safeSetAudioLevels([]);
      safeSetMetadata(null);
      
      // Track this operation
      monitoringService.current.log(LogLevel.INFO, 'Starting recording', {
        quality: settings.quality,
        format: settings.format
      });
      
      // Check permissions
      if (!isPermissionGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required for recording.');
        }
      }
      
      // Initialize audio session
      const initialized = await initializeAudioSession();
      if (!initialized) {
        throw new Error('Failed to initialize audio session.');
      }
      
      // Start recording based on platform
      if (Platform.OS !== 'web') {
        // Native recording
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(getRecordingOptions());
        
        // Set up status update callback for audio levels
        recording.setOnRecordingStatusUpdate(status => {
          if (!isMountedRef.current) return;
          
          if (status.isRecording) {
            safeSetRecordingDuration(status.durationMillis / 1000);
            // Update audio levels if metering is available
            if (status.metering !== undefined) {
              safeSetAudioLevels(prev => {
                const newLevels = [...prev, status.metering || -160];
                return newLevels.slice(-30); // Keep last 30 measurements
              });
            }
          }
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
      } else {
        // Web recording
        await webRecordingServiceRef.current.startRecording();
        
        // Set up interval for getting audio levels on web
        const levelIntervalId = setInterval(() => {
          if (!isMountedRef.current) {
            clearInterval(levelIntervalId);
            return;
          }
          
          const level = webRecordingServiceRef.current.getAudioLevel();
          safeSetAudioLevels(prev => {
            const newLevels = [...prev, level];
            return newLevels.slice(-30); // Keep last 30 measurements
          });
        }, 100);
        
        // Store interval ID in web recording service to clean up later
        webRecordingServiceRef.current.setLevelInterval(levelIntervalId);
      }
      
      safeSetRecordingState(RecordingState.RECORDING);
    } catch (error) {
      monitoringService.current.logError(
        error instanceof Error ? error : new Error(String(error)), 
        'start_recording',
        { settings }
      );
      
      handleError(error instanceof Error ? error : new Error(String(error)), 'startRecording');
    }
  };
  
  // Pause recording
  const pauseRecording = async (): Promise<void> => {
    try {
      if (recordingState !== RecordingState.RECORDING) {
        throw new Error('Cannot pause when not recording.');
      }
      
      if (Platform.OS !== 'web') {
        // Native pause
        if (recordingRef.current) {
          await recordingRef.current.pauseAsync();
        }
      } else {
        // Web pause
        await webRecordingServiceRef.current.pauseRecording();
      }
      
      setRecordingState(RecordingState.PAUSED);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'pauseRecording');
    }
  };
  
  // Resume recording
  const resumeRecording = async (): Promise<void> => {
    try {
      if (recordingState !== RecordingState.PAUSED) {
        throw new Error('Cannot resume when not paused.');
      }
      
      if (Platform.OS !== 'web') {
        // Native resume
        if (recordingRef.current) {
          await recordingRef.current.startAsync();
        }
      } else {
        // Web resume
        await webRecordingServiceRef.current.resumeRecording();
      }
      
      setRecordingState(RecordingState.RECORDING);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'resumeRecording');
    }
  };
  
  // Stop recording
  const stopRecording = async (): Promise<string | null> => {
    try {
      if (recordingState !== RecordingState.RECORDING && recordingState !== RecordingState.PAUSED) {
        throw new Error('Cannot stop when not recording or paused.');
      }
      
      setRecordingState(RecordingState.PROCESSING);
      
      let uri: string | null = null;
      
      if (Platform.OS !== 'web') {
        // Native stop
        if (recordingRef.current) {
          const status = await recordingRef.current.stopAndUnloadAsync();
          uri = recordingRef.current.getURI() || null;
          
          if (uri) {
            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(uri);
            
            // Create metadata
            const meta = createMetadata(
              uri,
              status.durationMillis,
              fileInfo.size || 0
            );
            
            setMetadata(meta);
            
            // Load for playback
            await loadRecordingForPlayback(uri);
          }
        }
      } else {
        // Web stop
        uri = await webRecordingServiceRef.current.stopRecording();
        
        if (uri) {
          // Create metadata for web recording
          const durationMs = recordingDuration * 1000;
          const meta = createMetadata(
            uri,
            durationMs,
            await webRecordingServiceRef.current.getRecordingSize() || 0
          );
          
          setMetadata(meta);
          
          // Load for playback
          await loadRecordingForPlayback(uri);
        }
      }
      
      setRecordingUri(uri);
      setRecordingState(RecordingState.COMPLETED);
      return uri;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'stopRecording');
      return null;
    }
  };
  
  // Cancel recording
  const cancelRecording = async (): Promise<void> => {
    try {
      if (recordingState !== RecordingState.RECORDING && recordingState !== RecordingState.PAUSED) {
        return; // Nothing to cancel
      }
      
      if (Platform.OS !== 'web') {
        // Native cancel
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          
          // Delete the file if it exists
          if (uri) {
            try {
              await FileSystem.deleteAsync(uri);
            } catch (deleteError) {
              console.error('Error deleting cancelled recording:', deleteError);
            }
          }
        }
      } else {
        // Web cancel
        await webRecordingServiceRef.current.cancelRecording();
      }
      
      // Reset state
      resetRecordingState();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'cancelRecording');
    }
  };
  
  // Load recording for playback
  const loadRecordingForPlayback = async (uri: string): Promise<void> => {
    try {
      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.error('Error loading recording for playback:', error);
      throw error;
    }
  };
  
  // Playback status update handler
  const onPlaybackStatusUpdate = (status: Audio.AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      
      if (status.didJustFinish) {
        setRecordingState(RecordingState.COMPLETED);
      }
    }
  };
  
  // Play recording
  const playRecording = async (): Promise<void> => {
    try {
      if (!soundRef.current) {
        if (!recordingUri) {
          throw new Error('No recording available to play.');
        }
        
        await loadRecordingForPlayback(recordingUri);
      }
      
      await soundRef.current?.playAsync();
      setRecordingState(RecordingState.PLAYBACK);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'playRecording');
    }
  };
  
  // Pause playback
  const pausePlayback = async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setRecordingState(RecordingState.COMPLETED);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'pausePlayback');
    }
  };
  
  // Stop playback
  const stopPlayback = async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
        setRecordingState(RecordingState.COMPLETED);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'stopPlayback');
    }
  };
  
  // Seek to position
  const seekToPosition = async (positionMillis: number): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(positionMillis);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'seekToPosition');
    }
  };
  
  // Apply noise reduction
  const applyNoiseReduction = async (): Promise<void> => {
    try {
      if (!recordingUri) {
        throw new Error('No recording available to process.');
      }
      
      setRecordingState(RecordingState.PROCESSING);
      
      // Apply noise reduction (this would use the actual audio processing service)
      // For now, this is a placeholder
      
      // Update metadata
      if (metadata) {
        const updatedMeta = {
          ...metadata,
          updatedAt: Date.now(),
          processingApplied: [...metadata.processingApplied, 'noise_reduction']
        };
        setMetadata(updatedMeta);
      }
      
      setRecordingState(RecordingState.COMPLETED);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'applyNoiseReduction');
    }
  };
  
  // Export recording (convert format if needed)
  const exportRecording = async (format?: RecordingFormat): Promise<string | null> => {
    try {
      if (!recordingUri) {
        throw new Error('No recording available to export.');
      }
      
      // If no format specified or same as current, just return the URI
      if (!format || format === metadata?.format) {
        return recordingUri;
      }
      
      setRecordingState(RecordingState.PROCESSING);
      
      // This would implement actual format conversion
      // For now, return the existing URI as a placeholder
      
      setRecordingState(RecordingState.COMPLETED);
      return recordingUri;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), 'exportRecording');
      return null;
    }
  };
  
  // Update recording settings
  const updateSettings = (newSettings: Partial<RecordingSettings>): void => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };
  
  // Reset recording state
  const resetRecordingState = (): void => {
    setRecordingState(RecordingState.READY);
    setRecordingUri(null);
    setRecordingDuration(0);
    setRecordingError(null);
    setAudioLevels([]);
    setMetadata(null);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    
    // Clean up resources but keep permission state
    cleanupResources();
  };
  
  // Get user-friendly error message
  const getErrorFeedback = (): string => {
    if (!recordingError) {
      return '';
    }
    
    // Get the error ID from the error handling service
    const errorEntry = errorHandlingService.current.getLastError();
    if (errorEntry) {
      return errorHandlingService.current.getAudioErrorMessage(errorEntry.id);
    }
    
    // Fall back to a generic message
    return `Recording error: ${recordingError.message}`;
  };
  
  // Retry last operation
  const retryLastOperation = async (): Promise<void> => {
    if (recordingState !== RecordingState.ERROR || !lastOperationRef.current) {
      return;
    }
    
    // Reset error state
    setRecordingError(null);
    setRecordingState(RecordingState.READY);
    
    // Retry the operation that failed
    switch (lastOperationRef.current) {
      case 'startRecording':
        await startRecording();
        break;
      case 'pauseRecording':
        await pauseRecording();
        break;
      case 'resumeRecording':
        await resumeRecording();
        break;
      case 'stopRecording':
        await stopRecording();
        break;
      case 'playRecording':
        await playRecording();
        break;
      default:
        // Reset to ready state for other operations
        break;
    }
  };
  
  // Context value
  const contextValue: RecordingContextType = {
    // State
    recordingState,
    recordingUri,
    recordingDuration,
    recordingError,
    audioLevels,
    isPermissionGranted,
    metadata,
    settings,
    playbackPosition,
    playbackDuration,
    
    // Methods
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    playRecording,
    pausePlayback,
    stopPlayback,
    seekToPosition,
    applyNoiseReduction,
    exportRecording,
    updateSettings,
    resetRecordingState,
    getErrorFeedback,
    retryLastOperation,
  };
  
  return (
    <RecordingContext.Provider value={contextValue}>
      {children}
    </RecordingContext.Provider>
  );
};

// Custom hook for using the recording context
export const useRecording = (): RecordingContextType => {
  const context = useContext(RecordingContext);
  
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  
  return context;
};

export default RecordingContext; 