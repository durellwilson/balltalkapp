import React, { useState, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

/**
 * Simple test component to verify that MediaRecorder works in the browser
 */
const RecorderTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const checkSupport = () => {
    try {
      setStatus('Checking support...');
      setError(null);
      
      // Check for required browser APIs
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
      const hasMediaRecorder = !!window.MediaRecorder;
      
      const isSupported = hasMediaDevices && hasAudioContext && hasMediaRecorder;
      
      console.log('Browser support check:');
      console.log('- Media Devices API:', hasMediaDevices);
      console.log('- Audio Context API:', hasAudioContext);
      console.log('- Media Recorder API:', hasMediaRecorder);
      console.log('Overall support:', isSupported);
      
      if (!isSupported) {
        setError('Your browser does not support recording');
        setStatus('Not supported');
        return false;
      }
      
      // Check supported MIME types
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mp3',
        'audio/wav'
      ];
      
      console.log('Supported MIME types:');
      let supportedTypes = 0;
      mimeTypes.forEach(mimeType => {
        let isTypeSupported = false;
        try {
          isTypeSupported = MediaRecorder.isTypeSupported(mimeType);
        } catch (e) {
          console.warn(`Error checking support for ${mimeType}:`, e);
        }
        console.log(`- ${mimeType}: ${isTypeSupported ? 'Supported' : 'Not supported'}`);
        if (isTypeSupported) supportedTypes++;
      });
      
      if (supportedTypes === 0) {
        setError('No supported audio MIME types found');
        setStatus('Limited support');
        return false;
      }
      
      setStatus('Supported');
      return true;
    } catch (error) {
      console.error('Error checking support:', error);
      setError(`Error checking support: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
      return false;
    }
  };
  
  const startRecording = async () => {
    try {
      setStatus('Starting recording...');
      setError(null);
      
      // Reset chunks
      chunksRef.current = [];
      
      // Get user media
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Got media stream');
      
      // Create MediaRecorder
      const mimeType = getSupportedMimeType();
      console.log('Using MIME type:', mimeType);
      
      try {
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });
        console.log('MediaRecorder created with MIME type');
      } catch (e) {
        console.warn('Failed to create MediaRecorder with MIME type, trying without options:', e);
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        console.log('MediaRecorder created without options');
      }
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log(`Data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('MediaRecorder error');
        setStatus('Error');
      };
      
      mediaRecorderRef.current.onstart = () => {
        console.log('MediaRecorder started');
        setStatus('Recording');
        setRecording(true);
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped');
        processRecording();
      };
      
      // Start recording
      mediaRecorderRef.current.start(1000);
      console.log('MediaRecorder.start() called');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(`Error starting recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
      cleanup();
    }
  };
  
  const stopRecording = () => {
    try {
      setStatus('Stopping recording...');
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder.stop() called');
      }
      
      setRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError(`Error stopping recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
      cleanup();
    }
  };
  
  const processRecording = () => {
    try {
      if (chunksRef.current.length === 0) {
        setError('No audio data recorded');
        setStatus('Error');
        return;
      }
      
      const mimeType = getSupportedMimeType();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      setStatus('Ready');
      console.log('Recording processed, URL created');
      
      cleanup();
    } catch (error) {
      console.error('Error processing recording:', error);
      setError(`Error processing recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Error');
      cleanup();
    }
  };
  
  const cleanup = () => {
    try {
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      mediaRecorderRef.current = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };
  
  const getSupportedMimeType = (): string => {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mp3',
      'audio/wav'
    ];
    
    for (const mimeType of mimeTypes) {
      try {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          return mimeType;
        }
      } catch (e) {
        console.warn(`Error checking support for ${mimeType}:`, e);
      }
    }
    
    return '';
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaRecorder Test</Text>
      
      <Text style={styles.status}>Status: {status}</Text>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Check Support" 
          onPress={checkSupport} 
          disabled={recording}
        />
        
        {!recording ? (
          <Button 
            title="Start Recording" 
            onPress={startRecording} 
            disabled={status === 'Not supported' || status === 'Recording'}
          />
        ) : (
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
  },
  audioContainer: {
    marginTop: 20,
  },
  audioTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default RecorderTest; 