import React, { useState } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { MOCK_ATHLETES } from '../../models/Athlete';

// Mock data for featured athletes with additional metrics
const FEATURED_ATHLETES = MOCK_ATHLETES.map(athlete => ({
  ...athlete,
  followers: Math.floor(Math.random() * 5000000) + 500000,
  tracks: Math.floor(Math.random() * 50) + 5,
  likes: Math.floor(Math.random() * 10000000) + 1000000,
  isFollowing: Math.random() > 0.5
}));

// Mock data for chats
const MOCK_CHATS = [
  {
    id: '1',
    name: 'NBA Musicians',
    lastMessage: 'LeBron: Just dropped a new track!',
    timestamp: '2h ago',
    isGroup: true
  },
  {
    id: '2',
    name: 'Michael Jordan',
    lastMessage: 'Hey there! Thanks for connecting.',
    timestamp: '1h ago',
    isGroup: false
  },
  {
    id: '3',
    name: 'Serena Williams',
    lastMessage: 'Check out my new song!',
    timestamp: '3h ago',
    isGroup: false
  }
];

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

export default function ChatTab() {
  return <Redirect href="/chat" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
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
    padding: 16
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  chatInfo: {
    flex: 1
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  timestamp: {
    fontSize: 12,
    color: '#999'
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
