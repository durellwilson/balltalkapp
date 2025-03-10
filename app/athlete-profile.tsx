import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Text, Button, Badge } from '@/components/themed';

// Mock data for demonstration
const MOCK_ATHLETE = {
  id: '123',
  name: 'Michael Jordan',
  username: 'airjordan',
  sport: 'Basketball',
  team: 'Chicago Bulls',
  position: 'Shooting Guard',
  verified: true,
  followers: 23000000,
  profileImage: 'https://via.placeholder.com/150',
  coverImage: 'https://via.placeholder.com/500x200',
  bio: 'Six-time NBA champion, five-time MVP. Considered the greatest basketball player of all time.',
  stats: [
    { label: 'Championships', value: 6 },
    { label: 'MVP Awards', value: 5 },
    { label: 'All-Star', value: 14 },
  ],
  content: {
    podcasts: 12,
    music: 8,
    videos: 23,
  }
};

// Mock content data
const MOCK_CONTENT = [
  { id: '1', type: 'podcast', title: 'My Journey in Basketball', duration: '45:22', thumbnail: 'https://via.placeholder.com/300' },
  { id: '2', type: 'music', title: 'Champion Anthem', duration: '3:45', thumbnail: 'https://via.placeholder.com/300' },
  { id: '3', type: 'video', title: 'Training Session Highlights', duration: '12:30', thumbnail: 'https://via.placeholder.com/300' },
  { id: '4', type: 'podcast', title: 'Interview with Coach Phil', duration: '32:10', thumbnail: 'https://via.placeholder.com/300' },
  { id: '5', type: 'music', title: 'Victory Lap', duration: '4:12', thumbnail: 'https://via.placeholder.com/300' },
];

export default function AthleteProfileScreen() {
  const params = useLocalSearchParams();
  const athleteId = params.id as string;
  
  const [athlete, setAthlete] = useState<typeof MOCK_ATHLETE | null>(null);
  const [content, setContent] = useState<typeof MOCK_CONTENT>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch athlete data
  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        // In a real app, you would fetch data from an API
        // For now, we'll use mock data with a delay to simulate network request
        setTimeout(() => {
          setAthlete(MOCK_ATHLETE);
          setContent(MOCK_CONTENT);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching athlete data:', error);
        setIsLoading(false);
      }
    };

    fetchAthleteData();
  }, [athleteId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In a real app, you would refetch data from an API
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Filter content based on active tab
  const filteredContent = activeTab === 'all' 
    ? content 
    : content.filter(item => item.type === activeTab);

  // Format follower count
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!athlete) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Athlete not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Stack.Screen
        options={{
          headerTitle: athlete.name,
          headerTransparent: true,
          headerTintColor: 'white',
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Cover Image with Gradient Overlay */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: athlete.coverImage }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: athlete.profileImage }}
              style={styles.profileImage}
            />
            {athlete.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{athlete.name}</Text>
              <Text style={styles.username}>@{athlete.username}</Text>
            </View>

            <View style={styles.detailsContainer}>
              <Badge label={athlete.sport} color={Colors.accent1} />
              {athlete.team && <Badge label={athlete.team} color={Colors.accent3} />}
              {athlete.position && <Badge label={athlete.position} color={Colors.accent2} />}
            </View>

            <Text style={styles.bio}>{athlete.bio}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.followersContainer}>
                <Text style={styles.followersCount}>{formatFollowers(athlete.followers)}</Text>
                <Text style={styles.followersLabel}>Followers</Text>
              </View>

              <Button
                onPress={handleFollowToggle}
                title={isFollowing ? 'Following' : 'Follow'}
                type={isFollowing ? 'outline' : 'primary'}
                size="small"
                style={styles.followButton}
              />
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {athlete.stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Content Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'podcast' && styles.activeTab]}
            onPress={() => handleTabChange('podcast')}
          >
            <Text style={[styles.tabText, activeTab === 'podcast' && styles.activeTabText]}>
              Podcasts ({athlete.content.podcasts})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'music' && styles.activeTab]}
            onPress={() => handleTabChange('music')}
          >
            <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>
              Music ({athlete.content.music})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'video' && styles.activeTab]}
            onPress={() => handleTabChange('video')}
          >
            <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>
              Videos ({athlete.content.videos})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        <View style={styles.contentContainer}>
          {filteredContent.length === 0 ? (
            <Text style={styles.noContentText}>No content available</Text>
          ) : (
            filteredContent.map((item) => (
              <TouchableOpacity key={item.id} style={styles.contentCard}>
                <Image source={{ uri: item.thumbnail }} style={styles.contentThumbnail} />
                <View style={styles.contentInfo}>
                  <View style={styles.contentTypeContainer}>
                    <Ionicons 
                      name={
                        item.type === 'podcast' ? 'mic' : 
                        item.type === 'music' ? 'musical-notes' : 'videocam'
                      } 
                      size={14} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.contentType}>{item.type}</Text>
                  </View>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.contentDuration}>{item.duration}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  profileImageContainer: {
    position: 'absolute',
    top: -50,
    left: 16,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.light.cardBackground,
    overflow: 'hidden',
    zIndex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 2,
  },
  infoContainer: {
    marginTop: 60,
    paddingTop: 8,
  },
  nameContainer: {
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  bio: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  followersContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  followersCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  followersLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  followButton: {
    minWidth: 120,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.cardBackgroundLight,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  noContentText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 24,
  },
  contentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentThumbnail: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  contentInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  contentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contentType: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentDuration: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
