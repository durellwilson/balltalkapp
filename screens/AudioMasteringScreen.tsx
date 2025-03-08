import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { 
  AudioProcessingProvider, 
  useAudioProcessing 
} from '../contexts/AudioProcessingContext';
import PresetSelector from '../components/audio/processing/PresetSelector';
import EqualizerControl from '../components/audio/processing/EqualizerControl';
import CompressorControl from '../components/audio/processing/CompressorControl';
import Waveform from '../components/audio/Waveform'; // Assume you have this component
import LimiterControl from '../components/audio/processing/LimiterControl';
import OutputControl from '../components/audio/processing/OutputControl';

// Wrapper component that uses the context
function AudioMasteringContent() {
  const { 
    state, 
    setAudioFile, 
    processAudio, 
    togglePlayback, 
    resetSettings 
  } = useAudioProcessing();
  
  const route = useRoute();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get audio file from route params
  useEffect(() => {
    const setupAudio = async () => {
      if (route.params?.audioUri) {
        setIsLoading(true);
        try {
          // Initialize audio system
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });
          
          // Set the audio file in the context
          setAudioFile(route.params.audioUri);
        } catch (error) {
          console.error('Error setting up audio:', error);
          Alert.alert('Error', 'Failed to load audio file.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    setupAudio();
  }, [route.params?.audioUri]);
  
  // Handle reset
  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetSettings }
      ]
    );
  };
  
  // Handle save
  const handleSave = async () => {
    if (!state.processedAudioUri) {
      // Process the audio first if it hasn't been processed
      await processAudio();
    }
    
    // Navigate to save/export screen with the processed audio URI
    navigation.navigate('SaveProcessedAudio', { 
      audioUri: state.processedAudioUri || state.originalAudioUri,
      settings: state.currentSettings,
      presetId: state.activePresetId
    });
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading audio file...</Text>
      </View>
    );
  }
  
  if (!state.originalAudioUri) {
    return (
      <View style={styles.noAudioContainer}>
        <MaterialIcons name="audio-file" size={64} color="#cccccc" />
        <Text style={styles.noAudioText}>No audio file selected</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.selectButtonText}>Select Audio File</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Mastering</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <MaterialIcons name="refresh" size={20} color="#666666" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      
      {/* Audio Preview */}
      <View style={styles.audioPreview}>
        <Waveform 
          audioUri={state.processedAudioUri || state.originalAudioUri} 
          height={100}
        />
        
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={togglePlayback}
          disabled={state.isProcessing}
        >
          <MaterialIcons 
            name={state.isPlaying ? "pause" : "play-arrow"} 
            size={32} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Process/Save Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.processButton, state.isProcessing && styles.disabledButton]} 
          onPress={processAudio}
          disabled={state.isProcessing}
        >
          {state.isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="auto-fix-high" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Process Audio</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, !state.processedAudioUri && styles.disabledButton]} 
          onPress={handleSave}
          disabled={!state.processedAudioUri && !state.isProcessing}
        >
          <MaterialIcons name="save" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Save & Export</Text>
        </TouchableOpacity>
      </View>
      
      {/* Presets */}
      <PresetSelector />
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <EqualizerControl />
        <CompressorControl />
        <LimiterControl />
        <OutputControl />
        {/* Add other processing controls here */}
      </View>
    </ScrollView>
  );
}

// Main screen component with context provider
export default function AudioMasteringScreen() {
  return (
    <AudioProcessingProvider>
      <AudioMasteringContent />
    </AudioProcessingProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetText: {
    marginLeft: 4,
    color: '#666666',
  },
  audioPreview: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  processButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  controlsContainer: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  noAudioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noAudioText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    color: '#666666',
  },
  selectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 