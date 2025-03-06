import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  ActivityIndicator,
  Image
} from 'react-native';
import { Text, Card, ActionButton, Badge } from '../../components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// Mock data for podcasts
const MOCK_PODCASTS = [
  {
    id: '1',
    title: 'The Basketball Mind',
    host: 'Damian Lillard',
    thumbnail: 'https://via.placeholder.com/300',
    duration: '45:32',
    episodeCount: 32,
    isNew: true,
  },
  {
    id: '2',
    title: 'Sports & Music',
    host: 'Stephen Curry',
    thumbnail: 'https://via.placeholder.com/300',
    duration: '32:15',
    episodeCount: 24,
    isNew: false,
  },
  {
    id: '3',
    title: 'Court Side Stories',
    host: 'Lisa Leslie',
    thumbnail: 'https://via.placeholder.com/300',
    duration: '58:21',
    episodeCount: 41,
    isNew: true,
  },
  {
    id: '4',
    title: 'From Athletics to Music',
    host: 'J. Cole & Kevin Durant',
    thumbnail: 'https://via.placeholder.com/300',
    duration: '1:04:18',
    episodeCount: 15,
    isNew: false,
  },
];

// Mock data for live streams
const MOCK_LIVESTREAMS = [
  {
    id: '1',
    title: 'Pre-Game Music Session',
    host: 'Kyrie Irving',
    thumbnail: 'https://via.placeholder.com/500x300',
    viewers: 1245,
    isLive: true,
  },
  {
    id: '2',
    title: 'Q&A with Fans',
    host: 'Candace Parker',
    thumbnail: 'https://via.placeholder.com/500x300',
    viewers: 875,
    isLive: true,
  },
  {
    id: '3',
    title: 'Studio Session - New Track Preview',
    host: 'Damian Lillard',
    thumbnail: 'https://via.placeholder.com/500x300',
    viewers: 2450,
    isLive: true,
  },
];

type PodcastItem = {
  id: string;
  title: string;
  host: string;
  thumbnail: string;
  duration: string;
  episodeCount: number;
  isNew: boolean;
};

type LiveStreamItem = {
  id: string;
  title: string;
  host: string;
  thumbnail: string;
  viewers: number;
  isLive: boolean;
};

const LiveStreamCard = ({ item }: { item: LiveStreamItem }) => {
  return (
    <TouchableOpacity style={styles.liveStreamCard}>
      <ImageBackground
        source={{ uri: item.thumbnail }}
        style={styles.liveStreamThumbnail}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.liveStreamOverlay}>
          <View style={styles.liveIndicatorContainer}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.viewerCount}>
              <Ionicons name="eye" size={14} color="white" /> {item.viewers.toLocaleString()}
            </Text>
          </View>
        </View>
      </ImageBackground>
      <View style={styles.liveStreamInfo}>
        <Text style={styles.liveStreamTitle}>{item.title}</Text>
        <Text style={styles.liveStreamHost}>{item.host}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PodcastCard = ({ item }: { item: PodcastItem }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <Card style={styles.podcastCard}>
      <View style={styles.podcastThumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.podcastThumbnail} />
        <ActionButton style={styles.playPauseButton} onPress={togglePlay}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={22}
            color="white"
          />
        </ActionButton>
      </View>
      <View style={styles.podcastInfo}>
        <View style={styles.podcastTitleRow}>
          <Text style={styles.podcastTitle} numberOfLines={1}>{item.title}</Text>
          {item.isNew && <Badge style={styles.newBadge}>New</Badge>}
        </View>
        <Text style={styles.podcastHost}>{item.host}</Text>
        <View style={styles.podcastStats}>
          <Text style={styles.podcastDuration}>
            <Ionicons name="time-outline" size={14} color="#666" /> {item.duration}
          </Text>
          <Text style={styles.podcastEpisodes}>
            <Ionicons name="list" size={14} color="#666" /> {item.episodeCount} episodes
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default function PodcastsScreen() {
  const [activeTab, setActiveTab] = useState<'podcast' | 'live'>('live');
  const [loading, setLoading] = useState(false);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live & Podcasts</Text>
        <ActionButton style={styles.createButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </ActionButton>
      </View>
      
      <View style={styles.tabsContainer}>
        <ActionButton 
          style={[
            styles.tabButton, 
            activeTab === 'live' && styles.activeTab
          ]}
          onPress={() => setActiveTab('live')}
        >
          <FontAwesome5 
            name="broadcast-tower" 
            size={16} 
            color={activeTab === 'live' ? "#007AFF" : "#666"} 
            style={styles.tabIcon} 
          />
          <Text 
            style={
              activeTab === 'live' 
                ? styles.activeTabText 
                : styles.tabText
            }
          >
            Live
          </Text>
        </ActionButton>
        
        <ActionButton 
          style={[
            styles.tabButton, 
            activeTab === 'podcast' && styles.activeTab
          ]}
          onPress={() => setActiveTab('podcast')}
        >
          <FontAwesome5 
            name="podcast" 
            size={16} 
            color={activeTab === 'podcast' ? "#007AFF" : "#666"} 
            style={styles.tabIcon} 
          />
          <Text 
            style={
              activeTab === 'podcast' 
                ? styles.activeTabText 
                : styles.tabText
            }
          >
            Podcasts
          </Text>
        </ActionButton>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'live' ? (
            <>
              <Text style={styles.sectionTitle}>Trending Live</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.liveStreamContainer}
                contentContainerStyle={styles.liveStreamContent}
              >
                {MOCK_LIVESTREAMS.map(stream => (
                  <LiveStreamCard key={stream.id} item={stream} />
                ))}
              </ScrollView>
              
              <View style={styles.upcomingContainer}>
                <Text style={styles.sectionTitle}>Upcoming Live Streams</Text>
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleDay}>TODAY</Text>
                    <Text style={styles.scheduleHour}>8:00 PM</Text>
                  </View>
                  <View style={styles.scheduleDivider} />
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleTitle}>Studio Session: New Album Preview</Text>
                    <Text style={styles.scheduleHost}>Miles Bridges</Text>
                  </View>
                  <ActionButton style={styles.notifyButton}>
                    <Ionicons name="notifications-outline" size={20} color="#007AFF" />
                  </ActionButton>
                </View>
                
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleDay}>TUE</Text>
                    <Text style={styles.scheduleHour}>5:30 PM</Text>
                  </View>
                  <View style={styles.scheduleDivider} />
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleTitle}>Q&A and Beats</Text>
                    <Text style={styles.scheduleHost}>Shaquille O'Neal</Text>
                  </View>
                  <ActionButton style={styles.notifyButton}>
                    <Ionicons name="notifications-outline" size={20} color="#007AFF" />
                  </ActionButton>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Popular Podcasts</Text>
              {MOCK_PODCASTS.map(podcast => (
                <PodcastCard key={podcast.id} item={podcast} />
              ))}
            </>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIcon: {
    marginRight: 8,
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
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
  },
  liveStreamContainer: {
    marginBottom: 25,
  },
  liveStreamContent: {
    paddingRight: 15,
  },
  liveStreamCard: {
    width: 280,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveStreamThumbnail: {
    height: 160,
    justifyContent: 'flex-end',
    borderRadius: 12,
  },
  liveStreamOverlay: {
    padding: 10,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 8,
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
  },
  liveStreamInfo: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  liveStreamTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  liveStreamHost: {
    color: '#666',
    fontSize: 13,
  },
  podcastCard: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
  },
  podcastThumbnailContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  podcastThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  podcastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  podcastTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  newBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FF9500',
  },
  podcastHost: {
    color: '#666',
    fontSize: 14,
    marginBottom: 6,
  },
  podcastStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  podcastDuration: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  podcastEpisodes: {
    fontSize: 12,
    color: '#666',
  },
  upcomingContainer: {
    marginTop: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  scheduleTime: {
    alignItems: 'center',
    width: 70,
  },
  scheduleDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  scheduleHour: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  scheduleDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eaeaea',
    marginHorizontal: 15,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  scheduleHost: {
    color: '#666',
    fontSize: 13,
  },
  notifyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
