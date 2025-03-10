import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PRIMARY, NEUTRAL_100, NEUTRAL_200, NEUTRAL_400, NEUTRAL_600, NEUTRAL_800 } from '@/constants/Colors';

interface UploadedFileDetailsProps {
  fileName: string;
  fileUrl: string;
  duration: number;
  trackName?: string;
  createdAt?: Date;
  onClose?: () => void;
  testID?: string;
}

const UploadedFileDetails: React.FC<UploadedFileDetailsProps> = ({
  fileName,
  fileUrl,
  duration,
  trackName,
  createdAt = new Date(),
  onClose,
  testID
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Load the sound
  const loadSound = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Loading sound: ${fileUrl}`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sound:', error);
      setError('Failed to load audio file');
      setIsLoading(false);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis / 1000);
      if (status.didJustFinish) {
        setIsPlaying(false);
        // Reset position to start
        sound?.setPositionAsync(0);
      }
    }
  };

  // Play/pause toggle
  const togglePlayback = async () => {
    if (!sound) {
      await loadSound();
      setIsPlaying(true);
      sound?.playAsync();
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Uploaded File</Text>
        {onClose && (
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            testID="close-button"
          >
            <Ionicons name="close" size={24} color={NEUTRAL_800} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fileInfoContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="musical-note" size={36} color={PRIMARY} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName}>{fileName}</Text>
          {trackName && <Text style={styles.trackName}>Track: {trackName}</Text>}
          <Text style={styles.duration}>Duration: {formatTime(duration)}</Text>
          <Text style={styles.uploadDate}>Uploaded: {formatDate(createdAt)}</Text>
        </View>
      </View>

      <View style={styles.playerContainer}>
        {isLoading ? (
          <ActivityIndicator 
            size="large" 
            color={PRIMARY} 
            testID="loading-indicator"
          />
        ) : error ? (
          <Text style={styles.errorText} testID="error-text">{error}</Text>
        ) : (
          <>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(playbackPosition / duration) * 100}%` }
                ]} 
                testID="progress-fill"
              />
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.playButton} 
              onPress={togglePlayback}
              testID="play-button"
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color={NEUTRAL_100} 
              />
            </TouchableOpacity>
            
            <Text style={styles.playbackInstructions}>
              Tap to {isPlaying ? 'pause' : 'play'} the uploaded track
            </Text>
          </>
        )}
      </View>

      <View style={styles.firebaseInfoContainer}>
        <Text style={styles.firebaseTitle}>File URL Stored in Firebase:</Text>
        <Text 
          style={styles.firebaseUrl} 
          numberOfLines={2} 
          ellipsizeMode="middle"
          testID="firebase-url"
        >
          {fileUrl}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: NEUTRAL_100,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
  },
  closeButton: {
    padding: 4,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: NEUTRAL_200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: NEUTRAL_800,
    marginBottom: 4,
  },
  trackName: {
    fontSize: 14,
    color: NEUTRAL_800,
    marginBottom: 2,
  },
  duration: {
    fontSize: 14,
    color: NEUTRAL_600,
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 14,
    color: NEUTRAL_600,
  },
  playerContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: NEUTRAL_400,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: NEUTRAL_600,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playbackInstructions: {
    fontSize: 14,
    color: NEUTRAL_600,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginVertical: 16,
    textAlign: 'center',
  },
  firebaseInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_400,
    paddingTop: 16,
    marginTop: 8,
  },
  firebaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUTRAL_800,
    marginBottom: 4,
  },
  firebaseUrl: {
    fontSize: 12,
    color: NEUTRAL_600,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: NEUTRAL_200,
    borderRadius: 4,
  },
});

export default UploadedFileDetails; 