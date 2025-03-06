import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';

// Mock data for athletes (same as in community.tsx)
const MOCK_ATHLETES = [
  {
    id: '1',
    name: 'Michael Jordan',
    username: '@airjordan',
    sport: 'Basketball',
    team: 'Chicago Bulls (Retired)',
    avatar: null
  },
  {
    id: '2',
    name: 'Serena Williams',
    username: '@serenawilliams',
    sport: 'Tennis',
    team: 'WTA',
    avatar: null
  },
  {
    id: '3',
    name: 'LeBron James',
    username: '@kingjames',
    sport: 'Basketball',
    team: 'Los Angeles Lakers',
    avatar: null
  },
  {
    id: '4',
    name: 'Megan Rapinoe',
    username: '@mrapinoe',
    sport: 'Soccer',
    team: 'OL Reign',
    avatar: null
  },
  {
    id: '5',
    name: 'Tom Brady',
    username: '@tombrady',
    sport: 'Football',
    team: 'Tampa Bay Buccaneers (Retired)',
    avatar: null
  }
];

// Mock data for groups
const MOCK_GROUPS = [
  {
    id: '1',
    name: 'NBA Musicians',
    description: 'Basketball players who make music',
    members: 28,
    isPrivate: false
  },
  {
    id: '2',
    name: 'Football Beats',
    description: 'Football players sharing their tracks',
    members: 42,
    isPrivate: false
  },
  {
    id: '3',
    name: 'Tennis Rhythms',
    description: 'Tennis players with a passion for music',
    members: 15,
    isPrivate: true
  },
  {
    id: '4',
    name: 'Soccer Sounds',
    description: 'Soccer players creating music together',
    members: 36,
    isPrivate: false
  }
];

// Mock initial messages
const generateInitialMessages = (recipientId: string) => {
  // Check if it's a group chat
  const isGroup = MOCK_GROUPS.some(group => group.id === recipientId);
  
  if (isGroup) {
    const group = MOCK_GROUPS.find(g => g.id === recipientId);
    if (!group) return [];
    
    return [
      {
        id: '1',
        senderId: 'system',
        text: `Welcome to the ${group.name} group chat!`,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        isSystemMessage: true
      },
      {
        id: '2',
        senderId: '3', // LeBron
        text: `Hey everyone! Just dropped a new track, check it out!`,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isSystemMessage: false
      },
      {
        id: '3',
        senderId: '1', // Michael Jordan
        text: `Nice beat LeBron! I'm working on something too.`,
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        isSystemMessage: false
      }
    ];
  } else {
    // Direct message
    const athlete = MOCK_ATHLETES.find(a => a.id === recipientId);
    if (!athlete) return [];
    
    return [
      {
        id: '1',
        senderId: recipientId,
        text: `Hey there! Thanks for connecting.`,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        isSystemMessage: false
      }
    ];
  }
};

const ChatScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [recipient, setRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load recipient data and messages
  useEffect(() => {
    // Check if it's a group chat
    const group = MOCK_GROUPS.find(g => g.id === id);
    if (group) {
      setRecipient(group);
      setIsGroup(true);
    } else {
      // It's a direct message
      const athlete = MOCK_ATHLETES.find(a => a.id === id);
      if (athlete) {
        setRecipient(athlete);
        setIsGroup(false);
      }
    }

    // Load initial messages
    setMessages(generateInitialMessages(id as string));
  }, [id]);

  // Send a message
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    const newMsg = {
      id: Date.now().toString(),
      senderId: 'currentUser', // In a real app, this would be the current user's ID
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isSystemMessage: false
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    } else {
      // Older
      return date.toLocaleDateString();
    }
  };

  // Get sender name
  const getSenderName = (senderId: string) => {
    if (senderId === 'currentUser') return 'You';
    if (senderId === 'system') return 'System';
    
    const athlete = MOCK_ATHLETES.find(a => a.id === senderId);
    return athlete ? athlete.name : 'Unknown User';
  };

  // Get avatar for sender
  const getSenderAvatar = (senderId: string) => {
    if (senderId === 'currentUser' || senderId === 'system') return null;
    
    const athlete = MOCK_ATHLETES.find(a => a.id === senderId);
    return athlete ? athlete.avatar : null;
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: any }) => {
    const isCurrentUser = item.senderId === 'currentUser';
    const isSystem = item.isSystemMessage;
    
    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && isGroup && (
          <View style={styles.messageSenderInfo}>
            {/* Always use the placeholder since we don't have real avatars in our mock data */}
            <View style={styles.senderAvatarPlaceholder}>
              <Text style={styles.senderAvatarInitial}>
                {getSenderName(item.senderId).charAt(0)}
              </Text>
            </View>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {!isCurrentUser && isGroup && (
            <Text style={styles.messageSenderName}>{getSenderName(item.senderId)}</Text>
          )}
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTimestamp,
            isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (!recipient) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chat not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {isGroup ? (
            <>
              <Text style={styles.headerTitle}>{recipient.name}</Text>
              <Text style={styles.headerSubtitle}>{recipient.members} members</Text>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>{recipient.name}</Text>
              <Text style={styles.headerSubtitle}>{recipient.username}</Text>
            </>
          )}
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            newMessage.trim() === '' ? styles.sendButtonDisabled : {}
          ]}
          onPress={sendMessage}
          disabled={newMessage.trim() === ''}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  backButton: {
    padding: 8
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  headerButton: {
    padding: 8
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  currentUserMessage: {
    justifyContent: 'flex-end'
  },
  otherUserMessage: {
    justifyContent: 'flex-start'
  },
  messageSenderInfo: {
    marginRight: 8,
    alignItems: 'center'
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  senderAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  senderAvatarInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4
  },
  otherUserBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  currentUserText: {
    color: 'white'
  },
  otherUserText: {
    color: '#333'
  },
  messageTimestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  otherUserTimestamp: {
    color: '#999'
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  sendButtonDisabled: {
    backgroundColor: '#b0b0b0'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 16
  }
});

export default ChatScreen;
