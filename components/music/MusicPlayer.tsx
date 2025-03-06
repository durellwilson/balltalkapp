import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// Mock Slider component since we don't have @react-native-community/slider
interface MockSliderProps {
  style: any;
  minimumValue: number;
  maximumValue: number;
  value: number;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
}

const MockSlider: React.FC<MockSliderProps> = ({ 
  style, 
  minimumValue, 
  maximumValue, 
  value, 
  minimumTrackTintColor, 
  maximumTrackTintColor, 
  thumbTintColor, 
  onSlidingStart, 
  onSlidingComplete, 
  disabled 
}) => {
  return (
    <View style={[style, { height: 40 }]}>
      <View style={{ 
        height: 4, 
        backgroundColor: maximumTrackTintColor, 
        width: '100%', 
        marginTop: 18 
      }}>
        <View style={{ 
          height: 4, 
          backgroundColor: minimumTrackTintColor, 
          width: `${(value / maximumValue) * 100}%` 
        }} />
      </View>
      <TouchableOpacity 
        style={{ 
          width: 16, 
          height: 16, 
          borderRadius: 8, 
          backgroundColor: thumbTintColor, 
          position: 'absolute', 
          left: `${(value / maximumValue) * 100}%`, 
          top: 12,
          transform: [{ translateX: -8 }]
        }}
        disabled={disabled}
        onPress={() => {
          if (!disabled && onSlidingComplete) {
            onSlidingComplete(value);
          }
        }}
      />
    </View>
  );
};

interface MusicPlayerProps {
  song: {
    id: string;
    title: string;
    artist: string;
    coverArtUrl?: string;
    fileUrl: string;
    duration: number;
  };
  isVisible: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const { width } = Dimensions.get('window');

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  song,
  isVisible,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.duration || 0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Animation for the disc rotation
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  // Start or stop the disc spinning animation
  useEffect(() => {
    if (isPlaying && !isSeeking) {
      spinAnimation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      spinAnimation.current.start();
    } else {
      if (spinAnimation.current) {
        spinAnimation.current.stop();
      }
    }
    
    return () => {
      if (spinAnimation.current) {
        spinAnimation.current.stop();
      }
    };
  }, [isPlaying, isSeeking, spinValue]);
  
  // Simulate loading the song
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(song.duration || 180); // Default to 3 minutes if no duration provided
      
      // Simulate loading delay
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setIsPlaying(false);
    }
  }, [isVisible, song]);
  
  // Simulate time progress when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && !isSeeking && !isLoading) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, isSeeking, isLoading, duration]);
  
  // Interpolate the spin value for rotation animation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle seeking
  const handleSeekStart = () => {
    setIsSeeking(true);
  };
  
  const handleSeekComplete = (value: number) => {
    setCurrentTime(value);
    setIsSeeking(false);
    if (value >= duration) {
      setIsPlaying(false);
    } else if (!isPlaying) {
      setIsPlaying(true);
    }
  };
  
  // Toggle like status
  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  
  if (!isVisible) return null;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.albumContainer}>
        <Animated.View
          style={[
            styles.albumWrapper,
            { transform: [{ rotate: spin }] }
          ]}
        >
          {song.coverArtUrl ? (
            <Image source={{ uri: song.coverArtUrl }} style={styles.albumArt} />
          ) : (
            <View style={styles.albumArtPlaceholder}>
              <FontAwesome5 name="music" size={50} color="#ccc" />
            </View>
          )}
        </Animated.View>
      </View>
      
      <View style={styles.songInfoContainer}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.artistName}>{song.artist}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <MockSlider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={currentTime}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor="#ddd"
          thumbTintColor={Colors.primary}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          disabled={isLoading}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleLike}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={28} 
            color={isLiked ? "#e74c3c" : "#666"} 
          />
        </TouchableOpacity>
        
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={[
              styles.skipButton,
              !hasPrevious || isLoading ? { opacity: 0.5 } : {}
            ]}
            onPress={onPrevious}
            disabled={!hasPrevious || isLoading}
          >
            <Ionicons name="play-skip-back" size={28} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={togglePlayback}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="white" 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.skipButton,
              !hasNext || isLoading ? { opacity: 0.5 } : {}
            ]}
            onPress={onNext}
            disabled={!hasNext || isLoading}
          >
            <Ionicons name="play-skip-forward" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="share-outline" size={28} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.additionalControls}>
        <TouchableOpacity style={styles.additionalButton}>
          <Ionicons name="repeat" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalButton}>
          <Ionicons name="shuffle" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalButton}>
          <Ionicons name="list" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  albumWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.35,
  },
  albumArtPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
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
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
});

export default MusicPlayer;
