import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { Text, Badge, ActionButton, Card } from '@/components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { router, Link, Redirect, Stack } from 'expo-router';
import AthleteVerificationForm from '../../components/verification/AthleteVerificationForm';
import VerificationService from '../../services/VerificationService';

const { width } = Dimensions.get('window');
const CONTENT_TABS = ['All', 'Music', 'Podcasts', 'Videos', 'Live'];

// Mock user content data
const MOCK_USER_CONTENT = [
  {
    id: '1',
    title: 'Game Day Playlist',
    type: 'music',
    thumbnail: 'https://via.placeholder.com/300',
    views: 12500,
    likes: 843,
    date: '2 weeks ago'
  },
  {
    id: '2',
    title: 'My Journey in Sports',
    type: 'podcast',
    thumbnail: 'https://via.placeholder.com/300',
    views: 8700,
    likes: 412,
    date: '3 weeks ago'
  },
  {
    id: '3',
    title: 'Training Session Highlights',
    type: 'video',
    thumbnail: 'https://via.placeholder.com/300',
    views: 15200,
    likes: 1024,
    date: '1 month ago'
  },
  {
    id: '4',
    title: 'Live Q&A with Fans',
    type: 'live',
    thumbnail: 'https://via.placeholder.com/300',
    views: 22000,
    likes: 1560,
    date: '2 months ago'
  },
];

const ContentTypeIcon = ({ type, size = 20, color = "#666" }: { type: string; size?: number; color?: string }) => {
  switch (type) {
    case 'music':
      return <MaterialIcons name="music-note" size={size} color={color} />;
    case 'podcast':
      return <FontAwesome5 name="podcast" size={size-2} color={color} />;
    case 'video':
      return <Ionicons name="videocam" size={size} color={color} />;
    case 'live':
      return <MaterialCommunityIcons name="broadcast" size={size} color={color} />;
    case 'reel':
      return <Entypo name="video" size={size} color={color} />;
    default:
      return <Ionicons name="document" size={size} color={color} />;
  }
};

/**
 * ProfileTab component that displays appropriate profile content
 * and provides navigation options, including premium subscription
 */
export default function ProfileTab() {
  const { user } = useAuth();
  const isPremium = user && 'isPremium' in user ? user.isPremium : false;
  
  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle" size={80} color="#ccc" />
          <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
          <Text style={styles.notLoggedInText}>
            Please log in to view your profile and access all features
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // For logged in users, show profile with appropriate options
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Profile' }} />
      
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.photoURL || 'https://via.placeholder.com/150' }} 
              style={styles.avatar} 
            />
            {user.isVerified && <VerificationBadge verified={true} />}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.displayName}</Text>
              {isPremium ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              ) : null}
            </View>
            
            <Text style={styles.username}>@{user.username || 'username'}</Text>
            <Text style={styles.bio}>
              {user.bio || 'Welcome to my profile! I love music and sports.'}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>245</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>15.2K</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>843</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          
          {!isPremium && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.premiumButton]}
              onPress={() => router.push('/payment/subscription')}
            >
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={[styles.actionButtonText, styles.premiumButtonText]}>Go Premium</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Your Content</Text>
          
          <FlatList
            data={MOCK_USER_CONTENT}
            renderItem={({ item }) => <ContentItem item={item} />}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
// Helper component for content items
const ContentItem = ({ item }: { item: { thumbnail: string; type: string; title: string; views: number; likes: number; date: string; } }) => {
  return (
    <Card style={styles.contentItem}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.typeIconContainer}>
          <ContentTypeIcon type={item.type} color="white" />
        </View>
      </View>
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle}>{item.title}</Text>
        <View style={styles.contentStats}>
          <Text style={styles.contentStat}><Ionicons name="eye" size={14} color="#666" /> {item.views.toLocaleString()}</Text>
          <Text style={styles.contentStat}><Ionicons name="heart" size={14} color="#666" /> {item.likes.toLocaleString()}</Text>
          <Text style={styles.contentDate}>{item.date}</Text>
        </View>
      </View>
    </Card>
  );
};
// Helper component for verification badge
const VerificationBadge = ({ verified }: { verified: boolean; size?: 'small' | 'large' }) => {
  if (!verified) return null;
  
  return (
    <View style={[
      styles.verificationBadge,
      verified && styles.verificationBadgeLarge
    ]}>
      <Ionicons 
        name="checkmark-circle" 
        size={verified ? (verified ? 22 : 16) : 0} 
        color="white" 
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notLoggedInText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  verificationBadgeLarge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 3,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bio: {
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 5,
    fontWeight: '500',
    color: '#333',
  },
  premiumButton: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumButtonText: {
    color: '#FF9800',
  },
  contentSection: {
    marginTop: 10,
    backgroundColor: 'white',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  contentItem: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  typeIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    padding: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contentStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  contentDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
});
