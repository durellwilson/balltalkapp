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
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Load conversations
  useEffect(() => {
    if (!user) return;
    
    // Set mounted flag
    isMounted.current = true;
    
    // Initial load
    loadConversations();
    
    // Subscribe to real-time updates
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = MessageService.subscribeToConversations(
        user.uid,
        (updatedConversations) => {
          if (!isMounted.current) return;
          
          // Sort conversations by last message timestamp
          const sortedConversations = [...updatedConversations].sort((a, b) => {
            const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return timeB - timeA; // Most recent first
          });
          
          setConversations(sortedConversations);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error subscribing to conversations:', err);
      if (isMounted.current) {
        setError('Failed to subscribe to conversation updates.');
        setLoading(false);
      }
    }
    
    // Clean up subscription and set mounted flag
    return () => {
      isMounted.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  // Load conversations
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      
      const userConversations = await MessageService.getUserConversations(user.uid);
      
      if (!isMounted.current) return;
      
      // Sort conversations by last message timestamp
      const sortedConversations = [...userConversations].sort((a, b) => {
        const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return timeB - timeA; // Most recent first
      });
      
      setConversations(sortedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      if (isMounted.current) {
        setError('Failed to load conversations. Please try again.');
        if (!refreshing) {
          Alert.alert('Error', 'Failed to load conversations. Please try again.');
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, []);
  
  // Navigate to conversation
  const navigateToConversation = useCallback((conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  }, [router]);
  
  // Create new conversation
  const createNewConversation = useCallback(() => {
    router.push('/chat/new');
  }, [router]);
  
  // Format participant name
  const formatParticipantName = useCallback((participantId: string) => {
    // In a real app, you would fetch user data and display their name
    // For now, we'll just show a shortened version of their ID
    return participantId.substring(0, 8) + '...';
  }, []);
  
  // Render conversation item
  const renderConversationItem = useCallback(({ item }: { item: Conversation }) => {
    if (!user) return null;
    
    // Get the other participant's ID (for direct messages)
    const otherParticipantId = item.participants.find(id => id !== user.uid) || '';
    
    // Get unread count for current user
    const unreadCount = item.unreadCount?.[user.uid] || 0;
    
    // Format last message time
    const lastMessageTime = item.lastMessage?.timestamp 
      ? formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true })
      : '';
    
    // Determine if this is the current user's message
    const isOwnMessage = item.lastMessage?.senderId === user.uid;
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem, 
          { 
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border
          }
        ]}
        onPress={() => navigateToConversation(item.id)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: theme.tint + '20' }]}>
          {item.isGroupChat ? (
            <Ionicons name="people" size={24} color={theme.tint} />
          ) : (
            <Ionicons name="person" size={24} color={theme.tint} />
          )}
        </View>
        
        {/* Conversation details */}
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text 
              style={[
                styles.conversationName, 
                { color: theme.text }
              ]} 
              numberOfLines={1}
            >
              {item.isGroupChat 
                ? item.groupName 
                : formatParticipantName(otherParticipantId)
              }
            </Text>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {lastMessageTime}
            </Text>
          </View>
          
          <View style={styles.messagePreview}>
            {isOwnMessage && (
              <Text style={[styles.youText, { color: theme.textSecondary }]}>
                You:{' '}
              </Text>
            )}
            <Text 
              style={[
                styles.previewText, 
                { 
                  color: unreadCount > 0 ? theme.text : theme.textSecondary,
                  fontWeight: unreadCount > 0 ? '600' : '400',
                  flex: 1
                }
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.tint }]}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user, theme, navigateToConversation, formatParticipantName]);
  
  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.tint} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No Conversations Yet
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Start a new conversation by tapping the button below.
        </Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: theme.tint }]}
          onPress={createNewConversation}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>Start New Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, theme, createNewConversation]);
  
  // Render error state
  const renderErrorState = useCallback(() => {
    if (!error) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.error} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Something Went Wrong
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: theme.tint }]}
          onPress={() => {
            setError(null);
            loadConversations();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }, [error, theme, loadConversations]);
  
  if (loading && !refreshing && conversations.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} testID="loading-indicator" />
      </View>
    );
  }
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'ios' ? insets.top : 0
      }
    ]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.cardBackground,
          borderBottomColor: theme.border
        }
      ]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={createNewConversation}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={theme.tint} />
        </TouchableOpacity>
      </View>
      
      {/* Error state */}
      {error && renderErrorState()}
      
      {/* Conversation list */}
      {!error && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={conversations.length === 0 ? styles.fullHeight : null}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.tint]}
              tintColor={theme.tint}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  newChatButton: {
    padding: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for FAB
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationDetails: {
    flex: 1,
    marginLeft: 12,
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
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youText: {
    fontSize: 14,
  },
  previewText: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  newButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullHeight: {
    flex: 1,
  },
});

export default ChatScreen; 