import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Button, Card, ActionButton } from '@/components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/auth';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Mock data for reels/short content
const MOCK_REELS = [
  {
    id: '1',
    title: 'Basketball Highlights',
    creator: 'LeBron James',
    likes: 15200,
    comments: 320,
    videoUrl: 'https://example.com/video1.mp4',
    thumbnail: 'https://via.placeholder.com/300x500',
    isVerified: true,
  },
  {
    id: '2',
    title: 'Game Day Vibes',
    creator: 'Stephen Curry',
    likes: 8500,
    comments: 152,
    videoUrl: 'https://example.com/video2.mp4',
    thumbnail: 'https://via.placeholder.com/300x500',
    isVerified: true,
  },
  {
    id: '3',
    title: 'Pre-Game Ritual',
    creator: 'Giannis Antetokounmpo',
    likes: 12300,
    comments: 210,
    videoUrl: 'https://example.com/video3.mp4',
    thumbnail: 'https://via.placeholder.com/300x500',
    isVerified: true,
  },
  {
    id: '4',
    title: 'Training Session',
    creator: 'Kevin Durant',
    likes: 9600,
    comments: 175,
    videoUrl: 'https://example.com/video4.mp4',
    thumbnail: 'https://via.placeholder.com/300x500',
    isVerified: true,
  },
];

type ReelItem = {
  id: string;
  title: string;
  creator: string;
  likes: number;
  comments: number;
  videoUrl: string;
  thumbnail: string;
  isVerified: boolean;
};

const ReelCard = ({ item }: { item: ReelItem }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  return (
    <View style={styles.reelContainer}>
      <View style={styles.thumbnailContainer}>
        {/* Placeholder for video/image */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.placeholderText}>Reel</Text>
          <ActionButton 
            style={styles.playButton} 
            onPress={togglePlay}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={28} 
              color="white" 
            />
          </ActionButton>
        </View>
      </View>
      
      <View style={styles.reelInfoContainer}>
        <View style={styles.creatorRow}>
          <Text style={styles.creatorName}>{item.creator}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.verifiedBadge} />
          )}
        </View>
        
        <Text style={styles.reelTitle}>{item.title}</Text>
        
        <View style={styles.interactionRow}>
          <ActionButton style={styles.interactionButton} onPress={toggleLike}>
            <FontAwesome
              name={isLiked ? "heart" : "heart-o"}
              size={20}
              color={isLiked ? "#FF3B30" : "#666"}
            />
            <Text style={styles.interactionText}>{formatNumber(item.likes)}</Text>
          </ActionButton>
          
          <ActionButton style={styles.interactionButton}>
            <FontAwesome name="comment-o" size={20} color="#666" />
            <Text style={styles.interactionText}>{formatNumber(item.comments)}</Text>
          </ActionButton>
          
          <ActionButton style={styles.interactionButton}>
            <FontAwesome name="share" size={20} color="#666" />
          </ActionButton>
        </View>
      </View>
    </View>
  );
};

/**
 * DiscoverScreen Component
 * 
 * The discover screen for fans to explore content from athletes.
 * Only accessible to users with the 'fan' role.
 */
export default function DiscoverScreen() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isFan = user?.role === 'fan';
  
  // If user is not a fan, show access denied message
  if (!isFan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>
            Discover Access Restricted
          </Text>
          <Text style={styles.accessDeniedMessage}>
            The Discover feature is only available to fan accounts.
          </Text>
          <Button
            title="Go to Home"
            onPress={() => router.replace('/(tabs)/')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <ActionButton style={[styles.tabButton, styles.activeTab]}>
          <Text style={styles.activeTabText}>For You</Text>
        </ActionButton>
        <ActionButton style={styles.tabButton}>
          <Text style={styles.tabText}>Following</Text>
        </ActionButton>
        <ActionButton style={styles.tabButton}>
          <Text style={styles.tabText}>Trending</Text>
        </ActionButton>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={MOCK_REELS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ReelCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 10,
  },
  reelContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    marginHorizontal: 10,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
  },
  thumbnailContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#ddd',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelInfoContainer: {
    padding: 15,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  creatorName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifiedBadge: {
    marginLeft: 5,
  },
  reelTitle: {
    fontSize: 15,
    marginBottom: 10,
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'transparent',
    padding: 5,
  },
  interactionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
  },
});
