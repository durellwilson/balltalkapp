import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface BeatMakerProps {
  onBeatCreated?: (beatUrl: string) => void;
  onClose?: () => void;
}

const BeatMaker: React.FC<BeatMakerProps> = ({
  onBeatCreated,
  onClose
}) => {
  const { theme, isDark } = useTheme();
  
  // State
  const [tempo, setTempo] = useState<number>(120);
  const [volume, setVolume] = useState<number>(0.8);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Simplified version to avoid sound loading errors
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text || '#000000' }]}>Beat Maker</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary || '#666666' }]}>
          Tempo: {tempo} BPM
        </Text>
      </View>
      
      <View style={styles.gridPlaceholder}>
        <Text style={[styles.placeholderText, { color: theme.textSecondary || '#666666' }]}>
          Beat Maker is currently being updated.
        </Text>
        <Text style={[styles.placeholderSubtext, { color: theme.textSecondary || '#666666' }]}>
          Please check back later.
        </Text>
      </View>
      
      <View style={styles.tempoContainer}>
        <Text style={[styles.tempoLabel, { color: theme.textSecondary || '#666666' }]}>Tempo</Text>
        <Slider
          style={styles.slider}
          value={tempo}
          onValueChange={setTempo}
          minimumValue={60}
          maximumValue={180}
          minimumTrackTintColor={theme.tint || '#2196F3'}
          maximumTrackTintColor={theme.border || '#DDDDDD'}
          thumbTintColor={theme.tint || '#2196F3'}
        />
      </View>
      
      <View style={styles.volumeContainer}>
        <Text style={[styles.volumeLabel, { color: theme.textSecondary || '#666666' }]}>Volume</Text>
        <Slider
          style={styles.slider}
          value={volume}
          onValueChange={setVolume}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={theme.tint || '#2196F3'}
          maximumTrackTintColor={theme.border || '#DDDDDD'}
          thumbTintColor={theme.tint || '#2196F3'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  tempoContainer: {
    marginBottom: 16,
  },
  tempoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  volumeContainer: {
    marginBottom: 20,
  },
  volumeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default BeatMaker; 