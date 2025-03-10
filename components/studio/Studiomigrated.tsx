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
import { useRouter } from "expo-router";
import { useAuth } from '../../hooks/useAuth';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../hooks/useTheme';
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

interface StudiomigratedProps {
  // Add props here
}

/**
 * Studiomigrated Component
 * 
 * Main studio interface component that provides audio recording, editing, and processing capabilities.
 */
const Studiomigrated: React.FC<StudiomigratedProps> = () => {
  const { user } = useAuth();
  const { 
    loadAudio, 
    isLoading, 
    isInitialized,
    processingMode,
    isProcessing
  } = useAudio();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
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
      }, 8000);
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
    <View style={styles.welcomeContainer}>
      <Text style={[styles.welcomeTitle, { color: theme.text }]}>Studio</Text>
      <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
        Create and edit your audio tracks
      </Text>
      
      {Platform.OS === 'web' && (
        <View style={styles.testContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recording Tests
          </Text>
          <SimpleRecorderTest />
          <RecorderTest />
        </View>
      )}
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionButton, { backgroundColor: theme.card }]} 
          onPress={() => setStudioMode('record')}
        >
          <Ionicons name="mic" size={32} color={theme.tint} />
          <Text style={[styles.optionText, { color: theme.text }]}>Record</Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            Record a new audio track
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
            onPress={() => router.push('/login')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  timeoutContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  timeoutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  skipButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#3498DB',
  },
  welcomeContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  optionButton: {
    width: 150,
    height: 150,
    borderRadius: 10,
    padding: 15,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  testContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editContainer: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 15,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8E44AD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E74C3C',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: 'white',
    flex: 1,
  }
});

export default Studiomigrated;