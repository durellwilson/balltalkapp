import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import VocalIsolator from '../../components/audio/VocalIsolator';

const VocalIsolationScreen: React.FC = () => {
  const { user } = useAuth();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  // Request audio recording permission
  const requestPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  // Pick audio file
  const pickAudioFile = async () => {
    try {
      // Request permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setMessage('Permission to access audio files was denied');
        return;
      }

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setMessage('Audio file selection was canceled');
        return;
      }

      // Set audio URI and name
      setAudioUri(result.assets[0].uri);
      setAudioName(result.assets[0].name);
      setMessage(`Selected audio file: ${result.assets[0].name}`);
    } catch (error) {
      console.error('Error picking audio file:', error);
      setMessage('Failed to pick audio file');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Vocal Isolation</Text>
          <Text style={styles.subtitle}>
            Separate vocals from instrumentals in your audio files
          </Text>
        </View>

        <View style={styles.filePickerContainer}>
          <Text style={styles.sectionTitle}>Select Audio File</Text>
          
          {audioName ? (
            <View style={styles.selectedFileContainer}>
              <Ionicons name="musical-note" size={24} color="#007AFF" />
              <Text style={styles.selectedFileName} numberOfLines={1} ellipsizeMode="middle">
                {audioName}
              </Text>
              <TouchableOpacity onPress={() => pickAudioFile()}>
                <Text style={styles.changeFileText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickButton} onPress={pickAudioFile}>
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
              <Text style={styles.pickButtonText}>Select Audio File</Text>
            </TouchableOpacity>
          )}
          
          {message ? (
            <Text style={styles.messageText}>{message}</Text>
          ) : null}
        </View>

        {audioUri && user ? (
          <VocalIsolator
            audioUri={audioUri}
            userId={user.uid}
            onIsolationComplete={(result) => {
              console.log('Isolation completed:', result);
              setMessage('Vocal isolation completed successfully');
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              {!audioUri
                ? 'Select an audio file to start isolating vocals'
                : 'Please sign in to use vocal isolation'}
            </Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Vocal Isolation</Text>
          <Text style={styles.infoText}>
            This feature uses advanced AI algorithms to separate vocals from instrumentals in your audio files.
            You can choose to extract only the vocals, only the instrumentals, or both as separate tracks.
          </Text>
          <Text style={styles.infoText}>
            The quality of separation depends on the original recording. Best results are achieved with
            high-quality audio files where vocals are centered in the stereo field.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  pickButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  changeFileText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
});

export default VocalIsolationScreen; 