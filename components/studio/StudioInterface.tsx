import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  TextInput
} from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import RecordingInterface from './RecordingInterface';
import TrackUploader from './TrackUploader';
import TrackBrowser from './TrackBrowser';
import AudioWaveform from './AudioWaveform';
import AudioProcessingControls from './AudioProcessingControls';
import DawService, { DawService as DawServiceClass } from '../../services/DawService';
import { AudioStorageService } from '../../services/audio/AudioStorageService';
import { AudioProcessingService } from '../../services/audio/AudioProcessingService';
import { Project, Track, AudioProcessingOptions } from './StudioTypes';
import Colors from '../../constants/Colors';
import AudioEffectsPanel from '../audio/processing/AudioEffectsPanel';

/**
 * StudioInterface Component
 * 
 * A comprehensive studio interface for recording, uploading, and processing audio.
 * Follows industry standards for audio production with a modern, elegant UI.
 * 
 * Features:
 * - Audio recording with visualization
 * - File uploading with validation
 * - Track browsing and selection
 * - Audio processing with professional controls
 * - Project management
 * - Collaboration tools
 * 
 * @returns {React.ReactElement} The StudioInterface component
 */
const StudioInterface: React.FC = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  
  // Ensure theme is available with fallback values - use a stable reference
  const safeTheme = useMemo(() => {
    if (theme) return theme;
    
    return {
      tint: '#007AFF',
      background: isDark ? '#121212' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#CCCCCC' : '#666666',
      cardBackground: isDark ? '#333333' : '#F8F8F8',
      border: isDark ? '#444444' : '#EEEEEE',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF2D55',
      cardBackgroundLight: '#F8F8F8',
    };
  }, [theme, isDark]);
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'welcome' | 'record' | 'upload' | 'browse' | 'edit' | 'effects'>('welcome');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trackTitle, setTrackTitle] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Initialize audio session
   * Sets up the audio session with appropriate settings for recording and playback
   */
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      
      // Set audio quality for recording
      await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      ).then(recording => {
        if (recording) {
          recording.recording.stopAndUnloadAsync();
        }
      });
      
      console.log('Audio session initialized successfully with high quality settings');
    } catch (error) {
      console.error('Failed to initialize audio session:', error);
      setError('Failed to initialize audio. Please restart the app.');
    }
  }, []);
  
  /**
   * Load user's current project or create a new one
   */
  const loadCurrentProject = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user's projects
      const projects = await DawServiceClass.getUserProjects(user.uid);
      
      if (projects && projects.length > 0) {
        // Sort by last updated and get the most recent
        const sortedProjects = [...projects].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        const latestProject = sortedProjects[0];
        setCurrentProject(latestProject);
        
        // Log successful project load
        console.log('[StudioInterface] Loaded existing project:', latestProject.id);
      } else {
        // Create a new project if none exists
        console.log('[StudioInterface] No existing projects found, creating new project');
        
        try {
          // Initialize a new DawService instance for this operation
          const dawServiceInstance = new DawServiceClass();
          const newProject = await dawServiceInstance.createProject(
            user.uid,
            'New Project',
            {
              tempo: 120,
              description: 'My first project',
              isPublic: false,
              tags: ['new']
            }
          );
          
          setCurrentProject(newProject);
          console.log('[StudioInterface] Created new project:', newProject.id);
        } catch (createError: any) {
          console.error('[StudioInterface] Error creating new project:', createError);
          setError(`Failed to create new project: ${createError.message}`);
          Alert.alert(
            'Error',
            'Failed to create new project. Please try again or contact support if the problem persists.'
          );
        }
      }
    } catch (error: any) {
      console.error('[StudioInterface] Error loading project:', error);
      setError(`Failed to load project: ${error.message}`);
      Alert.alert(
        'Error',
        'Failed to load project. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  /**
   * Handle recording completion
   * @param {string} recordingUri - The URI of the completed recording
   * @param {number} duration - The duration of the recording in seconds
   */
  const handleRecordingComplete = async (recordingUri: string, duration: number) => {
    console.log('Recording complete, loading audio:', recordingUri);
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const configureAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        return true;
      } catch (error) {
        console.error('Error configuring audio session:', error);
        return false;
      }
    };
    
    const preloadAudio = async () => {
      try {
        console.log('Pre-loading audio for immediate playback');
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: false }
        );
        await sound.unloadAsync(); // Clean up after preload
        return true;
      } catch (error) {
        console.error('Failed to pre-load audio:', error);
        return false;
      }
    };
    
    while (retryCount < maxRetries) {
      try {
        // Configure audio session
        const sessionConfigured = await configureAudioSession();
        if (!sessionConfigured) throw new Error('Failed to configure audio session');
        
        // Pre-load audio
        const audioPreloaded = await preloadAudio();
        if (!audioPreloaded) throw new Error('Failed to pre-load audio');
        
        // Load audio for processing
        const loaded = await loadAudio(recordingUri);
        if (!loaded) throw new Error('Failed to load audio for processing');
        
        console.log('Audio loaded successfully, switching to edit view');
        setActiveView('edit');
        
        // Auto-play the recording after a short delay
        setTimeout(() => {
          togglePlayback().catch(error => {
            console.error('Error auto-playing recording:', error);
            setError('Failed to auto-play the recording');
          });
        }, 500);
        
        return; // Success - exit the retry loop
        
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`Retrying audio loading (attempt ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          console.error('Failed to load recorded audio after multiple attempts');
          setError('Failed to load the recording. Please try again.');
          setActiveView('welcome');
        }
      }
    }
  };
  
  /**
   * Handle upload completion
   * @param {Object} data - The uploaded file data
   */
  const handleUploadComplete = async (data: {
    audioUri: string;
    coverArtUri?: string;
    title: string;
    genre: string;
    description?: string;
  }) => {
    const loaded = await loadAudio(data.audioUri);
    
    if (loaded) {
      setActiveView('edit');
    }
  };
  
  /**
   * Handle track selection from browser
   * @param {Object} track - The selected track
   */
  const handleTrackSelect = async (track: any) => {
    if (track && track.audioUrl) {
      const loaded = await loadAudio(track.audioUrl);
      
      if (loaded) {
        setActiveView('edit');
      }
    }
  };
  
  /**
   * Load audio file for playback and editing
   * @param {string} uri - The URI of the audio file
   * @returns {Promise<boolean>} Success status
   */
  const loadAudio = async (uri: string): Promise<boolean> => {
    if (!uri) return false;
    
    try {
      console.log('Loading audio from URI:', uri);
      setIsLoading(true);
      
      // Configure audio session for optimal playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Unload any existing sound
      if (soundRef.current) {
        console.log('Unloading previous sound');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Clear any existing interval
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
      
      // Load the sound
      console.log('Creating sound object from URI');
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { 
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
          shouldPlay: false,
          rate: 1.0,
          shouldCorrectPitch: true,
          volume: 1.0,
          isMuted: false
        },
        onPlaybackStatusUpdate
      );
      
      // Store the sound reference
      soundRef.current = sound;
      
      // Set audio duration if available
      if (status && 'durationMillis' in status && status.durationMillis) {
        setAudioDuration(status.durationMillis / 1000);
      }
      
      // Set the audio URI
      setAudioUri(uri);
      
      console.log('Audio loaded successfully');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      setError(`Failed to load audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      return false;
    }
  };
  
  /**
   * Handle playback status updates
   * @param status - The playback status object
   */
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      // Handle error or unloaded state
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    // Update state with current playback position and status
    setCurrentPosition(status.positionMillis / 1000);
    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);

    // Handle playback completion
    if (status.didJustFinish) {
      // Reset to start of track
      sound?.setPositionAsync(0).catch(console.error);
      setIsPlaying(false);
    }
    
    // Log any playback errors to help debug
    if (status.error) {
      console.error('Playback error:', status.error);
      setError(`Playback error: ${status.error}`);
    }
  };
  
  /**
   * Toggle playback state
   */
  const togglePlayback = async () => {
    if (!sound) {
      // If no sound is loaded yet, load the audio
      if (audioUri) {
        try {
          console.log('Loading audio from URI:', audioUri);
          
          // Unload any previous sound instance
          if (sound) {
            await sound.unloadAsync();
          }
          
          // Create a new sound instance
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          
          // Store the sound instance
          setSound(newSound);
          setIsPlaying(true);
        } catch (error) {
          console.error('Error loading audio:', error);
          setError(`Failed to load audio: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      // Toggle playback of existing sound
      try {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
        setError(`Playback error: ${error instanceof Error ? error.message : String(error)}`);
        
        // If we encounter an error, try to reload the sound
        try {
          await sound.unloadAsync();
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          setSound(newSound);
          setIsPlaying(true);
        } catch (reloadError) {
          console.error('Failed to reload audio after error:', reloadError);
        }
      }
    }
  };
  
  /**
   * Seek to a specific position in the audio
   * @param {number} position - The position in seconds
   */
  const seekTo = async (position: number) => {
    if (!soundRef.current || !audioUri) return;
    
    try {
      // Validate position is a finite number
      if (!Number.isFinite(position)) {
        console.warn('Invalid seek position:', position);
        return;
      }
      
      // Ensure position is within valid range
      const validPosition = Math.max(0, Math.min(position, audioDuration));
      console.log('Starting playback from position:', validPosition);
      
      // Convert to milliseconds for the Audio API
      await soundRef.current.setPositionAsync(Math.floor(validPosition * 1000));
      setCurrentPosition(validPosition);
    } catch (error: any) {
      console.error('Error seeking:', error);
      setError(`Seek error: ${error.message || 'Unknown error'}`);
    }
  };
  
  /**
   * Process audio with selected effects
   * @param {Object} processingOptions - The audio processing options
   */
  const processAudio = async (processingOptions: any) => {
    if (!audioUri) return;
    
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setError(null);
      
      const onProgress = (progress: number) => {
        setProcessingProgress(progress);
      };
      
      const result = await AudioProcessingService.processAudio(
        audioUri,
        processingOptions,
        onProgress
      );
      
      // Handle the result based on its structure
      if (result) {
        let outputUri = '';
        
        // Check if result is an object with outputUri property
        if (typeof result === 'object' && result !== null && 'outputUri' in result) {
          outputUri = (result as { outputUri: string }).outputUri;
        } 
        // Check if result is a string (direct URI)
        else if (typeof result === 'string') {
          outputUri = result;
        }
        
        if (outputUri) {
          // Load the processed audio
          const loaded = await loadAudio(outputUri);
          
          if (loaded) {
            Alert.alert('Success', 'Audio processing completed successfully');
          } else {
            throw new Error('Failed to load processed audio');
          }
        } else {
          throw new Error('Audio processing failed to return a valid URI');
        }
      } else {
        throw new Error('Audio processing failed');
      }
    } catch (error: any) {
      console.error('Error processing audio:', error);
      setError(`Processing error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Format time in seconds to MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Use useEffect with proper dependencies
  useEffect(() => {
    // Initialize audio when component mounts
    initializeAudio().catch(err => {
      console.error('Failed to initialize audio:', err);
      setError('Failed to initialize audio. Please restart the app.');
    });
    
    // Load current project if user is authenticated
    if (user) {
      loadCurrentProject().catch(err => {
        console.error('Failed to load project:', err);
        setError('Failed to load project. Please try again.');
      });
    }
    
    // Cleanup function
    return () => {
      // Unload sound when component unmounts
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
      
      // Clear interval
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [initializeAudio, loadCurrentProject, user]);
  
  /**
   * Render the welcome screen with options
   * @returns {React.ReactElement} The welcome screen component
   */
  const renderWelcomeScreen = () => (
    <View style={[styles.welcomeContainer, { backgroundColor: safeTheme.cardBackground }]}>
      <Text style={[styles.welcomeTitle, { color: safeTheme.text }]}>Studio</Text>
      <Text style={[styles.welcomeSubtitle, { color: safeTheme.textSecondary }]}>
        Create, record, and share your music
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: safeTheme.primary }]}
          onPress={() => setActiveView('record')}
        >
          <Ionicons name="mic" size={32} color="#FFFFFF" />
          <Text style={styles.optionButtonText}>Record</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: safeTheme.secondary }]}
          onPress={() => setActiveView('upload')}
        >
          <Ionicons name="cloud-upload" size={32} color="#FFFFFF" />
          <Text style={styles.optionButtonText}>Upload</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: safeTheme.accent }]}
          onPress={() => setActiveView('browse')}
        >
          <Ionicons name="albums" size={32} color="#FFFFFF" />
          <Text style={styles.optionButtonText}>Browse</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: '#5856D6' }]}
          onPress={() => setActiveView('effects')}
        >
          <Ionicons name="options" size={32} color="#FFFFFF" />
          <Text style={styles.optionButtonText}>Effects</Text>
        </TouchableOpacity>
      </View>
      
      {/* Test section for demo purposes */}
      <View style={styles.testSection}>
        <Text style={[styles.testSectionTitle, { color: safeTheme.text }]}>
          🎉 New Feature: Audio Effects
        </Text>
        <Text style={[styles.testSectionDescription, { color: safeTheme.textSecondary }]}>
          Try our new professional audio effects panel with presets, real-time preview, and advanced controls.
        </Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            // Load a demo track if none is loaded
            if (!audioUri) {
              // Use a local demo track from assets
              const demoTrack = require('../../assets/audio/demo-track.mp3');
              loadAudio(demoTrack).then(success => {
                if (success) {
                  setActiveView('effects');
                } else {
                  // If demo track fails to load, show an alert
                  Alert.alert(
                    'Demo Track Unavailable',
                    'Please record or upload a track first to try the audio effects.',
                    [{ text: 'OK' }]
                  );
                }
              });
            } else {
              setActiveView('effects');
            }
          }}
        >
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Try Audio Effects</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {currentProject && (
        <View style={[styles.projectInfoContainer, { backgroundColor: safeTheme.cardBackgroundLight }]}>
          <Text style={[styles.projectInfoTitle, { color: safeTheme.text }]}>
            Current Project: {currentProject.name}
          </Text>
          <Text style={[styles.projectInfoDetail, { color: safeTheme.textSecondary }]}>
            Tracks: {currentProject.tracks.length}
          </Text>
          <Text style={[styles.projectInfoDetail, { color: safeTheme.textSecondary }]}>
            Last updated: {new Date(currentProject.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
  
  /**
   * Render the audio editor with a more modern design
   */
  const renderAudioEditor = () => (
    <View style={[styles.editorContainer, { backgroundColor: safeTheme.cardBackground }]}>
      <View style={styles.waveformContainer}>
        <AudioWaveform
          uri={audioUri}
          height={120}
          width="100%"
          color={safeTheme.tint}
          style={styles.waveform}
          onPress={seekTo}
          currentPosition={currentPosition}
          duration={audioDuration}
        />
        
        <View style={styles.positionIndicator} pointerEvents="none">
          <View 
            style={[
              styles.positionLine, 
              { 
                backgroundColor: safeTheme.tint,
                left: `${(currentPosition / audioDuration) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.controlsRow}>
        <Text style={[styles.timeText, { color: safeTheme.text }]}>
          {formatTime(currentPosition)}
        </Text>
        
        <TouchableOpacity 
          style={[styles.playButton, isPlaying ? styles.pauseButton : null]}
          onPress={togglePlayback}
          disabled={!audioUri || isProcessing}
        >
          <Ionicons 
            name={isBuffering ? "hourglass" : (isPlaying ? "pause" : "play")} 
            size={30} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        <Text style={[styles.timeText, { color: safeTheme.text }]}>
          {formatTime(audioDuration)}
        </Text>
      </View>
      
      <View style={styles.trackInfoContainer}>
        <Text style={[styles.sectionTitle, { color: safeTheme.text }]}>
          Track Information
        </Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: safeTheme.inputBackground, color: safeTheme.text }]}
          placeholder="Enter track title"
          placeholderTextColor={safeTheme.textSecondary}
          value={trackTitle}
          onChangeText={setTrackTitle}
        />
        
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: safeTheme.primary }]}
            onPress={() => setActiveView('record')}
          >
            <Ionicons name="mic" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Record</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: safeTheme.secondary }]}
            onPress={() => setActiveView('effects')}
          >
            <Ionicons name="options" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Effects</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: safeTheme.accent }]}
            onPress={() => saveTrack()}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
  
  /**
   * Render the audio effects screen
   * @returns {React.ReactElement} The audio effects component
   */
  const renderEffectsView = () => {
    return (
      <View style={[styles.editorContainer, { backgroundColor: safeTheme.cardBackground }]}>
        <ScrollView style={styles.effectsScrollView} contentContainerStyle={styles.effectsScrollContent}>
          <Text style={[styles.sectionTitle, { color: safeTheme.text }]}>
            Audio Effects
          </Text>
          
          <Text style={[styles.sectionDescription, { color: safeTheme.textSecondary }]}>
            Apply professional audio effects to your track
          </Text>
          
          {audioUri ? (
            <AudioEffectsPanel 
              audioUri={audioUri}
              onProcessed={(processedUri) => {
                // Update the audio URI with the processed version
                setAudioUri(processedUri);
                
                // Show success message
                Alert.alert(
                  'Effects Applied',
                  'Your audio has been processed successfully.',
                  [{ text: 'OK' }]
                );
              }}
              onError={(errorMessage) => {
                // Show error message
                setError(`Processing error: ${errorMessage}`);
              }}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons 
                name="musical-notes" 
                size={64} 
                color={isDark ? safeTheme.textSecondary : '#CCCCCC'} 
              />
              <Text style={[styles.emptyStateText, { color: safeTheme.text }]}>
                No audio loaded. Record or upload a track first.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: safeTheme.primary }]}
                  onPress={() => setActiveView('record')}
                >
                  <Ionicons name="mic" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Record</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: safeTheme.secondary }]}
                  onPress={() => setActiveView('upload')}
                >
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: safeTheme.secondary }]}
              onPress={() => setActiveView('editor')}
            >
              <Text style={styles.backButtonText}>Back to Editor</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };
  
  /**
   * Render the recording view
   * @returns {React.ReactElement} The recording component
   */
  const renderRecordingView = () => {
    return (
      <View style={[styles.recordingContainer, { backgroundColor: safeTheme.cardBackground }]}>
        <RecordingInterface 
          onRecordingComplete={(recordingUri) => {
            // Set the new audio URI
            setAudioUri(recordingUri);
            
            // Switch to the editor view
            setActiveView('editor');
          }}
          existingTrackUri={audioUri} // Pass the existing track URI for overdubbing
        />
      </View>
    );
  };
  
  // Main render method
  if (!user) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed" size={48} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.authTitle, isDark && styles.textLight]}>
            Sign In Required
          </Text>
          <Text style={[styles.authDescription, isDark && styles.textLight]}>
            Please sign in to access the studio features.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => {
              // Navigate to sign in screen
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, isDark && styles.textLight]}>
          Loading Studio...
        </Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={[styles.errorTitle, isDark && styles.textLight]}>
          Error
        </Text>
        <Text style={[styles.errorMessage, isDark && styles.textLight]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            loadCurrentProject();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {activeView === 'welcome' && renderWelcomeScreen()}
      
      {activeView === 'record' && (
        <RecordingInterface
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setActiveView('welcome')}
        />
      )}
      
      {activeView === 'upload' && (
        <TrackUploader
          onUploadComplete={handleUploadComplete}
          onCancel={() => setActiveView('welcome')}
        />
      )}
      
      {activeView === 'browse' && (
        <TrackBrowser
          onTrackSelect={handleTrackSelect}
          onCancel={() => setActiveView('welcome')}
        />
      )}
      
      {activeView === 'edit' && renderAudioEditor()}
      
      {activeView === 'effects' && renderEffectsView()}
      
      {activeView === 'recording' && renderRecordingView()}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textLight: {
    color: '#FFFFFF',
  },
  
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  optionButton: {
    width: width / 2 - 30,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    margin: 10,
  },
  optionButtonText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
  projectInfoContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  projectInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectInfoDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  // Auth prompt styles
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  authDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading and error styles
  loadingText: {
    fontSize: 18,
    color: '#000000',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Editor styles
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  waveformContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  waveform: {
    width: '100%',
    height: '100%',
  },
  positionIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  positionLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#007AFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  trackInfoContainer: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  effectsScrollView: {
    flex: 1,
  },
  effectsScrollContent: {
    padding: 20,
  },
  recordingContainer: {
    flex: 1,
    padding: 20,
  },
});

export default StudioInterface;



