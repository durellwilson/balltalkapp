import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import WaveformVisualizer from './WaveformVisualizer';

interface EnhancedRecordingInterfaceProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

const EnhancedRecordingInterface: React.FC<EnhancedRecordingInterfaceProps> = ({
  onRecordingComplete,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const startRecording = async () => {
    setIsPreparing(true);
    
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert('Microphone permission is required to record audio.');
        setIsPreparing(false);
        return;
      }
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Start recording
      const recording = new Audio.Recording();
      
      // Use Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY preset instead of custom options
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      // Set up status update callback for audio levels
      recording.setOnRecordingStatusUpdate(status => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis / 1000);
          // Calculate audio level (metering) if available
          if (status.metering !== undefined) {
            setAudioLevel(status.metering || 0);
          }
        }
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      
      // Start timer for UI updates
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
    }
    
    setIsPreparing(false);
  };
  
  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) return;
    
    try {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      if (uri) {
        onRecordingComplete(uri, recordingDuration);
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to save recording. Please try again.');
    }
    
    // Reset state
    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioLevel(0);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Audio</Text>
      
      <View style={styles.visualizerContainer}>
        {isRecording ? (
          <WaveformVisualizer audioLevel={audioLevel} />
        ) : (
          <View style={styles.placeholderVisualizer} />
        )}
      </View>
      
      <Text style={styles.timer}>{formatTime(recordingDuration)}</Text>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isPreparing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        {isPreparing ? (
          <View style={styles.recordButton}>
            <ActivityIndicator color="white" />
          </View>
        ) : isRecording ? (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={stopRecording}
            testID="stop-button"
          >
            <Ionicons name="stop" size={32} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={startRecording}
            testID="record-button"
          >
            <Ionicons name="mic" size={32} color="white" />
          </TouchableOpacity>
        )}
        
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  visualizerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  placeholderVisualizer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 50,
  },
});

export default EnhancedRecordingInterface;
