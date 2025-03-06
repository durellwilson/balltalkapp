import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AthleteProfileCard from '../../components/profile/AthleteProfileCard';
import { MOCK_ATHLETES } from '../../models/Athlete';

// Mock data for featured athletes with additional metrics
const FEATURED_ATHLETES = MOCK_ATHLETES.map(athlete => ({
  ...athlete,
  followers: Math.floor(Math.random() * 5000000) + 500000,
  tracks: Math.floor(Math.random() * 50) + 5,
  likes: Math.floor(Math.random() * 10000000) + 1000000,
  isFollowing: Math.random() > 0.5
}));

// Mock data for upcoming events
const UPCOMING_EVENTS = [
  {
    id: '1',
    title: 'Live Studio Session with LeBron',
    date: 'March 10, 2025',
    time: '8:00 PM EST',
    image: 'https://example.com/event1.jpg'
  },
  {
    id: '2',
    title: 'Serena Williams Album Drop Party',
    date: 'March 15, 2025',
    time: '9:00 PM EST',
    image: 'https://example.com/event2.jpg'
  },
  {
    id: '3',
    title: 'Q&A Session with Kevin Durant',
    date: 'March 18, 2025',
    time: '7:30 PM EST',
    image: 'https://example.com/event3.jpg'
  }
];

export default function FanHubScreen() {
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

  const renderEventItem = ({ item }: { item: typeof UPCOMING_EVENTS[number] }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => console.log('Navigate to event', item.id)}
    >
      <View style={styles.eventImageContainer}>
        <View style={styles.eventImagePlaceholder}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
        </View>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date} • {item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fan Hub</Text>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <FlatList
            data={UPCOMING_EVENTS}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsListContent}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Athletes</Text>
          
          {FEATURED_ATHLETES.map(athlete => (
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
        </View>
      </ScrollView>
    </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  eventsListContent: {
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 280,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  eventImageContainer: {
    height: 140,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  }
});
