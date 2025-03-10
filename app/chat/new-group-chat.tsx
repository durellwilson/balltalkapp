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
import { useRouter } from 'expo-router';
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

const NewGroupChatScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load users
  useEffect(() => {
    if (!user) return;
    
    const loadUsers = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Get all users except current user
        const allUsers = await UserService.getAllUsers();
        const otherUsers = allUsers.filter(u => u.id !== user.uid);
        
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
        Alert.alert('Error', 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [user]);
  
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
  
  // Create group chat
  const createGroupChat = async () => {
    if (!user || creating || selectedUsers.length === 0 || !groupName.trim()) {
      if (selectedUsers.length === 0) {
        Alert.alert('Error', 'Please select at least one user for the group chat.');
      } else if (!groupName.trim()) {
        Alert.alert('Error', 'Please enter a group name.');
      }
      return;
    }
    
    try {
      setCreating(true);
      
      // Create new group conversation
      const participants = [user.uid, ...selectedUsers];
      const newConversation = await MessageService.createGroupChat(
        user.uid,
        participants,
        groupName.trim()
      );
      
      if (!newConversation) {
        throw new Error('Failed to create group chat');
      }
      
      // Navigate to new conversation
      router.push(`/chat/${newConversation.id}`);
    } catch (err) {
      console.error('Error creating group chat:', err);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    } finally {
      setCreating(false);
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
        disabled={creating}
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
        
        <Text style={styles.headerTitle}>New Group Chat</Text>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            (selectedUsers.length === 0 || !groupName.trim() || creating) && styles.disabledButton
          ]}
          onPress={createGroupChat}
          disabled={selectedUsers.length === 0 || !groupName.trim() || creating}
          testID="create-group-button"
        >
          <Text style={[
            styles.createButtonText,
            (selectedUsers.length === 0 || !groupName.trim() || creating) && styles.disabledButtonText
          ]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Group name input */}
      <View style={styles.groupNameContainer}>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={30}
          autoCapitalize="words"
        />
        {groupName.length > 0 && (
          <Text style={styles.charCount}>{groupName.length}/30</Text>
        )}
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
        </View>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" testID="loading-indicator" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : creating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" />
          <Text style={styles.loadingText}>Creating group chat...</Text>
        </View>
      ) : (
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
                  : 'No users available'}
              </Text>
            </View>
          }
        />
      )}
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
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8E44AD',
    borderRadius: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#A0A0A0',
  },
  groupNameContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  groupNameInput: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
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
    padding: 16,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
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

export default NewGroupChatScreen; 