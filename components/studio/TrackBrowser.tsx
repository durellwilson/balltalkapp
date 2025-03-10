import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { SongService } from '../../services/SongService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Colors from '@/constants/Colors';

interface TrackBrowserProps {
  onTrackSelect: (track: any) => void;
  onCancel: () => void;
}

/**
 * TrackBrowser Component
 * 
 * A modern interface for browsing and selecting tracks from other users.
 * Features search, filtering, previewing, and track selection.
 * 
 * @param {function} onTrackSelect - Callback when a track is selected
 * @param {function} onCancel - Callback when the browser is closed
 * @returns {React.ReactElement} The TrackBrowser component
 */
const TrackBrowser: React.FC<TrackBrowserProps> = ({ onTrackSelect, onCancel }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  // State
  const [tracks, setTracks] = useState<any[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Load tracks
  const loadTracks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get tracks from the service
      const tracksData = await SongService.getPublicTracks(50);
      setTracks(tracksData);
      setFilteredTracks(tracksData);
      
      // Extract unique genres
      const uniqueGenres = Array.from(
        new Set(tracksData.map((track) => track.genre || 'Other'))
      );
      setGenres(uniqueGenres);
    } catch (error) {
      console.error('Error loading tracks:', error);
      setError('Failed to load tracks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Load tracks on mount
  useEffect(() => {
    loadTracks();
    
    // Clean up sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [loadTracks]);
  
  // Filter tracks based on search query and selected genre
  useEffect(() => {
    if (!tracks.length) return;
    
    let filtered = [...tracks];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (track) =>
          track.title?.toLowerCase().includes(query) ||
          track.artist?.toLowerCase().includes(query) ||
          track.genre?.toLowerCase().includes(query)
      );
    }
    
    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter((track) => track.genre === selectedGenre);
    }
    
    setFilteredTracks(filtered);
  }, [searchQuery, selectedGenre, tracks]);
  
  // Play/pause track preview
  const togglePlayTrack = async (trackId: string, audioUrl: string) => {
    try {
      // If already playing this track, stop it
      if (currentlyPlaying === trackId) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setCurrentlyPlaying(null);
        setSound(null);
        return;
      }
      
      // If playing a different track, stop the current one
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      
      // Load and play the new track
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setCurrentlyPlaying(trackId);
    } catch (error) {
      console.error('Error playing track:', error);
      alert('Failed to play track preview. Please try again.');
    }
  };
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      // Track finished playing
      setCurrentlyPlaying(null);
    }
  };
  
  // Select a track
  const handleSelectTrack = (track: any) => {
    // Stop any playing preview
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setCurrentlyPlaying(null);
      setSound(null);
    }
    
    // Call the selection callback
    onTrackSelect(track);
  };
  
  // Render a track item
  const renderTrackItem = ({ item }: { item: any }) => {
    const isPlaying = currentlyPlaying === item.id;
    
    return (
      <View style={[styles.trackItem, isDark && styles.trackItemDark]}>
        {/* Track cover art */}
        <Image
          source={
            item.coverArtUrl
              ? { uri: item.coverArtUrl }
              : require('../../assets/images/icon.png')
          }
          style={styles.trackCover}
        />
        
        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isDark && styles.textLight]} numberOfLines={1}>
            {item.title || 'Untitled Track'}
          </Text>
          <Text style={[styles.trackArtist, isDark && styles.textLightSecondary]} numberOfLines={1}>
            {item.artist || 'Unknown Artist'}
          </Text>
          <View style={styles.trackMeta}>
            <Text style={[styles.trackGenre, isDark && styles.textLightSecondary]}>
              {item.genre || 'Other'}
            </Text>
            <Text style={[styles.trackDuration, isDark && styles.textLightSecondary]}>
              {formatDuration(item.duration || 0)}
            </Text>
          </View>
        </View>
        
        {/* Track actions */}
        <View style={styles.trackActions}>
          <TouchableOpacity
            style={[styles.actionButton, isPlaying && styles.actionButtonActive]}
            onPress={() => togglePlayTrack(item.id, item.fileUrl)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={isPlaying ? '#fff' : isDark ? '#fff' : '#333'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSelectTrack(item)}
          >
            <Ionicons
              name="add-circle"
              size={22}
              color={isDark ? '#fff' : '#333'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Render genre filter pills
  const renderGenreFilters = () => {
    return (
      <View style={styles.genreFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreFiltersContent}
        >
          <TouchableOpacity
            style={[
              styles.genrePill,
              !selectedGenre && styles.genrePillSelected,
              isDark && styles.genrePillDark,
              !selectedGenre && isDark && styles.genrePillSelectedDark,
            ]}
            onPress={() => setSelectedGenre(null)}
          >
            <Text
              style={[
                styles.genrePillText,
                !selectedGenre && styles.genrePillTextSelected,
                isDark && styles.textLight,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genrePill,
                selectedGenre === genre && styles.genrePillSelected,
                isDark && styles.genrePillDark,
                selectedGenre === genre && isDark && styles.genrePillSelectedDark,
              ]}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text
                style={[
                  styles.genrePillText,
                  selectedGenre === genre && styles.genrePillTextSelected,
                  isDark && styles.textLight,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textLight]}>
          Browse Tracks
        </Text>
      </View>
      
      {/* Search bar */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Ionicons
          name="search"
          size={20}
          color={isDark ? '#999' : '#666'}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search by title, artist, or genre"
          placeholderTextColor={isDark ? '#999' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? '#999' : '#666'}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Genre filters */}
      {genres.length > 0 && renderGenreFilters()}
      
      {/* Tracks list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={[styles.loadingText, isDark && styles.textLight]}>
            Loading tracks...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={[styles.errorText, isDark && styles.textLight]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTracks}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="musical-notes"
            size={48}
            color={isDark ? '#666' : '#ccc'}
          />
          <Text style={[styles.emptyText, isDark && styles.textLight]}>
            {searchQuery || selectedGenre
              ? 'No tracks match your search'
              : 'No tracks available'}
          </Text>
          {(searchQuery || selectedGenre) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedGenre(null);
              }}
            >
              <Text style={styles.clearFiltersButtonText}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tracksList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  closeButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
  },
  searchInputDark: {
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
  genreFilters: {
    marginBottom: 16,
  },
  genreFiltersContent: {
    paddingHorizontal: 16,
  },
  genrePill: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  genrePillDark: {
    backgroundColor: '#2A2A2A',
  },
  genrePillSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  genrePillSelectedDark: {
    backgroundColor: Colors.PRIMARY,
  },
  genrePillText: {
    fontSize: 14,
    color: '#666',
  },
  genrePillTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  tracksList: {
    padding: 16,
  },
  trackItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trackItemDark: {
    backgroundColor: '#2A2A2A',
  },
  trackCover: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackGenre: {
    fontSize: 12,
    color: '#888',
  },
  trackDuration: {
    fontSize: 12,
    color: '#888',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonActive: {
    backgroundColor: Colors.PRIMARY,
  },
  textLight: {
    color: '#fff',
  },
  textLightSecondary: {
    color: '#aaa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.PRIMARY,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TrackBrowser; 