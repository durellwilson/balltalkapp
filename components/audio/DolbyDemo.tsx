import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import AudioEnhancer from './AudioEnhancer';
import DolbyMasteringService, {
  DolbyMasteringProfile,
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyNoiseReductionLevel
} from '../../services/audio/DolbyMasteringService';

const DolbyDemo: React.FC = () => {
  const [userId] = useState('demo-user-' + Math.random().toString(36).substring(2, 9));
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedAudioUri, setEnhancedAudioUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  // Pick an audio file
  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        setMessage('Audio picking canceled');
        return;
      }

      setAudioUri(result.assets[0].uri);
      setMessage(`Audio file selected: ${result.assets[0].name}`);
    } catch (error) {
      console.error('Error picking audio:', error);
      setMessage('Error picking audio file');
    }
  };

  // Enhance audio
  const enhanceAudio = async () => {
    if (!audioUri) {
      setMessage('Please select an audio file first');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('Enhancing audio...');

      // Create a temporary file for the enhanced audio
      const tempDir = FileSystem.cacheDirectory + 'audio/';
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true }).catch(() => {});
      
      const enhancementOptions = {
        noiseReduction: DolbyNoiseReductionLevel.MEDIUM,
        outputFormat: DolbyOutputFormat.MP3,
        preserveMetadata: true
      };

      // Enhance the audio
      const result = await DolbyMasteringService.enhanceAudio(
        userId,
        audioUri,
        enhancementOptions
      );

      setEnhancedAudioUri(result.processedFileUrl);
      setMessage('Audio enhanced successfully');
    } catch (error) {
      console.error('Error enhancing audio:', error);
      setMessage('Error enhancing audio');
    } finally {
      setIsLoading(false);
    }
  };

  // Master audio
  const masterAudio = async () => {
    if (!audioUri) {
      setMessage('Please select an audio file first');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('Mastering audio...');

      const masteringOptions = {
        profile: DolbyMasteringProfile.BALANCED,
        outputFormat: DolbyOutputFormat.MP3,
        stereoEnhancement: DolbyStereoEnhancement.WIDEN,
        loudnessStandard: DolbyLoudnessStandard.STREAMING,
        preserveMetadata: true
      };

      // Master the audio
      const result = await DolbyMasteringService.masterAudio(
        userId,
        audioUri,
        masteringOptions
      );

      setEnhancedAudioUri(result.processedFileUrl);
      setMessage('Audio mastered successfully');
    } catch (error) {
      console.error('Error mastering audio:', error);
      setMessage('Error mastering audio');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze audio
  const analyzeAudio = async () => {
    if (!audioUri) {
      setMessage('Please select an audio file first');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('Analyzing audio...');

      // Analyze the audio
      const result = await DolbyMasteringService.analyzeAudio(
        userId,
        audioUri
      );

      setMessage(`Analysis complete. Loudness: ${result.metrics.loudness.toFixed(1)} LUFS, Dynamics: ${result.metrics.dynamics.toFixed(1)} dB`);
    } catch (error) {
      console.error('Error analyzing audio:', error);
      setMessage('Error analyzing audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dolby.io Media API Demo</Text>
      
      <TouchableOpacity style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>Select Audio File</Text>
      </TouchableOpacity>
      
      {audioUri && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.enhanceButton]} 
            onPress={enhanceAudio}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Enhance Audio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.masterButton]} 
            onPress={masterAudio}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Master Audio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.analyzeButton]} 
            onPress={analyzeAudio}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Analyze Audio</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      )}
      
      {!isLoading && message && (
        <Text style={styles.messageText}>{message}</Text>
      )}
      
      {audioUri && !isLoading && (
        <View style={styles.enhancerContainer}>
          <AudioEnhancer
            audioUri={audioUri}
            userId={userId}
            onEnhancementComplete={(uri) => {
              setEnhancedAudioUri(uri);
              setMessage('Audio processed successfully');
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  enhanceButton: {
    backgroundColor: '#34C759',
    flex: 1,
    marginRight: 8,
  },
  masterButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginHorizontal: 8,
  },
  analyzeButton: {
    backgroundColor: '#5856D6',
    flex: 1,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 16,
  },
  enhancerContainer: {
    flex: 1,
    marginTop: 16,
  },
});

export default DolbyDemo; 