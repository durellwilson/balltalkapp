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
import { Text, Badge, ActionButton, Card } from '../../components/themed';
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
import { router, Link, Redirect } from 'expo-router';
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

const ContentItem = ({ item }: { item: typeof MOCK_USER_CONTENT[0] }) => {
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

const VerificationBadge = ({ verified, size = 'small' }: { verified: boolean; size?: 'small' | 'large' }) => {
  if (!verified) return null;
  
  return (
    <View style={[
      styles.verificationBadge,
      size === 'large' && styles.verificationBadgeLarge
    ]}>
      <Ionicons 
        name="checkmark-circle" 
        size={size === 'large' ? 22 : 16} 
        color="white" 
      />
    </View>
  );
};

/**
 * ProfileTab component that redirects to the appropriate profile screen
 * based on the user's role (athlete or fan)
 */
export default function ProfileTab() {
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';
  const isFan = user?.role === 'fan';
  
  // Redirect to the appropriate profile screen based on user role
  if (isAthlete) {
    return <Redirect href="/athlete-profile" />;
  } else if (isFan) {
    return <Redirect href="/fan-profile" />;
  } else {
    // Default profile for other user types or when role is not yet determined
    return <Redirect href="/profile-default" />;
  }
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pendingButton: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    color: '#333',
  },
  athleteDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  athleteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  detailIcon: {
    marginRight: 5,
  },
  detailText: {
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eaeaea',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: 'white',
  },
  tabsContent: {
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentGrid: {
    padding: 15,
  },
  contentItem: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  typeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    padding: 15,
  },
  contentTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  contentStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentStat: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  contentDate: {
    fontSize: 14,
    color: '#999',
    marginLeft: 'auto',
  },
  emptyContentContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContentText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  modalBody: {
    padding: 20,
  },
  verificationIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  verificationDescription: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  verificationSteps: {
    marginBottom: 25,
  },
  verificationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: '#333',
  },
  startVerificationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  startVerificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
