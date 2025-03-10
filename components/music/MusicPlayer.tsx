import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { Text } from '../themed';

interface MusicPlayerProps {
  title: string;
  artist: string;
  albumArt: string;
  audioUri: string;
  duration?: number; // in seconds
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  compact?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  title,
  artist,
  albumArt,
  audioUri,
  duration = 0,
  onClose,
  onNext,
  onPrevious,
  compact = false,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);

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
        { shouldPlay: false, volume },
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

    // Auto-advance to next track when finished
    if (status.didJustFinish && onNext) {
      onNext();
    }
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

  // Set volume
  const changeVolume = async (value: number) => {
    setVolume(value);
    
    if (!sound) return;

    try {
      await sound.setVolumeAsync(value);
    } catch (err) {
      console.error('Failed to change volume', err);
    }
  };

  // Toggle like
  const toggleLike = () => {
    setIsLiked(!isLiked);
    // In a real app, you would save this to a database
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
        <Image source={{ uri: albumArt }} style={styles.compactImage} />
        
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.compactArtist} numberOfLines={1}>{artist}</Text>
        </View>
        
        <View style={styles.compactControls}>
          {onPrevious && (
            <TouchableOpacity onPress={onPrevious} style={styles.compactButton}>
              <Ionicons name="play-skip-back" size={20} color={Colors.neutral700} />
            </TouchableOpacity>
          )}
          
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : error ? (
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
          ) : (
            <TouchableOpacity onPress={togglePlayPause} style={styles.compactPlayButton}>
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          )}
          
          {onNext && (
            <TouchableOpacity onPress={onNext} style={styles.compactButton}>
              <Ionicons name="play-skip-forward" size={20} color={Colors.neutral700} />
            </TouchableOpacity>
          )}
        </View>
        
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
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      )}

      <LinearGradient
        colors={[Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd]}
        style={styles.background}
      />

      <View style={styles.albumContainer}>
        <Image source={{ uri: albumArt }} style={styles.albumArt} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.artist}>{artist}</Text>
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
              minimumTrackTintColor="white"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="white"
              disabled={isLoading}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={toggleLike}
            >
              <Ionicons 
                name={isLiked ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isLiked ? Colors.accent2 : 'white'} 
              />
            </TouchableOpacity>
            
            {onPrevious && (
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={onPrevious}
                disabled={isLoading}
              >
                <Ionicons name="play-skip-back" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.playPauseButton} 
              onPress={togglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color={Colors.primary} 
                />
              )}
            </TouchableOpacity>
            
            {onNext && (
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={onNext}
                disabled={isLoading}
              >
                <Ionicons name="play-skip-forward" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setIsVolumeVisible(!isVolumeVisible)}
            >
              <Ionicons 
                name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {isVolumeVisible && (
            <View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={20} color="white" />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={changeVolume}
                minimumTrackTintColor="white"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="white"
              />
              <Ionicons name="volume-high" size={20} color="white" />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  albumContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  albumArt: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  controlButton: {
    padding: 10,
  },
  actionButton: {
    padding: 10,
  },
  playPauseButton: {
    backgroundColor: 'white',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 10,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
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
  compactArtist: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactButton: {
    padding: 8,
  },
  compactPlayButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  compactCloseButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default MusicPlayer;
