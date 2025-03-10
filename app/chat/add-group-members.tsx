import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';

// User interface for the user list
interface UserItem {
  id: string;
  displayName?: string;
  username?: string;
  role?: string;
  selected?: boolean;
}

const AddGroupMembersScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load users and conversation
  useEffect(() => {
    if (!user || !conversationId) return;
    
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Get conversation to check existing members
        const userConversations = await MessageService.getUserConversations(user.uid);
        const conversation = userConversations.find(c => c.id === conversationId);
        
        if (!conversation) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        
        // Check if user is admin
        if (conversation.groupAdminId !== user.uid) {
          setError('Only the group admin can add members');
          setLoading(false);
          return;
        }
        
        // Store existing members
        setExistingMembers(conversation.participants);
        
        // Get all users
        const allUsers = await UserService.getAllUsers();
        
        // Filter out existing members
        const availableUsers = allUsers.filter(u => !conversation.participants.includes(u.id));
        
        setUsers(availableUsers);
        setFilteredUsers(availableUsers);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load users. Please try again.');
        Alert.alert('Error', 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, conversationId]);
  
  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(user => 
      (user.displayName && user.displayName.toLowerCase().includes(query)) ||
      (user.username && user.username.toLowerCase().includes(query)) ||
      user.id.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter(id => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });
  };
  
  // Add selected users to group
  const addUsersToGroup = async () => {
    if (!user || !conversationId || adding || selectedUsers.length === 0) {
      if (selectedUsers.length === 0) {
        Alert.alert('Error', 'Please select at least one user to add to the group.');
      }
      return;
    }
    
    try {
      setAdding(true);
      
      // Add each selected user to the group
      for (const userId of selectedUsers) {
        const success = await MessageService.addUserToGroupChat(
          conversationId,
          user.uid,
          userId
        );
        
        if (!success) {
          throw new Error(`Failed to add user ${userId} to group`);
        }
      }
      
      // Navigate back to conversation
      Alert.alert(
        'Success',
        `Added ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'} to the group.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (err) {
      console.error('Error adding users to group:', err);
      Alert.alert('Error', 'Failed to add users to group. Please try again.');
    } finally {
      setAdding(false);
    }
  };
  
  // Render user item
  const renderUserItem = ({ item }: { item: UserItem }) => {
    const displayName = item.displayName || item.username || item.id;
    const isSelected = selectedUsers.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item.id)}
        disabled={adding}
      >
        <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          {item.role && (
            <Text style={styles.userRole}>{item.role}</Text>
          )}
        </View>
        
        <Switch
          value={isSelected}
          onValueChange={() => toggleUserSelection(item.id)}
          trackColor={{ false: '#CCCCCC', true: '#E6D4EB' }}
          thumbColor={isSelected ? '#8E44AD' : '#f4f3f4'}
        />
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Group Members</Text>
        
        <TouchableOpacity
          style={[
            styles.addButton,
            (selectedUsers.length === 0 || adding) && styles.disabledButton
          ]}
          onPress={addUsersToGroup}
          disabled={selectedUsers.length === 0 || adding}
          testID="add-members-button"
        >
          <Text style={[
            styles.addButtonText,
            (selectedUsers.length === 0 || adding) && styles.disabledButtonText
          ]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Selected users count */}
      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
        </Text>
      </View>
      
      {/* Search input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#888888" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" testID="loading-indicator" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : adding ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" />
          <Text style={styles.loadingText}>Adding users to group...</Text>
        </View>
      ) : !error ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.userList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? 'No users found matching your search'
                  : 'No users available to add'}
              </Text>
            </View>
          }
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8E44AD',
    borderRadius: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#A0A0A0',
  },
  selectedCountContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  userList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedUserItem: {
    backgroundColor: '#F8F4FA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAvatar: {
    backgroundColor: '#E6D4EB',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  userRole: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
});

export default AddGroupMembersScreen; 