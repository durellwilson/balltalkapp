import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import CollaborationService, { 
  CollaborationSession, 
  CollaborationUser, 
  CollaborationMessage 
} from '../../services/CollaborationService';
import Colors from '@/constants/Colors';

interface CollaborationPanelProps {
  projectId: string;
  isVisible: boolean;
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  projectId, 
  isVisible, 
  onClose 
}) => {
  const { user } = useAuth();
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  const messagesRef = useRef<FlatList>(null);
  const sessionUnsubscribeRef = useRef<() => void | null>(null);
  const messagesUnsubscribeRef = useRef<() => void | null>(null);
  
  // Initialize or join session
  useEffect(() => {
    if (isVisible && user && projectId) {
      initializeSession();
    }
    
    return () => {
      // Clean up listeners when component unmounts
      if (sessionUnsubscribeRef.current) {
        sessionUnsubscribeRef.current();
      }
      
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, [isVisible, user, projectId]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesRef.current) {
      setTimeout(() => {
        messagesRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const initializeSession = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Check if there's an active session for this project
      const sessionsRef = await CollaborationService.findSessionByProject(projectId);
      
      if (sessionsRef) {
        // Join existing session
        await joinExistingSession(sessionsRef.inviteCode);
      } else {
        // Create new session
        await createNewSession();
      }
    } catch (error) {
      console.error('Error initializing collaboration session:', error);
      Alert.alert('Error', 'Failed to initialize collaboration session');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewSession = async () => {
    if (!user) return;
    
    try {
      const newSession = await CollaborationService.createSession(
        projectId,
        user.uid,
        user.displayName || user.email || 'Host'
      );
      
      setSession(newSession);
      
      // Subscribe to session updates
      const unsubscribe = CollaborationService.subscribeToSession(
        newSession.id,
        (updatedSession) => {
          setSession(updatedSession);
        }
      );
      
      sessionUnsubscribeRef.current = unsubscribe;
      
      // Subscribe to messages
      const messagesUnsubscribe = CollaborationService.subscribeToMessages(
        newSession.id,
        (newMessages) => {
          setMessages(newMessages);
        }
      );
      
      messagesUnsubscribeRef.current = messagesUnsubscribe;
      
      // Send welcome message
      await CollaborationService.sendMessage(
        newSession.id,
        'system',
        'System',
        'Collaboration session started. Share the invite code to collaborate with others.'
      );
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create collaboration session');
    }
  };
  
  const joinExistingSession = async (code: string) => {
    if (!user) return;
    
    setIsJoining(true);
    
    try {
      const joinedSession = await CollaborationService.joinSession(
        code,
        user.uid,
        user.displayName || user.email || 'Collaborator'
      );
      
      if (joinedSession) {
        setSession(joinedSession);
        
        // Subscribe to session updates
        const unsubscribe = CollaborationService.subscribeToSession(
          joinedSession.id,
          (updatedSession) => {
            setSession(updatedSession);
          }
        );
        
        sessionUnsubscribeRef.current = unsubscribe;
        
        // Subscribe to messages
        const messagesUnsubscribe = CollaborationService.subscribeToMessages(
          joinedSession.id,
          (newMessages) => {
            setMessages(newMessages);
          }
        );
        
        messagesUnsubscribeRef.current = messagesUnsubscribe;
      } else {
        Alert.alert('Error', 'Invalid invite code or session has ended');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', 'Failed to join collaboration session');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !session || !user) return;
    
    try {
      await CollaborationService.sendMessage(
        session.id,
        user.uid,
        user.displayName || user.email || 'User',
        messageText.trim()
      );
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };
  
  const handleLeaveSession = async () => {
    if (!session || !user) return;
    
    try {
      await CollaborationService.leaveSession(session.id, user.uid);
      
      // Clean up listeners
      if (sessionUnsubscribeRef.current) {
        sessionUnsubscribeRef.current();
      }
      
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
      
      setSession(null);
      setMessages([]);
      onClose();
    } catch (error) {
      console.error('Error leaving session:', error);
      Alert.alert('Error', 'Failed to leave collaboration session');
    }
  };
  
  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    
    await joinExistingSession(inviteCode.trim());
    setShowInviteModal(false);
    setInviteCode('');
  };
  
  const copyInviteCode = () => {
    if (!session?.inviteCode) return;
    
    // In a real app, you would use Clipboard.setString(session.inviteCode)
    Alert.alert('Invite Code', `Code copied: ${session.inviteCode}`);
  };
  
  const renderMessage = ({ item }: { item: CollaborationMessage }) => {
    const isCurrentUser = user && item.userId === user.uid;
    const isSystem = item.userId === 'system';
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        isSystem && styles.systemMessage
      ]}>
        {!isCurrentUser && !isSystem && (
          <Text style={styles.messageSender}>{item.displayName}</Text>
        )}
        <Text style={[
          styles.messageText,
          isSystem && styles.systemMessageText
        ]}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };
  
  const renderParticipant = ({ item }: { item: CollaborationUser }) => {
    const isHost = item.role === 'host';
    const isCurrentUser = user && item.userId === user.uid;
    
    return (
      <View style={styles.participantItem}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {item.displayName} {isCurrentUser ? '(You)' : ''}
          </Text>
          {isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>Host</Text>
            </View>
          )}
        </View>
        <View style={[
          styles.statusIndicator,
          item.isActive ? styles.activeStatus : styles.inactiveStatus
        ]} />
      </View>
    );
  };
  
  if (!isVisible) return null;
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Collaboration Studio</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Setting up collaboration...</Text>
            </View>
          ) : !session ? (
            <View style={styles.noSessionContainer}>
              <Text style={styles.noSessionText}>No active collaboration session</Text>
              <View style={styles.sessionButtons}>
                <TouchableOpacity 
                  style={styles.createSessionButton}
                  onPress={createNewSession}
                >
                  <Text style={styles.buttonText}>Create Session</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.joinSessionButton}
                  onPress={() => setShowInviteModal(true)}
                >
                  <Text style={styles.buttonText}>Join Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.sessionContainer}>
              {/* Session Info */}
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>
                    Session: {session.inviteCode}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={copyInviteCode}
                  >
                    <Ionicons name="copy-outline" size={18} color="#fff" />
                    <Text style={styles.copyText}>Copy Code</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Participants */}
                <View style={styles.participantsContainer}>
                  <Text style={styles.sectionTitle}>Participants</Text>
                  <FlatList
                    data={session.activeUsers}
                    renderItem={renderParticipant}
                    keyExtractor={(item) => item.userId}
                    horizontal={false}
                    style={styles.participantsList}
                  />
                </View>
              </View>
              
              {/* Chat */}
              <View style={styles.chatContainer}>
                <Text style={styles.sectionTitle}>Chat</Text>
                <FlatList
                  ref={messagesRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                />
                
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={100}
                  style={styles.inputContainer}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                  />
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Ionicons 
                      name="send" 
                      size={24} 
                      color={messageText.trim() ? Colors.primary : '#ccc'} 
                    />
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              </View>
              
              {/* Leave Button */}
              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={handleLeaveSession}
              >
                <Ionicons name="exit-outline" size={18} color="#fff" />
                <Text style={styles.leaveButtonText}>Leave Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Join with Code Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.inviteModalContainer}>
          <View style={styles.inviteModalContent}>
            <Text style={styles.inviteModalTitle}>Join Collaboration</Text>
            <Text style={styles.inviteModalSubtitle}>
              Enter the invite code to join a session
            </Text>
            
            <TextInput
              style={styles.inviteCodeInput}
              placeholder="Enter invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            
            <View style={styles.inviteModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={handleJoinWithCode}
                disabled={isJoining || !inviteCode.trim()}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.joinButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSessionText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  sessionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  createSessionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  joinSessionButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionContainer: {
    flex: 1,
    padding: 10,
  },
  sessionInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  copyText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  participantsContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  participantsList: {
    maxHeight: 100,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 14,
    color: '#333',
  },
  hostBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeStatus: {
    backgroundColor: '#4CAF50',
  },
  inactiveStatus: {
    backgroundColor: '#ccc',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5e5',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    maxWidth: '90%',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
  },
  systemMessageText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 5,
    maxHeight: 100,
  },
  sendButton: {
    padding: 5,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  leaveButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  inviteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  inviteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  inviteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inviteModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  inviteCodeInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inviteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CollaborationPanel; 