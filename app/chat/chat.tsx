import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import MessageService, { Conversation } from '../../services/MessageService';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay,
  FadeIn,
  FadeOut,
  SlideInRight,
  ZoomIn,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useNetwork } from '../../contexts/NetworkContext';
import { checkFirebaseConnection } from '../../services/ChatService';

// Debug flag
const DEBUG = true;
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[ChatScreen] ${message}`, data || '');
  }
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ChatScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable } = useNetwork();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const fabScale = useSharedValue(0);
  const listOpacity = useSharedValue(0);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Check Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkFirebaseConnection();
        setFirebaseConnected(isConnected);
        logDebug(`Firebase connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
      } catch (error) {
        console.error('Error checking Firebase connection:', error);
        setFirebaseConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  // Load conversations when user changes or network status changes
  useEffect(() => {
    if (user && isConnected) {
      loadConversations();
    }
  }, [user, isConnected]);
  
  // Load conversations
  const loadConversations = async () => {
    if (!user) {
      setError('You must be logged in to view conversations');
      setLoading(false);
      return;
    }
    
    if (!isConnected) {
      setError('No internet connection. Please check your network settings.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      logDebug('Loading conversations for user:', user.uid);
      const userConversations = await MessageService.getUserConversations(user.uid);
      
      logDebug(`Loaded ${userConversations.length} conversations`);
      setConversations(userConversations);
      setLoading(false);
      
      // Animate header in
      headerOpacity.value = withTiming(1, { duration: 500 });
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);
  
  // Navigate to conversation
  const navigateToConversation = (conversationId: string) => {
    router.push(`/chat/conversation/${conversationId}`);
  };
  
  // Start new conversation
  const startNewConversation = () => {
    // Animate FAB when pressed
    fabScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    
    router.push('/chat/new');
  };
  
  // Start new group chat
  const startNewGroupChat = () => {
    router.push('/chat/new-group');
  };
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }]
    };
  });
  
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }]
    };
  });
  
  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: listOpacity.value
    };
  });
  
  // Item enter animation
  const getItemAnimationStyle = (index: number) => {
    return {
      entering: FadeIn.delay(100 + index * 50).springify().damping(12)
    };
  };
  
  // Render conversation item
  const renderConversationItem = ({ item, index }: { item: Conversation; index: number }) => {
    const isGroup = item.type === 'group';
    const lastMessageTime = item.lastMessage?.timestamp 
      ? formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true })
      : '';
    
    return (
      <AnimatedTouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.cardBackground },
          getItemAnimationStyle(index)
        ]}
        onPress={() => navigateToConversation(item.id)}
      >
        <View style={styles.avatarContainer}>
          {isGroup ? (
            <View style={[styles.groupAvatar, { backgroundColor: theme.primary }]}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
          ) : (
            <Image
              source={
                item.photoURL
                  ? { uri: item.photoURL }
                  : require('../../assets/images/default-avatar.png')
              }
              style={styles.avatar}
            />
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text 
              style={[styles.conversationName, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.name || 'Unnamed Conversation'}
            </Text>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {lastMessageTime}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.lastMessage, 
              { color: item.unreadCount > 0 ? theme.text : theme.textSecondary }
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
      </AnimatedTouchableOpacity>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyState,
        { entering: FadeIn.delay(300).duration(500) }
      ]}
    >
      <Ionicons 
        name="chatbubble-ellipses-outline" 
        size={80} 
        color={theme.textSecondary} 
      />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        No Conversations Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        Start a new conversation to connect with athletes and fans
      </Text>
      <TouchableOpacity
        style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
        onPress={startNewConversation}
      >
        <Text style={styles.emptyStateButtonText}>Start New Conversation</Text>
      </TouchableOpacity>
    </Animated.View>
  );
  
  // Add a connection status component
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={[styles.connectionStatus, { backgroundColor: theme.error }]}>
          <Ionicons name="cloud-offline" size={20} color="white" />
          <Text style={styles.connectionStatusText}>No internet connection</Text>
        </View>
      );
    }
    
    if (firebaseConnected === false) {
      return (
        <View style={[styles.connectionStatus, { backgroundColor: theme.warning }]}>
          <Ionicons name="warning" size={20} color="white" />
          <Text style={styles.connectionStatusText}>Unable to connect to chat service</Text>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderConnectionStatus()}
      
      <Animated.View 
        style={[
          styles.header,
          { 
            backgroundColor: theme.background,
            paddingTop: insets.top + 10,
            borderBottomColor: theme.border
          },
          headerAnimatedStyle
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.cardBackground }]}
            onPress={startNewGroupChat}
          >
            <Ionicons name="people" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading conversations...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadConversations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <AnimatedFlatList
          style={[styles.list, listAnimatedStyle]}
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={
            conversations.length === 0 ? { flex: 1 } : { paddingBottom: 80 }
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
      
      <AnimatedTouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: theme.primary },
          fabAnimatedStyle
        ]}
        onPress={startNewConversation}
      >
        <Ionicons name="create" size={24} color="#FFFFFF" />
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  connectionStatusText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ChatScreen; 