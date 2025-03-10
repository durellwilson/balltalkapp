import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function BasicRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [status, setStatus] = useState('Ready');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;
  
  // Start pulse animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isRecording, pulseAnim]);
  
  // Check permissions on mount
  useEffect(() => {
    getPermissions();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);
  
  const getPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      setPermissionStatus(permission.status);
      
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: 1, // DoNotMix
          interruptionModeAndroid: 1, // DoNotMix
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.error('Failed to get permissions:', error);
      setStatus('Permission error');
    }
  };
  
  async function startRecording() {
    try {
      if (permissionStatus !== 'granted') {
        await getPermissions();
        return;
      }
      
      // Unload any existing recording
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      setStatus('Recording...');
      setRecordingDuration(0);
      setRecordingUri(null);
      
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      newRecording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus('Recording failed');
    }
  }
  
  function onRecordingStatusUpdate(status: Audio.RecordingStatus) {
    if (status.isRecording) {
      setRecordingDuration(status.durationMillis / 1000);
      
      // Animate level based on metering level if available
      if (status.metering !== undefined && status.metering > -50) {
        const normalizedLevel = (status.metering + 50) / 50; // Convert -50..0 to 0..1
        levelAnim.setValue(normalizedLevel);
      }
    }
  }
  
  async function stopRecording() {
    try {
      setStatus('Processing...');
      
      if (!recording) return;
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordingUri(uri);
        await loadRecordedSound(uri);
      }
      
      setRecording(null);
      setIsRecording(false);
      setStatus('Ready');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setStatus('Processing failed');
      setIsRecording(false);
    }
  }
  
  async function loadRecordedSound(uri: string) {
    try {
      setStatus('Loading...');
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setStatus('Ready');
    } catch (error) {
      console.error('Failed to load sound:', error);
      setStatus('Loading failed');
    }
  }
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isPlaying) {
      setIsPlaying(true);
      setPlaybackPosition(status.positionMillis / 1000);
      setPlaybackDuration(status.durationMillis / 1000);
    } else {
      setIsPlaying(false);
      
      if (status.didJustFinish) {
        setPlaybackPosition(0);
      }
    }
  };
  
  async function playSound() {
    try {
      if (!sound) return;
      
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playFromPositionAsync(playbackPosition * 1000);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
      setStatus('Playback failed');
    }
  }
  
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        {isRecording && (
          <Text style={styles.durationText}>
            {formatTime(recordingDuration)}
          </Text>
        )}
        {recordingUri && !isRecording && (
          <Text style={styles.durationText}>
            {formatTime(playbackPosition)} / {formatTime(playbackDuration)}
          </Text>
        )}
      </View>
      
      <View style={styles.visualizerContainer}>
        <Animated.View 
          style={[
            styles.levelIndicator, 
            { 
              height: levelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 100]
              }),
              opacity: isRecording ? 1 : 0 
            }
          ]} 
        />
      </View>
      
      <View style={styles.controlsContainer}>
        {!isRecording && !recordingUri && (
          <TouchableOpacity 
            style={styles.recordButton} 
            onPress={startRecording}
            disabled={permissionStatus !== 'granted'}
          >
            <Ionicons name="mic" size={32} color="white" />
          </TouchableOpacity>
        )}
        
        {isRecording && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopRecording}
            >
              <Ionicons name="square" size={32} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {recordingUri && !isRecording && (
          <View style={styles.playbackControls}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={playSound}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.newRecordingButton} 
              onPress={startRecording}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.actionText}>New Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIndicator: {
    width: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  controlsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playbackControls: {
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  actionText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
  },
}); 