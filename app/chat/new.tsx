import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import ChatService from '../../services/ChatService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ErrorFallback from '../../components/fallbacks/ErrorFallback';
import { useOffline } from '../../contexts/OfflineContext';

interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  isVerified?: boolean;
}

export default function NewChatScreen() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get all users except current user
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const usersList: User[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          usersList.push(userData);
        });
        
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleBackPress = () => {
    router.back();
  };

  const handleUserPress = async (selectedUser: User) => {
    if (!user || creating || isOffline) return;

    try {
      setCreating(true);
      
      // Create a new conversation
      const conversationId = await ChatService.createConversation({
        participants: [user.uid, selectedUser.uid],
        createdBy: user.uid,
        isGroup: false
      });
      
      // Navigate to the conversation
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (error) {
    return (
      <ErrorFallback 
        message="Could not load users" 
        onRetry={() => setError(null)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {isOffline && (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <Text style={styles.offlineText}>You're offline. You can't start new conversations while offline.</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => handleUserPress(item)}
              disabled={isOffline || creating}
            >
              <View style={styles.avatar}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#666" />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName || 'User'}</Text>
                <View style={styles.userMeta}>
                  {item.role && (
                    <Text style={styles.userRole}>{item.role}</Text>
                  )}
                  {item.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.verifiedIcon} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {creating && (
        <View style={styles.creatingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.creatingText}>Creating conversation...</Text>
        </View>
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
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center'
  },
  headerRight: {
    width: 40
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
    textAlign: 'center'
  },
  userItem: {
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  userName: {
    fontSize: 16,
    fontWeight: '600'
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize'
  },
  verifiedIcon: {
    marginLeft: 4
  },
  creatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  creatingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12
  }
}); 