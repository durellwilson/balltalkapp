import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import EnhancedWaveform from '../components/audio/EnhancedWaveform';
import GenreAutocomplete from '../components/studio/GenreAutocomplete';
import { detectGenreFromAudio } from '../constants/MusicGenres';
import { useTheme } from '../hooks/useTheme';
import Colors from '../constants/Colors';

export default function SaveProcessedAudioScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Audio analysis state
  const [isDetectingGenre, setIsDetectingGenre] = useState(false);
  const [detectedGenres, setDetectedGenres] = useState<string[]>([]);
  const [audioMetadata, setAudioMetadata] = useState<{
    duration: number;
    sampleRate?: number;
    channels?: number;
    format?: string;
    bitRate?: number;
  } | null>(null);
  
  // Get params from route
  const audioUri = route.params?.audioUri;
  const settings = route.params?.settings;
  const presetId = route.params?.presetId;
  
  // Load audio metadata on mount
  useEffect(() => {
    if (audioUri) {
      loadAudioMetadata();
    }
  }, [audioUri]);
  
  // Load audio metadata
  const loadAudioMetadata = async () => {
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      if (status.isLoaded) {
        setAudioMetadata({
          duration: status.durationMillis ? status.durationMillis / 1000 : 0,
          // Other metadata would be available in a real implementation
        });
      }
      
      // Unload the sound to free resources
      await sound.unloadAsync();
    } catch (error) {
      console.error('Error loading audio metadata:', error);
    }
  };
  
  // Detect genre from audio
  const detectGenre = async () => {
    if (!audioUri) return;
    
    setIsDetectingGenre(true);
    
    try {
      // In a real implementation, this would analyze the audio file
      // For now, we'll simulate detection with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate detected genres based on simple analysis
      // In a real app, this would use audio analysis APIs or ML models
      const simulatedBpm = 85 + Math.floor(Math.random() * 40);
      const simulatedKey = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)] + 
                          [' Major', ' Minor'][Math.floor(Math.random() * 2)];
      const simulatedEnergy = 0.4 + Math.random() * 0.6;
      const simulatedInstruments = [
        'drums', 'bass', 'guitar', 'piano', 'synth', 'vocals'
      ].filter(() => Math.random() > 0.5);
      
      const detected = detectGenreFromAudio(
        simulatedBpm,
        simulatedKey,
        simulatedEnergy,
        simulatedInstruments
      );
      
      setDetectedGenres(detected);
      
      // If no genre is selected yet, automatically select the first detected genre
      if (!genre && detected.length > 0) {
        setGenre(detected[0]);
      }
    } catch (error) {
      console.error('Error detecting genre:', error);
      Alert.alert('Error', 'Failed to detect genre from audio.');
    } finally {
      setIsDetectingGenre(false);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your track.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save the processed audio to the server
      // along with metadata and processing settings
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Your processed audio has been saved successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving processed audio:', error);
      Alert.alert('Error', 'Failed to save processed audio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!audioUri) {
    return (
      <View style={[styles.errorContainer, isDark && styles.containerDark]}>
        <MaterialIcons name="error" size={64} color="#f44336" />
        <Text style={[styles.errorText, isDark && styles.textLight]}>No audio file to save</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, isDark && styles.containerDark]} 
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, isDark && styles.textLight]}>Save Processed Audio</Text>
      
      {/* Audio Preview */}
      <View style={styles.audioPreview}>
        <EnhancedWaveform 
          audioUri={audioUri} 
          height={160}
          showControls={true}
          showTimeDisplay={true}
          primaryColor={Colors.PRIMARY}
          secondaryColor={Colors.SECONDARY || '#FF9500'}
          backgroundColor={isDark ? '#2A2A2A' : '#f9f9f9'}
        />
      </View>
      
      {/* Form */}
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Title</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title for your track"
            placeholderTextColor={isDark ? '#999' : '#999'}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Genre</Text>
          <GenreAutocomplete
            value={genre}
            onChangeText={setGenre}
            onDetectGenre={detectGenre}
            detectedGenres={detectedGenres}
            isDetecting={isDetectingGenre}
            placeholder="Enter or select a genre"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter a description for your track"
            placeholderTextColor={isDark ? '#999' : '#999'}
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isDark && styles.visibilityOptionDark,
                isPublic && styles.activeVisibilityOption,
                isPublic && isDark && styles.activeVisibilityOptionDark
              ]}
              onPress={() => setIsPublic(true)}
            >
              <MaterialIcons 
                name="public" 
                size={24} 
                color={isPublic ? Colors.PRIMARY : isDark ? '#aaa' : '#666'} 
              />
              <Text style={[
                styles.visibilityText,
                isDark && styles.textLight,
                isPublic && styles.activeVisibilityText
              ]}>
                Public
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isDark && styles.visibilityOptionDark,
                !isPublic && styles.activeVisibilityOption,
                !isPublic && isDark && styles.activeVisibilityOptionDark
              ]}
              onPress={() => setIsPublic(false)}
            >
              <MaterialIcons 
                name="lock" 
                size={24} 
                color={!isPublic ? Colors.PRIMARY : isDark ? '#aaa' : '#666'} 
              />
              <Text style={[
                styles.visibilityText,
                isDark && styles.textLight,
                !isPublic && styles.activeVisibilityText
              ]}>
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Audio Metadata */}
      {audioMetadata && (
        <View style={[styles.metadataContainer, isDark && styles.metadataContainerDark]}>
          <Text style={[styles.metadataTitle, isDark && styles.textLight]}>
            Audio Information
          </Text>
          <View style={styles.metadataRow}>
            <Text style={[styles.metadataLabel, isDark && styles.textLightSecondary]}>
              Duration:
            </Text>
            <Text style={[styles.metadataValue, isDark && styles.textLight]}>
              {formatTime(audioMetadata.duration)}
            </Text>
          </View>
          {audioMetadata.format && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, isDark && styles.textLightSecondary]}>
                Format:
              </Text>
              <Text style={[styles.metadataValue, isDark && styles.textLight]}>
                {audioMetadata.format.toUpperCase()}
              </Text>
            </View>
          )}
          {audioMetadata.bitRate && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, isDark && styles.textLightSecondary]}>
                Bit Rate:
              </Text>
              <Text style={[styles.metadataValue, isDark && styles.textLight]}>
                {Math.round(audioMetadata.bitRate / 1000)} kbps
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.savingButton]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <MaterialIcons name="cloud-upload" size={24} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save & Upload</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Format time (seconds) to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  audioPreview: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  inputDark: {
    borderColor: '#444',
    backgroundColor: '#2A2A2A',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  visibilityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  visibilityOptionDark: {
    borderColor: '#444',
    backgroundColor: '#2A2A2A',
  },
  activeVisibilityOption: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY + '10',
  },
  activeVisibilityOptionDark: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY + '20',
  },
  visibilityText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  activeVisibilityText: {
    color: Colors.PRIMARY,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  savingButton: {
    backgroundColor: Colors.SECONDARY || '#999',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metadataContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metadataContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metadataLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
  },
  metadataValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  textLight: {
    color: '#fff',
  },
  textLightSecondary: {
    color: '#aaa',
  },
}); 