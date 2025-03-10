import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Text, Button } from '@/components/themed';
import AthleteProfileCard from '@/components/profile/AthleteProfileCard';
import ContentCard from '../../components/content/ContentCard';

// Mock data for demonstration
const MOCK_TRENDING_ATHLETES = [
  {
    id: '1',
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
  },
  {
    id: '2',
    name: 'Serena Williams',
    username: 'serenawilliams',
    sport: 'Tennis',
    verified: true,
    followers: 15000000,
    profileImage: 'https://via.placeholder.com/150',
    coverImage: 'https://via.placeholder.com/500x200',
    bio: '23-time Grand Slam singles champion. One of the greatest tennis players of all time.',
  },
  {
    id: '3',
    name: 'Tom Brady',
    username: 'tombrady',
    sport: 'Football',
    team: 'Tampa Bay Buccaneers',
    position: 'Quarterback',
    verified: true,
    followers: 18000000,
    profileImage: 'https://via.placeholder.com/150',
    coverImage: 'https://via.placeholder.com/500x200',
    bio: 'Seven-time Super Bowl champion. Widely considered the greatest quarterback of all time.',
  },
];

const MOCK_TRENDING_CONTENT = [
  {
    id: '1',
    type: 'podcast',
    title: 'The Journey to Championship',
    description: 'Discussing the mental and physical challenges of winning a championship.',
    duration: '45:22',
    thumbnail: 'https://via.placeholder.com/300',
    author: {
      name: 'Michael Jordan',
      avatar: 'https://via.placeholder.com/50',
    },
    stats: {
      views: 1200000,
      likes: 85000,
    },
  },
  {
    id: '2',
    type: 'music',
    title: 'Victory Anthem',
    description: 'A motivational track to get you pumped for game day.',
    duration: '3:45',
    thumbnail: 'https://via.placeholder.com/300',
    author: {
      name: 'Serena Williams',
      avatar: 'https://via.placeholder.com/50',
    },
    stats: {
      views: 750000,
      likes: 62000,
    },
  },
  {
    id: '3',
    type: 'video',
    title: 'Training Session Highlights',
    description: 'Behind-the-scenes look at an intense training session.',
    duration: '12:30',
    thumbnail: 'https://via.placeholder.com/300',
    author: {
      name: 'Tom Brady',
      avatar: 'https://via.placeholder.com/50',
    },
    stats: {
      views: 980000,
      likes: 73000,
    },
  },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Basketball', icon: 'basketball', color: Colors.basketball },
  { id: '2', name: 'Football', icon: 'football', color: Colors.football },
  { id: '3', name: 'Soccer', icon: 'football-outline', color: Colors.soccer },
  { id: '4', name: 'Tennis', icon: 'tennisball', color: Colors.tennis },
  { id: '5', name: 'Baseball', icon: 'baseball', color: Colors.baseball },
];

export default function FanHubScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendingAthletes, setTrendingAthletes] = useState<typeof MOCK_TRENDING_ATHLETES>([]);
  const [trendingContent, setTrendingContent] = useState<typeof MOCK_TRENDING_CONTENT>([]);
  const [categories, setCategories] = useState<typeof MOCK_CATEGORIES>([]);
  const [followedAthletes, setFollowedAthletes] = useState<string[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch data from an API
        // For now, we'll use mock data with a delay to simulate network request
        setTimeout(() => {
          setTrendingAthletes(MOCK_TRENDING_ATHLETES);
          setTrendingContent(MOCK_TRENDING_CONTENT);
          setCategories(MOCK_CATEGORIES);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In a real app, you would refetch data from an API
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleFollowToggle = (athleteId: string) => {
    setFollowedAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      } else {
        return [...prev, athleteId];
      }
    });
  };

  const handleAthletePress = (athleteId: string) => {
    router.push(`/athlete-profile/${athleteId}`);
  };

  const handleContentPress = (contentId: string, contentType: string) => {
    router.push(`/${contentType}/${contentId}`);
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Stack.Screen
        options={{
          headerTitle: 'Fan Hub',
          headerRight: () => (
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
              <Ionicons name="search" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Browse by Sport</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={24} color="white" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Athletes Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Athletes</Text>
            <TouchableOpacity onPress={() => router.push('/athletes')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.athletesContainer}
          >
            {trendingAthletes.map(athlete => (
              <View key={athlete.id} style={styles.athleteCardContainer}>
                <AthleteProfileCard
                  athlete={athlete}
                  onFollow={() => handleFollowToggle(athlete.id)}
                  isFollowing={followedAthletes.includes(athlete.id)}
                  compact
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Trending Content Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Content</Text>
            <TouchableOpacity onPress={() => router.push('/discover')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {trendingContent.map(content => (
            <ContentCard
              key={content.id}
              id={content.id}
              type={content.type as any}
              title={content.title}
              description={content.description}
              duration={content.duration}
              thumbnail={content.thumbnail}
              author={content.author}
              stats={content.stats}
              onPress={() => handleContentPress(content.id, content.type)}
            />
          ))}
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
  scrollView: {
    flex: 1,
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  athletesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  athleteCardContainer: {
    width: 280,
    marginRight: 16,
  },
});
