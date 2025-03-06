import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/auth';
import { ProfileHeader, ProfileLayout, Text } from '../../../components';
import { defaultTheme } from '../../../constants';
import type { Theme } from '../../../constants/Theme';

// Mock data for athletes (same as in community.tsx)
const MOCK_ATHLETES = [
  {
    id: '1',
    name: 'Michael Jordan',
    username: '@airjordan',
    sport: 'Basketball',
    team: 'Chicago Bulls (Retired)',
    avatar: null,
    followers: 2500,
    following: 120,
    bio: 'Former professional basketball player and principal owner of the Charlotte Hornets. Considered one of the greatest basketball players of all time.',
    songs: [
      { id: '101', title: 'Championship Flow', plays: 1250 },
      { id: '102', title: 'Slam Dunk Beat', plays: 980 }
    ]
  },
  {
    id: '2',
    name: 'Serena Williams',
    username: '@serenawilliams',
    sport: 'Tennis',
    team: 'WTA',
    avatar: null,
    followers: 1800,
    following: 95,
    bio: 'Former professional tennis player. Has won 23 Grand Slam singles titles, the most by any player in the Open Era.',
    songs: [
      { id: '201', title: 'Grand Slam', plays: 1420 },
      { id: '202', title: 'Court Rhythm', plays: 890 }
    ]
  },
  {
    id: '3',
    name: 'LeBron James',
    username: '@kingjames',
    sport: 'Basketball',
    team: 'Los Angeles Lakers',
    avatar: null,
    followers: 2200,
    following: 150,
    bio: 'Professional basketball player for the Los Angeles Lakers. Widely considered one of the greatest players of all time.',
    songs: [
      { id: '301', title: 'King\'s Court', plays: 1680 },
      { id: '302', title: 'Lakers Anthem', plays: 1240 }
    ]
  },
  {
    id: '4',
    name: 'Megan Rapinoe',
    username: '@mrapinoe',
    sport: 'Soccer',
    team: 'OL Reign',
    avatar: null,
    followers: 1600,
    following: 110,
    bio: 'Professional soccer player and captain of OL Reign. Olympic gold medalist and two-time World Cup winner.',
    songs: [
      { id: '401', title: 'Victory Chant', plays: 950 },
      { id: '402', title: 'Field of Dreams', plays: 780 }
    ]
  },
  {
    id: '5',
    name: 'Tom Brady',
    username: '@tombrady',
    sport: 'Football',
    team: 'Tampa Bay Buccaneers (Retired)',
    avatar: null,
    followers: 2100,
    following: 85,
    bio: 'Former NFL quarterback who played 23 seasons. Seven-time Super Bowl champion.',
    songs: [
      { id: '501', title: 'Touchdown', plays: 1320 },
      { id: '502', title: 'Champion\'s Anthem', plays: 1150 }
    ]
  }
];

const AthleteProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [athlete, setAthlete] = useState<(typeof MOCK_ATHLETES)[0] | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' or 'about'

  // Load athlete data
  useEffect(() => {
    // In a real app, this would fetch the athlete data from an API
    const foundAthlete = MOCK_ATHLETES.find(a => a.id === id);
    if (foundAthlete) {
      setAthlete(foundAthlete);
    }
  }, [id]);

  // Toggle follow
  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  // Start chat
  const startChat = () => {
    if (athlete) {
      router.push(`/chat/${athlete.id}`);
    }
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (!athlete) {
    return (
      <ProfileLayout title="Profile" theme={defaultTheme as unknown as Theme}>
        <View style={{padding: 16}}>
          <Text variant="h2">Athlete not found</Text>
        </View>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout
      title={athlete.name}
      showBackButton={true}
      theme={defaultTheme as unknown as Theme}
    >
      {/* Profile Header */}
      <ProfileHeader
        name={athlete.name}
        username={athlete.username}
        bio={athlete.bio}
        sport={athlete.sport}
        team={athlete.team}
        avatar={athlete.avatar || undefined}
        verified={true}
        stats={[
          { label: 'Followers', value: athlete.followers, onPress: () => console.log('Followers pressed') },
          { label: 'Following', value: athlete.following, onPress: () => console.log('Following pressed') },
          { label: 'Songs', value: athlete.songs.length, onPress: () => console.log('Songs pressed') },
        ]}
        isFollowing={isFollowing}
        onFollowPress={toggleFollow}
        onMessagePress={startChat}
        theme={defaultTheme as unknown as Theme}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'songs' ? styles.activeTab : {}
          ]}
          onPress={() => setActiveTab('songs')}
        >
          <Text 
            variant="body1" 
            style={[
              activeTab === 'songs' ? {color: defaultTheme.colors.primary, fontWeight: 'bold'} : {color: defaultTheme.colors.textSecondary}
            ]}
          >
            Songs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'about' ? styles.activeTab : {}
          ]}
          onPress={() => setActiveTab('about')}
        >
          <Text 
            variant="body1" 
            style={[
              activeTab === 'about' ? {color: defaultTheme.colors.primary, fontWeight: 'bold'} : {color: defaultTheme.colors.textSecondary}
            ]}
          >
            About
          </Text>
        </TouchableOpacity>
      </View>

        {/* Tab Content */}
        {activeTab === 'songs' ? (
          <View style={styles.songsContainer}>
            {athlete.songs.map(song => (
              <View key={song.id} style={styles.songCard}>
                <View style={styles.songInfo}>
                  <View style={styles.songCoverArt}>
                    <FontAwesome5 name="music" size={20} color="white" />
                  </View>
                  <View style={styles.songDetails}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songArtist}>{athlete.name}</Text>
                  </View>
                </View>
                <View style={styles.songStats}>
                  <Ionicons name="play" size={14} color="#666" />
                  <Text style={styles.songPlays}>{formatNumber(song.plays)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.aboutContainer}>
            <Text variant="h4" style={styles.aboutTitle}>Bio</Text>
            <Text variant="body1" style={styles.aboutText}>{athlete.bio}</Text>
            
            <Text variant="h4" style={styles.aboutTitle}>Sport</Text>
            <Text variant="body1" style={styles.aboutText}>{athlete.sport}</Text>
            
            <Text variant="h4" style={styles.aboutTitle}>Team</Text>
            <Text variant="body1" style={styles.aboutText}>{athlete.team}</Text>
          </View>
        )}
    </ProfileLayout>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666'
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold'
  },
  songsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  songCoverArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  songDetails: {
    flex: 1
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  songArtist: {
    fontSize: 14,
    color: '#666'
  },
  songStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  songPlays: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666'
  },
  aboutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  aboutTitle: {
    marginBottom: 8,
    marginTop: 16
  },
  aboutText: {
    color: '#333',
    lineHeight: 24
  },
});

export default AthleteProfileScreen;
