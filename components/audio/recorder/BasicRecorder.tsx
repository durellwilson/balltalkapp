import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

export default function BasicRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [status, setStatus] = useState('Ready');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    // Request permissions on component mount
    const getPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          setStatus('Microphone permission not granted');
          return;
        }
        
        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
        
        setStatus('Ready to record');
      } catch (err) {
        console.error('Failed to get permissions', err);
        setStatus('Error getting permissions');
        setPermissionStatus('error');
      }
    };
    
    getPermissions();
    
    // Cleanup function
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  async function startRecording() {
    try {
      if (permissionStatus !== 'granted') {
        setStatus('Cannot record without microphone permission');
        return;
      }
      
      // Make sure any previous recording is stopped
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      
      // Unload any previous sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      setStatus('Recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start recording', err);
      setStatus(`Failed to record: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  async function stopRecording() {
    if (!recording) {
      setStatus('No active recording to stop');
      return;
    }
    
    try {
      setStatus('Processing...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setStatus(`Recording saved: ${uri}`);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setStatus(`Error stopping recording: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  async function playSound() {
    if (!recordingUri) {
      setStatus('No recording to play');
      return;
    }
    
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      setStatus('Loading sound...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setStatus('Playing...');
      
      // Listen for playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setStatus('Playback finished');
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
      setStatus(`Error playing sound: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Audio Recorder</Text>
      <Text style={styles.statusText}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title={recording ? 'Stop Recording' : 'Start Recording'} 
          onPress={recording ? stopRecording : startRecording}
          disabled={permissionStatus !== 'granted'} 
        />
      </View>
      
      {recordingUri && (
        <View style={styles.buttonContainer}>
          <Button 
            title="Play Recording" 
            onPress={playSound}
          />
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>Microphone Permission: {permissionStatus || 'unknown'}</Text>
        {recordingUri && (
          <Text style={styles.infoText} numberOfLines={2} ellipsizeMode="middle">
            Recording URI: {recordingUri}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  infoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e9e9e9',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 