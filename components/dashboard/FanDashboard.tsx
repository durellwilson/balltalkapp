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
import Colors from '../../constants/Colors';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FanDashboardProps {
  onNavigateToProfile: () => void;
}

const FanDashboard = ({ onNavigateToProfile }: FanDashboardProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recommendedAthletes, setRecommendedAthletes] = useState<string[]>([]);
  const [popularTeams, setPopularTeams] = useState<string[]>([]);

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

      // For demo purposes, we'll hardcode some recommended athletes and popular teams
      // In a real app, these would come from a recommendation engine or API
      setRecommendedAthletes([
        'LeBron James',
        'Serena Williams',
        'Cristiano Ronaldo',
        'Simone Biles',
        'Tom Brady'
      ]);

      setPopularTeams([
        'Los Angeles Lakers',
        'Manchester United',
        'New York Yankees',
        'Golden State Warriors',
        'Tampa Bay Buccaneers'
      ]);
      
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
    const displayName = user?.displayName || user?.username || 'Fan';
    
    return (
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeText}>Welcome to Fan Hub, <Text style={styles.nameText}>{displayName}</Text>!</Text>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onNavigateToProfile}
          >
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.welcomeSubtext}>
          Your personalized sports community awaits
        </Text>
      </View>
    );
  };

  const renderFavoritesSection = () => {
    const hasTeams = userProfile?.favoriteTeams && userProfile.favoriteTeams.length > 0;
    const hasAthletes = userProfile?.favoriteAthletes && userProfile.favoriteAthletes.length > 0;
    
    if (!hasTeams && !hasAthletes) {
      return (
        <View style={styles.emptyFavoritesSection}>
          <Ionicons name="star-outline" size={40} color="#ccc" />
          <Text style={styles.emptyFavoritesText}>
            You don't have any favorites yet
          </Text>
          <TouchableOpacity 
            style={styles.addFavoritesButton}
            onPress={onNavigateToProfile}
          >
            <Text style={styles.addFavoritesButtonText}>Add Favorites</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.favoritesSection}>
        {hasTeams && (
          <View style={styles.favoriteCategory}>
            <Text style={styles.categoryTitle}>Your Teams</Text>
            <View style={styles.tagsContainer}>
              {userProfile.favoriteTeams.map((team: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{team}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {hasAthletes && (
          <View style={styles.favoriteCategory}>
            <Text style={styles.categoryTitle}>Your Athletes</Text>
            <View style={styles.tagsContainer}>
              {userProfile.favoriteAthletes.map((athlete: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{athlete}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderRecommendedSection = () => {
    return (
      <View style={styles.recommendedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Athletes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedScrollContent}
        >
          {recommendedAthletes.map((athlete, index) => (
            <TouchableOpacity key={index} style={styles.recommendedCard}>
              <View style={styles.recommendedImageContainer}>
                <View style={styles.recommendedImagePlaceholder}>
                  <AntDesign name="user" size={30} color="#ccc" />
                </View>
              </View>
              <Text style={styles.recommendedName}>{athlete}</Text>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPopularTeamsSection = () => {
    return (
      <View style={styles.popularTeamsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Teams</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.teamsGrid}>
          {popularTeams.slice(0, 4).map((team, index) => (
            <TouchableOpacity key={index} style={styles.teamCard}>
              <View style={styles.teamLogoContainer}>
                <View style={styles.teamLogoPlaceholder}>
                  <MaterialIcons name="sports-basketball" size={24} color="#ccc" />
                </View>
              </View>
              <Text style={styles.teamName}>{team}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your fan hub...</Text>
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
      {renderFavoritesSection()}
      {renderRecommendedSection()}
      {renderPopularTeamsSection()}
      
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Explore Fan Features</Text>
        
        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="headset" size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Athlete Podcasts</Text>
            <Text style={styles.featureDescription}>Listen to exclusive podcasts from your favorite athletes</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="videocam" size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Live Streams</Text>
            <Text style={styles.featureDescription}>Watch athletes stream live on the platform</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Ionicons name="people" size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Fan Communities</Text>
            <Text style={styles.featureDescription}>Join discussions with other fans</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  nameText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileText: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
  },
  emptyFavoritesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyFavoritesText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 12,
    textAlign: 'center',
  },
  addFavoritesButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  addFavoritesButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  favoritesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteCategory: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e6f2ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 14,
  },
  recommendedSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  recommendedScrollContent: {
    paddingBottom: 8,
  },
  recommendedCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  recommendedImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recommendedImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  popularTeamsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  teamLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 8,
  },
  teamLogoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default FanDashboard;
