import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessageService, { Conversation } from '../../services/MessageService';
import UserService from '../../services/UserService';
import { formatDistanceToNow } from 'date-fns';

// Types for premium groups
type GroupType = 'athlete-only' | 'fan-groups' | 'my-subscriptions';

const PremiumGroupsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [selectedTab, setSelectedTab] = useState<GroupType>('fan-groups');
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messageService = new MessageService();
  const userService = new UserService();
  
  // Load groups based on selected tab
  const loadGroups = useCallback(async (isRefreshing: boolean = false) => {
    if (!user) return;
    
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      let groupsData: Conversation[] = [];
      
      switch (selectedTab) {
        case 'athlete-only':
          // Only show athlete-only groups if user is an athlete
          const isAthlete = user.role === 'athlete';
          if (isAthlete) {
            groupsData = await fetchAthleteOnlyGroups();
          } else {
            groupsData = [];
            setError('Only verified athletes can access these groups');
          }
          break;
          
        case 'fan-groups':
          // Show all monetized fan groups
          groupsData = await fetchMonetizedFanGroups();
          break;
          
        case 'my-subscriptions':
          // Show groups the user has subscribed to
          groupsData = await fetchMySubscriptions();
          break;
      }
      
      setGroups(groupsData);
    } catch (err) {
      console.error('[PremiumGroupsScreen] Error loading groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedTab]);
  
  // Fetch athlete-only groups
  const fetchAthleteOnlyGroups = async (): Promise<Conversation[]> => {
    if (!user) return [];
    
    // Query Firestore for athlete-only groups where user is participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('isAthleteOnly', '==', true),
      where('participants', 'array-contains', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const athleteGroups: Conversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      athleteGroups.push({
        id: doc.id,
        participants: data.participants || [],
        isGroupChat: data.isGroupChat || false,
        groupName: data.groupName || '',
        groupDescription: data.groupDescription || '',
        isAthleteOnly: true,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
        groupAdminId: data.groupAdminId || '',
        groupIcon: data.groupIcon || '',
        unreadCount: data.unreadCount || {}
      });
    });
    
    return athleteGroups;
  };
  
  // Fetch monetized fan groups
  const fetchMonetizedFanGroups = async (): Promise<Conversation[]> => {
    // Query Firestore for monetized fan groups
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('isFanGroup', '==', true),
      where('isMonetized', '==', true),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const fanGroups: Conversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      fanGroups.push({
        id: doc.id,
        participants: data.participants || [],
        isGroupChat: data.isGroupChat || true,
        groupName: data.groupName || '',
        groupDescription: data.groupDescription || '',
        isFanGroup: true,
        isMonetized: true,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
        groupAdminId: data.groupAdminId || '',
        groupIcon: data.groupIcon || '',
        monetizationSettings: data.monetizationSettings || {},
        statistics: data.statistics || {},
        unreadCount: data.unreadCount || {}
      });
    });
    
    return fanGroups;
  };
  
  // Fetch my subscriptions
  const fetchMySubscriptions = async (): Promise<Conversation[]> => {
    if (!user) return [];
    
    // First get all active subscriptions for this user
    const subscriptionsRef = collection(db, 'fanGroupSubscriptions');
    const q = query(
      subscriptionsRef,
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const groupIds: string[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.groupId) {
        groupIds.push(data.groupId);
      }
    });
    
    // Now fetch each group
    const subscribedGroups: Conversation[] = [];
    
    for (const groupId of groupIds) {
      const groupDoc = await getDoc(doc(db, 'conversations', groupId));
      
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        subscribedGroups.push({
          id: groupDoc.id,
          participants: data.participants || [],
          isGroupChat: data.isGroupChat || true,
          groupName: data.groupName || '',
          groupDescription: data.groupDescription || '',
          isFanGroup: data.isFanGroup || false,
          isMonetized: data.isMonetized || false,
          createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
          groupAdminId: data.groupAdminId || '',
          groupIcon: data.groupIcon || '',
          monetizationSettings: data.monetizationSettings || {},
          statistics: data.statistics || {},
          unreadCount: data.unreadCount || {}
        });
      }
    }
    
    return subscribedGroups;
  };
  
  // Initial load
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);
  
  // Reload when tab changes
  useEffect(() => {
    loadGroups();
  }, [selectedTab]);
  
  // Create new premium group
  const createNewPremiumGroup = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a premium group');
      return;
    }
    
    if (selectedTab === 'athlete-only' && user.role !== 'athlete') {
      Alert.alert('Error', 'Only verified athletes can create athlete-only groups');
      return;
    }
    
    if (selectedTab === 'fan-groups' && user.role !== 'athlete') {
      Alert.alert('Error', 'Only verified athletes can create fan groups');
      return;
    }
    
    // Navigate to group creation screen with the type
    router.push({
      pathname: '/chat/create-premium-group',
      params: { type: selectedTab === 'athlete-only' ? 'athlete-only' : 'fan-group' }
    });
  };
  
  // Join a group or open it if already a member
  const handleGroupPress = async (group: Conversation) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a group');
      return;
    }
    
    // Check if user is already a participant
    if (group.participants.includes(user.uid)) {
      // Open the conversation
      router.push(`/chat/${group.id}`);
      return;
    }
    
    // Handle athlete-only groups
    if (group.isAthleteOnly) {
      if (user.role !== 'athlete') {
        Alert.alert('Access Denied', 'Only verified athletes can join athlete-only groups');
        return;
      }
      
      // Show confirm dialog
      Alert.alert(
        'Join Group',
        `Would you like to join "${group.groupName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: async () => {
              try {
                // Add user to group
                await messageService.addUserToGroupChat(group.id, group.groupAdminId, user.uid);
                // Navigate to the conversation
                router.push(`/chat/${group.id}`);
              } catch (err) {
                console.error('[PremiumGroupsScreen] Error joining athlete group:', err);
                Alert.alert('Error', 'Failed to join group. Please try again.');
              }
            }
          }
        ]
      );
      return;
    }
    
    // Handle monetized fan groups
    if (group.isFanGroup && group.isMonetized) {
      // Check if user has active subscription
      const hasSubscription = await messageService.checkFanGroupSubscription(user.uid, group.id);
      
      if (hasSubscription) {
        // User has already paid, open the conversation
        router.push(`/chat/${group.id}`);
        return;
      }
      
      // Show subscription details
      const price = group.monetizationSettings?.price || 0;
      const period = group.monetizationSettings?.subscriptionPeriod || 'monthly';
      
      Alert.alert(
        'Premium Group',
        `Subscribe to "${group.groupName}" for $${price}/${period}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Subscribe',
            onPress: () => {
              // Navigate to payment screen
              router.push({
                pathname: '/payment/subscribe',
                params: {
                  groupId: group.id,
                  price: price.toString(),
                  period
                }
              });
            }
          }
        ]
      );
    }
  };
  
  // Render group item
  const renderGroupItem = ({ item }: { item: Conversation }) => {
    const isSubscribed = item.participants.includes(user?.uid || '');
    const isAthletesOnlyGroup = item.isAthleteOnly;
    const isFanGroup = item.isFanGroup;
    
    const price = item.monetizationSettings?.price || 0;
    const period = item.monetizationSettings?.subscriptionPeriod || 'monthly';
    
    return (
      <TouchableOpacity
        style={[styles.groupItem, { backgroundColor: theme.cardBackground }]}
        onPress={() => handleGroupPress(item)}
      >
        {/* Group Icon */}
        <View style={styles.groupIconContainer}>
          {item.groupIcon ? (
            <Image source={{ uri: item.groupIcon }} style={styles.groupIcon} />
          ) : (
            <View style={[styles.defaultGroupIcon, { backgroundColor: theme.tint + '40' }]}>
              <Ionicons 
                name={isAthletesOnlyGroup ? 'shield' : 'people'} 
                size={24} 
                color={theme.tint} 
              />
            </View>
          )}
          
          {/* Badge for group type */}
          <View style={[
            styles.groupTypeBadge,
            {
              backgroundColor: isAthletesOnlyGroup ? '#FF9800' : '#4CAF50'
            }
          ]}>
            <Text style={styles.groupTypeBadgeText}>
              {isAthletesOnlyGroup ? 'Athletes' : 'Premium'}
            </Text>
          </View>
        </View>
        
        {/* Group Details */}
        <View style={styles.groupDetails}>
          <Text style={[styles.groupName, { color: theme.text }]} numberOfLines={1}>
            {item.groupName}
          </Text>
          
          <Text style={[styles.groupDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.groupDescription}
          </Text>
          
          <View style={styles.groupMetaInfo}>
            {/* Member count */}
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.statistics?.memberCount || item.participants.length} members
              </Text>
            </View>
            
            {/* Created date */}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Action area */}
        <View style={styles.groupAction}>
          {isSubscribed ? (
            <View style={[styles.joinedBadge, { backgroundColor: theme.success + '20' }]}>
              <Text style={[styles.joinedText, { color: theme.success }]}>Joined</Text>
            </View>
          ) : (
            isFanGroup && item.monetizationSettings ? (
              <View style={styles.priceContainer}>
                <Text style={[styles.priceText, { color: theme.text }]}>
                  ${price}
                </Text>
                <Text style={[styles.periodText, { color: theme.textSecondary }]}>
                  /{period}
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render list header
  const renderListHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.text }]}>
          {selectedTab === 'athlete-only' ? 'Athlete-Only Groups' :
           selectedTab === 'fan-groups' ? 'Premium Fan Groups' :
           'My Subscriptions'}
        </Text>
        
        {/* Only show create button for appropriate tabs and user roles */}
        {((selectedTab === 'athlete-only' && user?.role === 'athlete') ||
          (selectedTab === 'fan-groups' && user?.role === 'athlete')) && (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.tint }]}
            onPress={createNewPremiumGroup}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render empty list
  const renderEmptyList = () => {
    if (loading) return null;
    
    let message = '';
    
    switch (selectedTab) {
      case 'athlete-only':
        message = user?.role === 'athlete' 
          ? 'No athlete-only groups found. Create one to get started!'
          : 'Athlete-only groups are exclusive to verified athletes.';
        break;
      case 'fan-groups':
        message = 'No premium fan groups available right now.';
        break;
      case 'my-subscriptions':
        message = 'You haven\'t subscribed to any premium groups yet.';
        break;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={selectedTab === 'athlete-only' ? 'shield-outline' : 'people-outline'} 
          size={60} 
          color={theme.textSecondary} 
        />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {message}
        </Text>
      </View>
    );
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(true);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab Navigation */}
      <View style={[
        styles.tabBar, 
        { backgroundColor: theme.cardBackground, paddingTop: insets.top }
      ]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            selectedTab === 'fan-groups' && [styles.activeTab, { borderBottomColor: theme.tint }]
          ]}
          onPress={() => setSelectedTab('fan-groups')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={selectedTab === 'fan-groups' ? theme.tint : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'fan-groups' ? theme.tint : theme.textSecondary }
            ]}
          >
            Fan Groups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabItem,
            selectedTab === 'athlete-only' && [styles.activeTab, { borderBottomColor: theme.tint }]
          ]}
          onPress={() => setSelectedTab('athlete-only')}
        >
          <Ionicons 
            name="shield" 
            size={20} 
            color={selectedTab === 'athlete-only' ? theme.tint : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'athlete-only' ? theme.tint : theme.textSecondary }
            ]}
          >
            Athletes Only
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabItem,
            selectedTab === 'my-subscriptions' && [styles.activeTab, { borderBottomColor: theme.tint }]
          ]}
          onPress={() => setSelectedTab('my-subscriptions')}
        >
          <Ionicons 
            name="star" 
            size={20} 
            color={selectedTab === 'my-subscriptions' ? theme.tint : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: selectedTab === 'my-subscriptions' ? theme.tint : theme.textSecondary }
            ]}
          >
            My Subscriptions
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.tint]}
            tintColor={theme.tint}
          />
        }
      />
      
      {/* Loading Indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      )}
      
      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
  },
  groupItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultGroupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTypeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupTypeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  groupDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  groupMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 2,
  },
  groupAction: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  joinedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodText: {
    fontSize: 12,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
});

export default PremiumGroupsScreen; 