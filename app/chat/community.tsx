import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AthleteProfileCard from '@/components/profile/AthleteProfileCard';
import { MOCK_ATHLETES } from '../../models/Athlete';

// Mock data for community groups
const MOCK_GROUPS = [
  {
    id: '1',
    name: 'NBA Musicians',
    description: 'Basketball players who make music',
    members: 28,
    isPrivate: false,
    joined: false
  },
  {
    id: '2',
    name: 'Football Beats',
    description: 'Football players sharing their tracks',
    members: 42,
    isPrivate: false,
    joined: true
  },
  {
    id: '3',
    name: 'Tennis Rhythms',
    description: 'Tennis players with a passion for music',
    members: 15,
    isPrivate: true,
    joined: false
  },
  {
    id: '4',
    name: 'Soccer Sounds',
    description: 'Soccer players creating music together',
    members: 36,
    isPrivate: false,
    joined: false
  }
];

// Mock data for featured athletes with additional metrics
const FEATURED_ATHLETES = MOCK_ATHLETES.map(athlete => ({
  ...athlete,
  followers: Math.floor(Math.random() * 5000000) + 500000,
  tracks: Math.floor(Math.random() * 50) + 5,
  likes: Math.floor(Math.random() * 10000000) + 1000000,
  isFollowing: Math.random() > 0.5
}));

export default function CommunityScreen() {
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'athletes'
  const [followState, setFollowState] = useState(
    FEATURED_ATHLETES.reduce((acc, athlete) => {
      acc[athlete.id] = athlete.isFollowing;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleFollowPress = (athleteId: string) => {
    setFollowState(prev => ({
      ...prev,
      [athleteId]: !prev[athleteId]
    }));
    
    console.log(`${followState[athleteId] ? 'Unfollowing' : 'Following'} athlete ${athleteId}`);
  };

  const handleJoinGroup = (groupId: string) => {
    // Update the local state to toggle the joined status
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, joined: !group.joined } 
          : group
      )
    );
    
    // In a real app, this would make an API call to join/leave the group
    console.log(`${groups.find(g => g.id === groupId)?.joined ? 'Leaving' : 'Joining'} group ${groupId}`);
  };

  const renderGroupItem = ({ item }: { item: typeof MOCK_GROUPS[number] }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIconContainer}>
          <FontAwesome5 
            name={item.isPrivate ? 'lock' : 'users'} 
            size={20} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription}>{item.description}</Text>
          <Text style={styles.memberCount}>{item.members} members</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.joinButton,
          item.joined ? styles.leaveButton : null
        ]}
        onPress={() => handleJoinGroup(item.id)}
      >
        <Text style={[
          styles.joinButtonText,
          item.joined ? styles.leaveButtonText : null
        ]}>
          {item.joined ? 'Leave Group' : 'Join Group'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const filteredGroups = searchQuery
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  const filteredAthletes = searchQuery
    ? FEATURED_ATHLETES.filter(athlete => 
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.team.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FEATURED_ATHLETES;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'groups' ? styles.activeTabButton : null
          ]}
          onPress={() => setActiveTab('groups')}
        >
          <FontAwesome5 
            name="users" 
            size={16} 
            color={activeTab === 'groups' ? '#007AFF' : '#666'} 
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'groups' ? styles.activeTabText : null
          ]}>
            Groups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'athletes' ? styles.activeTabButton : null
          ]}
          onPress={() => setActiveTab('athletes')}
        >
          <FontAwesome5 
            name="user-friends" 
            size={16} 
            color={activeTab === 'athletes' ? '#007AFF' : '#666'} 
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'athletes' ? styles.activeTabText : null
          ]}>
            Athletes
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'groups' ? "Search groups..." : "Search athletes..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {activeTab === 'groups' ? (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.athletesContent}>
          {filteredAthletes.map(athlete => (
            <AthleteProfileCard
              key={athlete.id}
              id={athlete.id}
              name={athlete.name}
              username={athlete.username}
              sport={athlete.sport}
              team={athlete.team}
              avatar={athlete.avatar}
              isFollowing={followState[athlete.id]}
              onFollowPress={() => handleFollowPress(athlete.id)}
              onProfilePress={() => router.push(`/(tabs)/profile/${athlete.id}`)}
              metrics={[
                { label: 'Followers', value: athlete.followers, icon: 'users' },
                { label: 'Tracks', value: athlete.tracks, icon: 'music' },
                { label: 'Likes', value: athlete.likes, icon: 'heart' }
              ]}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  homeButton: {
    padding: 8,
    position: 'absolute',
    right: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    padding: 16,
  },
  athletesContent: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  leaveButtonText: {
    color: '#007AFF',
  },
});
