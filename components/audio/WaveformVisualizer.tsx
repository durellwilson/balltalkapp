import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  Text, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import WebAudioRecordingService from '../../services/WebAudioRecordingService';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface WaveformVisualizerProps {
  audioUri?: string | null;
  isRecording?: boolean;
  onPositionChange?: (position: number) => void;
  height?: number;
  waveformColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  showControls?: boolean;
  showTimeMarkers?: boolean;
  enableZoom?: boolean;
  onPlaybackComplete?: () => void;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUri,
  isRecording = false,
  onPositionChange,
  height = 100,
  waveformColor = '#007AFF',
  progressColor = '#FF9500',
  backgroundColor = '#F0F0F0',
  showControls = true,
  showTimeMarkers = true,
  enableZoom = true,
  onPlaybackComplete,
}) => {
  const { isDark } = useTheme();
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const sound = useRef<Audio.Sound | null>(null);
  const canvasRef = useRef<View>(null);
  const playbackAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const screenWidth = Dimensions.get('window').width;
  
  // Load audio and analyze waveform
  useEffect(() => {
    if (audioUri) {
      loadAudio();
    }
    
    return () => {
      // Cleanup
      if (sound.current) {
        sound.current.unloadAsync();
        sound.current = null;
      }
      
      if (playbackAnimation.current) {
        playbackAnimation.current.stop();
        playbackAnimation.current = null;
      }
    };
  }, [audioUri]);
  
  // Handle real-time waveform during recording
  useEffect(() => {
    if (isRecording) {
      const intervalId = setInterval(() => {
        const levels = WebAudioRecordingService.getAudioLevels();
        if (levels) {
          // Downsample the levels data to a manageable size
          const downsampledData = downsampleData(Array.from(levels), 100);
          setWaveformData(downsampledData);
        }
      }, 100);
      
      return () => clearInterval(intervalId);
    }
  }, [isRecording]);
  
  // Update position when animatedPosition changes
  useEffect(() => {
    const listener = animatedPosition.addListener(({ value }) => {
      const newPosition = value * duration;
      setPosition(newPosition);
      onPositionChange?.(newPosition);
    });
    
    return () => animatedPosition.removeListener(listener);
  }, [animatedPosition, duration, onPositionChange]);
  
  // Pan responder for position scrubbing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (playbackAnimation.current) {
          playbackAnimation.current.stop();
        }
        
        const { locationX } = evt.nativeEvent;
        const progress = getProgressFromLocation(locationX);
        animatedPosition.setValue(progress);
        
        if (sound.current && isPlaying) {
          sound.current.setPositionAsync(progress * duration * 1000);
          startPlaybackAnimation(progress);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const progress = getProgressFromLocation(locationX);
        animatedPosition.setValue(progress);
      },
      onPanResponderRelease: (evt) => {
        const { locationX } = evt.nativeEvent;
        const progress = getProgressFromLocation(locationX);
        
        if (sound.current) {
          sound.current.setPositionAsync(progress * duration * 1000)
            .then(() => {
              if (isPlaying) {
                startPlaybackAnimation(progress);
              }
            });
        }
      },
    }),
  ).current;
  
  // Calculate progress from touch location considering zoom and pan
  const getProgressFromLocation = (locationX: number): number => {
    const adjustedWidth = screenWidth * zoomLevel;
    const visibleWidth = screenWidth;
    const maxPan = Math.max(0, adjustedWidth - visibleWidth);
    
    // Calculate the position within the zoomed waveform
    const positionInZoomedWaveform = (locationX + panOffset) / adjustedWidth;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, positionInZoomedWaveform));
  };
  
  // Load and analyze audio
  const loadAudio = async () => {
    if (!audioUri) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Unload any previous sound
      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }
      
      // Load the sound
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      sound.current = newSound;
      
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      
      // Generate waveform data
      const waveformData = await generateWaveformData(audioUri);
      setWaveformData(waveformData);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio');
      setIsLoading(false);
    }
  };
  
  // Update playback status
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;
    
    // Update position
    if (status.positionMillis !== undefined) {
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
      onPlaybackComplete?.();
    }
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (!sound.current) return;
    
    try {
      if (isPlaying) {
        await sound.current.pauseAsync();
        if (playbackAnimation.current) {
          playbackAnimation.current.stop();
        }
      } else {
        await sound.current.playAsync();
        startPlaybackAnimation(animatedPosition._value);
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };
  
  // Start playback animation
  const startPlaybackAnimation = (fromProgress: number) => {
    if (playbackAnimation.current) {
      playbackAnimation.current.stop();
    }
    
    const remainingDuration = (1 - fromProgress) * duration * 1000;
    
    playbackAnimation.current = Animated.timing(animatedPosition, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });
    
    playbackAnimation.current.start();
  };
  
  // Generate waveform data from audio file
  const generateWaveformData = async (uri: string): Promise<number[]> => {
    // In a real implementation, this would analyze the audio file
    // For now, we'll generate random data as a placeholder
    // TODO: Implement real waveform analysis
    
    const sampleCount = 200;
    const data: number[] = [];
    
    for (let i = 0; i < sampleCount; i++) {
      // Generate values between 0.1 and 1.0
      data.push(0.1 + Math.random() * 0.9);
    }
    
    return data;
  };
  
  // Downsample data to reduce array size
  const downsampleData = (data: number[], targetLength: number): number[] => {
    if (data.length <= targetLength) return data;
    
    const result: number[] = [];
    const step = data.length / targetLength;
    
    for (let i = 0; i < targetLength; i++) {
      const idx = Math.floor(i * step);
      result.push(data[idx]);
    }
    
    return result;
  };
  
  // Format time in mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Zoom in
  const zoomIn = () => {
    if (zoomLevel < 4) {
      setZoomLevel(prevZoom => prevZoom + 0.5);
    }
  };
  
  // Zoom out
  const zoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prevZoom => prevZoom - 0.5);
    }
  };
  
  // Reset zoom
  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };
  
  // Render waveform
  const renderWaveform = () => {
    if (isLoading) {
      return (
        <View style={[styles.loadingContainer, { height }]}>
          <ActivityIndicator size="large" color={waveformColor} />
          <Text style={styles.loadingText}>Loading waveform...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={[styles.errorContainer, { height }]}>
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    
    if (waveformData.length === 0) {
      return (
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={styles.emptyText}>No waveform data available</Text>
        </View>
      );
    }
    
    const barWidth = 2;
    const barSpacing = 1;
    const totalBars = waveformData.length;
    const containerWidth = (barWidth + barSpacing) * totalBars;
    
    // Adjust for zoom level
    const zoomedWidth = containerWidth * zoomLevel;
    
    return (
      <Animated.ScrollView
        horizontal
        scrollEnabled={enableZoom && zoomLevel > 1}
        style={[styles.waveformContainer, { height }]}
        contentContainerStyle={{ width: zoomedWidth }}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          setPanOffset(e.nativeEvent.contentOffset.x);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.waveformContent} {...panResponder.panHandlers}>
          {waveformData.map((value, index) => {
            const barHeight = value * height * 0.8;
            const isActive = (index / totalBars) <= animatedPosition._value;
            
            return (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    width: barWidth,
                    marginHorizontal: barSpacing / 2,
                    backgroundColor: isActive ? progressColor : waveformColor,
                  },
                ]}
              />
            );
          })}
        </View>
      </Animated.ScrollView>
    );
  };
  
  // Render time markers
  const renderTimeMarkers = () => {
    if (!showTimeMarkers || duration === 0) return null;
    
    const markers = [];
    const interval = duration > 60 ? 15 : 5; // 15 sec intervals for longer audio, 5 sec for shorter
    const count = Math.ceil(duration / interval);
    
    for (let i = 0; i <= count; i++) {
      const time = i * interval;
      const position = time / duration * 100;
      if (time <= duration) {
        markers.push(
          <View key={i} style={[styles.timeMarker, { left: `${position}%` }]}>
            <Text style={styles.timeMarkerText}>{formatTime(time)}</Text>
          </View>
        );
      }
    }
    
    return <View style={styles.timeMarkersContainer}>{markers}</View>;
  };
  
  return (
    <View style={styles.container}>
      {renderWaveform()}
      
      {showTimeMarkers && renderTimeMarkers()}
      
      {showControls && (
        <View style={styles.controlsContainer}>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeSeparator}>/</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          
          <View style={styles.playbackControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={togglePlayback}
              disabled={!audioUri || isLoading}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>
          
          {enableZoom && (
            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomButton} onPress={zoomOut} disabled={zoomLevel <= 1}>
                <Ionicons name="remove" size={20} color={zoomLevel <= 1 ? '#999999' : (isDark ? '#FFFFFF' : '#000000')} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.zoomButton} onPress={resetZoom} disabled={zoomLevel === 1}>
                <Ionicons name="refresh" size={20} color={zoomLevel === 1 ? '#999999' : (isDark ? '#FFFFFF' : '#000000')} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.zoomButton} onPress={zoomIn} disabled={zoomLevel >= 4}>
                <Ionicons name="add" size={20} color={zoomLevel >= 4 ? '#999999' : (isDark ? '#FFFFFF' : '#000000')} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  waveformContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  waveformContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 10,
  },
  bar: {
    backgroundColor: '#007AFF',
    width: 2,
    marginHorizontal: 0.5,
    alignSelf: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
    fontSize: 14,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3F2',
    borderRadius: 8,
  },
  errorText: {
    marginTop: 8,
    color: '#FF3B30',
    fontSize: 14,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  timeSeparator: {
    fontSize: 12,
    color: '#666666',
    marginHorizontal: 4,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeMarkersContainer: {
    position: 'relative',
    height: 20,
    width: '100%',
    marginTop: 4,
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeMarkerText: {
    fontSize: 10,
    color: '#999999',
  },
});

export default WaveformVisualizer; 