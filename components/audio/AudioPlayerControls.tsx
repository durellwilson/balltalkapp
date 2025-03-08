import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudio } from '../../contexts/AudioContext';
import { ThemeType } from '../../constants/Theme';

interface AudioPlayerControlsProps {
  theme?: ThemeType;
}

const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({ 
  theme = ThemeType.DARK 
}) => {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    play, 
    pause, 
    stop, 
    seekTo,
    isLoading
  } = useAudio();
  
  // Get theme colors
  const backgroundColor = theme === ThemeType.DARK ? '#2A2A2A' : '#F0F0F0';
  const textColor = theme === ThemeType.DARK ? '#FFFFFF' : '#000000';
  const accentColor = '#8E44AD'; // Purple accent color
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause button press
  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };
  
  // Handle stop button press
  const handleStop = async () => {
    await stop();
  };
  
  // Handle seek
  const handleSeek = async (value: number) => {
    await seekTo(value);
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Time display */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: textColor }]}>
          {formatTime(currentTime)}
        </Text>
        <Text style={[styles.timeText, { color: textColor }]}>
          {formatTime(duration)}
        </Text>
      </View>
      
      {/* Seek slider */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={currentTime}
        onValueChange={handleSeek}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor={theme === ThemeType.DARK ? '#555555' : '#CCCCCC'}
        thumbTintColor={accentColor}
        disabled={isLoading || duration === 0}
      />
      
      {/* Playback controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleStop}
          disabled={isLoading || duration === 0}
        >
          <Ionicons
            name="stop"
            size={24}
            color={isLoading || duration === 0 ? '#888888' : accentColor}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.playPauseButton, { backgroundColor: accentColor }]}
          onPress={handlePlayPause}
          disabled={isLoading || duration === 0}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          disabled={true} // No next track functionality yet
        >
          <Ionicons
            name="play-skip-forward"
            size={24}
            color="#888888"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  slider: {
    width: '100%',
    height: 40
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  controlButton: {
    padding: 12
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24
  }
});

export default AudioPlayerControls; 