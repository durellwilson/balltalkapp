
import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function BasicRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<{ uri: string; duration: number }[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState<Audio.PermissionResponse | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('');

  async function requestPermissions() {
    try {
      console.log('Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      console.log('Permission response:', permission);
      setPermissionResponse(permission);
      
      if (permission.granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (err) {
      console.error('Error requesting permissions:', err);
    }
  }

  useEffect(() => {
    requestPermissions();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  async function startRecording() {
    try {
      if (!permissionResponse?.granted) {
        await requestPermissions();
        if (!permissionResponse?.granted) {
          setRecordingStatus('No permission to record');
          return;
        }
      }
      
      setRecordingStatus('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setRecordingStatus('Recording...');
      
      recording.setOnRecordingStatusUpdate(status => {
        if (status.isRecording) {
          setRecordingStatus(`Recording... ${Math.floor(status.durationMillis / 1000)}s`);
        }
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingStatus(`Error: ${err.message}`);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    
    try {
      setRecordingStatus('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        setRecordingStatus('No recording file created');
        return;
      }
      
      const info = await FileSystem.getInfoAsync(uri);
      
      setRecordings(prev => [
        ...prev, 
        { 
          uri, 
          duration: recording._finalDurationMillis ? 
            recording._finalDurationMillis / 1000 : 
            0 
        }
      ]);
      
      setRecording(null);
      setRecordingStatus('Recording stopped');
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecordingStatus(`Error: ${err.message}`);
    }
  }

  async function playSound(uri) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Audio Recorder</Text>
      
      {permissionResponse && (
        <Text style={styles.status}>
          Microphone Permission: {permissionResponse.granted ? 'Granted' : 'Denied'}
        </Text>
      )}
      
      <Text style={styles.status}>{recordingStatus}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title={recording ? "Stop Recording" : "Start Recording"}
          onPress={recording ? stopRecording : startRecording}
          disabled={!permissionResponse?.granted && !recording}
        />
      </View>
      
      <Text style={styles.subtitle}>Recordings ({recordings.length})</Text>
      
      {recordings.length === 0 ? (
        <Text style={styles.noRecordings}>No recordings yet</Text>
      ) : (
        recordings.map((item, index) => (
          <View key={index} style={styles.recordingItem}>
            <Text>Recording #{index + 1} ({item.duration.toFixed(1)}s)</Text>
            <Button 
              title={isPlaying ? "Stop" : "Play"} 
              onPress={() => playSound(item.uri)} 
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  status: {
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  noRecordings: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  }
});
