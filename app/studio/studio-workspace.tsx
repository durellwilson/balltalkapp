import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { AudioProvider, useAudio } from '../../contexts/AudioContext';
import Waveform from '../../components/audio/Waveform';
import AudioPlayerControls from '../../components/audio/AudioPlayerControls';
import MasteringControls from '../../components/audio/MasteringControls';
import VocalControls from '../../components/audio/VocalControls';
import RecordingInterface from '../../components/studio/RecordingInterface';
import TrackUploader from '../../components/studio/TrackUploader';
import TrackBrowser from '../../components/studio/TrackBrowser';
import RecorderTest from '../../components/studio/RecorderTest';
import SimpleRecorderTest from '../../components/studio/SimpleRecorderTest';
import { Song } from '../../models/Song';
import SongService from '../../services/SongService';
import { useAppTheme } from '../../components/ThemeProvider';

// Main content component
const StudioWorkspaceContent = () => {
  const { user } = useAuth();
  const { 
    loadAudio, 
    isLoading, 
    isInitialized,
    processingMode,
    isProcessing
  } = useAudio();
  const navigation = useNavigation();
  const { theme, isDark } = useAppTheme();
  
  // State for studio mode
  const [studioMode, setStudioMode] = useState<'welcome' | 'record' | 'upload' | 'browse' | 'edit'>('welcome');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'mastering' | 'vocal'>('mastering');
  const [initializationTimeout, setInitializationTimeout] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set a timeout for initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setInitializationTimeout(true);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isInitialized]);
  
  // Handle recording completion
  const handleRecordingComplete = async (uri: string, duration: number) => {
    try {
      setStudioMode('edit');
      await loadAudio(uri);
    } catch (error) {
      console.error('Error loading recorded audio:', error);
      handleError('Failed to load recorded audio');
    }
  };
  
  // Handle upload completion
  const handleUploadComplete = async (data: {
    audioUri: string;
    coverArtUri?: string;
    title: string;
    genre: string;
    description?: string;
  }) => {
    try {
      setStudioMode('edit');
      await loadAudio(data.audioUri);
      
      // Save metadata for later use
      setSelectedFile({
        uri: data.audioUri,
        title: data.title,
        genre: data.genre,
        description: data.description || '',
        coverArt: data.coverArtUri
      });
    } catch (error) {
      console.error('Error loading uploaded audio:', error);
      handleError('Failed to load uploaded audio');
    }
  };
  
  // Handle track selection from browser
  const handleTrackSelect = async (track: Song) => {
    try {
      setStudioMode('edit');
      
      // If track has a downloadUrl, use that, otherwise use the localUri
      const audioUri = track.downloadUrl || track.localUri;
      
      if (!audioUri) {
        throw new Error('No audio URI available for this track');
      }
      
      await loadAudio(audioUri);
      
      // Save track data
      setSelectedFile({
        id: track.id,
        uri: audioUri,
        title: track.title,
        genre: track.genre,
        description: track.description || '',
        coverArt: track.coverArt
      });
    } catch (error) {
      console.error('Error loading selected track:', error);
      handleError('Failed to load selected track');
    }
  };
  
  // Force continue past initialization timeout
  const forceContinue = () => {
    setInitializationTimeout(false);
    Alert.alert(
      'Limited Functionality',
      'Some audio features may not work correctly. You can try reloading the app if you experience issues.',
      [{ text: 'OK' }]
    );
  };
  
  // Handle errors
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setStudioMode('welcome');
  };
  
  // Render welcome screen
  const renderWelcomeScreen = () => (
    <ScrollView style={styles.welcomeContainer}>
      <Text style={[styles.welcomeTitle, { color: theme.text }]}>Audio Studio</Text>
      <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
        Create, upload, or select audio to get started
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.cardBackground }]} 
          onPress={() => setStudioMode('record')}
        >
          <Ionicons name="mic" size={32} color={theme.primary} />
          <Text style={[styles.optionTitle, { color: theme.text }]}>Record</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Record audio directly using your microphone
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.cardBackground }]} 
          onPress={() => setStudioMode('upload')}
        >
          <Ionicons name="cloud-upload" size={32} color={theme.primary} />
          <Text style={[styles.optionTitle, { color: theme.text }]}>Upload</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Upload audio files from your device
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.cardBackground }]} 
          onPress={() => setStudioMode('browse')}
        >
          <Ionicons name="library" size={32} color={theme.primary} />
          <Text style={[styles.optionTitle, { color: theme.text }]}>Browse</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Select from your existing audio library
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  // Render studio content based on mode
  const renderStudioContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: theme.primary }]}
            onPress={() => setError(null)}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!isInitialized && isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Initializing audio engine...
          </Text>
          
          {initializationTimeout && (
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
              onPress={forceContinue}
            >
              <Text style={styles.continueButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    switch (studioMode) {
      case 'welcome':
        return renderWelcomeScreen();
        
      case 'record':
        return (
          <RecordingInterface 
            onComplete={handleRecordingComplete}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'upload':
        return (
          <TrackUploader 
            onComplete={handleUploadComplete}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'browse':
        return (
          <TrackBrowser 
            onSelect={handleTrackSelect}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'edit':
        return (
          <View style={styles.editContainer}>
            <View style={styles.waveformContainer}>
              <Waveform />
            </View>
            
            <AudioPlayerControls />
            
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'mastering' && [styles.activeTab, { borderBottomColor: theme.primary }]
                ]}
                onPress={() => setActiveTab('mastering')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'mastering' ? theme.primary : theme.textSecondary }
                  ]}
                >
                  Mastering
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'vocal' && [styles.activeTab, { borderBottomColor: theme.primary }]
                ]}
                onPress={() => setActiveTab('vocal')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'vocal' ? theme.primary : theme.textSecondary }
                  ]}
                >
                  Vocal Processing
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.controlsContainer}>
              {activeTab === 'mastering' ? (
                <MasteringControls />
              ) : (
                <VocalControls />
              )}
            </ScrollView>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                onPress={() => setStudioMode('welcome')}
              >
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (selectedFile?.id) {
                    // Navigate to save processed audio with the track ID
                    navigation.navigate('save-processed-audio', { trackId: selectedFile.id });
                  } else {
                    // Navigate to save processed audio with no track ID (new track)
                    navigation.navigate('save-processed-audio');
                  }
                }}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      default:
        return renderWelcomeScreen();
    }
  };
  
  return (
    <View style={styles.container}>
      {renderStudioContent()}
      
      {isProcessing && (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.processingModal}>
            <View style={[styles.processingContent, { backgroundColor: theme.cardBackground }]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.processingText, { color: theme.text }]}>
                {processingMode === 'mastering' 
                  ? 'Mastering audio...' 
                  : processingMode === 'vocal' 
                    ? 'Processing vocals...'
                    : 'Processing audio...'}
              </Text>
              <Text style={[styles.processingSubtext, { color: theme.textSecondary }]}>
                This may take a few moments
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Main screen component with AudioProvider
const StudioWorkspaceScreen = () => {
  const { theme } = useAppTheme();
  
  return (
    <AudioProvider>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StudioWorkspaceContent />
      </View>
    </AudioProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  optionCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  continueButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  editContainer: {
    flex: 1,
  },
  waveformContainer: {
    height: 160,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    flex: 1,
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  processingModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
  },
});

export default StudioWorkspaceScreen; 