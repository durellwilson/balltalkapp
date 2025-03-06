import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import SongService from '../../services/SongService';
import { Song } from '../../models/Song';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { 
  inspectObject, 
  safePrint, 
  debugAsync, 
  createDebugState,
  diagnoseNetworkError,
  isNetworkError
} from '../../utils/errorDebugger';

const SongsScreen = () => {
  const { user } = useAuth();
  // Log user object to check for potential issues
  useEffect(() => {
    console.log('User auth state changed:');
    inspectObject(user, 'User object');
  }, [user]);

  // Use debug state setters to track state changes
  const [songs, setSongsOriginal] = useState<Song[]>([]);
  const setSongs = createDebugState(setSongsOriginal, 'songs');
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load user's songs
  useEffect(() => {
    if (user) {
      loadSongs().catch(error => {
        // Handle network errors specifically
        if (isNetworkError(error)) {
          console.error('Network error detected when loading songs:');
          diagnoseNetworkError(error);
          Alert.alert(
            'Network Error', 
            'Unable to connect to the server. Please check your internet connection and try again.'
          );
        }
      });
    } else {
      setSongs([]);
      setIsLoading(false);
    }
  }, [user]);

  // Wrap the loadSongs function with debugging
  const loadSongs = debugAsync(async () => {
    setIsLoading(true);
    try {
      console.log('Loading songs for user:', user?.uid || '');
      const userSongs = await SongService.getSongsByArtist(user?.uid || '');
      
      // Inspect the returned songs array
      console.log(`Received ${userSongs.length} songs from SongService`);
      inspectObject(userSongs, 'Songs array');
      
      // Validate each song object before setting state
      const validatedSongs = userSongs.map((song, index) => {
        console.log(`Validating song ${index + 1}/${userSongs.length}`);
        
        // Check for required fields
        if (!song.id) console.warn(`Song at index ${index} is missing id`);
        if (!song.title) console.warn(`Song at index ${index} is missing title`);
        if (!song.releaseDate) console.warn(`Song at index ${index} is missing releaseDate`);
        
        // Return the song as is
        return song;
      });
      
      setSongs(validatedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
      inspectObject(error, 'Load songs error');
      
      // Check if it's a network error
      if (isNetworkError(error)) {
        const diagnosis = diagnoseNetworkError(error);
        console.log(diagnosis);
        throw error; // Re-throw to be caught by the useEffect error handler
      } else {
        Alert.alert('Error', 'Failed to load your songs');
      }
    } finally {
      setIsLoading(false);
    }
  }, 'loadSongs');

  // Play a song
  const playSong = (songId: string, fileUrl: string) => {
    if (currentlyPlaying === songId) {
      // Stop playing
      // In a real app, we would use the proper audio API to stop playback
      setCurrentlyPlaying(null);
    } else {
      // Start playing
      // In a real app, we would use the proper audio API to start playback
      setCurrentlyPlaying(songId);
      
      // Auto-stop after 5 seconds (simulating end of audio)
      setTimeout(() => {
        setCurrentlyPlaying(null);
      }, 5000);
    }
  };

  // Delete a song
  const deleteSong = async (songId: string) => {
    Alert.alert(
      'Delete Song',
      'Are you sure you want to delete this song? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(songId);
            try {
              const success = await SongService.deleteSong(songId, user?.uid || '');
              if (success) {
                setSongs(songs.filter(song => song.id !== songId));
              } else {
                Alert.alert('Error', 'Failed to delete the song');
              }
            } catch (error) {
              console.error('Error deleting song:', error);
              Alert.alert('Error', `An error occurred while deleting the song: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  // Format date with error handling
  const formatDate = (dateString: string) => {
    try {
      // Check if dateString is valid
      if (!dateString) {
        console.warn('formatDate called with empty dateString');
        return 'Unknown date';
      }
      
      // Log the input for debugging
      console.log('Formatting date string:', dateString);
      
      // Try to create a Date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid date';
      }
      
      // Format the date
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      console.log('Formatted date result:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      console.error('Problem dateString:', dateString);
      return 'Error';
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Songs</Text>
        <Text style={styles.message}>Please log in to view your songs</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Songs</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your songs...</Text>
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="music" size={64} color="#ccc" />
          <Text style={styles.emptyText}>You haven't uploaded any songs yet</Text>
          <Text style={styles.emptySubtext}>
            Head over to the Studio tab to record and upload your first track!
          </Text>
        </View>
      ) : (
        <View style={styles.songsContainer}>
          {songs.map(song => (
            <View key={song.id} style={styles.songCard}>
              <View style={styles.songHeader}>
                <View style={styles.coverArt}>
                  {song.coverArtUrl ? (
                    <Image 
                      source={{ uri: song.coverArtUrl }} 
                      style={styles.coverImage} 
                    />
                  ) : (
                    <View style={styles.placeholderCover}>
                      <FontAwesome5 name="music" size={32} color="#fff" />
                    </View>
                  )}
                </View>
                
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{safePrint(song.title, 'Untitled')}</Text>
                  <Text style={styles.songGenre}>{safePrint(song.genre, 'No genre')}</Text>
                  <Text style={styles.songDate}>
                    Released: {formatDate(song.releaseDate)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.songControls}>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => playSong(song.id, song.fileUrl)}
                >
                  <Ionicons 
                    name={currentlyPlaying === song.id ? "pause" : "play"} 
                    size={24} 
                    color="#007AFF" 
                  />
                  <Text style={styles.controlText}>
                    {currentlyPlaying === song.id ? "Pause" : "Play"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.deleteButton]}
                  onPress={() => deleteSong(song.id)}
                  disabled={isDeleting === song.id}
                >
                  {isDeleting === song.id ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <MaterialIcons name="delete" size={24} color="#FF3B30" />
                      <Text style={[styles.controlText, styles.deleteText]}>
                        Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.songStats}>
                <View style={styles.statItem}>
                  <Ionicons name="play-circle-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {safePrint(song.playCount, '0')} plays
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {safePrint(song.likeCount, '0')} likes
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {safePrint(song.commentCount, '0')} comments
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  songsContainer: {
    marginBottom: 16,
  },
  songCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2, // Keep elevation for Android
  },
  songHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coverArt: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songGenre: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  songDate: {
    fontSize: 14,
    color: '#999',
  },
  songControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    marginRight: 0,
    marginLeft: 8,
  },
  controlText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  songStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});

export default SongsScreen;
