import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import MessageService, { Message, Conversation, MessageReaction } from '../../services/MessageService';
import UserService, { UserProfile } from '../../services/UserService';
import { formatDistanceToNow, formatRelative } from 'date-fns';
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNetwork } from '../../contexts/NetworkContext';

// Common emoji reactions
const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const ConversationScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Group chat management
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [removingUser, setRemovingUser] = useState(false);
  
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  const [conversationName, setConversationName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [attachments, setAttachments] = useState<{uri: string, type: string, name: string}[]>([]);
  
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [participantOnlineStatus, setParticipantOnlineStatus] = useState<{
    [userId: string]: { isOnline: boolean; lastSeen: Date | null };
  }>({});
  
  const userService = new UserService();
  
  const { isConnected, isInternetReachable } = useNetwork();
  const [queuedMessages, setQueuedMessages] = useState<Message[]>([]);
  const messageService = useRef(new MessageService()).current;
  
  // Set up message subscription and load conversation data
  useEffect(() => {
    if (!user || !conversationId) return;
    
    console.log(`[ConversationScreen] Setting up for conversation ${conversationId}`);
    
    // Set loading flag
    setLoading(true);
    
    // Load conversation and initial messages
    const loadConversationData = async () => {
      try {
        // Fetch conversation details
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (!conversationSnap.exists()) {
          console.error(`[ConversationScreen] Conversation ${conversationId} not found`);
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        
        // Parse the conversation data
        const conversationData = conversationSnap.data();
        const createdAt = conversationData.createdAt instanceof Timestamp 
          ? conversationData.createdAt.toDate().toISOString() 
          : conversationData.createdAt;
        
        const updatedAt = conversationData.updatedAt instanceof Timestamp 
          ? conversationData.updatedAt.toDate().toISOString() 
          : conversationData.updatedAt;
        
        // Build conversation object
        const conversationObject: Conversation = {
          id: conversationId,
          participants: conversationData.participants || [],
          createdAt,
          updatedAt,
          isGroupChat: conversationData.isGroupChat || false,
          groupName: conversationData.groupName,
          groupAdminId: conversationData.groupAdminId,
          unreadCount: conversationData.unreadCount || {}
        };
        
        // Set conversation data
        setConversation(conversationObject);
        
        // Set conversation name
        if (conversationObject.isGroupChat) {
          setConversationName(conversationObject.groupName || 'Group Chat');
        } else {
          // For direct messages, use participant ID for now
          // In a real app, you would fetch user details
          const otherParticipantId = conversationObject.participants.find(id => id !== user.uid);
          if (otherParticipantId) {
            setConversationName(otherParticipantId);
          }
        }
        
        // Load initial messages
        await loadMessages();
        
      } catch (err) {
        console.error('[ConversationScreen] Error loading conversation data:', err);
        setError('Failed to load conversation data');
      } finally {
        setLoading(false);
      }
    };
    
    // Load data
    loadConversationData();
    
    // Set up messages subscription
    const unsubscribe = setupMessageSubscription();
    
    // Clean up subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log(`[ConversationScreen] Cleaning up message subscription for conversation ${conversationId}`);
        unsubscribe();
      }
    };
  }, [conversationId, user, loadMessages, setupMessageSubscription]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);
  
  // Load participants
  const loadParticipants = async (participantIds: string[]) => {
    if (!participantIds.length) return;
    
    try {
      setLoadingParticipants(true);
      
      const participantProfiles: UserProfile[] = [];
      
      // Get each participant's profile
      for (const id of participantIds) {
        const profile = await UserService.getUserProfile(id);
        if (profile) {
          participantProfiles.push(profile);
        }
      }
      
      setParticipants(participantProfiles);
    } catch (err) {
      console.error('Error loading participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };
  
  // Load messages for a conversation
  const loadMessages = useCallback(async (loadMore: boolean = false) => {
    if (!user || !conversationId) return;
    
    try {
      setError(null);
      if (!loadMore) {
        setLoading(true);
      }
      
      let lastTimestamp: string | undefined;
      if (loadMore && messages.length > 0) {
        // Use the oldest message timestamp as the cursor for pagination
        lastTimestamp = messages[messages.length - 1]?.timestamp;
      }
      
      console.log(`[ConversationScreen] Loading messages for conversation ${conversationId}${loadMore ? ' (loading more)' : ''}`);
      
      // Fetch messages from the service
      const fetchedMessages = await MessageService.getMessages(
        conversationId,
        user.uid,
        20, // Limit per page
        lastTimestamp
      );
      
      if (fetchedMessages.length === 0 && loadMore) {
        console.log('[ConversationScreen] No more messages to load');
        return;
      }
      
      if (loadMore) {
        // Append new messages to the existing list (for pagination)
        setMessages(prevMessages => [...prevMessages, ...fetchedMessages]);
      } else {
        // Replace messages (for initial load or refresh)
        setMessages(fetchedMessages);
      }
      
      // Mark messages as read
      MessageService.markMessagesAsRead(conversationId, user.uid)
        .catch(err => console.error('[ConversationScreen] Error marking messages as read:', err));
      
    } catch (err) {
      console.error('[ConversationScreen] Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, messages]);
  
  // Set up real-time subscription to messages
  const setupMessageSubscription = useCallback(() => {
    if (!user || !conversationId) return;
    
    try {
      console.log(`[ConversationScreen] Setting up message subscription for conversation ${conversationId}`);
      
      const unsubscribe = MessageService.subscribeToMessages(
        conversationId,
        user.uid,
        (updatedMessages) => {
          console.log(`[ConversationScreen] Received ${updatedMessages.length} messages in real-time update`);
          
          // Filter out any duplicate messages that might come from the subscription
          // This prevents flickering when messages are updated
          const messageIds = new Set(updatedMessages.map(msg => msg.id));
          
          // Update the local state with the real-time messages
          setMessages(updatedMessages.reverse()); // Reverse to show newest at the bottom
          
          // Scroll to bottom if the newest message is from another user
          // or if we're already at the bottom
          if (updatedMessages.length > 0) {
            const newestMessage = updatedMessages[0]; // First message is newest due to order in query
            if (newestMessage.senderId !== user.uid) {
              // Scroll to bottom with a slight delay to ensure rendering is complete
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
          
          // Mark messages as read in the background
          MessageService.markMessagesAsRead(conversationId, user.uid)
            .catch(err => console.error('[ConversationScreen] Error marking messages as read:', err));
        }
      );
      
      return unsubscribe;
    } catch (err) {
      console.error('[ConversationScreen] Error setting up message subscription:', err);
      setError('Failed to set up real-time updates. Please refresh.');
      return () => {};
    }
  }, [conversationId, user]);
  
  // Set up typing indicator subscription
  useEffect(() => {
    if (!user || !conversationId) return;
    
    console.log(`[ConversationScreen] Setting up typing indicator subscription for conversation ${conversationId}`);
    
    // Subscribe to typing indicators
    const unsubscribe = MessageService.subscribeToTypingIndicators(
      conversationId,
      (updatedTypingUsers) => {
        // Filter out the current user
        const filteredUsers = updatedTypingUsers.filter(id => id !== user.uid);
        setTypingUsers(filteredUsers);
      }
    );
    
    return () => {
      console.log(`[ConversationScreen] Cleaning up typing indicator subscription for conversation ${conversationId}`);
      unsubscribe();
    };
  }, [conversationId, user]);
  
  // Handle text input change with typing indicator
  const handleTextInputChange = (text: string) => {
    setMessageText(text);
    
    // Don't send typing indicators if not authenticated or no conversation
    if (!user || !conversationId) return;
    
    // Set typing status to true
    MessageService.updateTypingStatus(conversationId, user.uid, true)
      .catch(err => console.error('[ConversationScreen] Error updating typing status:', err));
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing status after 5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      MessageService.updateTypingStatus(conversationId, user.uid, false)
        .catch(err => console.error('[ConversationScreen] Error clearing typing status:', err));
      typingTimeoutRef.current = null;
    }, 5000);
  };
  
  // Check if we're online
  const isOnline = isConnected && isInternetReachable !== false;
  
  // Load any queued messages on startup
  useEffect(() => {
    messageService.loadQueuedMessages().catch(err => {
      console.error('[ConversationScreen] Error loading queued messages:', err);
    });
  }, [messageService]);
  
  // Process queued messages when coming back online
  useEffect(() => {
    if (isOnline) {
      console.log('[ConversationScreen] Device is back online, processing queued messages');
      messageService.processQueuedMessages().catch(err => {
        console.error('[ConversationScreen] Error processing queued messages:', err);
      });
    }
  }, [isOnline]);
  
  // Update sendMessage to handle offline mode
  const sendMessage = async () => {
    if (!user || !conversationId || (!messageText.trim() && attachments.length === 0)) {
      return;
    }
    
    // Show sending feedback immediately
    setSending(true);
    
    try {
      const content = messageText.trim();
      setMessageText('');
      setAttachments([]);
      
      // Create a temporary message for optimistic UI update
      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempMessageId,
        conversationId,
        senderId: user.uid,
        receiverId: '',
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: [user.uid],
        attachments: [],
        status: isOnline ? 'sending' : 'queued' // Added status field for UI
      };
      
      // Add temp message to the UI immediately
      setMessages(prevMessages => [tempMessage, ...prevMessages]);
      
      // Clear typing status
      await messageService.updateTypingStatus(conversationId, user.uid, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      if (!isOnline) {
        // We're offline, queue the message for later
        console.log('[ConversationScreen] Device is offline, queueing message for later');
        await messageService.queueMessageForLater(
          conversationId,
          user.uid,
          content,
          attachments.length > 0 ? attachments.map(a => ({ 
            type: a.type as any, 
            url: a.uri, 
            name: a.name 
          })) : undefined
        );
        
        // Update the temporary message to show queued status
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, status: 'queued' } 
              : msg
          )
        );
        
        Alert.alert(
          'Offline Mode',
          'Your message has been queued and will be sent when you\'re back online.'
        );
      } else {
        // We're online, send the message normally
        const sentMessage = await messageService.sendMessage(
          conversationId,
          user.uid,
          content,
          attachments.length > 0 ? attachments.map(a => ({ 
            type: a.type as any, 
            url: a.uri, 
            name: a.name 
          })) : undefined
        );
        
        if (sentMessage) {
          // Remove the temporary message and add the real one
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg.id !== tempMessageId)
          );
          
          // The real message will be added via the subscription
        }
      }
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('[ConversationScreen] Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Pick image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = uri.split('/').pop() || 'image.jpg';
        
        setAttachments([...attachments, {
          uri,
          type: 'image/jpeg',
          name: fileName
        }]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        setAttachments([...attachments, {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name || 'document'
        }]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio.');
        return;
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      setRecordingInstance(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!recordingInstance) return;
    
    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      
      if (uri) {
        const fileName = `recording_${Date.now()}.m4a`;
        
        setAttachments([...attachments, {
          uri,
          type: 'audio/m4a',
          name: fileName
        }]);
      }
      
      setRecordingInstance(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Error stopping recording:', err);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setRecordingInstance(null);
      setIsRecording(false);
    }
  };
  
  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Get conversation title
  const getConversationTitle = () => {
    if (!conversation) return 'Conversation';
    
    if (conversation.isGroupChat) {
      return conversation.groupName || 'Group Chat';
    }
    
    // For direct messages, show the other participant's ID
    const otherParticipantId = conversation.participants.find(id => id !== user?.uid) || '';
    return otherParticipantId;
  };
  
  // Add user to group
  const addUserToGroup = async () => {
    if (!user || !conversation || !conversation.isGroupChat) return;
    
    try {
      setAddingUser(true);
      
      // Navigate to add members screen
      router.push(`/chat/add-members?conversationId=${conversation.id}`);
    } catch (err) {
      console.error('Error navigating to add members screen:', err);
      Alert.alert('Error', 'Failed to navigate to add members screen. Please try again.');
    } finally {
      setAddingUser(false);
    }
  };
  
  // Remove user from group
  const removeUserFromGroup = async (userId: string) => {
    if (!user || !conversation || !conversation.isGroupChat) return;
    
    // Check if current user is admin
    const isAdmin = conversation.groupAdminId === user.uid;
    
    // Can't remove self if not admin
    if (userId === user.uid && !isAdmin) {
      Alert.alert('Error', 'You cannot remove yourself from the group.');
      return;
    }
    
    // Only admin can remove others
    if (userId !== user.uid && !isAdmin) {
      Alert.alert('Error', 'Only the group admin can remove other users.');
      return;
    }
    
    try {
      setRemovingUser(true);
      
      // Confirm removal
      Alert.alert(
        'Remove User',
        'Are you sure you want to remove this user from the group?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await MessageService.removeUserFromGroupChat(
                  conversationId,
                  user.uid,
                  userId
                );
                
                if (success) {
                  // If removing self, navigate back
                  if (userId === user.uid) {
                    router.back();
                  } else {
                    // Refresh participants
                    loadParticipants(conversation.participants.filter(id => id !== userId));
                  }
                } else {
                  throw new Error('Failed to remove user');
                }
              } catch (err) {
                console.error('Error removing user:', err);
                Alert.alert('Error', 'Failed to remove user. Please try again.');
              } finally {
                setRemovingUser(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error removing user from group:', err);
      Alert.alert('Error', 'Failed to remove user from group. Please try again.');
      setRemovingUser(false);
    }
  };
  
  // Mark messages as read when they are viewed
  useEffect(() => {
    if (!user || !conversationId || loading || messages.length === 0) return;
    
    const markMessagesAsRead = async () => {
      try {
        await MessageService.markMessagesAsRead(conversationId, user.uid);
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };
    
    markMessagesAsRead();
  }, [user, conversationId, messages, loading]);
  
  // Handle message long press to show reaction picker
  const handleMessageLongPress = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowReactionPicker(true);
  };
  
  // Add reaction to message
  const addReaction = async (emoji: string) => {
    if (!user || !selectedMessageId) return;
    
    try {
      await MessageService.addReaction(selectedMessageId, user.uid, emoji);
      setShowReactionPicker(false);
      setSelectedMessageId(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
      Alert.alert('Error', 'Failed to add reaction. Please try again.');
    }
  };
  
  // Remove reaction from message
  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      await MessageService.removeReaction(messageId, user.uid, emoji);
    } catch (err) {
      console.error('Error removing reaction:', err);
      Alert.alert('Error', 'Failed to remove reaction. Please try again.');
    }
  };
  
  // Render reactions for a message
  const renderReactions = (message: Message) => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    // Group reactions by emoji
    const reactionGroups: { [emoji: string]: MessageReaction[] } = {};
    message.reactions.forEach(reaction => {
      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = [];
      }
      reactionGroups[reaction.emoji].push(reaction);
    });
    
    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
          const hasUserReacted = reactions.some(r => r.userId === user?.uid);
          
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionBadge,
                hasUserReacted && styles.userReactionBadge
              ]}
              onPress={() => {
                if (hasUserReacted) {
                  removeReaction(message.id, emoji);
                } else {
                  addReaction(emoji);
                }
              }}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              <Text style={styles.reactionCount}>{reactions.length}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  
  // Render read receipts for a message
  const renderReadReceipts = (message: Message) => {
    if (!message.readBy || message.readBy.length <= 1 || message.senderId !== user?.uid) {
      return null;
    }
    
    // Filter out the sender (current user)
    const readers = message.readBy.filter(id => id !== user?.uid);
    
    if (readers.length === 0) return null;
    
    return (
      <View style={styles.readReceiptsContainer}>
        <Text style={styles.readReceiptsText}>
          Read by {readers.length} {readers.length === 1 ? 'person' : 'people'}
        </Text>
      </View>
    );
  };
  
  // Add status indicator for the sender's messages
  const renderMessageStatus = (message: Message) => {
    if (!message.senderId === user?.uid) return null;
    
    let statusIcon = null;
    let statusText = '';
    
    if (message.status === 'queued') {
      statusIcon = <Ionicons name="time-outline" size={14} color="#999" />;
      statusText = 'Queued';
    } else if (message.status === 'sending') {
      statusIcon = <ActivityIndicator size="small" color="#999" />;
      statusText = 'Sending...';
    } else if (message.status === 'error') {
      statusIcon = <Ionicons name="alert-circle-outline" size={14} color="#f44336" />;
      statusText = 'Failed';
    }
    
    if (!statusIcon) return null;
    
    return (
      <View style={styles.messageStatus}>
        {statusIcon}
        <Text style={styles.messageStatusText}>{statusText}</Text>
      </View>
    );
  };
  
  // Render message item
  const renderMessageItem = useCallback(({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    const isSystemMessage = item.senderId === 'system';
    
    // Format message time
    const messageTime = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
          <Text style={styles.systemMessageTime}>{messageTime}</Text>
        </View>
      );
    }
    
    return (
      <Pressable
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
        ]}
        onLongPress={() => handleMessageLongPress(item.id)}
        delayLongPress={500}
      >
        {/* Message content */}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {/* Sender name for group chats */}
          {conversation?.isGroupChat && !isCurrentUser && (
            <Text style={styles.senderName}>{item.senderId}</Text>
          )}
          
          {/* Message text */}
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          
          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => {
                if (attachment.type === 'image') {
                  return (
                    <Image
                      key={index}
                      source={{ uri: attachment.url }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  );
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentFile}
                    onPress={() => {
                      // Open attachment
                    }}
                  >
                    <Ionicons
                      name={
                        attachment.type === 'audio' ? 'musical-note' :
                        attachment.type === 'video' ? 'videocam' : 'document'
                      }
                      size={24}
                      color="#8E44AD"
                    />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        
        <View style={styles.messageFooter}>
          {renderMessageStatus(item)}
          {renderReadReceipts(item)}
          <Text style={styles.messageTime}>
            {messageTime}
          </Text>
        </View>
        
        {/* Reactions */}
        {renderReactions(item)}
      </Pressable>
    );
  }, [user, conversation, theme]);
  
  // Render participant item
  const renderParticipantItem = (participant: UserProfile) => {
    const isCurrentUser = participant.id === user?.uid;
    const isAdmin = conversation?.groupAdminId === participant.id;
    
    return (
      <View style={styles.participantItem} key={participant.id}>
        <View style={styles.participantInfo}>
          <View style={styles.participantAvatar}>
            <Text style={styles.participantAvatarText}>
              {(participant.displayName || participant.username || participant.id).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.participantName}>
              {participant.displayName || participant.username || participant.id}
              {isCurrentUser && ' (You)'}
            </Text>
            {isAdmin && (
              <Text style={styles.adminBadge}>Admin</Text>
            )}
          </View>
        </View>
        
        {!isCurrentUser && conversation?.groupAdminId === user?.uid && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeUserFromGroup(participant.id)}
            disabled={removingUser}
          >
            <Ionicons name="remove-circle" size={24} color="#D32F2F" />
          </TouchableOpacity>
        )}
        
        {isCurrentUser && conversation?.groupAdminId !== user?.uid && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => removeUserFromGroup(user.uid)}
            disabled={removingUser}
          >
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    let typingText = '';
    if (typingUsers.length === 1) {
      // Get user name if available, otherwise use ID
      const userName = typingUsers[0].substring(0, 6) + '...';
      typingText = `${userName} is typing...`;
    } else if (typingUsers.length === 2) {
      const user1 = typingUsers[0].substring(0, 6) + '...';
      const user2 = typingUsers[1].substring(0, 6) + '...';
      typingText = `${user1} and ${user2} are typing...`;
    } else {
      typingText = 'Several people are typing...';
    }
    
    return (
      <View style={styles.typingIndicator}>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
          <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
        </View>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };
  
  // Setup online status tracking for participants
  useEffect(() => {
    if (!conversation || !user) return;
    
    const otherParticipants = conversation.participants.filter(id => id !== user.uid);
    const unsubscribes: (() => void)[] = [];
    
    console.log(`[ConversationScreen] Setting up online status tracking for ${otherParticipants.length} participants`);
    
    // Subscribe to online status for each participant
    otherParticipants.forEach(participantId => {
      const unsubscribe = userService.subscribeToUserOnlineStatus(
        participantId,
        (isOnline, lastSeen) => {
          setParticipantOnlineStatus(prev => ({
            ...prev,
            [participantId]: { isOnline, lastSeen }
          }));
        }
      );
      
      unsubscribes.push(unsubscribe);
    });
    
    return () => {
      console.log(`[ConversationScreen] Cleaning up online status subscriptions`);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [conversation, user]);
  
  // Get formatted time ago for last seen
  const getLastSeenText = (userId: string) => {
    const status = participantOnlineStatus[userId];
    
    if (!status) return 'Offline';
    
    if (status.isOnline) return 'Online';
    
    if (status.lastSeen) {
      return `Last seen ${formatDistanceToNow(status.lastSeen, { addSuffix: true })}`;
    }
    
    return 'Offline';
  };
  
  // Render online status indicator
  const renderOnlineStatus = (userId: string) => {
    const status = participantOnlineStatus[userId];
    const isOnline = status?.isOnline || false;
    
    return (
      <View style={styles.onlineStatusContainer}>
        <View style={[
          styles.onlineStatusIndicator, 
          { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }
        ]} />
        <Text style={styles.onlineStatusText}>
          {getLastSeenText(userId)}
        </Text>
      </View>
    );
  };
  
  // Render loading state
  if (loading && messages.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.cardBackground,
          borderBottomColor: theme.border 
        },
        Platform.OS === 'ios' && { paddingTop: insets.top }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {getConversationTitle()}
          </Text>
          
          {!conversation?.isGroupChat && conversation?.participants && (
            <View style={styles.participantInfo}>
              {conversation.participants
                .filter(id => id !== user?.uid)
                .map(participantId => renderOnlineStatus(participantId))}
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {conversation?.isGroupChat && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowGroupInfo(true)}
            >
              <Ionicons name="people" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Group Info Modal */}
      <Modal
        visible={showGroupInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupInfo(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Info</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGroupInfo(false)}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.groupInfoContainer}>
              <Text style={styles.groupName}>{conversation?.groupName || 'Group Chat'}</Text>
              <Text style={styles.participantsCount}>
                {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
              </Text>
            </View>
            
            {conversation?.groupAdminId === user?.uid && (
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={addUserToGroup}
                disabled={addingUser}
              >
                <Ionicons name="person-add" size={20} color="#8E44AD" />
                <Text style={styles.addUserButtonText}>Add Participants</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.sectionTitle}>Participants</Text>
            
            {loadingParticipants ? (
              <ActivityIndicator size="small" color="#8E44AD" style={styles.loadingIndicator} />
            ) : (
              <ScrollView style={styles.participantsList}>
                {participants.map(renderParticipantItem)}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <Pressable
          style={styles.reactionPickerOverlay}
          onPress={() => setShowReactionPicker(false)}
        >
          <View style={styles.reactionPickerContainer}>
            {COMMON_REACTIONS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionPickerItem}
                onPress={() => addReaction(emoji)}
              >
                <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
      
      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E44AD" testID="loading-indicator" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color={theme.tint} /> : null}
        />
      )}
      
      {/* Typing indicator */}
      {renderTypingIndicator()}
      
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <View style={[styles.attachmentsPreview, { backgroundColor: theme.cardBackground }]}>
          <FlatList
            data={attachments}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            renderItem={({ item, index }) => (
              <View style={styles.attachmentPreviewItem}>
                {item.type.startsWith('image/') ? (
                  <Image source={{ uri: item.uri }} style={styles.attachmentPreviewImage} />
                ) : item.type.startsWith('audio/') ? (
                  <View style={[styles.attachmentPreviewDocument, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name="mic" size={20} color={theme.tint} />
                  </View>
                ) : (
                  <View style={[styles.attachmentPreviewDocument, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name="document" size={20} color={theme.tint} />
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.removeAttachment, { backgroundColor: theme.error }]}
                  onPress={() => removeAttachment(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
      
      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: theme.tint + '20' }]}
            onPress={() => {
              Alert.alert(
                'Attach',
                'Choose attachment type',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Photo', onPress: pickImage },
                  { text: 'Document', onPress: pickDocument },
                ]
              );
            }}
          >
            <Ionicons name="attach" size={24} color={theme.tint} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { 
                backgroundColor: theme.cardBackground,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={messageText}
            onChangeText={handleTextInputChange}
            multiline
            maxLength={1000}
          />
          
          {isRecording ? (
            <TouchableOpacity style={styles.recordingButton} onPress={stopRecording}>
              <Ionicons name="mic" size={24} color="red" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={!messageText.trim() && attachments.length === 0}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color={messageText.trim() || attachments.length > 0 ? theme.tint : theme.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  infoButton: {
    padding: 8,
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
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
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
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '100%',
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: '#E0E0E0',
    alignSelf: 'flex-end',
  },
  otherUserTime: {
    color: '#999999',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  systemMessageTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  recordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  attachmentsPreview: {
    padding: 8,
    borderTopWidth: 1,
  },
  attachmentPreviewItem: {
    marginRight: 8,
    position: 'relative',
  },
  attachmentPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentPreviewDocument: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  groupInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  participantsCount: {
    fontSize: 14,
    color: '#666666',
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  addUserButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6D4EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E44AD',
  },
  participantName: {
    fontSize: 16,
    color: '#333333',
  },
  adminBadge: {
    fontSize: 12,
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
  leaveButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  leaveButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  // Reaction styles
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  userReactionBadge: {
    backgroundColor: '#E6D4EB',
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666666',
  },
  
  // Read receipts styles
  readReceiptsContainer: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: 8,
  },
  readReceiptsText: {
    fontSize: 10,
    color: '#8E44AD',
    fontStyle: 'italic',
  },
  
  // Reaction picker styles
  reactionPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 8,
  },
  reactionPickerItem: {
    padding: 8,
    marginHorizontal: 4,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },
  
  // Typing indicator styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 10,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  participantInfo: {
    marginTop: 2,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  messageStatusText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 2,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
});

export default ConversationScreen; 