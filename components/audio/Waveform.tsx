import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useAudio } from '../../contexts/AudioContext';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { ThemeType } from '../../constants/Theme';

interface WaveformProps {
  height?: number;
  theme?: ThemeType;
  audioUri?: string; // Add audioUri prop for AudioProcessingContext
}

const Waveform: React.FC<WaveformProps> = ({ 
  height = 100,
  theme = ThemeType.DARK,
  audioUri
}) => {
  const { currentTime, duration } = useAudio();
  const { analysisData } = useAudioAnalyzer();
  const canvasRef = useRef<View>(null);
  
  // Get theme colors
  const backgroundColor = theme === ThemeType.DARK ? '#1E1E1E' : '#F5F5F5';
  const waveformColor = theme === ThemeType.DARK ? '#8E44AD' : '#6A1B9A';
  const progressColor = theme === ThemeType.DARK ? '#D1C4E9' : '#4A148C';
  const timelineColor = theme === ThemeType.DARK ? '#FFFFFF' : '#000000';
  
  // Draw the waveform
  useEffect(() => {
    // This is a simplified implementation
    // In a real implementation, we would use a canvas or SVG to draw the waveform
    // For React Native, we might use react-native-svg or a custom native module
    
    // For now, we'll just use a View with a background color
    
    // If audioUri is provided, we would analyze it here
    if (audioUri) {
      // In a real implementation, we would analyze the audio file
      // and update the waveform visualization
      console.log('Analyzing audio file:', audioUri);
    }
  }, [analysisData, currentTime, duration, audioUri]);
  
  // Calculate the progress position
  const progressPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // If we don't have analysis data but have an audioUri, show a placeholder waveform
  const waveformData = analysisData.waveform.length > 0 
    ? analysisData.waveform 
    : Array(50).fill(0).map(() => Math.random() * 0.8 + 0.2); // Generate random waveform for placeholder
  
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      {/* Waveform visualization */}
      <View style={styles.waveformContainer}>
        {waveformData.map((value, index) => {
          const amplitude = Math.abs(value);
          const isBeforeProgress = (index / waveformData.length) * 100 < progressPosition;
          
          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: amplitude * height * 0.8,
                  backgroundColor: isBeforeProgress ? progressColor : waveformColor
                }
              ]}
            />
          );
        })}
      </View>
      
      {/* Progress indicator */}
      <View
        style={[
          styles.progressIndicator,
          {
            left: `${progressPosition}%`,
            backgroundColor: timelineColor
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 16
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 4
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    alignSelf: 'center'
  },
  progressIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%'
  }
});

export default Waveform; 