import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Song } from '../../models/Song';

// Mock data for demonstration
const MOCK_TRACKS: Song[] = [
  {
    id: '1',
    artistId: 'artist1',
    title: 'Court Vision',
    description: 'A track about seeing the game differently',
    genre: 'Hip Hop',
    releaseDate: new Date().toISOString(),
    fileUrl: 'https://example.com/song1.mp3',
    duration: 180,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverArtUrl: 'https://via.placeholder.com/300/8E44AD/FFFFFF?text=Court+Vision',
    playCount: 1250,
    likeCount: 342
  },
  {
    id: '2',
    artistId: 'artist2',
    title: 'Slam Dunk Dreams',
    description: 'Inspired by my journey to the league',
    genre: 'Trap',
    releaseDate: new Date().toISOString(),
    fileUrl: 'https://example.com/song2.mp3',
    duration: 210,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverArtUrl: 'https://via.placeholder.com/300/FF3B30/FFFFFF?text=Slam+Dunk',
    playCount: 980,
    likeCount: 201
  },
  {
    id: '3',
    artistId: 'artist3',
    title: 'Crossover King',
    description: 'Breaking ankles and taking names',
    genre: 'Hip Hop',
    releaseDate: new Date().toISOString(),
    fileUrl: 'https://example.com/song3.mp3',
    duration: 195,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverArtUrl: 'https://via.placeholder.com/300/4CD964/FFFFFF?text=Crossover',
    playCount: 1540,
    likeCount: 423
  },
  {
    id: '4',
    artistId: 'artist4',
    title: 'Three Point Range',
    description: 'Shooting from downtown',
    genre: 'R&B',
    releaseDate: new Date().toISOString(),
    fileUrl: 'https://example.com/song4.mp3',
    duration: 225,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverArtUrl: 'https://via.placeholder.com/300/007AFF/FFFFFF?text=Three+Point',
    playCount: 2100,
    likeCount: 567
  },
  {
    id: '5',
    artistId: 'artist5',
    title: 'MVP Flow',
    description: 'The mindset of a champion',
    genre: 'Hip Hop',
    releaseDate: new Date().toISOString(),
    fileUrl: 'https://example.com/song5.mp3',
    duration: 240,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverArtUrl: 'https://via.placeholder.com/300/FFCC00/000000?text=MVP+Flow',
    playCount: 3200,
    likeCount: 890
  }
];

interface TrackBrowserProps {
  onTrackSelect: (track: Song) => void;
  onCancel: () => void;
}

const TrackBrowser: React.FC<TrackBrowserProps> = ({
  onTrackSelect,
  onCancel
}) => {
  const [tracks, setTracks] = useState<Song[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Simulate loading tracks from an API
  useEffect(() => {
    const fetchTracks = async () => {
      // In a real app, you would fetch tracks from an API
      // For now, we'll just use mock data with a delay
      setTimeout(() => {
        setTracks(MOCK_TRACKS);
        setFilteredTracks(MOCK_TRACKS);
        setIsLoading(false);
      }, 1000);
    };
    
    fetchTracks();
  }, []);
  
  // Filter tracks based on search query and selected genre
  useEffect(() => {
    let filtered = tracks;
    
    if (searchQuery) {
      filtered = filtered.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedGenre) {
      filtered = filtered.filter(track => track.genre === selectedGenre);
    }
    
    setFilteredTracks(filtered);
  }, [searchQuery, selectedGenre, tracks]);
  
  // Get unique genres from tracks
  const genres = [...new Set(tracks.map(track => track.genre))];
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  const renderTrackItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => onTrackSelect(item)}
    >
      <Image
        source={{ uri: item.coverArtUrl || 'https://via.placeholder.com/60' }}
        style={styles.trackCover}
      />
      
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>Artist ID: {item.artistId}</Text>
        <Text style={styles.trackGenre}>{item.genre} • {formatDuration(item.duration)}</Text>
      </View>
      
      <View style={styles.trackStats}>
        <View style={styles.statItem}>
          <Ionicons name="play" size={12} color="#BBBBBB" />
          <Text style={styles.statText}>{formatNumber(item.playCount || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={12} color="#BBBBBB" />
          <Text style={styles.statText}>{formatNumber(item.likeCount || 0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Tracks</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="#BBBBBB" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#BBBBBB" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tracks..."
          placeholderTextColor="#888888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.genreContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.genreChip,
              selectedGenre === null && styles.activeGenreChip
            ]}
            onPress={() => setSelectedGenre(null)}
          >
            <Text style={[
              styles.genreText,
              selectedGenre === null && styles.activeGenreText
            ]}>All</Text>
          </TouchableOpacity>
          
          {genres.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreChip,
                selectedGenre === genre && styles.activeGenreChip
              ]}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text style={[
                styles.genreText,
                selectedGenre === genre && styles.activeGenreText
              ]}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" />
          <Text style={styles.loadingText}>Loading tracks...</Text>
        </View>
      ) : filteredTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={48} color="#BBBBBB" />
          <Text style={styles.emptyText}>No tracks found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          renderItem={renderTrackItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.trackList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
  },
  genreContainer: {
    marginBottom: 16,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginRight: 8,
  },
  activeGenreChip: {
    backgroundColor: '#8E44AD',
  },
  genreText: {
    color: '#BBBBBB',
  },
  activeGenreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#BBBBBB',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#BBBBBB',
    marginTop: 8,
  },
  trackList: {
    paddingBottom: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  trackCover: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackArtist: {
    color: '#BBBBBB',
    fontSize: 14,
  },
  trackGenre: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  trackStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    color: '#BBBBBB',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TrackBrowser; 