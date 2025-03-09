import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import ChatService, { Message, Conversation, TypingStatus } from '../../services/ChatService';
import { formatDistanceToNow } from 'date-fns';
import ErrorFallback from '../../components/fallbacks/ErrorFallback';
import { useOffline } from '../../contexts/OfflineContext';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    // Mark messages as read when opening the conversation
    ChatService.markMessagesAsRead(id, user.uid).catch(err => {
      console.error('Error marking messages as read:', err);
    });

    // Subscribe to messages
    const messagesUnsubscribe = ChatService.getMessages(id, 50, (data) => {
      setMessages(data.sort((a, b) => {
        return b.timestamp.toMillis() - a.timestamp.toMillis();
      }));
      setLoading(false);
    });

    // Subscribe to typing status
    const typingUnsubscribe = ChatService.getTypingStatus(id, (typingData) => {
      // Filter out the current user
      setTypingUsers(typingData.filter(status => status.userId !== user.uid));
    });

    return () => {
      messagesUnsubscribe();
      typingUnsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, id]);

  // Get conversation details
  useEffect(() => {
    if (!user || !id) return;

    const unsubscribe = ChatService.getConversations(user.uid, (conversations) => {
      const currentConversation = conversations.find(conv => conv.id === id);
      if (currentConversation) {
        setConversation(currentConversation);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, id]);

  const handleSendMessage = async () => {
    if (!user || !id || !messageText.trim() || sending) return;

    try {
      setSending(true);
      await ChatService.sendMessage({
        conversationId: id,
        senderId: user.uid,
        text: messageText.trim()
      });
      setMessageText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err as Error);
    } finally {
      setSending(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!user || !id) return;
    
    ChatService.addReaction(messageId, user.uid, emoji).catch(err => {
      console.error('Error adding reaction:', err);
    });
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (!user || !id) return;
    
    ChatService.removeReaction(messageId, user.uid, emoji).catch(err => {
      console.error('Error removing reaction:', err);
    });
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    // Update typing status
    if (!user || !id) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Update typing status
    ChatService.updateTypingStatus(id, user.uid, user.displayName || 'User').catch(err => {
      console.error('Error updating typing status:', err);
    });
    
    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      // This will be cleared automatically after 5 seconds on the server
    }, 4000);
  };

  if (error) {
    return (
      <ErrorFallback 
        message="Could not load conversation" 
        onRetry={() => setError(null)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {conversation?.isGroup 
              ? conversation.groupName 
              : 'Direct Message'}
          </Text>
          <View style={styles.headerRight}>
            {conversation?.isPremium && (
              <Ionicons name="star" size={18} color="#FFD700" style={styles.premiumIcon} />
            )}
          </View>
        </View>

        {isOffline && (
          <View style={styles.offlineNotice}>
            <Ionicons name="cloud-offline" size={16} color="white" />
            <Text style={styles.offlineText}>You're offline. Messages will be sent when you're back online.</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id || ''}
              inverted
              contentContainerStyle={styles.messagesList}
              renderItem={({ item }) => {
                const isMyMessage = item.senderId === user?.uid;
                const messageTime = item.timestamp 
                  ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true })
                  : '';
                
                return (
                  <View style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
                  ]}>
                    <View style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
                    ]}>
                      <Text style={styles.messageText}>{item.text}</Text>
                      <Text style={styles.messageTime}>{messageTime}</Text>
                    </View>
                    
                    {/* Reactions */}
                    {item.reactions && item.reactions.length > 0 && (
                      <View style={styles.reactionsContainer}>
                        {/* Group reactions by emoji */}
                        {Object.entries(
                          item.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <TouchableOpacity 
                            key={emoji}
                            style={styles.reactionBubble}
                            onPress={() => {
                              // Toggle reaction
                              const hasReacted = item.reactions?.some(
                                r => r.userId === user?.uid && r.emoji === emoji
                              );
                              
                              if (hasReacted) {
                                handleRemoveReaction(item.id || '', emoji);
                              } else {
                                handleAddReaction(item.id || '', emoji);
                              }
                            }}
                          >
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                            {count > 1 && (
                              <Text style={styles.reactionCount}>{count}</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {/* Read receipts */}
                    {isMyMessage && item.readBy && item.readBy.length > 1 && (
                      <View style={styles.readReceiptContainer}>
                        <Ionicons name="checkmark-done" size={14} color="#007AFF" />
                        <Text style={styles.readReceiptText}>
                          Read by {item.readBy.length - 1}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>
                    {typingUsers.length === 1
                      ? `${typingUsers[0].displayName} is typing...`
                      : `${typingUsers.length} people are typing...`}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Message input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={messageText}
                onChangeText={handleTextChange}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!messageText.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  keyboardAvoidingView: {
    flex: 1
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
    width: 40,
    alignItems: 'flex-end'
  },
  premiumIcon: {
    marginRight: 4
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 8,
    marginBottom: 8
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%'
  },
  myMessageContainer: {
    alignSelf: 'flex-end'
  },
  otherMessageContainer: {
    alignSelf: 'flex-start'
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
  },
  otherMessageBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: 'white'
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4
  },
  reactionEmoji: {
    fontSize: 14
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666'
  },
  readReceiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  readReceiptText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  typingBubble: {
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
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
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0'
  }
});
