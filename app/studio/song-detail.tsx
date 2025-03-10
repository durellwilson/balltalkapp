import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Share as RNShare
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useAuth } from '@/hooks/useAuth';
import SongService from '../../services/SongService';
import UserService from '../../services/UserService';
import { Song } from '../../models/Song';
import { User } from '../../models/User';
import { 
  PRIMARY, 
  SECONDARY,
  ERROR,
  NEUTRAL_100, 
  NEUTRAL_200,
  NEUTRAL_400,
  NEUTRAL_600, 
  NEUTRAL_800 
} from '../../constants/Colors';
import TrackSharingModal from '../../components/studio/TrackSharingModal';
import { formatDuration, formatDate } from '../../utils/formatting';

interface RouteParams {
  songId: string;
}

const SongDetailScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { songId } = route.params as RouteParams;
  
  const [song, setSong] = useState<Song | null>(null);
  const [artist, setArtist] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const songService = new SongService();
  const userService = new UserService();

  useEffect(() => {
    loadSongDetails();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [songId]);

  const loadSongDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load song details
      const songData = await songService.getSong(songId);
      if (!songData) {
        throw new Error('Song not found');
      }
      setSong(songData);
      setLikeCount(songData.likeCount || 0);

      // Load artist details
      if (songData.artistId) {
        const artistData = await userService.getUserById(songData.artistId);
        setArtist(artistData);
      }

      // Check if the current user has liked this song
      if (user && songData.likedBy && songData.likedBy.includes(user.uid)) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error loading song details:', error);
      setError('Failed to load song details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!song) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.fileUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis / 1000);
      setPlaybackDuration(status.durationMillis / 1000);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  const handleLike = async () => {
    if (!user || !song) return;

    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount(prevCount => newIsLiked ? prevCount + 1 : prevCount - 1);

      await songService.likeSong(song.id, user.uid, newIsLiked);
    } catch (error) {
      console.error('Error liking song:', error);
      // Revert UI changes if the operation fails
      setIsLiked(!isLiked);
      setLikeCount(prevCount => !isLiked ? prevCount - 1 : prevCount + 1);
    }
  };

  const handleShare = () => {
    if (song && user && song.artistId === user.uid) {
      // If the current user is the artist, show the track sharing modal
      setShowShareModal(true);
    } else {
      // Otherwise, use the native share functionality
      handleNativeShare();
    }
  };

  const handleNativeShare = async () => {
    if (!song) return;

    try {
      await RNShare.share({
        message: `Check out "${song.title}" on BallTalk! ${song.description || ''}`,
        url: song.fileUrl, // This might not work on all platforms
      });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const navigateToSharedTracks = () => {
    router.push('/sharedtracksscreen' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading song details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !song) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Song not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadSongDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={NEUTRAL_800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Song Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.coverArtContainer}>
          {song.coverArtUrl ? (
            <Image
              source={{ uri: song.coverArtUrl }}
              style={styles.coverArt}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderCoverArt}>
              <FontAwesome5 name="music" size={48} color={NEUTRAL_600} />
            </View>
          )}
        </View>

        <View style={styles.songInfoContainer}>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.artistName}>{artist?.displayName || 'Unknown Artist'}</Text>
          
          {song.genre && (
            <View style={styles.genreContainer}>
              <Text style={styles.genreText}>{song.genre}</Text>
            </View>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="play-circle-outline" size={16} color={NEUTRAL_600} />
              <Text style={styles.statText}>{song.playCount || 0} plays</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={16} color={NEUTRAL_600} />
              <Text style={styles.statText}>{likeCount} likes</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color={NEUTRAL_600} />
              <Text style={styles.statText}>
                {song.releaseDate ? formatDate(song.releaseDate) : 'Unknown date'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.playerContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    playbackDuration > 0
                      ? (playbackPosition / playbackDuration) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              {formatDuration(Math.floor(playbackPosition))}
            </Text>
            <Text style={styles.timeText}>
              {formatDuration(Math.floor(playbackDuration))}
            </Text>
          </View>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={24} color={NEUTRAL_800} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={24} color={NEUTRAL_800} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#e74c3c' : NEUTRAL_800}
            />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={24} color={NEUTRAL_800} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={24} color={NEUTRAL_800} />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          
          {user && song && song.artistId === user.uid && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToSharedTracks}
            >
              <Ionicons name="people-outline" size={24} color={NEUTRAL_800} />
              <Text style={styles.actionText}>Shared</Text>
            </TouchableOpacity>
          )}
        </View>

        {song.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{song.description}</Text>
          </View>
        )}

        {song.lyrics && (
          <View style={styles.lyricsContainer}>
            <Text style={styles.lyricsTitle}>Lyrics</Text>
            <Text style={styles.lyricsText}>{song.lyrics}</Text>
          </View>
        )}
      </ScrollView>

      {/* Track Sharing Modal */}
      {song && (
        <TrackSharingModal
          visible={showShareModal}
          onClose={closeShareModal}
          track={song}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEUTRAL_200,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NEUTRAL_200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: NEUTRAL_600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NEUTRAL_200,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: NEUTRAL_600,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
  },
  headerRight: {
    width: 40,
  },
  coverArtContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  coverArt: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  placeholderCoverArt: {
    width: 250,
    height: 250,
    backgroundColor: NEUTRAL_100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: NEUTRAL_800,
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    color: NEUTRAL_600,
    marginBottom: 12,
  },
  genreContainer: {
    backgroundColor: NEUTRAL_100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  genreText: {
    fontSize: 14,
    color: NEUTRAL_800,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: NEUTRAL_600,
    marginLeft: 4,
  },
  playerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressBar: {
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
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: NEUTRAL_600,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: NEUTRAL_800,
    marginTop: 4,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: NEUTRAL_800,
    lineHeight: 24,
  },
  lyricsContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  lyricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
    marginBottom: 8,
  },
  lyricsText: {
    fontSize: 16,
    color: NEUTRAL_800,
    lineHeight: 24,
  },
});

export default SongDetailScreen; 