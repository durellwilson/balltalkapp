import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import SongService from '../../services/SongService';
import { Song } from '../../models/Song';
import Colors from '../../constants/Colors';
import { formatDuration } from '../../utils/formatting';

const SongsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const songService = new SongService();

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError(null);

      let songsData: Song[] = [];
      
      if (user) {
        // Get user's songs
        const userSongs = await songService.getSongsByArtist(user.uid);
        songsData = [...userSongs];
        
        // Get public songs from other artists
        const publicSongs = await songService.getPublicSongs();
        
        // Filter out user's own songs from public songs
        const otherArtistsSongs = publicSongs.filter(song => song.artistId !== user.uid);
        
        songsData = [...songsData, ...otherArtistsSongs];
      } else {
        // If no user is logged in, just get public songs
        songsData = await songService.getPublicSongs();
      }
      
      setSongs(songsData);
    } catch (error) {
      console.error('Error loading songs:', error);
      setError('Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSongs();
  };

  const navigateToSongDetail = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => navigateToSongDetail(item.id)}
    >
      <View style={styles.songImageContainer}>
        {item.coverArtUrl ? (
          <Image
            source={{ uri: item.coverArtUrl }}
            style={styles.songImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.songImagePlaceholder}>
            <FontAwesome5 name="music" size={24} color={Colors.neutral600} />
          </View>
        )}
      </View>
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{item.artistName || 'Unknown Artist'}</Text>
        
        <View style={styles.songDetails}>
          {item.genre && (
            <Text style={styles.songGenre}>{item.genre}</Text>
          )}
          
          {item.duration && (
            <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.songStats}>
        <View style={styles.statItem}>
          <Ionicons name="play-circle-outline" size={14} color={Colors.neutral600} />
          <Text style={styles.statText}>{item.playCount || 0}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={14} color={Colors.neutral600} />
          <Text style={styles.statText}>{item.likeCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading songs...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSongs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (songs.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <FontAwesome5 name="music" size={64} color={Colors.neutral600} />
        <Text style={styles.emptyText}>No songs found</Text>
        <Text style={styles.emptySubtext}>
          Songs you upload or that are shared with you will appear here
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={songs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.neutral600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral200,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral200,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral800,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.neutral600,
    textAlign: 'center',
    maxWidth: '80%',
  },
  listContent: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  songImageContainer: {
    marginRight: 12,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  songImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.neutral400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.neutral800,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: Colors.neutral600,
    marginBottom: 8,
  },
  songDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songGenre: {
    fontSize: 12,
    color: Colors.neutral600,
    backgroundColor: Colors.neutral400,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  songDuration: {
    fontSize: 12,
    color: Colors.neutral600,
  },
  songStats: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.neutral600,
    marginLeft: 4,
  },
});

export default SongsScreen; 