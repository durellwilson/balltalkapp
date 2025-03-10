import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Colors from '@/constants/Colors';
import { Text } from '../themed';

interface PodcastPlayerProps {
  title: string;
  author: string;
  imageUri: string;
  audioUri: string;
  duration?: number; // in seconds
  onClose?: () => void;
  compact?: boolean;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  title,
  author,
  imageUri,
  audioUri,
  duration = 0,
  onClose,
  compact = false,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [error, setError] = useState<string | null>(null);

  // Load sound on component mount
  useEffect(() => {
    loadAudio();

    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  // Load audio file
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load audio', err);
      setError('Failed to load audio');
      setIsLoading(false);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Encountered error: ${status.error}`);
        setError(`Error: ${status.error}`);
      }
      return;
    }

    setPosition(status.positionMillis / 1000);
    
    if (status.durationMillis) {
      setAudioDuration(status.durationMillis / 1000);
    }

    setIsPlaying(status.isPlaying);
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      console.error('Failed to toggle play/pause', err);
      setError('Failed to play audio');
    }
  };

  // Seek to position
  const seekAudio = async (value: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(value * 1000);
    } catch (err) {
      console.error('Failed to seek', err);
    }
  };

  // Skip forward 15 seconds
  const skipForward = async () => {
    if (!sound) return;

    try {
      const newPosition = Math.min(position + 15, audioDuration);
      await sound.setPositionAsync(newPosition * 1000);
    } catch (err) {
      console.error('Failed to skip forward', err);
    }
  };

  // Skip backward 15 seconds
  const skipBackward = async () => {
    if (!sound) return;

    try {
      const newPosition = Math.max(position - 15, 0);
      await sound.setPositionAsync(newPosition * 1000);
    } catch (err) {
      console.error('Failed to skip backward', err);
    }
  };

  // Format time in seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render compact player
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Image source={{ uri: imageUri }} style={styles.compactImage} />
        
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.compactAuthor} numberOfLines={1}>{author}</Text>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : error ? (
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
        ) : (
          <TouchableOpacity onPress={togglePlayPause} style={styles.compactPlayButton}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={24} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
        )}
        
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.compactCloseButton}>
            <Ionicons name="close" size={20} color={Colors.neutral600} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render full player
  return (
    <View style={styles.container}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.neutral600} />
        </TouchableOpacity>
      )}

      <Image source={{ uri: imageUri }} style={styles.image} />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.author}>{author}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={audioDuration}
              value={position}
              onSlidingComplete={seekAudio}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.neutral400}
              thumbTintColor={Colors.primary}
              disabled={isLoading}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={skipBackward}
              disabled={isLoading}
            >
              <Ionicons name="play-back" size={24} color={Colors.neutral700} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playPauseButton} 
              onPress={togglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color="white" 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={skipForward}
              disabled={isLoading}
            >
              <Ionicons name="play-forward" size={24} color={Colors.neutral700} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackgroundLight,
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 8,
    height: 60,
  },
  compactImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  compactContent: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  compactAuthor: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  compactPlayButton: {
    padding: 8,
  },
  compactCloseButton: {
    padding: 8,
  },
});

export default PodcastPlayer; 