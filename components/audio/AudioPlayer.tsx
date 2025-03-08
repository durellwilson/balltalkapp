import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface AudioPlayerProps {
  uri: string;
  title?: string;
  duration?: number;
  onError?: (error: any) => void;
  autoPlay?: boolean;
  showControls?: boolean;
  testID?: string;
}

export default function AudioPlayer({ 
  uri, 
  title, 
  duration: initialDuration,
  onError, 
  autoPlay = false,
  showControls = true,
  testID = 'audio-player'
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs for timers
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load sound on mount or when URI changes
  useEffect(() => {
    let isMounted = true;
    
    const loadSound = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Unload previous sound if exists
        if (sound) {
          await sound.unloadAsync();
        }
        
        console.log(`[AudioPlayer] Loading sound from URI: ${uri}`);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { 
            shouldPlay: autoPlay, 
            progressUpdateIntervalMillis: 100 
          },
          onPlaybackStatusUpdate
        );
        
        if (isMounted) {
          setSound(newSound);
          setIsLoading(false);
          if (autoPlay) setIsPlaying(true);
        }
      } catch (err) {
        console.error('[AudioPlayer] Error loading sound:', err);
        if (isMounted) {
          setError(`Failed to load audio file${retryCount > 0 ? ' after ' + retryCount + ' retries' : ''}`);
          setIsLoading(false);
        }
        if (onError) onError(err);
      }
    };
    
    if (uri) {
      loadSound();
    } else {
      setError('No audio URI provided');
      setIsLoading(false);
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }
      if (sound) {
        sound.unloadAsync().catch(err => 
          console.error('[AudioPlayer] Error unloading sound during cleanup:', err)
        );
      }
    };
  }, [uri, retryCount, autoPlay]);

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      return;
    }
    
    // Don't update position while user is seeking
    if (!isSeeking) {
      setPosition(status.positionMillis / 1000);
    }
    
    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    } else if (initialDuration) {
      setDuration(initialDuration);
    }
    
    setIsPlaying(status.isPlaying);
    
    // Handle playback end
    if (status.didJustFinish) {
      setIsPlaying(false);
      // Reset position to start
      sound?.setPositionAsync(0).catch(err => 
        console.error('[AudioPlayer] Error resetting position on finish:', err)
      );
    }
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      console.error('[AudioPlayer] Error toggling playback:', err);
      setError('Failed to play audio');
      if (onError) onError(err);
    }
  };

  // Seek to position
  const seekTo = async (seconds: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(Math.floor(seconds * 1000));
    } catch (err) {
      console.error('[AudioPlayer] Error seeking:', err);
      if (onError) onError(err);
    }
  };

  // Retry loading after error
  const retryLoading = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading audio...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.container} testID={`${testID}-error`}>
        <MaterialIcons name="error-outline" size={32} color="#ff4757" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={retryLoading}
          testID={`${testID}-retry-button`}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Minimal player without controls
  if (!showControls) {
    return (
      <View style={styles.miniContainer} testID={testID}>
        {title && <Text style={styles.miniTitle} numberOfLines={1}>{title}</Text>}
        <TouchableOpacity
          style={styles.miniPlayButton}
          onPress={togglePlayback}
          testID={`${testID}-play-button`}
        >
          <MaterialIcons
            name={isPlaying ? "pause" : "play-arrow"}
            size={24}
            color="#1e90ff"
          />
        </TouchableOpacity>
      </View>
    );
  }

  // Full player with controls
  return (
    <View style={styles.container} testID={testID}>
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText} testID={`${testID}-position`}>{formatTime(position)}</Text>
        <Text style={styles.timeText} testID={`${testID}-duration`}>{formatTime(duration)}</Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={position}
        minimumTrackTintColor="#1e90ff"
        maximumTrackTintColor="#dfe4ea"
        thumbTintColor="#1e90ff"
        onSlidingStart={() => setIsSeeking(true)}
        onSlidingComplete={(value) => {
          seekTo(value);
          setIsSeeking(false);
        }}
        onValueChange={(value) => {
          if (isSeeking) {
            setPosition(value);
          }
        }}
        testID={`${testID}-slider`}
      />
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.rewindButton} 
          onPress={() => seekTo(Math.max(0, position - 10))}
          testID={`${testID}-rewind-button`}
        >
          <MaterialIcons name="replay-10" size={24} color="#747d8c" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={togglePlayback}
          disabled={!sound}
          testID={`${testID}-play-button`}
        >
          <MaterialIcons 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={32} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.forwardButton} 
          onPress={() => seekTo(Math.min(duration, position + 10))}
          testID={`${testID}-forward-button`}
        >
          <MaterialIcons name="forward-10" size={24} color="#747d8c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  miniTitle: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
    marginRight: 8,
  },
  miniPlayButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f1f2f6',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2d3436',
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#747d8c',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '80%',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e90ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  rewindButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#747d8c',
  },
  errorText: {
    color: '#ff4757',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    padding: 8,
    backgroundColor: '#f1f2f6',
    borderRadius: 5,
  },
  retryText: {
    color: '#1e90ff',
    fontWeight: 'bold',
  },
}); 