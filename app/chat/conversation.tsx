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
import { useTheme } from '../../hooks/useTheme';
import MessageService, { Message, Conversation, MessageReaction } from '../../services/MessageService';
import UserService, { UserProfile } from '../../services/UserService';
import { formatDistanceToNow, formatRelative } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNetwork } from '../../contexts/NetworkContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  Layout
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Common emoji reactions
const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

// Animated components
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const ConversationScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
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
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const inputContainerTranslateY = useSharedValue(50);
  const inputContainerOpacity = useSharedValue(0);
  const sendButtonScale = useSharedValue(1);
  const attachmentScale = useSharedValue(1);
  const micButtonScale = useSharedValue(1);
  const reactionMenuScale = useSharedValue(0);
  
  // Set up message subscription and load conversation data
  useEffect(() => {
    if (!user || !conversationId) return;
    
    console.log(`[ConversationScreen] Setting up for conversation ${conversationId}`);
    
    // Set loading flag
    setLoading(true);
    
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 500 });
    inputContainerTranslateY.value = withDelay(300, withSpring(0, { damping: 12 }));
    inputContainerOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    
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
  }, [user, conversationId, loadMessages, setupMessageSubscription]);

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
    
    // Animate send button
    sendButtonScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    
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
    // Animate attachment button
    attachmentScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    
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
    // Animate mic button
    micButtonScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    
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
    
    // Animate reaction menu
    reactionMenuScale.value = withSpring(1, { damping: 12 });
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
  
  // Render message item with animations
  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.uid;
    const isSystemMessage = item.senderId === 'system';
    
    // Format message time
    const messageDate = new Date(item.timestamp);
    const formattedTime = formatRelative(messageDate, new Date());
    
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
          <Text style={styles.systemMessageTime}>{formattedTime}</Text>
        </View>
      );
    }
    
    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          getMessageAnimationStyle(index, isOwnMessage)
        ]}
      >
        <Pressable
          style={[
            styles.messageBubble,
            isOwnMessage 
              ? [styles.ownMessageBubble, { backgroundColor: theme.primary }] 
              : [styles.otherMessageBubble, { backgroundColor: theme.cardBackground }]
          ]}
          onLongPress={() => handleMessageLongPress(item.id)}
          delayLongPress={200}
        >
          {!isOwnMessage && item.senderName && (
            <Text style={[styles.senderName, { color: theme.accent }]}>
              {item.senderName}
            </Text>
          )}
          
          {item.content && (
            <Text 
              style={[
                styles.messageText, 
                { color: isOwnMessage ? '#FFFFFF' : theme.text }
              ]}
            >
              {item.content}
            </Text>
          )}
          
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
          
          <Text 
            style={[
              styles.messageTime, 
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
            ]}
          >
            {formattedTime}
          </Text>
        </Pressable>
        
        {renderReactions(item)}
        {renderMessageStatus(item)}
      </Animated.View>
    );
  };
  
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
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value
    };
  });
  
  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: inputContainerTranslateY.value }],
      opacity: inputContainerOpacity.value
    };
  });
  
  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sendButtonScale.value }]
    };
  });
  
  const attachmentButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: attachmentScale.value }]
    };
  });
  
  const micButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: micButtonScale.value }]
    };
  });
  
  const reactionMenuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: reactionMenuScale.value }],
      opacity: reactionMenuScale.value
    };
  });
  
  // Message animation based on position
  const getMessageAnimationStyle = (index: number, isOwnMessage: boolean) => {
    return {
      entering: isOwnMessage 
        ? SlideInRight.delay(50 * index).springify().damping(12) 
        : SlideInUp.delay(50 * index).springify().damping(12),
      layout: Layout.springify().damping(12)
    };
  };
  
  // Close reaction picker with animation
  const closeReactionPicker = () => {
    // Animate reaction menu closing
    reactionMenuScale.value = withTiming(0, { duration: 200 });
    
    // Delay actual state change to allow animation to complete
    setTimeout(() => {
      setShowReactionPicker(false);
      setSelectedMessageId(null);
    }, 200);
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Animated.View 
        style={[
          styles.header,
          { 
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            paddingTop: insets.top
          },
          headerAnimatedStyle
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => setShowGroupInfo(true)}
        >
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {getConversationTitle()}
          </Text>
          
          {typingUsers.length > 0 ? (
            <Text style={[styles.typingText, { color: theme.primary }]}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          ) : conversation?.type === 'direct' ? (
            renderOnlineStatus(
              conversation.participants.find(id => id !== user?.uid) || ''
            )
          ) : (
            <Text style={[styles.participantsText, { color: theme.textSecondary }]}>
              {conversation?.participants.length || 0} participants
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {conversation?.type === 'group' && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowGroupInfo(true)}
            >
              <Ionicons name="people" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading conversation...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : (
        <AnimatedFlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          inverted
          onEndReached={() => {/* Load more messages */}}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderTypingIndicator}
          ListEmptyComponent={
            <Animated.View 
              style={[
                styles.emptyContainer,
                { entering: FadeIn.delay(300).duration(500) }
              ]}
            >
              <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No messages yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Start the conversation by sending a message
              </Text>
            </Animated.View>
          }
        />
      )}
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { 
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16
          },
          inputContainerAnimatedStyle
        ]}
      >
        {attachments.length > 0 && (
          <ScrollView 
            horizontal 
            style={styles.attachmentsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {attachments.map((attachment, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.attachmentPreview,
                  { entering: ZoomIn.duration(300) }
                ]}
              >
                {attachment.type.startsWith('image') ? (
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                ) : (
                  <View style={[styles.documentPreview, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="document" size={24} color={theme.primary} />
                    <Text style={[styles.documentName, { color: theme.text }]} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.removeAttachment, { backgroundColor: theme.error }]}
                  onPress={() => removeAttachment(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        )}
        
        <View style={styles.inputRow}>
          <AnimatedTouchableOpacity
            style={[
              styles.attachButton,
              { backgroundColor: theme.cardBackground },
              attachmentButtonAnimatedStyle
            ]}
            onPress={pickImage}
          >
            <Ionicons name="image" size={24} color={theme.primary} />
          </AnimatedTouchableOpacity>
          
          <AnimatedTextInput
            ref={inputRef}
            style={[
              styles.input,
              { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={messageText}
            onChangeText={handleTextInputChange}
            multiline
          />
          
          {messageText.trim() || attachments.length > 0 ? (
            <AnimatedTouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.primary },
                sendButtonAnimatedStyle
              ]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </AnimatedTouchableOpacity>
          ) : (
            <AnimatedTouchableOpacity
              style={[
                styles.micButton,
                isRecording 
                  ? [styles.recordingButton, { backgroundColor: theme.error }]
                  : { backgroundColor: theme.primary },
                micButtonAnimatedStyle
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color="#FFFFFF" 
              />
            </AnimatedTouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Reaction picker modal */}
      {showReactionPicker && (
        <View style={styles.reactionPickerOverlay}>
          <Pressable 
            style={styles.reactionPickerBackground}
            onPress={closeReactionPicker}
          />
          <Animated.View 
            style={[
              styles.reactionPicker,
              { backgroundColor: theme.cardBackground },
              reactionMenuAnimatedStyle
            ]}
          >
            {COMMON_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => {
                  if (selectedMessageId) {
                    addReaction(emoji);
                  }
                  closeReactionPicker();
                }}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      )}
      
      {/* Group info modal */}
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
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  participantsText: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    height: 30,
  },
  audioWaveformBar: {
    width: 3,
    height: 10,
    borderRadius: 1.5,
    marginHorizontal: 2,
  },
  audioDuration: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 8,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  attachmentPreview: {
    marginRight: 8,
    position: 'relative',
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentName: {
    fontSize: 8,
    marginTop: 4,
    width: 50,
    textAlign: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  reactionPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  reactionPickerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reactionPicker: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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