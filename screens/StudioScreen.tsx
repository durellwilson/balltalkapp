import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AudioProvider, useAudio } from '../contexts/AudioContext';
import Waveform from '../components/audio/Waveform';
import AudioPlayerControls from '../components/audio/AudioPlayerControls';
import MasteringControls from '../components/audio/MasteringControls';
import VocalControls from '../components/audio/VocalControls';
import RecordingInterface from '../components/studio/RecordingInterface';
import TrackUploader from '../components/studio/TrackUploader';
import TrackBrowser from '../components/studio/TrackBrowser';
import { Song } from '../models/Song';
import SongService from '../services/SongService';
import { useAppTheme } from '../components/ThemeProvider';

// Main content component
const StudioContent = () => {
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
    if (!isInitialized && !initializationTimeout) {
      console.log('Setting audio initialization timeout...');
      const timer = setTimeout(() => {
        console.log('Audio initialization timeout reached');
        setInitializationTimeout(true);
      }, 8000); // 8 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, initializationTimeout]);
  
  // Handle recording completion
  const handleRecordingComplete = async (uri: string, duration: number) => {
    console.log('Recording complete:', uri, 'Duration:', duration);
    try {
      setSelectedFile({
        type: 'success',
        name: 'Recording.m4a',
        uri,
        size: 0,
        duration
      });
      
      const success = await loadAudio(uri);
      if (!success) {
        throw new Error('Failed to load recorded audio');
      }
      
      setStudioMode('edit');
    } catch (error) {
      console.error('Error handling recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setStudioMode('welcome');
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
    console.log('Upload complete:', data);
    try {
      setSelectedFile({
        type: 'success',
        name: data.title,
        uri: data.audioUri,
        size: 0,
        coverArtUri: data.coverArtUri,
        genre: data.genre,
        description: data.description
      });
      
      const success = await loadAudio(data.audioUri);
      if (!success) {
        throw new Error('Failed to load uploaded audio');
      }
      
      setStudioMode('edit');
    } catch (error) {
      console.error('Error handling upload:', error);
      Alert.alert('Error', 'Failed to process upload. Please try again.');
      setStudioMode('welcome');
    }
  };
  
  // Handle track selection from browser
  const handleTrackSelect = async (track: Song) => {
    console.log('Track selected:', track);
    try {
      setSelectedFile({
        type: 'success',
        name: track.title,
        uri: track.fileUrl,
        size: 0,
        coverArtUri: track.coverArtUrl,
        genre: track.genre,
        description: track.description
      });
      
      const success = await loadAudio(track.fileUrl);
      if (!success) {
        throw new Error('Failed to load selected track');
      }
      
      setStudioMode('edit');
    } catch (error) {
      console.error('Error handling track selection:', error);
      Alert.alert('Error', 'Failed to load selected track. Please try again.');
      setStudioMode('welcome');
    }
  };
  
  // Force continue without waiting for audio initialization
  const forceContinue = () => {
    Alert.alert(
      "Continue Without Audio",
      "Some audio features may not work properly. Do you want to continue anyway?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Continue",
          onPress: () => {
            // This is a workaround to bypass the initialization screen
            setInitializationTimeout(false);
            setStudioMode('welcome');
          }
        }
      ]
    );
  };
  
  // Handle errors
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  };
  
  // Render welcome screen with options
  const renderWelcomeScreen = () => (
    <View style={[styles.welcomeContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.welcomeTitle, { color: theme.text }]}>BallTalk Studio</Text>
      <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>Create, upload, and master your tracks</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionButton, { backgroundColor: theme.card }]} 
          onPress={() => setStudioMode('record')}
        >
          <Ionicons name="mic" size={32} color={theme.tint} />
          <Text style={[styles.optionText, { color: theme.text }]}>Record</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Record a new track directly in the app
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionButton, { backgroundColor: theme.card }]} 
          onPress={() => setStudioMode('upload')}
        >
          <Ionicons name="cloud-upload" size={32} color={theme.tint} />
          <Text style={[styles.optionText, { color: theme.text }]}>Upload</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Upload an existing audio file
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionButton, { backgroundColor: theme.card }]} 
          onPress={() => setStudioMode('browse')}
        >
          <Ionicons name="library" size={32} color={theme.tint} />
          <Text style={[styles.optionText, { color: theme.text }]}>Browse</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Browse and edit your existing tracks
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render the appropriate content based on studio mode
  const renderStudioContent = () => {
    if (!user) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Please log in to use the studio features.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    switch (studioMode) {
      case 'welcome':
        return renderWelcomeScreen();
        
      case 'record':
        return (
          <RecordingInterface
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'upload':
        return (
          <TrackUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'browse':
        return (
          <TrackBrowser
            onTrackSelect={handleTrackSelect}
            onCancel={() => setStudioMode('welcome')}
          />
        );
        
      case 'edit':
        if (!selectedFile) {
          setStudioMode('welcome');
          return null;
        }
        
        return (
          <View style={styles.editContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{selectedFile.name}</Text>
              <TouchableOpacity onPress={() => setStudioMode('welcome')}>
                <Ionicons name="close" size={24} color="#BBBBBB" />
              </TouchableOpacity>
            </View>
            
            <Waveform height={120} />
            <AudioPlayerControls />
            
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'mastering' && styles.activeTab
                ]}
                onPress={() => setActiveTab('mastering')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'mastering' && styles.activeTabText
                ]}>
                  Mastering
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'vocal' && styles.activeTab
                ]}
                onPress={() => setActiveTab('vocal')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'vocal' && styles.activeTabText
                ]}>
                  Vocal Processing
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scrollView}>
              {activeTab === 'mastering' ? (
                <MasteringControls userId={user.uid} />
              ) : (
                <VocalControls userId={user.uid} />
              )}
            </ScrollView>
          </View>
        );
    }
  };
  
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E44AD" />
        <Text style={styles.loadingText}>Initializing audio engine...</Text>
        {initializationTimeout && (
          <View style={styles.timeoutContainer}>
            <Text style={styles.timeoutText}>
              Audio initialization is taking longer than expected.
            </Text>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={forceContinue}
            >
              <Text style={styles.skipButtonText}>Continue Without Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.skipButton, styles.retryButton]}
              onPress={() => {
                setInitializationTimeout(false);
                // This would ideally trigger a re-initialization of the audio engine
                // but we'll just refresh the timeout for now
                const timer = setTimeout(() => {
                  setInitializationTimeout(true);
                }, 8000);
                return () => clearTimeout(timer);
              }}
            >
              <Text style={styles.skipButtonText}>Retry Initialization</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderStudioContent()}
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>
            Processing audio...
          </Text>
        </View>
      )}
      
      {error && (
        <TouchableOpacity 
          style={styles.errorBanner}
          onPress={() => setError(null)}
        >
          <Text style={styles.errorBannerText}>{error}</Text>
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main screen component with AudioProvider
const StudioScreen = () => {
  const { theme } = useAppTheme();
  
  return (
    <AudioProvider>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StudioContent />
      </View>
    </AudioProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#BBBBBB'
  },
  scrollView: {
    flex: 1
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6
  },
  activeTab: {
    backgroundColor: '#8E44AD'
  },
  tabText: {
    color: '#BBBBBB',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 24
  },
  loginButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#BBBBBB'
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500'
  },
  timeoutContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  timeoutText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#555',
  },
  skipButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#8E44AD',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#555',
  },
  welcomeContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  editContainer: {
    flex: 1,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
});

export default StudioScreen; 