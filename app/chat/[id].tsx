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
    const messagesUnsubscribe = ChatService.getMessages(id, 50, (data, error) => {
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setMessages(data.sort((a, b) => {
        return b.timestamp.toMillis() - a.timestamp.toMillis();
      }));
      setLoading(false);
    });

    // Subscribe to typing status
    const typingUnsubscribe = ChatService.getTypingStatus(id, (typingData, error) => {
      if (error) {
        console.error('Error fetching typing status:', error);
        return;
      }
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

    const unsubscribe = ChatService.getConversations(user.uid, (conversations, error) => {
      if (error) {
        setError(error);
        return;
      }
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
    if (!messageText.trim() || !user || !id || sending) return;
    
    const trimmedMessage = messageText.trim();
    setMessageText('');
    setSending(true);
    
    try {
      await ChatService.sendMessage(id, {
        text: trimmedMessage,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        timestamp: new Date(),
      });
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (err) {
      console.error('Error sending message:', err);
      // Show the message text again if sending failed
      setMessageText(trimmedMessage);
      
      // Show error toast or notification
      if (!isOffline) {
        setError(new Error('Failed to send message. Please try again.'));
      }
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
        message={error.message || "Something went wrong"} 
        onRetry={() => setError(null)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.groupName || conversation?.participants
              .filter(p => p !== user?.uid)
              .map(p => conversation?.participantNames?.[p] || 'User')
              .join(', ')}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <ErrorFallback 
            message={error.message || "Something went wrong"} 
            onRetry={() => setError(null)} 
          />
        )}

        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={16} color="#fff" />
            <Text style={styles.offlineText}>You're offline. Messages will be sent when you reconnect.</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            inverted={false}
            onLayout={() => {
              // Scroll to bottom on initial load
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer,
                item.senderId === user?.uid ? styles.sentMessage : styles.receivedMessage
              ]}>
                {item.senderId !== user?.uid && (
                  <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <View style={[
                  styles.messageBubble,
                  item.senderId === user?.uid ? styles.sentBubble : styles.receivedBubble
                ]}>
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
                <Text style={styles.messageTime}>
                  {item.timestamp ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true }) : ''}
                </Text>
                
                {/* Reactions */}
                {item.reactions && Object.keys(item.reactions).length > 0 && (
                  <View style={styles.reactionsContainer}>
                    {Object.entries(item.reactions).map(([emoji, users]) => (
                      <TouchableOpacity 
                        key={emoji}
                        style={styles.reactionBubble}
                        onPress={() => 
                          users.includes(user?.uid) 
                            ? handleRemoveReaction(item.id, emoji)
                            : handleAddReaction(item.id, emoji)
                        }
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text style={styles.reactionCount}>{users.length}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )}

        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#999" />
            <Text style={styles.typingText}>
              {typingUsers.length === 1 
                ? `${typingUsers[0].displayName} is typing...` 
                : `${typingUsers.length} people are typing...`}
            </Text>
          </View>
        )}

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
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  infoButton: {
    padding: 5,
  },
  offlineBanner: {
    backgroundColor: '#ff9800',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  sentBubble: {
    backgroundColor: '#007AFF',
  },
  receivedBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  sentBubble: {
    backgroundColor: '#007AFF',
  },
  receivedBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: props => props.sentBubble ? '#fff' : '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingLeft: 15,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
});
