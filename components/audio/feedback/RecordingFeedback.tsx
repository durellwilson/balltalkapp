import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecording, RecordingState } from '../../../contexts/RecordingContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface RecordingFeedbackProps {
  showMetrics?: boolean;
  showWaveform?: boolean;
  style?: object;
}

/**
 * RecordingFeedback component provides visual feedback during the recording process.
 * It displays different feedback based on the current recording state.
 */
const RecordingFeedback: React.FC<RecordingFeedbackProps> = ({
  showMetrics = true,
  showWaveform = true,
  style
}) => {
  const {
    recordingState,
    recordingDuration,
    recordingError,
    audioLevels,
    getErrorFeedback,
    metadata,
    playbackPosition,
    playbackDuration
  } = useRecording();
  
  // Animation value for pulsing
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Pulse animation
  useEffect(() => {
    if (recordingState === RecordingState.RECORDING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [recordingState]);
  
  // Format time in mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format playback time
  const formatPlaybackTime = (): string => {
    const positionSecs = playbackPosition / 1000;
    const durationSecs = playbackDuration / 1000;
    return `${formatTime(positionSecs)} / ${formatTime(durationSecs)}`;
  };
  
  // Get status message based on state
  const getStatusMessage = (): string => {
    switch (recordingState) {
      case RecordingState.IDLE:
        return 'Ready to record';
      case RecordingState.REQUESTING_PERMISSION:
        return 'Requesting microphone permission...';
      case RecordingState.INITIALIZING:
        return 'Initializing audio...';
      case RecordingState.READY:
        return 'Ready to record';
      case RecordingState.RECORDING:
        return `Recording ${formatTime(recordingDuration)}`;
      case RecordingState.PAUSED:
        return `Paused ${formatTime(recordingDuration)}`;
      case RecordingState.PROCESSING:
        return 'Processing audio...';
      case RecordingState.PLAYBACK:
        return `Playing ${formatPlaybackTime()}`;
      case RecordingState.ERROR:
        return getErrorFeedback();
      case RecordingState.COMPLETED:
        return 'Recording complete';
      default:
        return '';
    }
  };
  
  // Get the icon for the current state
  const getStateIcon = () => {
    switch (recordingState) {
      case RecordingState.RECORDING:
        return (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="radio-outline" size={24} color="red" />
          </Animated.View>
        );
      case RecordingState.PAUSED:
        return <Ionicons name="pause-circle-outline" size={24} color="#FFA500" />;
      case RecordingState.PROCESSING:
        return <ActivityIndicator size="small" color="#0000FF" />;
      case RecordingState.PLAYBACK:
        return <Ionicons name="play-circle-outline" size={24} color="#00FF00" />;
      case RecordingState.ERROR:
        return <Ionicons name="warning-outline" size={24} color="#FF0000" />;
      case RecordingState.COMPLETED:
        return <Ionicons name="checkmark-circle-outline" size={24} color="#00FF00" />;
      default:
        return <Ionicons name="mic-outline" size={24} color="#666" />;
    }
  };
  
  // Calculate a level meter based on audio levels
  const renderLevelMeter = () => {
    if (!showMetrics || audioLevels.length === 0) {
      return null;
    }
    
    // Normalize levels to 0-100 range
    const normalizedLevels = audioLevels.map(level => {
      // Assuming levels are in dB scale from -160 to 0
      const normalized = ((level + 160) / 160) * 100;
      return Math.max(0, Math.min(100, normalized));
    });
    
    // Get the most recent level
    const currentLevel = normalizedLevels[normalizedLevels.length - 1] || 0;
    
    return (
      <View style={styles.meterContainer}>
        <View style={styles.meter}>
          {[...Array(10)].map((_, index) => {
            const threshold = index * 10;
            const isActive = currentLevel >= threshold;
            
            let backgroundColor = '#4CAF50'; // Green
            if (index >= 7) {
              backgroundColor = '#FF0000'; // Red for high levels
            } else if (index >= 5) {
              backgroundColor = '#FFA500'; // Orange for medium levels
            }
            
            return (
              <View
                key={`level-${index}`}
                style={[
                  styles.meterSegment,
                  { backgroundColor: isActive ? backgroundColor : '#E0E0E0' }
                ]}
              />
            );
          })}
        </View>
        {recordingState === RecordingState.RECORDING && (
          <Text style={styles.meterValue}>{Math.round(currentLevel)}%</Text>
        )}
      </View>
    );
  };
  
  // Render audio waveform visualization
  const renderWaveform = () => {
    if (!showWaveform || audioLevels.length < 2) {
      return null;
    }
    
    // Normalize levels for display
    const normalizedLevels = audioLevels.map(level => {
      const normalized = ((level + 160) / 160);
      return Math.max(0, Math.min(1, normalized));
    });
    
    return (
      <View style={styles.waveformContainer}>
        {normalizedLevels.map((level, index) => (
          <View
            key={`wave-${index}`}
            style={[
              styles.waveformBar,
              { 
                height: `${level * 100}%`,
                backgroundColor: recordingState === RecordingState.ERROR 
                  ? '#FF0000' 
                  : recordingState === RecordingState.RECORDING
                    ? '#00A5E0'
                    : '#888'
              }
            ]}
          />
        ))}
      </View>
    );
  };
  
  // Render recording metadata if available
  const renderMetadata = () => {
    if (!metadata || !showMetrics) {
      return null;
    }
    
    return (
      <View style={styles.metadataContainer}>
        <Text style={styles.metadataText}>
          {`Size: ${(metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB`}
        </Text>
        <Text style={styles.metadataText}>
          {`Duration: ${formatTime(metadata.durationMs / 1000)}`}
        </Text>
        <Text style={styles.metadataText}>
          {`Format: ${metadata.format.toUpperCase()}`}
        </Text>
        <Text style={styles.metadataText}>
          {`Quality: ${metadata.quality}`}
        </Text>
      </View>
    );
  };
  
  // Render loading indicator for processing state
  const renderProcessingIndicator = () => {
    if (recordingState !== RecordingState.PROCESSING) {
      return null;
    }
    
    // Animate layout for smoother appearance
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#0000FF" />
        <Text style={styles.processingText}>Processing your recording...</Text>
      </View>
    );
  };
  
  // Render error feedback
  const renderErrorFeedback = () => {
    if (recordingState !== RecordingState.ERROR || !recordingError) {
      return null;
    }
    
    // Animate layout for smoother appearance
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={32} color="#FF0000" />
        <Text style={styles.errorText}>{getErrorFeedback()}</Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusContainer}>
        {getStateIcon()}
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
      </View>
      
      {renderLevelMeter()}
      {renderWaveform()}
      {renderMetadata()}
      {renderProcessingIndicator()}
      {renderErrorFeedback()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  meterContainer: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meter: {
    flexDirection: 'row',
    height: 20,
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterSegment: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
  },
  meterValue: {
    marginLeft: 8,
    width: 40,
    textAlign: 'right',
    fontSize: 14,
  },
  waveformContainer: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    backgroundColor: '#00A5E0',
    borderRadius: 2,
  },
  metadataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  processingContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,255,0.05)',
    borderRadius: 8,
  },
  processingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#0000FF',
  },
  errorContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,0,0,0.05)',
    borderRadius: 8,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF0000',
    textAlign: 'center',
  },
});

export default RecordingFeedback; 