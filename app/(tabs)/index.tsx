import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AthleteDashboard } from '../../components';
import SongService from '../../services/SongService';
import { Song } from '../../models/Song';
import { safeRender, safeLog } from '../../utils/debugging';
import { inspectObject } from '../../utils/errorDebugger';

const TabsHome = () => {
  const { user } = useAuth();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Log user object to help debug [object Object] errors
  useEffect(() => {
    if (user) {
      console.log('Current user data:');
      inspectObject(user, 'User object in TabsHome');
    }
  }, [user]);

  // Load trending songs
  useEffect(() => {
    const loadTrendingSongs = async () => {
      setIsLoading(true);
      try {
        // In a real app we would fetch trending songs from the API
        // For now we'll use a mock implementation
        const mockSongs: Song[] = [
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
            playCount: 1250,
            likeCount: 342
          },
          {
            id: '2',
            artistId: 'artist2',
            title: 'Overtime',
            description: 'Pushing beyond limits',
            genre: 'Rap',
            releaseDate: new Date().toISOString(),
            fileUrl: 'https://example.com/song2.mp3',
            duration: 210,
            visibility: 'public',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            playCount: 980,
            likeCount: 256
          },
          {
            id: '3',
            artistId: 'artist3',
            title: 'Champion Mindset',
            description: 'The mentality of a winner',
            genre: 'R&B',
            releaseDate: new Date().toISOString(),
            fileUrl: 'https://example.com/song3.mp3',
            duration: 195,
            visibility: 'public',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            playCount: 1420,
            likeCount: 389
          }
        ];

        setTrendingSongs(mockSongs);
      } catch (error) {
        console.error('Error loading trending songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingSongs();
  }, []);

  // Play a song
  const playSong = (songId: string) => {
    if (currentlyPlaying === songId) {
      // Stop playing
      setCurrentlyPlaying(null);
    } else {
      // Start playing
      setCurrentlyPlaying(songId);

      // Auto-stop after 5 seconds (simulating end of audio)
      setTimeout(() => {
        setCurrentlyPlaying(null);
      }, 5000);
    }
  };

  // Format play count
  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Get user display name safely
  const getUserDisplayName = () => {
    if (!user) return '';
    
    // Check if user has displayName property and it's a string
    if (user.displayName && typeof user.displayName === 'string') {
      return user.displayName;
    }
    
    // Check if user has username property and it's a string
    if (user.username && typeof user.username === 'string') {
      return user.username;
    }
    
    return 'Athlete'; // Default fallback
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
  <Text style={styles.title}>BallTalk</Text>
  <TouchableOpacity 
    style={styles.profileButton}
    onPress={() => router.push('/profile/1')}
  >
    <Ionicons name="person-circle" size={40} color="#007AFF" />
  </TouchableOpacity>
</View>

      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          Welcome to BallTalk{user ? ` ${getUserDisplayName()}` : ''}!
        </Text>
        <Text style={styles.welcomeText}>
          The exclusive music platform for professional athletes to create, share, and connect through music.
        </Text>

        {!user && (
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signupButtonText}>Sign In / Sign Up</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Featured Athletes Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Athletes</Text>
        <TouchableOpacity onPress={() => router.push('/athlete-examples')}>
          <Text style={styles.viewAll}>View Examples</Text>
        </TouchableOpacity>
      </View>
      <AthleteDashboard 
        limit={2} 
        showTitle={false} 
        onNavigateToProfile={() => router.push('/athlete-profile')}
        onNavigateToStudio={() => router.push('/studio')}
      />
      
      {/* Core Features Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Core Features</Text>
      </View>

      <View style={styles.featuresGrid}>
        {/* Studio Feature */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/studio')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FF9500' }]}>
            <MaterialIcons name="music-note" size={32} color="white" />
          </View>
          <Text style={styles.featureTitle}>Studio</Text>
          <Text style={styles.featureDescription}>
            Create and produce music
          </Text>
        </TouchableOpacity>

        {/* My Songs Feature */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/songs')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#007AFF' }]}>
            <FontAwesome5 name="compact-disc" size={28} color="white" />
          </View>
          <Text style={styles.featureTitle}>My Songs</Text>
          <Text style={styles.featureDescription}>
            Manage your music library
          </Text>
        </TouchableOpacity>

        {/* Community Feature */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/community')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#34C759' }]}>
            <Ionicons name="people" size={32} color="white" />
          </View>
          <Text style={styles.featureTitle}>Community</Text>
          <Text style={styles.featureDescription}>
            Connect with athletes
          </Text>
        </TouchableOpacity>

        {/* Fan Hub Feature */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/fan-hub')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#5856D6' }]}>
            <Ionicons name="star" size={32} color="white" />
          </View>
          <Text style={styles.featureTitle}>Fan Hub</Text>
          <Text style={styles.featureDescription}>
            Authentication & fan access
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trending Songs Section */}
      <View style={styles.trendingSection}>
        <Text style={styles.sectionTitle}>Trending Songs</Text>

        {trendingSongs.map(song => (
          <View key={song.id} style={styles.songCard}>
            <View style={styles.songInfo}>
              <View style={styles.coverArt}>
                <View style={styles.placeholderCover}>
                  <FontAwesome5 name="music" size={24} color="white" />
                </View>
              </View>

              <View style={styles.songDetails}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songArtist}>Artist Name</Text>
                <Text style={styles.songGenre}>{song.genre}</Text>
              </View>
            </View>

            <View style={styles.songControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playSong(song.id)}
              >
                <Ionicons
                  name={currentlyPlaying === song.id ? "pause" : "play"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              <View style={styles.songStats}>
                <View style={styles.statItem}>
                  <Ionicons name="play" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {formatCount(song.playCount)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {formatCount(song.likeCount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  profileButton: {
    padding: 4
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22
  },
  signupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center'
  },
  signupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  viewAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  trendingSection: {
    marginBottom: 24
  },
  songCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2
  },
  songInfo: {
    flexDirection: 'row',
    marginBottom: 12
  },
  coverArt: {
    width: 60,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  songDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  songGenre: {
    fontSize: 12,
    color: '#999'
  },
  songControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  songStats: {
    flexDirection: 'row'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666'
  }
});

export default TabsHome;
