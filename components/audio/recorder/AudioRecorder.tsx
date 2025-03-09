import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onCancel, 
  maxDuration = 300 // Default to 5 minutes max
}: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // References for timers
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('[AudioRecorder] Requesting audio recording permissions...');
        const { status } = await Audio.requestPermissionsAsync();
        const isGranted = status === 'granted';
        setPermissionStatus(isGranted);
        
        if (!isGranted) {
          setError('Permission to record audio was denied');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
        
        console.log('[AudioRecorder] Audio mode set successfully');
      } catch (err) {
        console.error('[AudioRecorder] Error requesting permissions:', err);
        setError('Failed to request recording permissions');
        setPermissionStatus(false);
      }
    })();
    
    // Cleanup function
    return () => {
      stopAllTimers();
      if (recording) {
        recording.stopAndUnloadAsync().catch(err => 
          console.error('[AudioRecorder] Error stopping recording during cleanup:', err)
        );
      }
      if (sound) {
        sound.unloadAsync().catch(err => 
          console.error('[AudioRecorder] Error unloading sound during cleanup:', err)
        );
      }
    };
  }, []);

  // Stop all timers
  const stopAllTimers = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  };

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);
      
      // Reset states
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
      setRecordingUri(null);
      setRecordingDuration(0);
      
      console.log('[AudioRecorder] Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      
      // Start tracking duration
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          // Auto-stop if we reach maxDuration
          if (prev + 1 >= maxDuration) {
            stopRecording().catch(err => 
              console.error('[AudioRecorder] Error auto-stopping recording:', err)
            );
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Set a timeout to stop recording after maxDuration
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording) {
          console.log(`[AudioRecorder] Reached max duration of ${maxDuration}s, stopping automatically`);
          stopRecording().catch(err => 
            console.error('[AudioRecorder] Error stopping at max duration:', err)
          );
        }
      }, maxDuration * 1000);
      
    } catch (err) {
      console.error('[AudioRecorder] Failed to start recording:', err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('[AudioRecorder] Stopping recording...');
      
      // Clear timers
      stopAllTimers();
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || '';
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      
      // Get recording information
      try {
        const info = await FileSystem.getInfoAsync(uri);
        console.log('[AudioRecorder] Recording file info:', info);
      } catch (infoErr) {
        console.warn('[AudioRecorder] Could not get file info:', infoErr);
      }
      
      // Load sound for playback
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
      } catch (soundErr) {
        console.error('[AudioRecorder] Error loading recorded sound:', soundErr);
        setError('Could not load recording for playback');
      }
      
    } catch (err) {
      console.error('[AudioRecorder] Failed to stop recording:', err);
      setError(`Failed to stop recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    
    // Handle playback completion
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  // Play/pause recording
  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        // Reset to beginning if playback finished
        if (await sound.getStatusAsync().then(status => status.isLoaded && status.positionMillis === status.durationMillis)) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
      }
      
    } catch (err) {
      console.error('[AudioRecorder] Failed to toggle playback:', err);
      setError(`Failed to play recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Save recording
  const saveRecording = () => {
    if (recordingUri) {
      onRecordingComplete(recordingUri, recordingDuration);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render error state
  if (error) {
    return (
      <View style={styles.container} testID="audio-recorder-container">
        <Text style={styles.errorText} testID="error-text">{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel} testID="cancel-button">
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render loading state while checking permissions
  if (permissionStatus === null) {
    return (
      <View style={styles.container} testID="audio-recorder-container">
        <ActivityIndicator size="large" color="#0000ff" testID="loading-indicator" />
        <Text style={styles.text}>Checking permissions...</Text>
      </View>
    );
  }

  // Render permission denied state
  if (permissionStatus === false) {
    return (
      <View style={styles.container} testID="audio-recorder-container">
        <Text style={styles.errorText} testID="error-text">
          Permission to record audio was denied. 
          Please enable microphone access in your device settings.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onCancel} testID="cancel-button">
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="audio-recorder-container">
      <Text style={styles.title}>Record Audio</Text>
      
      {/* Duration display */}
      <Text style={styles.durationText} testID="duration-text">
        {formatTime(recordingDuration)}
      </Text>
      
      {/* Progress bar showing recording time relative to max duration */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${(recordingDuration / maxDuration) * 100}%` }
          ]} 
          testID="progress-bar"
        />
      </View>
      
      {/* Recording/playback controls */}
      <View style={styles.controlsContainer}>
        {isRecording ? (
          // Stop recording button
          <TouchableOpacity 
            style={styles.recordButton} 
            onPress={stopRecording}
            testID="stop-button"
          >
            <MaterialIcons name="stop" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        ) : recordingUri ? (
          // Playback controls
          <View style={styles.playbackContainer}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={togglePlayback}
              testID="play-button"
            >
              <MaterialIcons 
                name={isPlaying ? "pause" : "play-arrow"} 
                size={32} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={startRecording}
              testID="reset-button"
            >
              <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          // Start recording button
          <TouchableOpacity 
            style={styles.recordButton} 
            onPress={startRecording}
            testID="record-button"
          >
            <MaterialIcons name="mic" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          testID="cancel-button"
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        {recordingUri && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveRecording}
            testID="save-button"
          >
            <Text style={styles.saveButtonText}>Use Recording</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Instructions */}
      <Text style={styles.instructionsText}>
        {isRecording 
          ? `Recording in progress (max ${formatTime(maxDuration)})...` 
          : recordingUri 
            ? 'Review your recording before using it' 
            : 'Tap the microphone to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2f3542'
  },
  durationText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2f3542'
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#dfe4ea',
    borderRadius: 4,
    marginBottom: 30,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff4757',
    borderRadius: 4
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2ed573',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#747d8c',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#dfe4ea',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#1e90ff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  buttonText: {
    fontSize: 16,
    color: '#2f3542'
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#57606f'
  },
  errorText: {
    color: '#ff4757',
    marginBottom: 20,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    width: '100%'
  },
  instructionsText: {
    fontSize: 14,
    color: '#57606f',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 