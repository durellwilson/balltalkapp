import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '../../constants/Colors';
import { Ionicons, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';

// Types for content
interface ContentCreator {
  id: string;
  name: string;
  avatar?: string;
  sport: string;
  verified: boolean;
}

interface ContentItem {
  id: string;
  type: 'podcast' | 'video' | 'article';
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string;
  creator: ContentCreator;
  publishedAt: string;
  views: number;
  likes: number;
  saved?: boolean;
}

// Mock data
const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: 'podcast',
    title: 'The Mental Game: Preparing for Championships',
    description: 'Join me as I discuss mental preparation techniques with sports psychologist Dr. Emma Thompson.',
    thumbnail: 'https://via.placeholder.com/400x300',
    duration: '42:18',
    creator: {
      id: '101',
      name: 'LeBron James',
      sport: 'Basketball',
      verified: true
    },
    publishedAt: '2d ago',
    views: 145332,
    likes: 12890
  },
  {
    id: '2',
    type: 'video',
    title: 'My Morning Workout Routine',
    description: 'Check out my daily morning workout routine that keeps me in top shape throughout the season.',
    thumbnail: 'https://via.placeholder.com/400x300',
    duration: '12:45',
    creator: {
      id: '102',
      name: 'Serena Williams',
      sport: 'Tennis',
      verified: true
    },
    publishedAt: '1w ago',
    views: 892156,
    likes: 56478
  },
  {
    id: '3',
    type: 'article',
    title: 'How I Transformed My Nutrition Plan',
    description: 'The complete breakdown of how I changed my diet to extend my career and improve recovery times.',
    thumbnail: 'https://via.placeholder.com/400x300',
    creator: {
      id: '103',
      name: 'Tom Brady',
      sport: 'Football',
      verified: true
    },
    publishedAt: '2w ago',
    views: 67234,
    likes: 5291
  },
  {
    id: '4',
    type: 'podcast',
    title: 'Guest Episode: Training Camp Stories',
    description: 'I invited three of my teammates to share their funniest and most challenging training camp experiences.',
    thumbnail: 'https://via.placeholder.com/400x300',
    duration: '58:10',
    creator: {
      id: '104',
      name: 'Patrick Mahomes',
      sport: 'Football',
      verified: true
    },
    publishedAt: '3d ago',
    views: 89012,
    likes: 7834
  },
  {
    id: '5',
    type: 'video',
    title: 'Technique Breakdown: Perfect Your Swing',
    description: 'A detailed analysis of the mechanics behind an effective swing, with slow-motion demonstrations.',
    thumbnail: 'https://via.placeholder.com/400x300',
    duration: '18:23',
    creator: {
      id: '105',
      name: 'Tiger Woods',
      sport: 'Golf',
      verified: true
    },
    publishedAt: '5d ago',
    views: 205678,
    likes: 25678
  }
];

// Content filters
const CONTENT_FILTERS = [
  'All',
  'Podcasts',
  'Videos',
  'Articles',
  'Following',
  'Trending'
];

const FanContentDiscovery: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [featuredContent, setFeaturedContent] = useState<ContentItem | null>(null);
  
  useEffect(() => {
    loadContent();
  }, []);
  
  const loadContent = async () => {
    // In a real app, this would fetch from an API
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setContent(MOCK_CONTENT);
      setFeaturedContent(MOCK_CONTENT[1]); // Use the workout video as featured content
      setIsLoading(false);
      setRefreshing(false);
    }, 1000);
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadContent();
  };
  
  const handleSaveContent = (contentId: string) => {
    setContent(currentContent => 
      currentContent.map(item => {
        if (item.id === contentId) {
          return {
            ...item,
            saved: !item.saved
          };
        }
        return item;
      })
    );
    
    if (featuredContent?.id === contentId) {
      setFeaturedContent(current => {
        if (current) {
          return {
            ...current,
            saved: !current.saved
          };
        }
        return current;
      });
    }
  };
  
  const getFilteredContent = () => {
    if (selectedFilter === 'All') {
      return content;
    } else if (selectedFilter === 'Podcasts') {
      return content.filter(item => item.type === 'podcast');
    } else if (selectedFilter === 'Videos') {
      return content.filter(item => item.type === 'video');
    } else if (selectedFilter === 'Articles') {
      return content.filter(item => item.type === 'article');
    } else if (selectedFilter === 'Following') {
      // For demo, just return first 2 items
      return content.slice(0, 2);
    } else if (selectedFilter === 'Trending') {
      // For demo, sort by views (highest first)
      return [...content].sort((a, b) => b.views - a.views);
    }
    return content;
  };
  
  const renderContentTypeIcon = (type: 'podcast' | 'video' | 'article') => {
    switch (type) {
      case 'podcast':
        return <Ionicons name="mic" size={16} color="#fff" />;
      case 'video':
        return <Ionicons name="videocam" size={16} color="#fff" />;
      case 'article':
        return <Ionicons name="document-text" size={16} color="#fff" />;
    }
  };
  
  const renderContentTypeLabel = (type: 'podcast' | 'video' | 'article') => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const formatNumberShort = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const renderFeaturedContent = () => {
    if (!featuredContent) return null;
    
    return (
      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity style={styles.featuredCard}>
          <View style={styles.featuredImageContainer}>
            {featuredContent.thumbnail ? (
              <Image 
                source={{ uri: featuredContent.thumbnail }} 
                style={styles.featuredImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.featuredImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredContentType}>
                {renderContentTypeIcon(featuredContent.type)}
                <Text style={styles.featuredContentTypeText}>
                  {renderContentTypeLabel(featuredContent.type)}
                </Text>
              </View>
              {featuredContent.duration && (
                <View style={styles.featuredDuration}>
                  <Text style={styles.featuredDurationText}>{featuredContent.duration}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.featuredDetails}>
            <View style={styles.featuredCreator}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorInitial}>
                  {featuredContent.creator.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.creatorName}>
                  {featuredContent.creator.name}
                  {featuredContent.creator.verified && (
                    <MaterialIcons name="verified" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
                  )}
                </Text>
                <Text style={styles.creatorSport}>{featuredContent.creator.sport}</Text>
              </View>
            </View>
            
            <Text style={styles.featuredTitle}>{featuredContent.title}</Text>
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {featuredContent.description}
            </Text>
            
            <View style={styles.featuredMeta}>
              <Text style={styles.featuredMetaText}>{formatNumberShort(featuredContent.views)} views</Text>
              <Text style={styles.featuredMetaText}>•</Text>
              <Text style={styles.featuredMetaText}>{featuredContent.publishedAt}</Text>
            </View>
            
            <View style={styles.featuredActions}>
              <TouchableOpacity style={styles.featuredAction}>
                <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.featuredActionText}>Play</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featuredAction}
                onPress={() => handleSaveContent(featuredContent.id)}
              >
                <Ionicons 
                  name={featuredContent.saved ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color={Colors.primary} 
                />
                <Text style={styles.featuredActionText}>
                  {featuredContent.saved ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.featuredAction}>
                <Ionicons name="share-social-outline" size={24} color={Colors.primary} />
                <Text style={styles.featuredActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity style={styles.contentCard}>
      <View style={styles.contentThumbnailContainer}>
        {item.thumbnail ? (
          <Image 
            source={{ uri: item.thumbnail }} 
            style={styles.contentThumbnail} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.contentThumbnailPlaceholder}>
            <Ionicons name="image-outline" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.contentTypeTag}>
          {renderContentTypeIcon(item.type)}
        </View>
        {item.duration && (
          <View style={styles.durationTag}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentDetails}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity onPress={() => handleSaveContent(item.id)}>
            <Ionicons 
              name={item.saved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={item.saved ? Colors.primary : "#666"} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.creatorName} numberOfLines={1}>
          {item.creator.name}
          {item.creator.verified && (
            <MaterialIcons name="verified" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
          )}
        </Text>
        
        <View style={styles.contentMeta}>
          <Text style={styles.metaText}>{formatNumberShort(item.views)} views</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{item.publishedAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Content Type Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {CONTENT_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Content List */}
      <FlatList
        data={getFilteredContent()}
        renderItem={renderContentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contentList}
        ListHeaderComponent={renderFeaturedContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No content found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different filter</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: '#555',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  contentList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#333',
  },
  // Featured content styles
  featuredContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  featuredImage: {
    height: '100%',
    width: '100%',
  },
  featuredImagePlaceholder: {
    height: '100%',
    width: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'flex-start',
  },
  featuredContentType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  featuredContentTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  featuredDuration: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredDurationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  featuredDetails: {
    padding: 16,
  },
  featuredCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  creatorInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  creatorSport: {
    fontSize: 12,
    color: '#666',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredMetaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  featuredActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  featuredAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Content items styles
  contentCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  contentThumbnailContainer: {
    width: 120,
    height: 90,
    position: 'relative',
  },
  contentThumbnail: {
    width: '100%',
    height: '100%',
  },
  contentThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTypeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  contentDetails: {
    flex: 1,
    padding: 12,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  metaDot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
});

export default FanContentDiscovery;
