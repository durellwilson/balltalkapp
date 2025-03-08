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
import { router, Link } from 'expo-router';
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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Check if user is an athlete
  useEffect(() => {
    if (user && user.role === 'fan') {
      Alert.alert(
        'Fan Account',
        'This section is for athlete accounts. You will be redirected to the Fan Hub.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)/fan-profile') 
          }
        ]
      );
    }
  }, [user]);

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (user?.uid) {
        try {
          const status = await VerificationService.getVerificationStatus(user.uid);
          setIsVerified(status.isVerified);
        } catch (error) {
          console.error('Error fetching verification status:', error);
        }
      }
    };

    fetchVerificationStatus();
  }, [user]);

  // If no user is logged in, show login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Athlete Profile</Text>
          <Text style={styles.message}>Please sign in to access your profile</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Mock user data - in a real app, this would come from a profile service
  const mockUserData = {
    name: user?.displayName || user?.username || 'Athlete Name',
    username: user?.username || 'athlete',
    avatar: user?.photoURL || 'https://via.placeholder.com/150',
    followers: 12400,
    following: 843,
    verified: isVerified,
    bio: 'Professional basketball player. Music enthusiast. Creating content to inspire the next generation.',
    team: 'Chicago Bulls',
    sport: 'Basketball',
    socialLinks: {
      instagram: 'athlete_official',
      twitter: 'athlete_official',
      tiktok: 'athlete_official'
    }
  };
  
  const filteredContent = activeTab === 'All' 
    ? MOCK_USER_CONTENT 
    : MOCK_USER_CONTENT.filter(item => {
        if (activeTab === 'Music') return item.type === 'music';
        if (activeTab === 'Podcasts') return item.type === 'podcast';
        if (activeTab === 'Videos') return item.type === 'video';
        if (activeTab === 'Live') return item.type === 'live';
        return true;
      });
  
  const openVerificationModal = () => {
    setShowVerificationModal(true);
  };
  
  const closeVerificationModal = () => {
    setShowVerificationModal(false);
  };
  
  const handleVerificationComplete = () => {
    closeVerificationModal();
    setIsVerified(true);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <ActionButton 
            style={[styles.headerButton, { marginRight: 8 }]} 
            onPress={() => router.push('/(tabs)/verification-test')}
          >
            <Ionicons name="shield-checkmark" size={22} color="#666" />
          </ActionButton>
          <ActionButton style={styles.headerButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color="#666" />
          </ActionButton>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: mockUserData.avatar }} style={styles.avatar} />
            <VerificationBadge verified={mockUserData.verified} size="large" />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{mockUserData.name}</Text>
              {user?.role === 'athlete' && !isVerified && (
                <TouchableOpacity 
                  style={[
                    styles.verifyButton, 
                    showVerificationModal && styles.pendingButton
                  ]} 
                  onPress={openVerificationModal}
                  disabled={showVerificationModal}
                >
                  <Text style={styles.verifyButtonText}>
                    {showVerificationModal ? 'Verification Pending' : 'Get Verified'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.username}>@{mockUserData.username}</Text>
            <Text style={styles.bio}>{mockUserData.bio}</Text>
            
            {(mockUserData.team || mockUserData.sport) && (
              <View style={styles.athleteDetails}>
                {mockUserData.team && (
                  <View style={styles.athleteDetail}>
                    <Ionicons name="people" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{mockUserData.team}</Text>
                  </View>
                )}
                {mockUserData.sport && (
                  <View style={styles.athleteDetail}>
                    <Ionicons name="basketball" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{mockUserData.sport}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{mockUserData.followers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{mockUserData.following.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER_CONTENT.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>
            
            <View style={styles.socialLinks}>
              {mockUserData.socialLinks.instagram && (
                <ActionButton style={styles.socialButton}>
                  <FontAwesome name="instagram" size={22} color="#E1306C" />
                </ActionButton>
              )}
              {mockUserData.socialLinks.twitter && (
                <ActionButton style={styles.socialButton}>
                  <FontAwesome name="twitter" size={22} color="#1DA1F2" />
                </ActionButton>
              )}
              {mockUserData.socialLinks.tiktok && (
                <ActionButton style={styles.socialButton}>
                  <FontAwesome5 name="tiktok" size={22} color="#000000" />
                </ActionButton>
              )}
            </View>
          </View>
        </View>
        
        {/* Content Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {CONTENT_TABS.map(tab => (
            <ActionButton
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive
                ]}
              >
                {tab}
              </Text>
            </ActionButton>
          ))}
        </ScrollView>
        
        {/* User Content */}
        <View style={styles.contentGrid}>
          {filteredContent.length > 0 ? (
            filteredContent.map(item => (
              <ContentItem key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyContentContainer}>
              <Ionicons name="albums-outline" size={48} color="#ccc" />
              <Text style={styles.emptyContentText}>No {activeTab} content yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeVerificationModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verification Status</Text>
              <ActionButton style={styles.closeButton} onPress={closeVerificationModal}>
                <Ionicons name="close" size={24} color="#666" />
              </ActionButton>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.verificationIconContainer}>
                <Ionicons name="time-outline" size={60} color="#FF9500" />
              </View>
              
              <Text style={styles.verificationTitle}>Verification In Progress</Text>
              <Text style={styles.verificationDescription}>
                Your verification request is currently being reviewed by our team. This process typically
                takes 1-3 business days. You'll be notified when the review is complete.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
