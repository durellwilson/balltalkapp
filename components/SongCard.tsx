import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safePrint } from '../utils/errorDebugger';

interface SongCardProps {
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: number;
  onPlay: () => void;
  isPlaying?: boolean;
}

const SongCard = ({ 
  title, 
  artist, 
  coverUrl, 
  duration, 
  onPlay, 
  isPlaying = false 
}: SongCardProps) => {
  return (
    <View style={styles.container} testID="song-card">
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{safePrint(title, 'Untitled')}</Text>
        <Text style={styles.artist}>{safePrint(artist, 'Unknown Artist')}</Text>
        {duration && (
          <Text style={styles.duration}>
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={onPlay}
        testID="play-button"
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color="#007AFF" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2, // Keep elevation for Android
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: '#999',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SongCard;
