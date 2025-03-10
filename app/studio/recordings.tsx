import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MockSongService from '../../services/MockSongService';
import { Song } from '../../models/Song';
import SongCardAdapter from '../../components/music/SongCardAdapter';
import MusicPlayerAdapter from '../../components/music/MusicPlayerAdapter';

export default function RecordingsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recordings, setRecordings] = useState<Song[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadRecordings();
    }
  }, [user]);
  
  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      // Get recordings for the current user
      const userRecordings = await MockSongService.getUserSongs(user?.uid || '');
      setRecordings(userRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      Alert.alert('Error', 'Failed to load your recordings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlayRecording = (recording: Song) => {
    setSelectedRecording(recording);
    setIsPlaying(true);
  };
  
  const handleStopPlayback = () => {
    setIsPlaying(false);
    setSelectedRecording(null);
  };
  
  const handleDeleteRecording = async (recordingId: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop playback if the recording is currently playing
              if (selectedRecording?.id === recordingId) {
                handleStopPlayback();
              }
              
              // Delete the recording
              await MockSongService.deleteSong(recordingId);
              
              // Refresh the recordings list
              loadRecordings();
              
              Alert.alert('Success', 'Recording deleted successfully.');
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  // Check if user is authenticated
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Your Recordings</Text>
        <Text style={styles.subtitle}>Sign in to access your recordings</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/athlete-signup')}>
            <Text style={styles.signupLink}>Sign up as an athlete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Check if user is an athlete
  if (user?.role !== 'athlete') {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Athletes Only</Text>
        <Text style={styles.subtitle}>
          The recordings section is exclusively available to verified athletes.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(auth)/athlete-signup')}
        >
          <Text style={styles.buttonText}>Sign Up as an Athlete</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recordings...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Recordings</Text>
        <TouchableOpacity 
          style={styles.studioButton}
          onPress={() => router.push('/studio')}
        >
          <Ionicons name="mic" size={18} color="white" />
          <Text style={styles.studioButtonText}>Go to Studio</Text>
        </TouchableOpacity>
      </View>
      
      {recordings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="music-off" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No recordings yet</Text>
          <Text style={styles.emptySubtext}>
            Head to the studio to create your first track
          </Text>
          <TouchableOpacity 
            style={[styles.button, styles.emptyButton]}
            onPress={() => router.push('/studio')}
          >
            <Text style={styles.buttonText}>Go to Studio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCardAdapter
              song={item}
              onPlay={() => handlePlayRecording(item)}
              onDelete={() => handleDeleteRecording(item.id)}
              isPlaying={selectedRecording?.id === item.id && isPlaying}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {selectedRecording && (
        <MusicPlayerAdapter
          song={selectedRecording}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={handleStopPlayback}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  studioButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  studioButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    width: 200,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
