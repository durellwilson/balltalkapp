import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import * as FileSystem from 'expo-file-system';

interface RecordingInterfaceProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  onRecordingComplete,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // For web recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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
      console.log('Starting recording on platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        await startWebRecording();
      } else {
        await startNativeRecording();
      }
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
    
    setIsPreparing(false);
  };
  
  const startWebRecording = async () => {
    try {
      console.log('Requesting web audio permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        } 
      });
      
      console.log('Creating MediaRecorder with improved settings...');
      // Use webm for better compatibility
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Data available, size:', event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Web MediaRecorder stopped, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error('No audio data recorded');
          Alert.alert('Recording Error', 'No audio data was captured. Please try again.');
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Created audio blob, size:', audioBlob.size);
        
        if (audioBlob.size < 1000) {
          console.warn('Audio blob is suspiciously small:', audioBlob.size);
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Web recording completed, URL:', audioUrl);
        
        // Use the HTML Audio element (not the Expo Audio)
        try {
          // Create an HTML audio element to test the recording
          const audioElement = document.createElement('audio');
          audioElement.src = audioUrl;
          
          // Set up event listeners
          audioElement.addEventListener('loadedmetadata', () => {
            console.log('Audio duration:', audioElement.duration);
            // Use actual audio duration if available
            const finalDuration = audioElement.duration > 0 ? audioElement.duration : recordingDuration;
            setRecordingUri(audioUrl);
            onRecordingComplete(audioUrl, finalDuration);
          });
          
          audioElement.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            // Fallback: still try to use the URL even if we can't get duration
            setRecordingUri(audioUrl);
            onRecordingComplete(audioUrl, recordingDuration);
          });
          
          // Trigger loading of metadata
          audioElement.load();
          
          // Set a timeout in case the events don't fire
          setTimeout(() => {
            if (!audioElement.duration) {
              console.warn('Audio duration not available after timeout, using estimated duration');
              setRecordingUri(audioUrl);
              onRecordingComplete(audioUrl, recordingDuration);
            }
          }, 2000);
        } catch (audioError) {
          console.error('Error creating audio element:', audioError);
          // Fallback approach if HTML Audio element fails
          console.log('Using fallback approach for audio handling');
          setRecordingUri(audioUrl);
          onRecordingComplete(audioUrl, recordingDuration);
        }
      };
      
      // Request data every 1 second to ensure we get chunks
      mediaRecorder.start(1000);
      console.log('MediaRecorder started with 1s intervals');
      setIsRecording(true);
      
      // Set up audio analyzer for levels
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Start timer for UI updates and audio level monitoring
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 0.1);
          
          // Get actual audio levels from analyzer
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Convert to dB scale similar to native (-60 to 0)
          const dB = average > 0 ? 20 * Math.log10(average / 255) * 3 : -60;
          setAudioLevel(dB);
        }, 100);
      } catch (analyzerError) {
        console.error('Error setting up audio analyzer:', analyzerError);
        // Fallback to simulated audio levels
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 0.1);
          // Simulate audio level changes for better visual feedback
          setAudioLevel(Math.random() * -20 - 10); // Random value between -30 and -10 dB
        }, 100);
      }
    } catch (error) {
      console.error('Error starting web recording:', error);
      Alert.alert('Recording Error', `Could not start recording: ${error.message}`);
      throw error;
    }
  };
  
  const startNativeRecording = async () => {
    try {
      console.log('Requesting recording permissions...');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
        setIsPreparing(false);
        return;
      }
      
      console.log('Configuring audio session...');
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });
      
      console.log('Creating recording object...');
      // Start recording
      const recording = new Audio.Recording();
      
      try {
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
        
        console.log('Starting recording...');
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        setIsPreparing(false);
        
        // Start timer
        startTimer();
        
        console.log('Recording started successfully');
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Recording Error', `Could not start recording: ${error.message}`);
        setIsPreparing(false);
      }
    } catch (error) {
      console.error('Error in recording setup:', error);
      Alert.alert('Recording Error', `Setup failed: ${error.message}`);
      setIsPreparing(false);
    }
  };
  
  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && isRecording) {
        console.log('Stopping web recording...');
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop the MediaRecorder
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setAudioLevel(0);
      }
      return;
    }
    
    // Native recording
    if (!recordingRef.current || !isRecording) return;
    
    try {
      console.log('Stopping recording...');
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log('Recording stopped, URI:', uri);
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      setRecordingUri(uri);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });
      
      // Get file info to verify it exists
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('File info:', fileInfo);
        
        if (fileInfo.exists) {
          // Call the callback with the URI and duration
          onRecordingComplete(uri, recordingDuration);
        } else {
          throw new Error('Recording file does not exist');
        }
      } catch (fileError) {
        console.error('Error checking file:', fileError);
        throw new Error('Failed to verify recording file');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
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
  
  // Generate visual bars for audio level visualization
  const renderAudioVisualization = () => {
    // Create an array of 30 bars
    const bars = Array.from({ length: 30 }, (_, i) => i);
    
    return (
      <View style={styles.visualizationContainer}>
        {bars.map((_, index) => {
          // Calculate height based on audio level and add some randomness
          const randomFactor = 0.7 + Math.random() * 0.6;
          const normalizedLevel = Math.max(0, Math.min(1, (audioLevel + 60) / 60));
          const height = isRecording ? normalizedLevel * randomFactor * 100 : 5 + Math.random() * 10;
          
          return (
            <View
              key={index}
              style={[
                styles.visualizationBar,
                {
                  height: `${height}%`,
                  backgroundColor: isRecording ? '#FF3B30' : '#555555',
                }
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  const startTimer = () => {
    // Start timer for UI updates
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 0.1);
      
      // Simulate audio level changes for better visual feedback
      if (Platform.OS === 'web') {
        setAudioLevel(Math.random() * -20 - 10); // Random value between -30 and -10 dB
      }
    }, 100);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Your Track</Text>
      
      <View style={styles.visualizerContainer}>
        {isRecording ? (
          renderAudioVisualization()
        ) : (
          <View style={styles.placeholderVisualizer}>
            <Text style={styles.placeholderText}>Tap record to start</Text>
          </View>
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
          >
            <Ionicons name="stop" size={32} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={startRecording}
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
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  visualizerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#1E1E1E',
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
  placeholderText: {
    color: '#888888',
  },
  visualizationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  visualizationBar: {
    width: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  recordingIndicator: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  recordingText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
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
    color: '#BBBBBB',
    fontSize: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 50,
  },
});

export default RecordingInterface; 