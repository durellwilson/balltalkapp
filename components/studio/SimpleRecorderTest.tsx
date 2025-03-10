import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import SimpleRecordingService from '../../services/SimpleRecordingService';

/**
 * Simple test component for SimpleRecordingService
 */
const SimpleRecorderTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  
  const recorderRef = useRef<SimpleRecordingService | null>(null);
  
  // Initialize the recorder
  useEffect(() => {
    try {
      console.log('Initializing SimpleRecordingService...');
      recorderRef.current = new SimpleRecordingService();
      
      // Check if recording is supported
      const isSupported = recorderRef.current.isSupported();
      setSupported(isSupported);
      console.log('Recording supported:', isSupported);
      
      if (!isSupported) {
        setError('Your browser does not support recording');
      }
    } catch (error) {
      console.error('Error initializing recorder:', error);
      setError(`Error initializing recorder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Cleanup
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
        recorderRef.current = null;
      }
    };
  }, []);
  
  const requestPermissions = async () => {
    try {
      setStatus('Requesting permissions...');
      setError(null);
      
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }
      
      const permissionGranted = await recorderRef.current.requestPermissions();
      
      if (permissionGranted) {
        setStatus('Permission granted');
      } else {
        setError('Microphone permission denied');
        setStatus('Permission denied');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setError(`Error requesting permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
    }
  };
  
  const startRecording = async () => {
    try {
      setStatus('Starting recording...');
      setError(null);
      setAudioUrl(null);
      
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }
      
      await recorderRef.current.startRecording();
      
      setRecording(true);
      setPaused(false);
      setStatus('Recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(`Error starting recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
    }
  };
  
  const pauseRecording = async () => {
    try {
      setStatus('Pausing recording...');
      
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }
      
      await recorderRef.current.pauseRecording();
      
      setPaused(true);
      setStatus('Paused');
    } catch (error) {
      console.error('Error pausing recording:', error);
      setError(`Error pausing recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const resumeRecording = async () => {
    try {
      setStatus('Resuming recording...');
      
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }
      
      await recorderRef.current.resumeRecording();
      
      setPaused(false);
      setStatus('Recording');
    } catch (error) {
      console.error('Error resuming recording:', error);
      setError(`Error resuming recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const stopRecording = async () => {
    try {
      setStatus('Stopping recording...');
      
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }
      
      const result = await recorderRef.current.stopRecording();
      console.log('Recording result:', result);
      
      setAudioUrl(result.uri);
      setRecording(false);
      setPaused(false);
      setStatus('Ready');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError(`Error stopping recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
      setRecording(false);
      setPaused(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Recorder Test</Text>
      
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.support}>
        Support: {supported === null ? 'Checking...' : supported ? 'Supported' : 'Not supported'}
      </Text>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Request Permissions" 
          onPress={requestPermissions} 
          disabled={recording}
        />
        
        {!recording ? (
          <Button 
            title="Start Recording" 
            onPress={startRecording} 
            disabled={supported === false}
          />
        ) : paused ? (
          <Button 
            title="Resume" 
            onPress={resumeRecording} 
            color="green"
          />
        ) : (
          <Button 
            title="Pause" 
            onPress={pauseRecording} 
            color="orange"
          />
        )}
        
        {recording && (
          <Button 
            title="Stop Recording" 
            onPress={stopRecording} 
            color="red"
          />
        )}
      </View>
      
      {audioUrl && (
        <View style={styles.audioContainer}>
          <Text style={styles.audioTitle}>Recorded Audio:</Text>
          <audio src={audioUrl} controls style={{ width: '100%' }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 5,
  },
  support: {
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  audioContainer: {
    marginTop: 20,
  },
  audioTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default SimpleRecorderTest; 