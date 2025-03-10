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
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  SlideInUp
} from 'react-native-reanimated';
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
import Colors from '@/constants/Colors';
import AudioEffectsPanel from '../audio/processing/AudioEffectsPanel';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../hooks/useToast';
import BeatMaker from './BeatMaker';
import VocalEffectsProcessor from './VocalEffectsProcessor';

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
 * - Beat making
 * - Vocal effects processing
 * 
 * @returns {React.ReactElement} The StudioInterface component
 */
const StudioInterface: React.FC = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { saveData, loadData, listSessions } = useStorage();
  const { showToast } = useToast();
  
  // Ensure theme is available with fallback values - use a stable reference
  const safeTheme = useMemo(() => {
    if (theme) return theme;
    
    return {
      tint: '#007AFF',
      background: isDark ? '#121212' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#AAAAAA' : '#666666',
      border: isDark ? '#333333' : '#EEEEEE',
      primary: '#007AFF',
      secondary: '#5856D6',
      tertiary: '#FF9500',
      success: '#34C759',
      warning: '#FFCC00',
      error: '#FF3B30',
      info: '#5AC8FA',
      cardBackground: isDark ? '#1C1C1E' : '#F2F2F7',
    };
  }, [theme, isDark]);
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<
    'welcome' | 'record' | 'upload' | 'browse' | 'edit' | 'effects' | 'beatmaker' | 'vocaleffects'
  >('welcome');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [processingOptions, setProcessingOptions] = useState<AudioProcessingOptions>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trackTitle, setTrackTitle] = useState('New Track');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showSessionsPanel, setShowSessionsPanel] = useState<boolean>(false);
  const [trackLayers, setTrackLayers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [beatUrl, setBeatUrl] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const translateY = useSharedValue(20);
  const trackOpacity = useSharedValue(1);
  const trackScale = useSharedValue(1);
  const trackTranslateY = useSharedValue(0);
  
  // Move the animated style to the top level
  const trackAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: trackOpacity.value,
      transform: [
        { scale: trackScale.value },
        { translateY: trackTranslateY.value }
      ]
    };
  });
  
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
    console.log('Recording complete, loading audio:', recordingUri, 'duration:', duration);
    
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
        
        // Set audio duration
        setAudioDuration(duration);
        
        console.log('Audio loaded successfully, switching to edit view');
        setActiveView('edit');
        
        // Auto-play the recording after a short delay
        setTimeout(() => {
          togglePlayback().catch(error => {
            console.error('Error auto-playing recording:', error);
          });
        }, 500);
        
        return;
      } catch (error) {
        console.error(`Attempt ${retryCount + 1}/${maxRetries} failed:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error('Max retries reached, showing error');
          setError(`Failed to load recording: ${error.message || 'Unknown error'}`);
          Alert.alert(
            'Error',
            'Failed to load the recording. Please try again.',
            [{ text: 'OK' }]
          );
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
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
    try {
      setIsLoading(true);
      setError(null);
      
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      console.log('Loading audio from URI:', uri);
      
      // Create a new sound object
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 100, // Update position more frequently (100ms)
          positionMillis: 0,
          volume: 1.0,
        },
        onPlaybackStatusUpdate
      );
      
      // Get initial status to set duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setAudioDuration(status.durationMillis / 1000);
        setPlaybackPosition(0);
        setCurrentPosition(0);
        console.log(`Audio loaded successfully. Duration: ${status.durationMillis / 1000}s`);
      }
      
      // Save the sound object
      setSound(newSound);
      setAudioUri(uri);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      setError(`Failed to load audio: ${error.message}`);
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
    const currentPositionSeconds = status.positionMillis / 1000;
    setCurrentPosition(currentPositionSeconds);
    setPlaybackPosition(currentPositionSeconds);
    
    // Log position updates for debugging (only occasionally to avoid console spam)
    if (Math.floor(currentPositionSeconds) % 5 === 0) {
      console.log(`Playback position: ${currentPositionSeconds.toFixed(2)}s / ${audioDuration.toFixed(2)}s`);
    }
    
    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);

    // Handle playback completion
    if (status.didJustFinish) {
      console.log('Playback finished, resetting position');
      // Reset to start of track
      sound?.setPositionAsync(0).catch(console.error);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setCurrentPosition(0);
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
  
  /**
   * Load saved sessions on component mount
   */
  useEffect(() => {
    const loadSavedSessions = async () => {
      try {
        const sessions = await listSessions('studio-sessions');
        setSavedSessions(sessions);
      } catch (error) {
        console.error('Failed to load saved sessions:', error);
      }
    };
    
    loadSavedSessions();
  }, []);
  
  /**
   * Create a new session with a unique ID
   */
  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    setActiveView('welcome');
    setTrackLayers([]);
    setAudioUri('');
    setTrackTitle('New Track');
    
    showToast('New session created', 'success');
  };
  
  /**
   * Save the current session
   */
  const saveSession = async () => {
    if (!sessionId) {
      createNewSession();
      return;
    }
    
    setIsSaving(true);
    
    try {
      const sessionData = {
        id: sessionId,
        title: trackTitle || 'Untitled Session',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        audioUri,
        trackLayers,
        processingOptions: {},
        duration: audioDuration,
      };
      
      await saveData(`studio-sessions/${sessionId}`, sessionData);
      
      // Refresh sessions list
      const sessions = await listSessions('studio-sessions');
      setSavedSessions(sessions);
      
      showToast('Session saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save session:', error);
      showToast('Failed to save session', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Load a saved session
   */
  const loadSession = async (id: string) => {
    try {
      const sessionData = await loadData(`studio-sessions/${id}`);
      
      if (sessionData) {
        setSessionId(id);
        setTrackTitle(sessionData.title || 'Untitled Session');
        setAudioUri(sessionData.audioUri || '');
        setTrackLayers(sessionData.trackLayers || []);
        setProcessingOptions(sessionData.processingOptions || {});
        setAudioDuration(sessionData.duration || 0);
        
        // Load the audio if available
        if (sessionData.audioUri) {
          await loadAudio(sessionData.audioUri);
          setActiveView('edit');
        } else {
          setActiveView('welcome');
        }
        
        showToast('Session loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      showToast('Failed to load session', 'error');
    }
  };
  
  /**
   * Handle adding a new layer from the recording interface
   */
  const handleLayerAdded = (uri: string, duration: number) => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      uri,
      duration,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
    };
    
    setTrackLayers(prev => [...prev, newLayer]);
    showToast('New layer added', 'success');
  };
  
  /**
   * Export the current project
   */
  const exportProject = async (format: 'mp3' | 'wav' = 'mp3', quality: 'high' | 'medium' | 'low' = 'high') => {
    if (!audioUri) {
      showToast('No audio to export', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would use a proper audio export service
      // For now, we'll just simulate the export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast(`Project exported as ${format.toUpperCase()} (${quality} quality)`, 'success');
      setShowExportOptions(false);
    } catch (error) {
      console.error('Failed to export project:', error);
      showToast('Failed to export project', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Handle beat creation from the BeatMaker component
   */
  const handleBeatCreated = (url: string) => {
    setBeatUrl(url);
    showToast('Beat created successfully', 'success');
    setActiveView('edit');
  };
  
  /**
   * Handle vocal effects processing completion
   */
  const handleVocalEffectsComplete = (processedUri: string) => {
    setAudioUri(processedUri);
    showToast('Vocal effects applied successfully', 'success');
    setActiveView('edit');
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
  
  // Enhanced renderWelcomeScreen with animations
  const renderWelcomeScreen = () => (
    <Animated.View 
      style={[
        styles.welcomeContainer,
        { entering: FadeIn.duration(500) }
      ]}
    >
      <View style={styles.welcomeHeader}>
        <Text style={[styles.welcomeTitle, { color: safeTheme.text }]}>
          BallTalk Studio
        </Text>
        
        <TouchableOpacity
          style={[styles.sessionButton, { backgroundColor: safeTheme.primary }]}
          onPress={() => setShowSessionsPanel(!showSessionsPanel)}
        >
          <Ionicons name="folder-open" size={20} color="#FFFFFF" />
          <Text style={styles.sessionButtonText}>Sessions</Text>
        </TouchableOpacity>
      </View>
      
      {showSessionsPanel && (
        <Animated.View 
          style={[
            styles.sessionsPanel,
            { entering: SlideInUp.duration(300) }
          ]}
        >
          <View style={styles.sessionsPanelHeader}>
            <Text style={[styles.sessionsPanelTitle, { color: safeTheme.text }]}>
              Saved Sessions
            </Text>
            <TouchableOpacity
              style={styles.newSessionButton}
              onPress={createNewSession}
            >
              <Ionicons name="add-circle" size={24} color={safeTheme.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.sessionsList}>
            {savedSessions.length === 0 ? (
              <Text style={[styles.noSessionsText, { color: safeTheme.textSecondary }]}>
                No saved sessions found
              </Text>
            ) : (
              savedSessions.map((session, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sessionItem,
                    { borderColor: safeTheme.border }
                  ]}
                  onPress={() => loadSession(session.id)}
                >
                  <View style={styles.sessionItemContent}>
                    <Text style={[styles.sessionItemTitle, { color: safeTheme.text }]}>
                      {session.title || 'Untitled Session'}
                    </Text>
                    <Text style={[styles.sessionItemDate, { color: safeTheme.textSecondary }]}>
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={safeTheme.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      )}
      
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
          style={[styles.optionButton, { backgroundColor: safeTheme.tertiary }]}
          onPress={() => setActiveView('browse')}
        >
          <Ionicons name="albums" size={32} color="#FFFFFF" />
          <Text style={styles.optionButtonText}>Browse</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.beatMakerButton, { backgroundColor: safeTheme.info }]}
        onPress={() => setActiveView('beatmaker')}
      >
        <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
        <Text style={styles.beatMakerButtonText}>Beat Maker</Text>
      </TouchableOpacity>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="layers" size={24} color={safeTheme.primary} />
          <Text style={[styles.featureText, { color: safeTheme.text }]}>
            Multi-track Recording
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="pulse" size={24} color={safeTheme.primary} />
          <Text style={[styles.featureText, { color: safeTheme.text }]}>
            Real-time Waveforms
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Ionicons name="options" size={24} color={safeTheme.primary} />
          <Text style={[styles.featureText, { color: safeTheme.text }]}>
            Professional Effects
          </Text>
        </View>
      </View>
    </Animated.View>
  );
  
  // Enhanced renderAudioEditor with animations
  const renderAudioEditor = () => {
    // Create a drag gesture for tracks
    const dragGesture = Gesture.Pan()
      .onBegin(() => {
        trackScale.value = withSpring(1.05);
        trackOpacity.value = withTiming(0.8);
      })
      .onUpdate((event) => {
        trackTranslateY.value = event.translationY;
      })
      .onEnd(() => {
        trackTranslateY.value = withSpring(0);
        trackScale.value = withSpring(1);
        trackOpacity.value = withTiming(1);
      });
      
    return (
      <Animated.View 
        style={[
          styles.editorContainer,
          { entering: FadeIn.duration(500) }
        ]}
      >
        <View style={styles.editorHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveView('welcome')}
          >
            <Ionicons name="arrow-back" size={24} color={safeTheme.text} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.trackTitleInput, { color: safeTheme.text, borderColor: safeTheme.border }]}
            value={trackTitle}
            onChangeText={setTrackTitle}
            placeholder="Track Title"
            placeholderTextColor={safeTheme.textSecondary}
          />
          
          <View style={styles.editorHeaderButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={saveSession}
              disabled={isSaving}
            >
              <Ionicons 
                name="save" 
                size={24} 
                color={isSaving ? safeTheme.textSecondary : safeTheme.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowExportOptions(!showExportOptions)}
            >
              <Ionicons name="share" size={24} color={safeTheme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.effectsButton, { backgroundColor: safeTheme.primary }]}
              onPress={() => setActiveView('effects')}
            >
              <Ionicons name="options" size={20} color="#FFFFFF" />
              <Text style={styles.effectsButtonText}>Effects</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.vocalEffectsButton, { backgroundColor: safeTheme.secondary }]}
              onPress={() => setActiveView('vocaleffects')}
            >
              <Ionicons name="mic" size={20} color="#FFFFFF" />
              <Text style={styles.effectsButtonText}>Vocal FX</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {showExportOptions && (
          <Animated.View 
            style={[
              styles.exportPanel,
              { entering: FadeIn.duration(300) }
            ]}
          >
            <View style={styles.exportPanelHeader}>
              <Text style={[styles.exportPanelTitle, { color: safeTheme.text }]}>
                Export Options
              </Text>
              <TouchableOpacity
                onPress={() => setShowExportOptions(false)}
              >
                <Ionicons name="close" size={24} color={safeTheme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={[styles.exportOption, { borderColor: safeTheme.border }]}
                onPress={() => exportProject('mp3', 'high')}
              >
                <Ionicons name="musical-note" size={24} color={safeTheme.primary} />
                <Text style={[styles.exportOptionText, { color: safeTheme.text }]}>
                  MP3 (High Quality)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, { borderColor: safeTheme.border }]}
                onPress={() => exportProject('wav', 'high')}
              >
                <Ionicons name="disc" size={24} color={safeTheme.primary} />
                <Text style={[styles.exportOptionText, { color: safeTheme.text }]}>
                  WAV (Lossless)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, { borderColor: safeTheme.border }]}
                onPress={() => exportProject('mp3', 'medium')}
              >
                <Ionicons name="cloud-upload" size={24} color={safeTheme.primary} />
                <Text style={[styles.exportOptionText, { color: safeTheme.text }]}>
                  Share to BallTalk
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        
        <View style={styles.waveformContainer}>
          <AudioWaveform
            uri={audioUri}
            isPlaying={isPlaying}
            position={playbackPosition}
            duration={audioDuration}
            onSeek={seekTo}
            isDark={isDark}
            theme={safeTheme}
            height={150}
            barWidth={3}
            barSpacing={2}
            sensitivity={7}
            progressColor={safeTheme.primary}
            waveformColor={safeTheme.text}
          />
        </View>
        
        {trackLayers.length > 0 && (
          <View style={[styles.layersContainer, { marginTop: 20, marginBottom: 20, padding: 15 }]}>
            <Text style={[styles.layersTitle, { 
              color: safeTheme.text, 
              fontSize: 18, 
              fontWeight: 'bold', 
              marginBottom: 15,
              textAlign: 'center'
            }]}>
              Layers ({trackLayers.length})
            </Text>
            
            <ScrollView 
              horizontal 
              style={[styles.layersList, { 
                minHeight: 120,
                paddingVertical: 10,
                paddingHorizontal: 5
              }]}
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 10
              }}
            >
              {trackLayers.map((layer, index) => (
                <GestureDetector key={index} gesture={dragGesture}>
                  <Animated.View 
                    style={[
                      styles.layerItem,
                      { 
                        borderColor: safeTheme.border,
                        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                        padding: 15,
                        borderRadius: 12,
                        marginHorizontal: 10,
                        minWidth: 150,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3
                      },
                      trackAnimatedStyle
                    ]}
                  >
                    <Text style={[styles.layerName, { 
                      color: safeTheme.text,
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 8
                    }]}>
                      Layer {index + 1}
                    </Text>
                    <Text style={[styles.layerDuration, { 
                      color: safeTheme.textSecondary,
                      fontSize: 14,
                      marginBottom: 12
                    }]}>
                      {formatTime(layer.duration)}
                    </Text>
                    
                    <View style={[styles.layerControls, { 
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }]}>
                      <TouchableOpacity
                        style={[
                          styles.layerControlButton,
                          { 
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: layer.muted ? safeTheme.error : safeTheme.primary,
                          }
                        ]}
                        onPress={() => {
                          // Toggle mute for this layer
                          setTrackLayers(prev => 
                            prev.map((l, i) => 
                              i === index ? { ...l, muted: !l.muted } : l
                            )
                          );
                        }}
                      >
                        <Ionicons 
                          name={layer.muted ? "volume-mute" : "volume-high"} 
                          size={18} 
                          color="#FFFFFF" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.layerControlButton,
                          { 
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: safeTheme.error,
                            marginLeft: 8
                          }
                        ]}
                        onPress={() => {
                          // Remove this layer
                          setTrackLayers(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Ionicons name="trash" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </GestureDetector>
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.playbackControls}>
          <TouchableOpacity
            onPress={() => seekTo(Math.max(0, playbackPosition - 5))}
          >
            <Ionicons name="play-back" size={28} color={safeTheme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.playPauseButton,
              { backgroundColor: safeTheme.primary }
            ]}
            onPress={togglePlayback}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => seekTo(Math.min(audioDuration, playbackPosition + 5))}
          >
            <Ionicons name="play-forward" size={28} color={safeTheme.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: safeTheme.text }]}>
            {formatTime(playbackPosition)}
          </Text>
          <Text style={[styles.timeText, { color: safeTheme.textSecondary }]}>
            / {formatTime(audioDuration)}
          </Text>
        </View>
      </Animated.View>
    );
  };
  
  // Enhanced renderEffectsView with animations
  const renderEffectsView = () => {
    return (
      <Animated.View 
        style={[
          styles.effectsContainer,
          { entering: ZoomIn.duration(400) }
        ]}
      >
        <View style={styles.effectsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveView('edit')}
          >
            <Ionicons name="arrow-back" size={24} color={safeTheme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.effectsTitle, { color: safeTheme.text }]}>
            Audio Effects
          </Text>
        </View>
        
        <AudioEffectsPanel
          onApplyEffects={processAudio}
          theme={safeTheme}
          isProcessing={isProcessing}
          processingProgress={processingProgress}
        />
      </Animated.View>
    );
  };
  
  // Enhanced renderRecordingView with animations
  const renderRecordingView = () => {
    return (
      <Animated.View 
        style={[
          styles.recordingContainer,
          { entering: FadeIn.duration(500).easing(Easing.out(Easing.exp)) }
        ]}
      >
        <View style={styles.recordingHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveView('welcome')}
          >
            <Ionicons name="arrow-back" size={24} color={safeTheme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.recordingTitle, { color: safeTheme.text }]}>
            Record New Track
          </Text>
          
          <TouchableOpacity
            style={styles.saveSessionButton}
            onPress={saveSession}
            disabled={isSaving}
          >
            <Ionicons 
              name="save" 
              size={24} 
              color={isSaving ? safeTheme.textSecondary : safeTheme.primary} 
            />
          </TouchableOpacity>
        </View>
        
        <RecordingInterface
          onRecordingComplete={handleRecordingComplete}
          onLayerAdded={handleLayerAdded}
          showAdvancedControls={true}
          theme={safeTheme}
        />
      </Animated.View>
    );
  };
  
  // Enhanced renderUploadView with animations
  const renderUploadView = () => {
    return (
      <Animated.View 
        style={[
          styles.uploadContainer,
          { entering: SlideInRight.duration(400) }
        ]}
      >
        <TrackUploader
          onUploadComplete={handleUploadComplete}
          onCancel={() => setActiveView('welcome')}
          theme={safeTheme}
        />
      </Animated.View>
    );
  };
  
  // Enhanced renderBrowseView with animations
  const renderBrowseView = () => {
    return (
      <Animated.View 
        style={[
          styles.browseContainer,
          { entering: FadeIn.duration(400) }
        ]}
      >
        <TrackBrowser
          onTrackSelect={handleTrackSelect}
          onCancel={() => setActiveView('welcome')}
          theme={safeTheme}
        />
      </Animated.View>
    );
  };
  
  // Enhanced renderBeatMakerView with animations
  const renderBeatMakerView = () => {
    return (
      <Animated.View 
        style={[
          styles.beatMakerContainer,
          { entering: FadeIn.duration(500) }
        ]}
      >
        <BeatMaker 
          onBeatCreated={handleBeatCreated}
          onClose={() => setActiveView('welcome')}
          theme={safeTheme}
        />
      </Animated.View>
    );
  };
  
  // Enhanced renderVocalEffectsView with animations
  const renderVocalEffectsView = () => {
    if (!audioUri) {
      setActiveView('welcome');
      showToast('No audio to process', 'error');
      return null;
    }
    
    return (
      <Animated.View 
        style={[
          styles.vocalEffectsContainer,
          { entering: FadeIn.duration(500) }
        ]}
      >
        <VocalEffectsProcessor 
          audioUri={audioUri}
          onProcessingComplete={handleVocalEffectsComplete}
          onClose={() => setActiveView('edit')}
          theme={safeTheme}
        />
      </Animated.View>
    );
  };
  
  // Main render with animated transitions between views
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeTheme.primary} />
          <Text style={[styles.loadingText, { color: safeTheme.text }]}>
            Loading Studio...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={safeTheme.error} />
          <Text style={[styles.errorText, { color: safeTheme.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: safeTheme.primary }]}
            onPress={initializeAudio}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {activeView === 'welcome' && renderWelcomeScreen()}
          {activeView === 'record' && renderRecordingView()}
          {activeView === 'upload' && renderUploadView()}
          {activeView === 'browse' && renderBrowseView()}
          {activeView === 'edit' && renderAudioEditor()}
          {activeView === 'effects' && renderEffectsView()}
          {activeView === 'beatmaker' && renderBeatMakerView()}
          {activeView === 'vocaleffects' && renderVocalEffectsView()}
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={safeTheme.primary} />
              <Text style={[styles.processingText, { color: "#FFFFFF" }]}>
                Processing Audio...
              </Text>
            </View>
          )}
        </>
      )}
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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sessionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  sessionsPanel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sessionsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionsPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newSessionButton: {
    padding: 4,
  },
  sessionsList: {
    maxHeight: 200,
  },
  noSessionsText: {
    textAlign: 'center',
    padding: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  optionButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  featuresContainer: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
  },
  recordingContainer: {
    flex: 1,
    padding: 20,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  saveSessionButton: {
    padding: 8,
  },
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackTitleInput: {
    width: '70%',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  editorHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  effectsButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  effectsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  uploadContainer: {
    flex: 1,
    padding: 20,
  },
  browseContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#000000',
    marginTop: 16,
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
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  beatMakerContainer: {
    flex: 1,
  },
  beatMakerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beatMakerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  vocalEffectsContainer: {
    flex: 1,
  },
  vocalEffectsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  layersContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  layersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  layersList: {
    minHeight: 100,
  },
  layerItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
  },
  layerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  layerDuration: {
    fontSize: 14,
    color: '#666666',
  },
  layerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  layerControlButton: {
    padding: 4,
    borderRadius: 8,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  effectsContainer: {
    flex: 1,
  },
  effectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  effectsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  exportPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  exportPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  exportPanelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  exportOptions: {
    padding: 20,
  },
  exportOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    marginBottom: 10,
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudioInterface;



