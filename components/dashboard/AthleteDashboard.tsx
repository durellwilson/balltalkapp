import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import AuthService from '../../services/AuthService';
import VerificationService from '../../services/VerificationService';
import SongService from '../../services/SongService';
import SubscriptionService from '../../services/SubscriptionService';
import { Theme } from '../../constants/Theme'; // Import Theme
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';

// Define a default theme using Colors
const defaultTheme = {
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    background: '#f5f5f5',
    text: '#212529',
    textSecondary: '#666',
    border: '#f0f0f0',
  }
};

// Define the Theme interface
interface Theme {
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
  };
}

interface AthleteDashboardProps {
  onNavigateToProfile?: () => void;
  onNavigateToStudio?: () => void;
  theme?: Theme; // Make theme prop optional
  limit?: number; // Optional limit for number of athletes to show
  showTitle?: boolean; // Optional flag to show/hide the section title
}

const AthleteDashboard = ({ 
  onNavigateToProfile = () => {}, 
  onNavigateToStudio = () => {}, 
  theme = defaultTheme, // Use default theme if not provided
  limit,
  showTitle = true
}: AthleteDashboardProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'none';
  }>({ isVerified: false, status: 'none' });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [recentSongs, setRecentSongs] = useState<any[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user?.uid]);

  const loadDashboardData = async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading dashboard data for user:', user.uid);
      
      // Get user profile data
      let userData;
      try {
        userData = await AuthService.getUserDocument(user.uid);
        console.log('User profile data loaded:', userData ? 'success' : 'not found');
      } catch (profileError) {
        console.error('Error loading user profile:', profileError);
        userData = {
          displayName: user.displayName || 'Athlete',
          email: user.email,
          uid: user.uid,
          role: 'athlete',
          createdAt: new Date().toISOString()
        };
      }
      setUserProfile(userData);

      // Get verification status
      let verificationData;
      try {
        verificationData = await VerificationService.getUserVerificationStatus(user.uid);
        console.log('Verification status loaded:', verificationData);
      } catch (verificationError) {
        console.error('Error loading verification status:', verificationError);
        verificationData = { isVerified: false, status: 'none' };
      }
      setVerificationStatus(verificationData);

      // Get subscriber count
      let subscribers = [];
      try {
        subscribers = await SubscriptionService.getAthleteSubscribers(user.uid);
        console.log('Subscriber count loaded:', subscribers.length);
      } catch (subscriberError) {
        console.error('Error loading subscribers:', subscriberError);
        subscribers = [];
      }
      setSubscriberCount(subscribers.length);

      // Get recent songs
      let songs = [];
      try {
        songs = await SongService.getSongsByArtist(user.uid);
        console.log('Songs loaded:', songs.length);
      } catch (songsError) {
        console.error('Error loading songs:', songsError);
        songs = [];
      }
      setRecentSongs(songs.slice(0, 3)); // Get only the 3 most recent songs

      // Calculate total plays
      const totalPlaysCount = songs.reduce((total, song) => total + (song.playCount || 0), 0);
      setTotalPlays(totalPlaysCount);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set fallback data to prevent UI from being stuck in loading state
      if (!userProfile) {
        setUserProfile({
          displayName: user.displayName || 'Athlete',
          email: user.email,
          uid: user.uid,
          role: 'athlete',
          createdAt: new Date().toISOString()
        });
      }
      if (verificationStatus.status === 'none') {
        setVerificationStatus({ isVerified: false, status: 'none' });
      }
      if (recentSongs.length === 0) {
        setRecentSongs([]);
      }
    } finally {
      // Always set loading to false, even if there are errors
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Get a welcome message based on the time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning! Ready to create some music?";
    } else if (hour < 18) {
      return "Good afternoon! How's your day going?";
    } else {
      return "Good evening! Time to make some beats?";
    }
  };

  const renderWelcomeSection = () => {
    return (
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeHeaderText}>
            {showTitle && (
              <>
                <Text style={styles.welcomeText}>
                  Welcome back, <Text style={styles.nameText}>{user?.displayName || 'Athlete'}</Text>
                </Text>
                <Text style={styles.welcomeSubtext}>
                  {getWelcomeMessage()}
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onNavigateToProfile}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {!user?.isVerified ? (
          <TouchableOpacity
            style={styles.verificationButton}
            onPress={() => router.push('/verification-test')}
          >
            <Ionicons name="shield-checkmark" size={20} color="white" />
            <Text style={styles.verificationButtonText}>
              Verify Your Athlete Status
            </Text>
          </TouchableOpacity>
        ) : user?.verificationStatus === 'pending' ? (
          <View style={styles.verificationPendingBanner}>
            <Ionicons name="time" size={20} color="#6c757d" />
            <Text style={styles.verificationPendingText}>
              Your verification is being processed. We'll notify you once it's complete.
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderStatsSection = () => {
    return (
      <View style={styles.statsSection}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Your Stats</Text>
        )}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{subscriberCount}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{recentSongs.length}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPlays}</Text>
            <Text style={styles.statLabel}>Total Plays</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentMusicSection = () => {
    if (recentSongs.length === 0) {
      return (
        <View style={styles.emptyMusicSection}>
          <FontAwesome5 name="music" size={40} color="#ccc" />
          <Text style={styles.emptyMusicTitle}>No Music Yet</Text>
          <Text style={styles.emptyMusicText}>
            You haven't created any music yet. Head to the studio to get started!
          </Text>
          <TouchableOpacity
            style={styles.createMusicButton}
            onPress={onNavigateToStudio}
          >
            <Text style={styles.createMusicButtonText}>Go to Studio</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Apply limit if provided
    const songsToShow = limit ? recentSongs.slice(0, limit) : recentSongs;

    return (
      <View style={styles.recentMusicSection}>
        {showTitle && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Music</Text>
            <TouchableOpacity onPress={() => router.push('/songs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
        )}

        {songsToShow.map((song) => (
          <View key={song.id} style={styles.songCard}>
            <View style={styles.songThumbnail}>
              {song.coverUrl ? (
                <Image
                  source={{ uri: song.coverUrl }}
                  style={styles.songImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.songImagePlaceholder}>
                  <FontAwesome5 name="music" size={20} color="#999" />
                </View>
              )}
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songGenre}>{song.genre}</Text>
              <View style={styles.songStats}>
                <View style={styles.statItem}>
                  <Ionicons name="play" size={14} color="#999" />
                  <Text style={styles.statValue}>{song.playCount || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color="#999" />
                  <Text style={styles.statValue}>{song.likeCount || 0}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.playSongButton}
              onPress={() => router.push(`/songs/${song.id}`)}
            >
              <Ionicons name="play-circle" size={36} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActionsSection = () => {
    return (
      <View style={styles.quickActionsSection}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        )}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={onNavigateToStudio}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="mic" size={24} color="white" />
            </View>
            <Text style={styles.quickActionTitle}>Record</Text>
            <Text style={styles.quickActionSubtitle}>Create new music</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/songs')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#5856D6' }]}>
              <Ionicons name="musical-notes" size={24} color="white" />
            </View>
            <Text style={styles.quickActionTitle}>My Songs</Text>
            <Text style={styles.quickActionSubtitle}>Manage your music</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/community')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#34C759' }]}>
              <Ionicons name="people" size={24} color="white" />
            </View>
            <Text style={styles.quickActionTitle}>Community</Text>
            <Text style={styles.quickActionSubtitle}>Connect with others</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={onNavigateToProfile}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={styles.quickActionTitle}>Profile</Text>
            <Text style={styles.quickActionSubtitle}>Edit your profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {renderWelcomeSection()}
      {renderStatsSection()}
      {renderRecentMusicSection()}
      {renderQuickActionsSection()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
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
  welcomeSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#dee2e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
    welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  welcomeHeaderText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  nameText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileText: {
    color: '#007bff',
    marginLeft: 4,
    fontWeight: '500',
  },
  verificationButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  verificationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  verificationPendingBanner: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
  },
  verificationPendingText: {
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#dee2e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptyMusicSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#dee2e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyMusicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#212529',
  },
  emptyMusicText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createMusicButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  createMusicButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentMusicSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#dee2e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#007bff',
    fontWeight: '500',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  songThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  songImage: {
    width: '100%',
    height: '100%',
  },
  songImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#212529',
  },
  songGenre: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  songStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  playSongButton: {
    padding: 8,
  },
  quickActionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#dee2e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default AthleteDashboard;
