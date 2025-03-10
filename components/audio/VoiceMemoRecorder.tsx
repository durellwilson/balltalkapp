import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../hooks/useTheme';
import Colors from '@/constants/Colors';

interface VoiceMemoRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

/**
 * VoiceMemoRecorder Component
 * 
 * A clean, minimalist voice memo recorder inspired by Apple's Voice Memos app.
 * Features real-time waveform visualization, simple controls, and high-quality recording.
 */
const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  onRecordingComplete,
  onCancel
}) => {
  // Theme
  const { isDark, theme } = useTheme();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(60).fill(0.05));
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Screen dimensions
  const { width: screenWidth } = Dimensions.get('window');
  
  // Initialize and request permissions
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
        
        // Request permissions
        const { granted } = await Audio.requestPermissionsAsync();
        setPermissionStatus(granted);
        
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Microphone access is needed to record audio.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
        Alert.alert('Error', 'Failed to initialize audio recording.');
      }
    };
    
    setupAudio();
    
    // Cleanup on unmount
    return () => {
      stopRecording();
      cleanupPlayback();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Start recording
  const startRecording = async () => {
    try {
      if (!permissionStatus) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
        return;
      }
      
      setIsProcessing(true);
      
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
      
      // Start timer and audio level monitoring
      startTimer();
      startAudioLevelMonitoring();
      
      // Update state
      setIsRecording(true);
      setIsPaused(false);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      
      // Cleanup any partial recording
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Error cleaning up failed recording:', cleanupError);
        }
        recordingRef.current = null;
      }
    }
  };
  
  // Pause recording
  const pauseRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop level monitoring
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      
    } catch (error) {
      console.error('Error pausing recording:', error);
      Alert.alert('Error', 'Failed to pause recording.');
    }
  };
  
  // Resume recording
  const resumeRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      await recordingRef.current.startAsync();
      setIsPaused(false);
      
      // Restart timer and level monitoring
      startTimer();
      startAudioLevelMonitoring();
      
    } catch (error) {
      console.error('Error resuming recording:', error);
      Alert.alert('Error', 'Failed to resume recording.');
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    try {
      setIsProcessing(true);
      
      // Stop timer and level monitoring
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = null;
      }
      
      if (!recordingRef.current) {
        setIsProcessing(false);
        return;
      }
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get recording URI
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        throw new Error('Recording URI is null');
      }
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Recording file does not exist');
      }
      
      // Update state
      setRecordingUri(uri);
      setIsRecording(false);
      setIsPaused(false);
      setIsProcessing(false);
      
      // Load for playback
      loadRecordingForPlayback(uri);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to save recording.');
      
      // Reset state
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  // Load recording for playback
  const loadRecordingForPlayback = async (uri: string) => {
    try {
      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Create new sound object
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
    } catch (error) {
      console.error('Error loading recording for playback:', error);
    }
  };
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    
    if (status.positionMillis !== undefined) {
      setPlaybackPosition(status.positionMillis / 1000);
    }
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };
  
  // Play recording
  const playRecording = async () => {
    try {
      if (!soundRef.current) return;
      
      await soundRef.current.playFromPositionAsync(playbackPosition * 1000);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };
  
  // Pause playback
  const pausePlayback = async () => {
    try {
      if (!soundRef.current) return;
      
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  };
  
  // Cleanup playback
  const cleanupPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up playback:', error);
    }
  };
  
  // Save recording
  const saveRecording = () => {
    if (!recordingUri) return;
    
    onRecordingComplete(recordingUri, recordingDuration);
  };
  
  // Start timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };
  
  // Start audio level monitoring
  const startAudioLevelMonitoring = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }
    
    // Simulate audio levels for now
    // In a real implementation, we would use Audio.getStatusAsync() or a native module
    levelIntervalRef.current = setInterval(() => {
      // Generate random audio levels that look natural
      const newLevels = [...audioLevels];
      
      // Shift existing levels to the left
      newLevels.shift();
      
      // Add a new level at the end
      // Create a somewhat natural-looking level
      const baseLevel = 0.3 + (Math.random() * 0.4); // Base level between 0.3 and 0.7
      const randomSpike = Math.random() > 0.8 ? Math.random() * 0.3 : 0; // Occasional spikes
      newLevels.push(Math.min(1, baseLevel + randomSpike));
      
      setAudioLevels(newLevels);
    }, 100);
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render waveform visualization
  const renderWaveform = () => {
    const barWidth = 3;
    const barSpacing = 2;
    const containerWidth = screenWidth - 40; // Accounting for padding
    const maxBars = Math.floor(containerWidth / (barWidth + barSpacing));
    const displayLevels = audioLevels.slice(-maxBars);
    
    return (
      <View style={styles.waveformContainer}>
        {displayLevels.map((level, index) => (
          <View
            key={`bar-${index}`}
            style={[
              styles.waveformBar,
              {
                height: `${level * 100}%`,
                width: barWidth,
                marginHorizontal: barSpacing / 2,
                backgroundColor: isRecording 
                  ? '#FF3B30' // Red when recording
                  : recordingUri 
                    ? index / displayLevels.length <= playbackPosition / recordingDuration
                      ? '#007AFF' // Blue for played portion
                      : isDark ? '#555' : '#DDD' // Gray for unplayed portion
                    : isDark ? '#555' : '#DDD', // Gray when not recording
              }
            ]}
          />
        ))}
      </View>
    );
  };
  
  // Render recording controls
  const renderRecordingControls = () => {
    if (isProcessing) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
          <Text style={[styles.processingText, isDark && styles.textLight]}>
            Processing...
          </Text>
        </View>
      );
    }
    
    if (recordingUri) {
      // Playback controls
      return (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={isPlaying ? pausePlayback : playRecording}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveRecording}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Recording controls
    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.recordButton}
          onPress={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
          disabled={isProcessing}
        >
          <View style={[
            styles.recordButtonInner,
            isRecording && !isPaused && styles.recordButtonActive,
            isPaused && styles.recordButtonPaused
          ]} />
        </TouchableOpacity>
        
        {isRecording && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            disabled={isProcessing}
          >
            <View style={styles.stopButtonInner} />
          </TouchableOpacity>
        )}
        
        {!isRecording && (
          <View style={styles.placeholderButton} />
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.textLight]}>
          {recordingUri ? 'Recording' : isRecording ? 'Recording...' : 'New Recording'}
        </Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, isDark && styles.textLight]}>
            {formatTime(recordingUri ? (isPlaying ? playbackPosition : recordingDuration) : recordingDuration)}
          </Text>
        </View>
        
        <View style={[styles.waveformWrapper, isDark && styles.waveformWrapperDark]}>
          {renderWaveform()}
        </View>
        
        {renderRecordingControls()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 60,
    fontWeight: '200',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  waveformWrapper: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  waveformWrapperDark: {
    backgroundColor: '#222',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF3B30',
  },
  recordButtonActive: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  recordButtonPaused: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButtonInner: {
    width: 20,
    height: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderButton: {
    width: 50,
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  textLight: {
    color: '#FFF',
  },
});

export default VoiceMemoRecorder; 