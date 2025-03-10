import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Text,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import Colors from '@/constants/Colors';

interface EnhancedWaveformProps {
  audioUri: string;
  height?: number;
  onPlaybackComplete?: () => void;
  onPositionChange?: (position: number) => void;
  autoPlay?: boolean;
  showControls?: boolean;
  showTimeDisplay?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  style?: any;
}

/**
 * EnhancedWaveform Component
 * 
 * A professional, sleek audio waveform visualization with EQ-like display,
 * playback controls, and interactive scrubbing.
 * 
 * @param {string} audioUri - URI of the audio file to visualize
 * @param {number} height - Height of the waveform component
 * @param {function} onPlaybackComplete - Callback when playback completes
 * @param {function} onPositionChange - Callback when playback position changes
 * @param {boolean} autoPlay - Whether to start playback automatically
 * @param {boolean} showControls - Whether to show playback controls
 * @param {boolean} showTimeDisplay - Whether to show time display
 * @param {string} primaryColor - Primary color for the waveform
 * @param {string} secondaryColor - Secondary color for the waveform
 * @param {string} backgroundColor - Background color for the component
 * @param {object} style - Additional styles for the container
 * @returns {React.ReactElement} The EnhancedWaveform component
 */
const EnhancedWaveform: React.FC<EnhancedWaveformProps> = ({
  audioUri,
  height = 120,
  onPlaybackComplete,
  onPositionChange,
  autoPlay = false,
  showControls = true,
  showTimeDisplay = true,
  primaryColor = Colors.PRIMARY,
  secondaryColor = Colors.SECONDARY || '#FF9500',
  backgroundColor = 'transparent',
  style
}) => {
  // State
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const sound = useRef<Audio.Sound | null>(null);
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const playbackAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const containerRef = useRef<View>(null);
  const containerWidth = useRef(Dimensions.get('window').width - 32).current;
  const isUserSeeking = useRef(false);
  const visualizerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Theme
  const { isDark } = useTheme();
  
  // Load audio and generate waveform on mount
  useEffect(() => {
    if (audioUri) {
      loadAudio();
    }
    
    return () => {
      // Clean up
      if (sound.current) {
        sound.current.unloadAsync();
      }
      
      if (playbackAnimation.current) {
        playbackAnimation.current.stop();
      }
      
      if (visualizerInterval.current) {
        clearInterval(visualizerInterval.current);
      }
    };
  }, [audioUri]);
  
  // Update position when animatedPosition changes
  useEffect(() => {
    const listener = animatedPosition.addListener(({ value }) => {
      const newPosition = value * duration;
      setPosition(newPosition);
      
      if (!isUserSeeking.current && onPositionChange) {
        onPositionChange(newPosition);
      }
    });
    
    return () => animatedPosition.removeListener(listener);
  }, [animatedPosition, duration, onPositionChange]);
  
  // Load audio file
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Unload any previous sound
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      
      // Load the sound
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: autoPlay },
        onPlaybackStatusUpdate
      );
      
      sound.current = newSound;
      
      if (status.isLoaded) {
        if (status.durationMillis) {
          setDuration(status.durationMillis / 1000);
        }
        
        setIsPlaying(status.isPlaying);
        
        // Generate waveform data
        const waveformData = await generateWaveformData();
        setWaveformData(waveformData);
        
        // Start visualizer if playing
        if (status.isPlaying) {
          startVisualizer();
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio');
      setIsLoading(false);
    }
  };
  
  // Generate waveform data
  const generateWaveformData = async (): Promise<number[]> => {
    // In a real implementation, we would analyze the audio file
    // For now, we'll generate a realistic-looking waveform
    
    const sampleCount = 100;
    const waveform: number[] = [];
    
    // Create a natural-looking waveform with multiple sine waves
    for (let i = 0; i < sampleCount; i++) {
      const position = i / sampleCount;
      
      // Base wave (overall shape)
      const baseWave = Math.sin(position * Math.PI * 2) * 0.5 + 0.5;
      
      // Medium frequency details
      const mediumDetails = Math.sin(position * Math.PI * 8) * 0.25;
      
      // High frequency details
      const highDetails = Math.sin(position * Math.PI * 20) * 0.15;
      
      // Combine waves with some randomness for natural look
      const amplitude = 
        baseWave + 
        mediumDetails + 
        highDetails + 
        (Math.random() * 0.1);
      
      // Ensure value is between 0.1 and 1
      waveform.push(Math.max(0.1, Math.min(1, amplitude)));
    }
    
    return waveform;
  };
  
  // Generate frequency data for EQ visualization
  const generateFrequencyData = (): number[] => {
    // In a real implementation, we would use Web Audio API's analyser
    // For now, we'll generate realistic-looking frequency data
    
    const bandCount = 32;
    const freqData: number[] = [];
    
    // Base pattern that changes with position
    const positionFactor = position / duration;
    
    for (let i = 0; i < bandCount; i++) {
      const bandPosition = i / bandCount;
      
      // Create a frequency response curve
      // Lower frequencies (bass) on the left, higher on the right
      const bassCurve = Math.exp(-bandPosition * 3) * 0.8;
      const midCurve = Math.exp(-Math.pow(bandPosition - 0.5, 2) * 8) * 0.7;
      const trebleCurve = Math.exp(-Math.pow(bandPosition - 0.8, 2) * 6) * 0.6;
      
      // Combine curves
      let value = bassCurve + midCurve + trebleCurve;
      
      // Add time-based variation
      value *= 0.7 + 0.3 * Math.sin(positionFactor * Math.PI * 2 + bandPosition * 10);
      
      // Add randomness for realism
      value += Math.random() * 0.2;
      
      // Ensure value is between 0.05 and 1
      freqData.push(Math.max(0.05, Math.min(1, value)));
    }
    
    return freqData;
  };
  
  // Start frequency visualizer
  const startVisualizer = () => {
    if (visualizerInterval.current) {
      clearInterval(visualizerInterval.current);
    }
    
    // Update frequency data at 30fps
    visualizerInterval.current = setInterval(() => {
      if (isPlaying) {
        setFrequencyData(generateFrequencyData());
      }
    }, 33);
  };
  
  // Stop frequency visualizer
  const stopVisualizer = () => {
    if (visualizerInterval.current) {
      clearInterval(visualizerInterval.current);
      visualizerInterval.current = null;
    }
  };
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;
    
    // Update position if not seeking
    if (!isUserSeeking.current && status.positionMillis !== undefined) {
      const newPosition = status.positionMillis / 1000;
      const newProgress = newPosition / duration;
      
      // Only update if not currently scrubbing
      if (!animatedPosition._animation) {
        animatedPosition.setValue(newProgress);
      }
    }
    
    // Update playing state
    setIsPlaying(status.isPlaying);
    
    // Handle playback complete
    if (status.didJustFinish) {
      setIsPlaying(false);
      animatedPosition.setValue(0);
      stopVisualizer();
      
      if (onPlaybackComplete) {
        onPlaybackComplete();
      }
    }
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (!sound.current) return;
    
    try {
      if (isPlaying) {
        await sound.current.pauseAsync();
        stopVisualizer();
        
        if (playbackAnimation.current) {
          playbackAnimation.current.stop();
        }
      } else {
        await sound.current.playAsync();
        startVisualizer();
        startPlaybackAnimation();
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };
  
  // Start playback animation
  const startPlaybackAnimation = () => {
    if (playbackAnimation.current) {
      playbackAnimation.current.stop();
    }
    
    const currentProgress = animatedPosition._value;
    const remainingDuration = (1 - currentProgress) * duration * 1000;
    
    playbackAnimation.current = Animated.timing(animatedPosition, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });
    
    playbackAnimation.current.start();
  };
  
  // Handle seeking
  const handleSeek = (event: any) => {
    try {
      const { locationX } = event.nativeEvent;
      
      // Calculate progress (0-1)
      const progress = Math.max(0, Math.min(1, locationX / containerWidth));
      
      // Update animated value
      animatedPosition.setValue(progress);
      
      // Set seeking flag
      isUserSeeking.current = true;
      
      // Update sound position
      if (sound.current) {
        const newPosition = progress * duration * 1000;
        sound.current.setPositionAsync(newPosition).then(() => {
          // Reset seeking flag
          isUserSeeking.current = false;
          
          // If playing, restart animation from new position
          if (isPlaying) {
            startPlaybackAnimation();
          }
        });
      }
    } catch (err) {
      console.error('Error seeking:', err);
      isUserSeeking.current = false;
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render waveform bars
  const renderWaveform = () => {
    if (waveformData.length === 0) {
      // Return placeholder if no data
      return Array.from({ length: 50 }, (_, i) => (
        <View
          key={`placeholder-${i}`}
          style={[
            styles.waveformBar,
            {
              height: `${20 + Math.random() * 30}%`,
              backgroundColor: isDark ? '#444' : '#e0e0e0',
            },
          ]}
        />
      ));
    }
    
    const progressWidth = animatedPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, containerWidth],
    });
    
    return (
      <>
        {/* Progress overlay */}
        <Animated.View
          style={[
            styles.progressOverlay,
            {
              width: progressWidth,
              backgroundColor: 'rgba(0,0,0,0.1)',
            },
          ]}
        />
        
        {/* Waveform bars */}
        {waveformData.map((value, index) => {
          const barPosition = (index / waveformData.length) * containerWidth;
          
          // Determine if this bar is before or after the current position
          const isBeforePosition = barPosition < (position / duration) * containerWidth;
          
          return (
            <View
              key={`waveform-${index}`}
              style={[
                styles.waveformBar,
                {
                  height: `${value * 70}%`,
                  backgroundColor: isBeforePosition ? primaryColor : isDark ? '#555' : '#e0e0e0',
                },
              ]}
            />
          );
        })}
        
        {/* Position indicator */}
        <Animated.View
          style={[
            styles.positionIndicator,
            {
              left: progressWidth,
              backgroundColor: secondaryColor,
            },
          ]}
        />
      </>
    );
  };
  
  // Render frequency visualizer (EQ)
  const renderFrequencyVisualizer = () => {
    if (frequencyData.length === 0) {
      // Generate initial frequency data if empty
      const initialData = Array.from({ length: 32 }, () => 0.1);
      return renderFrequencyBars(initialData);
    }
    
    return renderFrequencyBars(frequencyData);
  };
  
  // Render frequency bars
  const renderFrequencyBars = (data: number[]) => {
    return (
      <View style={styles.frequencyContainer}>
        {data.map((value, index) => (
          <View
            key={`freq-${index}`}
            style={[
              styles.frequencyBar,
              {
                height: `${value * 100}%`,
                backgroundColor: primaryColor,
              },
            ]}
          >
            <LinearGradient
              colors={[
                `${primaryColor}00`,
                primaryColor,
                secondaryColor,
              ]}
              style={styles.frequencyGradient}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
            />
          </View>
        ))}
      </View>
    );
  };
  
  // Render time display
  const renderTimeDisplay = () => {
    if (!showTimeDisplay) return null;
    
    return (
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
          {formatTime(position)}
        </Text>
        <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
          {formatTime(duration)}
        </Text>
      </View>
    );
  };
  
  // Render controls
  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <View style={styles.controlsContainer}>
        <TouchableWithoutFeedback onPress={togglePlayback}>
          <View style={styles.playButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };
  
  // Main render
  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        { height, backgroundColor },
        isDark && styles.containerDark,
        style,
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={handleSeek}>
          <View style={styles.waveformContainer}>
            {/* Frequency visualizer (EQ) */}
            {renderFrequencyVisualizer()}
            
            {/* Waveform */}
            <View style={styles.waveformContent}>
              {renderWaveform()}
            </View>
            
            {/* Time display */}
            {renderTimeDisplay()}
            
            {/* Controls */}
            {renderControls()}
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#FF3B30',
    fontSize: 14,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  waveformContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 1,
  },
  positionIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    zIndex: 2,
  },
  frequencyContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  frequencyBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  frequencyGradient: {
    flex: 1,
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  timeTextDark: {
    color: '#aaa',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 3,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default EnhancedWaveform; 