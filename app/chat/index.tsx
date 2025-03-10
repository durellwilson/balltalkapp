import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import ChatService, { Conversation } from '../../services/ChatService';
import { formatDistanceToNow } from 'date-fns';
import ErrorFallback from '../../components/fallbacks/ErrorFallback';
import { useOffline } from '../../contexts/OfflineContext';

export default function ChatScreen() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Subscribe to conversations
    const unsubscribe = ChatService.getConversations(user.uid, (data, error) => {
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setConversations(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  const handleNewGroup = () => {
    router.push('/chat/new-group');
  };

  const handlePremiumGroups = () => {
    router.push('/chat/premium-groups');
  };

  const handleConversationPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const filteredConversations = searchQuery
    ? conversations.filter(conv => 
        conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  if (error) {
    return (
      <ErrorFallback 
        message="Could not load conversations" 
        onRetry={() => setError(null)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNewChat}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleNewGroup}
        >
          <Ionicons name="people" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>New Group</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePremiumGroups}
        >
          <Ionicons name="star" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Premium Groups</Text>
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new chat with an athlete or fan
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleNewChat}
          >
            <Text style={styles.emptyButtonText}>Start a New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => {
            const unreadCount = item.unreadCount?.[user?.uid || ''] || 0;
            const lastMessageTime = item.lastMessageAt 
              ? formatDistanceToNow(item.lastMessageAt.toDate(), { addSuffix: true })
              : '';
            
            return (
              <TouchableOpacity 
                style={styles.conversationItem}
                onPress={() => handleConversationPress(item.id || '')}
              >
                <View style={styles.avatar}>
                  {item.isGroup ? (
                    <Ionicons name="people" size={24} color="#666" />
                  ) : (
                    <Ionicons name="person" size={24} color="#666" />
                  )}
                </View>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>
                      {item.isGroup ? item.groupName : 'Direct Message'}
                    </Text>
                    <Text style={styles.timeText}>{lastMessageTime}</Text>
                  </View>
                  <View style={styles.conversationFooter}>
                    <Text 
                      style={styles.lastMessage}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.lastMessage || 'No messages yet'}
                    </Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  headerButtons: {
    flexDirection: 'row'
  },
  headerButton: {
    padding: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12
  },
  actionButtonText: {
    marginLeft: 4,
    color: '#007AFF',
    fontWeight: '500'
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8
  },
  offlineText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center'
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600'
  },
  timeText: {
    fontSize: 12,
    color: '#999'
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6
  }
});
