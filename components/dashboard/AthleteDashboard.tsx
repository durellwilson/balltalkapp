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

interface AthleteDashboardProps {
  onNavigateToProfile: () => void;
  onNavigateToStudio: () => void;
  theme: Theme; // Add theme prop
}

const AthleteDashboard = ({ onNavigateToProfile, onNavigateToStudio, theme }: AthleteDashboardProps) => {
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
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      // Get user profile data
      const userData = await AuthService.getUserDocument(user.uid);
      setUserProfile(userData);

      // Get verification status
      const verificationData = await VerificationService.getUserVerificationStatus(user.uid);
      setVerificationStatus(verificationData);

      // Get subscriber count
      const subscribers = await SubscriptionService.getAthleteSubscribers(user.uid);
      setSubscriberCount(subscribers.length);

      // Get recent songs
      const songs = await SongService.getSongsByArtist(user.uid);
      setRecentSongs(songs.slice(0, 3)); // Get only the 3 most recent songs

      // Calculate total plays
      const totalPlaysCount = songs.reduce((total, song) => total + (song.playCount || 0), 0);
      setTotalPlays(totalPlaysCount);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderWelcomeSection = () => {
    const displayName = user?.displayName || user?.username || 'Athlete';
    const isVerified = verificationStatus.isVerified;
    
    return (
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeHeaderText}>
            <Text style={styles.welcomeText}>
              Welcome, <Text style={styles.nameText}>{displayName}</Text>
              {isVerified && <MaterialIcons name="verified" size={20} color={theme.colors.primary} style={{marginLeft: 4}} />}
            </Text>
            <Text style={styles.welcomeSubtext}>
              Your athlete dashboard
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onNavigateToProfile}
          >
            <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {!isVerified && verificationStatus.status !== 'pending' && (
          <TouchableOpacity 
            style={styles.verificationButton}
            onPress={onNavigateToProfile}
          >
            <MaterialIcons name="verified" size={20} color="white" />
            <Text style={styles.verificationButtonText}>Verify Athlete Status</Text>
          </TouchableOpacity>
        )}
        
        {verificationStatus.status === 'pending' && (
          <View style={styles.verificationPendingBanner}>
            <Ionicons name="time-outline" size={20} color="#f39c12" />
            <Text style={styles.verificationPendingText}>
              Your verification is pending. We'll notify you once it's approved.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStatsSection = () => {
    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
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
            Start creating and sharing your music with fans
          </Text>
          <TouchableOpacity 
            style={styles.createMusicButton}
            onPress={onNavigateToStudio}
          >
            <Text style={styles.createMusicButtonText}>Create Music</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.recentMusicSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Recent Music</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentSongs.map((song, index) => (
          <TouchableOpacity key={index} style={styles.songCard}>
            <View style={styles.songThumbnail}>
              {song.coverArtUrl ? (
                <Image source={{ uri: song.coverArtUrl }} style={styles.songImage} />
              ) : (
                <View style={styles.songImagePlaceholder}>
                  <FontAwesome5 name="music" size={24} color="#ccc" />
                </View>
              )}
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songGenre}>{song.genre}</Text>
              <View style={styles.songStats}>
                <Text style={styles.songStatText}>
                  <Ionicons name="play" size={12} color="#666" /> {song.playCount || 0}
                </Text>
                <Text style={styles.songStatText}>
                  <Ionicons name="heart" size={12} color="#666" /> {song.likeCount || 0}
                </Text>
              </View>
            </View>
            <MaterialIcons name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.createMusicButton}
          onPress={onNavigateToStudio}
        >
          <Text style={styles.createMusicButtonText}>Create New Music</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickActionsSection = () => {
    return (
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToStudio}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#e6f7ff' }]}>
            <Ionicons name="mic" size={24} color="#0099ff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Record Music</Text>
            <Text style={styles.actionDescription}>Create new tracks in the studio</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#fff0e6' }]}>
            <Ionicons name="people" size={24} color="#ff8c00" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Subscribers</Text>
            <Text style={styles.actionDescription}>View and interact with your fans</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#e6ffe6' }]}>
            <Ionicons name="stats-chart" size={24} color="#00cc00" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionDescription}>Track your music performance</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#f0e6ff' }]}>
            <Ionicons name="chatbubbles" size={24} color="#8c00ff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionDescription}>Communicate with other athletes</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    backgroundColor: theme.colors.background,
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
    shadowColor: theme.colors.border,
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
    color: theme.colors.text,
    marginBottom: 4,
  },
  nameText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
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
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  verificationButton: {
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
  },
  verificationPendingText: {
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptyMusicSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: theme.colors.border,
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
    color: theme.colors.text,
  },
  emptyMusicText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createMusicButton: {
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.border,
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
    color: theme.colors.primary,
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
    color: theme.colors.text,
  },
  songGenre: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  songStats: {
    flexDirection: 'row',
  },
  songStatText: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  quickActionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default AthleteDashboard;
