import { collection, query, where, orderBy, addDoc, updateDoc, doc, getDoc, getDocs, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../models/User';
import { recordError, ErrorCategory } from '../utils/errorReporting';
import { NetworkError, DataError } from '../utils/errors';

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  readBy: string[];
  reactions?: MessageReaction[];
  attachments?: Attachment[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Timestamp;
}

export interface Attachment {
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  name: string;
  size?: number;
  duration?: number; // For audio/video
}

export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  unreadCount?: Record<string, number>;
  isPremium?: boolean;
  isAthleteOnly?: boolean;
  isFanGroup?: boolean;
  isMonetized?: boolean;
}

export interface TypingStatus {
  userId: string;
  displayName: string;
  timestamp: Timestamp;
}

/**
 * Service for handling chat-related functionality
 */
class ChatService {
  /**
   * Get conversations for a user
   * @param userId - The user ID
   * @returns A function to unsubscribe from the snapshot listener
   */
  getConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Conversation));
        
        callback(conversations);
      }, (error) => {
        recordError(error, 'ChatService.getConversations', ErrorCategory.DATA);
        throw new DataError(
          'FETCH_CONVERSATIONS_FAILED',
          'Failed to fetch conversations',
          error,
          'ChatService.getConversations'
        );
      });
    } catch (error) {
      recordError(error, 'ChatService.getConversations', ErrorCategory.DATA);
      throw new DataError(
        'FETCH_CONVERSATIONS_FAILED',
        'Failed to fetch conversations',
        error,
        'ChatService.getConversations'
      );
    }
  }

  /**
   * Get premium group conversations for a user
   * @param userId - The user ID
   * @returns A function to unsubscribe from the snapshot listener
   */
  getPremiumGroupConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        where('isPremium', '==', true),
        orderBy('lastMessageAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Conversation));
        
        callback(conversations);
      }, (error) => {
        recordError(error, 'ChatService.getPremiumGroupConversations', ErrorCategory.DATA);
        throw new DataError(
          'FETCH_PREMIUM_CONVERSATIONS_FAILED',
          'Failed to fetch premium conversations',
          error,
          'ChatService.getPremiumGroupConversations'
        );
      });
    } catch (error) {
      recordError(error, 'ChatService.getPremiumGroupConversations', ErrorCategory.DATA);
      throw new DataError(
        'FETCH_PREMIUM_CONVERSATIONS_FAILED',
        'Failed to fetch premium conversations',
        error,
        'ChatService.getPremiumGroupConversations'
      );
    }
  }

  /**
   * Get messages for a conversation
   * @param conversationId - The conversation ID
   * @param messageLimit - The maximum number of messages to fetch
   * @returns A function to unsubscribe from the snapshot listener
   */
  getMessages(conversationId: string, messageLimit: number = 50, callback: (messages: Message[]) => void) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        
        callback(messages);
      }, (error) => {
        recordError(error, 'ChatService.getMessages', ErrorCategory.DATA);
        throw new DataError(
          'FETCH_MESSAGES_FAILED',
          'Failed to fetch messages',
          error,
          'ChatService.getMessages'
        );
      });
    } catch (error) {
      recordError(error, 'ChatService.getMessages', ErrorCategory.DATA);
      throw new DataError(
        'FETCH_MESSAGES_FAILED',
        'Failed to fetch messages',
        error,
        'ChatService.getMessages'
      );
    }
  }

  /**
   * Create a new conversation
   * @param conversation - The conversation data
   * @returns The created conversation ID
   */
  async createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'lastMessageAt'>) {
    try {
      const conversationData = {
        ...conversation,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadCount: conversation.participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as Record<string, number>)
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      recordError(error, 'ChatService.createConversation', ErrorCategory.DATA);
      throw new DataError(
        'CREATE_CONVERSATION_FAILED',
        'Failed to create conversation',
        error,
        'ChatService.createConversation'
      );
    }
  }

  /**
   * Send a message
   * @param message - The message data
   * @returns The created message ID
   */
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) {
    try {
      // Add message to Firestore
      const messageData = {
        ...message,
        timestamp: serverTimestamp(),
        readBy: [message.senderId] // Sender has read the message
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Update conversation with last message
      const conversationRef = doc(db, 'conversations', message.conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data() as Conversation;
        const unreadCount = { ...conversationData.unreadCount };
        
        // Increment unread count for all participants except sender
        conversationData.participants.forEach(userId => {
          if (userId !== message.senderId) {
            unreadCount[userId] = (unreadCount[userId] || 0) + 1;
          }
        });
        
        await updateDoc(conversationRef, {
          lastMessage: message.text.substring(0, 100), // Truncate long messages
          lastMessageAt: serverTimestamp(),
          unreadCount
        });
      }
      
      return docRef.id;
    } catch (error) {
      recordError(error, 'ChatService.sendMessage', ErrorCategory.DATA);
      throw new DataError(
        'SEND_MESSAGE_FAILED',
        'Failed to send message',
        error,
        'ChatService.sendMessage'
      );
    }
  }

  /**
   * Mark messages as read
   * @param conversationId - The conversation ID
   * @param userId - The user ID
   */
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      // Get unread messages
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('readBy', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const unreadMessages = querySnapshot.docs.map(doc => doc.id);
      
      // Mark each message as read
      const batch = [];
      for (const messageId of unreadMessages) {
        const messageRef = doc(db, 'messages', messageId);
        batch.push(updateDoc(messageRef, {
          readBy: arrayUnion(userId)
        }));
      }
      
      // Reset unread count for this user in the conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data() as Conversation;
        const unreadCount = { ...conversationData.unreadCount };
        unreadCount[userId] = 0;
        
        batch.push(updateDoc(conversationRef, { unreadCount }));
      }
      
      await Promise.all(batch);
    } catch (error) {
      recordError(error, 'ChatService.markMessagesAsRead', ErrorCategory.DATA);
      throw new DataError(
        'MARK_READ_FAILED',
        'Failed to mark messages as read',
        error,
        'ChatService.markMessagesAsRead'
      );
    }
  }

  /**
   * Add a reaction to a message
   * @param messageId - The message ID
   * @param userId - The user ID
   * @param emoji - The emoji reaction
   */
  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const reaction: MessageReaction = {
        userId,
        emoji,
        timestamp: Timestamp.now()
      };
      
      await updateDoc(messageRef, {
        reactions: arrayUnion(reaction)
      });
    } catch (error) {
      recordError(error, 'ChatService.addReaction', ErrorCategory.DATA);
      throw new DataError(
        'ADD_REACTION_FAILED',
        'Failed to add reaction',
        error,
        'ChatService.addReaction'
      );
    }
  }

  /**
   * Remove a reaction from a message
   * @param messageId - The message ID
   * @param userId - The user ID
   * @param emoji - The emoji reaction
   */
  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const message = messageDoc.data() as Message;
        const reactions = message.reactions || [];
        
        // Find the specific reaction to remove
        const reactionToRemove = reactions.find(
          r => r.userId === userId && r.emoji === emoji
        );
        
        if (reactionToRemove) {
          await updateDoc(messageRef, {
            reactions: arrayRemove(reactionToRemove)
          });
        }
      }
    } catch (error) {
      recordError(error, 'ChatService.removeReaction', ErrorCategory.DATA);
      throw new DataError(
        'REMOVE_REACTION_FAILED',
        'Failed to remove reaction',
        error,
        'ChatService.removeReaction'
      );
    }
  }

  /**
   * Update typing status
   * @param conversationId - The conversation ID
   * @param userId - The user ID
   * @param displayName - The user's display name
   */
  async updateTypingStatus(conversationId: string, userId: string, displayName: string) {
    try {
      const typingRef = doc(db, 'typing', `${conversationId}_${userId}`);
      
      await updateDoc(typingRef, {
        conversationId,
        userId,
        displayName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      // If the document doesn't exist, create it
      if ((error as any).code === 'not-found') {
        try {
          const typingRef = doc(db, 'typing', `${conversationId}_${userId}`);
          
          await updateDoc(typingRef, {
            conversationId,
            userId,
            displayName,
            timestamp: serverTimestamp()
          });
        } catch (innerError) {
          recordError(innerError, 'ChatService.updateTypingStatus', ErrorCategory.DATA);
        }
      } else {
        recordError(error, 'ChatService.updateTypingStatus', ErrorCategory.DATA);
      }
    }
  }

  /**
   * Get typing status for a conversation
   * @param conversationId - The conversation ID
   * @returns A function to unsubscribe from the snapshot listener
   */
  getTypingStatus(conversationId: string, callback: (typingUsers: TypingStatus[]) => void) {
    try {
      const q = query(
        collection(db, 'typing'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const now = Timestamp.now();
        const fiveSecondsAgo = new Timestamp(
          now.seconds - 5,
          now.nanoseconds
        );
        
        // Only include users who have typed in the last 5 seconds
        const typingUsers = snapshot.docs
          .map(doc => doc.data() as TypingStatus)
          .filter(status => status.timestamp > fiveSecondsAgo);
        
        callback(typingUsers);
      }, (error) => {
        recordError(error, 'ChatService.getTypingStatus', ErrorCategory.DATA);
      });
    } catch (error) {
      recordError(error, 'ChatService.getTypingStatus', ErrorCategory.DATA);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Add a user to a group conversation
   * @param conversationId - The conversation ID
   * @param userId - The user ID to add
   */
  async addUserToGroup(conversationId: string, userId: string) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data() as Conversation;
        
        if (!conversationData.isGroup) {
          throw new DataError(
            'NOT_GROUP_CONVERSATION',
            'Cannot add user to a non-group conversation',
            null,
            'ChatService.addUserToGroup'
          );
        }
        
        // Add user to participants
        await updateDoc(conversationRef, {
          participants: arrayUnion(userId)
        });
        
        // Initialize unread count for new user
        const unreadCount = { ...conversationData.unreadCount };
        unreadCount[userId] = 0;
        
        await updateDoc(conversationRef, { unreadCount });
      } else {
        throw new DataError(
          'CONVERSATION_NOT_FOUND',
          'Conversation not found',
          null,
          'ChatService.addUserToGroup'
        );
      }
    } catch (error) {
      recordError(error, 'ChatService.addUserToGroup', ErrorCategory.DATA);
      throw new DataError(
        'ADD_USER_FAILED',
        'Failed to add user to group',
        error,
        'ChatService.addUserToGroup'
      );
    }
  }

  /**
   * Remove a user from a group conversation
   * @param conversationId - The conversation ID
   * @param userId - The user ID to remove
   */
  async removeUserFromGroup(conversationId: string, userId: string) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data() as Conversation;
        
        if (!conversationData.isGroup) {
          throw new DataError(
            'NOT_GROUP_CONVERSATION',
            'Cannot remove user from a non-group conversation',
            null,
            'ChatService.removeUserFromGroup'
          );
        }
        
        // Remove user from participants
        await updateDoc(conversationRef, {
          participants: arrayRemove(userId)
        });
        
        // Remove unread count for user
        const unreadCount = { ...conversationData.unreadCount };
        delete unreadCount[userId];
        
        await updateDoc(conversationRef, { unreadCount });
      } else {
        throw new DataError(
          'CONVERSATION_NOT_FOUND',
          'Conversation not found',
          null,
          'ChatService.removeUserFromGroup'
        );
      }
    } catch (error) {
      recordError(error, 'ChatService.removeUserFromGroup', ErrorCategory.DATA);
      throw new DataError(
        'REMOVE_USER_FAILED',
        'Failed to remove user from group',
        error,
        'ChatService.removeUserFromGroup'
      );
    }
  }

  /**
   * Create a premium group conversation
   * @param conversation - The conversation data
   * @param price - The subscription price
   * @returns The created conversation ID
   */
  async createPremiumGroup(
    conversation: Omit<Conversation, 'id' | 'createdAt' | 'lastMessageAt'>,
    price: number
  ) {
    try {
      const conversationId = await this.createConversation({
        ...conversation,
        isPremium: true
      });
      
      // Create subscription info
      await addDoc(collection(db, 'premiumGroups'), {
        conversationId,
        price,
        createdAt: serverTimestamp(),
        createdBy: conversation.createdBy,
        subscriberCount: 0,
        isActive: true
      });
      
      return conversationId;
    } catch (error) {
      recordError(error, 'ChatService.createPremiumGroup', ErrorCategory.DATA);
      throw new DataError(
        'CREATE_PREMIUM_GROUP_FAILED',
        'Failed to create premium group',
        error,
        'ChatService.createPremiumGroup'
      );
    }
  }
}

export default new ChatService(); 