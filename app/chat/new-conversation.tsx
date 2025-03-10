import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService, { UserProfile } from '../../services/UserService';
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { debounce } from 'lodash';

const NewConversationScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  
  // Load users
  useEffect(() => {
    if (!user) return;
    
    loadUsers();
  }, [user]);
  
  // Load users
  const loadUsers = async () => {
    if (!user) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const allUsers = await UserService.getAllUsers();
      
      // Filter out current user
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
  
  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (!text.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    setSearching(true);
    
    // Filter users by name or username
    const filtered = users.filter(user => {
      const searchLower = text.toLowerCase();
      const nameLower = (user.displayName || '').toLowerCase();
      const usernameLower = (user.username || '').toLowerCase();
      
      return nameLower.includes(searchLower) || usernameLower.includes(searchLower);
    });
    
    setFilteredUsers(filtered);
    setSearching(false);
  }, [users]);
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce((text: string) => handleSearch(text), 300),
    [handleSearch]
  );
  
  // Handle search input change
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };
  
  // Toggle user selection
  const toggleUserSelection = (user: UserProfile) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      // Remove user
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      // Add user
      setSelectedUsers([...selectedUsers, user]);
      
      // If only one user is selected, disable group chat
      if (selectedUsers.length === 0) {
        setIsGroupChat(false);
      }
    }
  };
  
  // Create conversation
  const createConversation = async () => {
    if (!user) return;
    
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user to start a conversation.');
      return;
    }
    
    if (isGroupChat && !groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    
    try {
      setLoading(true);
      
      let conversationId;
      
      if (isGroupChat) {
        // Create group conversation
        conversationId = await MessageService.createGroupConversation(
          [user.uid, ...selectedUsers.map(u => u.id)],
          groupName.trim(),
          user.uid
        );
      } else {
        // Create direct conversation
        conversationId = await MessageService.createOrGetDirectConversation(
          user.uid,
          selectedUsers[0].id
        );
      }
      
      // Navigate to conversation
      if (conversationId) {
        router.replace(`/chat/${conversationId}`);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render user item
  const renderUserItem = useCallback(({ item }: { item: UserProfile }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border
          }
        ]}
        onPress={() => toggleUserSelection(item)}
        activeOpacity={0.7}
      >
        {/* User avatar */}
        <View style={[styles.avatar, { backgroundColor: theme.tint + '20' }]}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={theme.tint} />
          )}
        </View>
        
        {/* User details */}
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {item.displayName || 'User'}
          </Text>
          {item.username && (
            <Text style={[styles.userUsername, { color: theme.textSecondary }]}>
              @{item.username}
            </Text>
          )}
        </View>
        
        {/* Selection indicator */}
        <View style={[
          styles.selectionIndicator,
          isSelected 
            ? { backgroundColor: theme.tint, borderColor: theme.tint }
            : { backgroundColor: 'transparent', borderColor: theme.border }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedUsers, theme]);
  
  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color={theme.tint} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {searchQuery ? 'No users found' : 'Start searching'}
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {searchQuery 
            ? 'Try a different search term'
            : 'Search for users to start a conversation'
          }
        </Text>
      </View>
    );
  }, [loading, searchQuery, theme]);
  
  // Render selected users
  const renderSelectedUsers = () => {
    if (selectedUsers.length === 0) return null;
    
    return (
      <View style={[styles.selectedUsersContainer, { borderBottomColor: theme.border }]}>
        <FlatList
          data={selectedUsers}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.selectedUserItem, { backgroundColor: theme.tint + '20' }]}
              onPress={() => toggleUserSelection(item)}
            >
              <Text style={[styles.selectedUserName, { color: theme.text }]} numberOfLines={1}>
                {item.displayName || 'User'}
              </Text>
              <Ionicons name="close-circle" size={16} color={theme.tint} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
  
  // Render group chat options
  const renderGroupChatOptions = () => {
    if (selectedUsers.length <= 1 || !isGroupChat) return null;
    
    return (
      <View style={[styles.groupOptionsContainer, { borderBottomColor: theme.border }]}>
        <TextInput
          style={[
            styles.groupNameInput,
            { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border
            }
          ]}
          placeholder="Enter group name"
          placeholderTextColor={theme.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={30}
        />
      </View>
    );
  };
  
  if (loading && users.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.tint} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          New Conversation
        </Text>
        
        {selectedUsers.length > 0 && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={createConversation}
          >
            <Text style={[styles.headerButtonText, { color: theme.tint }]}>
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Search input */}
      <View style={[
        styles.searchContainer, 
        { 
          backgroundColor: theme.cardBackground,
          borderBottomColor: theme.border
        }
      ]}>
        <View style={[
          styles.searchInputContainer,
          { backgroundColor: theme.inputBackground }
        ]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilteredUsers(users);
              }}
            >
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Group chat toggle */}
      {selectedUsers.length > 1 && (
        <View style={[
          styles.groupToggleContainer,
          { 
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border
          }
        ]}>
          <Text style={[styles.groupToggleLabel, { color: theme.text }]}>
            Create group chat
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isGroupChat ? theme.tint : theme.border }
            ]}
            onPress={() => setIsGroupChat(!isGroupChat)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.toggleKnob,
              { 
                backgroundColor: theme.cardBackground,
                transform: [{ translateX: isGroupChat ? 20 : 0 }]
              }
            ]} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Selected users */}
      {renderSelectedUsers()}
      
      {/* Group chat options */}
      {renderGroupChatOptions()}
      
      {/* Error message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      )}
      
      {/* Users list */}
      {searching ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="small" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Searching...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={[
            styles.listContent,
            filteredUsers.length === 0 && { flex: 1 }
          ]}
          ListEmptyComponent={renderEmptyState}
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
  groupToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  groupToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  selectedUsersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginLeft: 12,
  },
  selectedUserName: {
    fontSize: 14,
    marginRight: 4,
    maxWidth: 100,
  },
  groupOptionsContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  groupNameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default NewConversationScreen; 