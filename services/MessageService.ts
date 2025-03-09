import { db, storage } from '../config/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  startAfter,
  addDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from './UserService';

// Message interface
export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  readBy?: string[]; // Array of user IDs who have read the message
  reactions?: MessageReaction[]; // Array of reactions to the message
  attachments?: {
    type: 'image' | 'audio' | 'video' | 'file';
    url: string;
    name: string;
  }[];
  isSystemMessage?: boolean;
  systemMessageType?: string;
}

// Conversation interface
export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
  isGroupChat: boolean;
  groupName?: string;
  groupAdminId?: string;
  unreadCount?: {
    [userId: string]: number;
  };
  isAthleteOnly?: boolean;
  groupDescription?: string;
  groupIcon?: string;
  verificationLevel?: string;
  encryptionEnabled?: boolean;
  isFanGroup?: boolean;
  isMonetized?: boolean;
  monetizationSettings?: {
    price: number;
    currency: string;
    subscriptionPeriod: 'weekly' | 'monthly' | 'yearly';
    trialPeriodDays: number;
    athleteShare: number;
    platformFee: number;
  };
  groupRules?: string[];
  maxParticipants?: number;
  accessControl?: string;
  statistics?: {
    memberCount: number;
    messageCount: number;
    activeMembers: number;
    revenue: number;
    createdAt: string;
  };
}

// Message request interface
export interface MessageRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

class MessageService {
  // Collection names
  private MESSAGES_COLLECTION = 'messages';
  private CONVERSATIONS_COLLECTION = 'conversations';
  private MESSAGE_REQUESTS_COLLECTION = 'messageRequests';
  
  // Message queue for offline functionality
  private messageQueue: {
    conversationId: string;
    senderId: string;
    content: string;
    attachments?: Message['attachments'];
    timestamp: string;
    retry: number;
  }[] = [];
  
  // Check if we have network connectivity
  private isOnline(): boolean {
    // This is a simple check - we'll get this info from NetworkContext in the component
    // and pass it to the service when calling methods
    return navigator.onLine !== false;
  }
  
  // Queue a message for sending when offline
  async queueMessageForLater(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Message['attachments']
  ): Promise<void> {
    console.log(`[MessageService] Queueing message for conversation ${conversationId} from user ${senderId}`);
    
    // Add message to the queue
    this.messageQueue.push({
      conversationId,
      senderId,
      content,
      attachments,
      timestamp: new Date().toISOString(),
      retry: 0
    });
    
    // Store the queue in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(
        'offline_message_queue', 
        JSON.stringify(this.messageQueue)
      );
      
      console.log(`[MessageService] Message queue saved to storage, ${this.messageQueue.length} messages in queue`);
    } catch (error) {
      console.error('[MessageService] Failed to save message queue to storage:', error);
    }
  }
  
  // Load queued messages from storage
  async loadQueuedMessages(): Promise<void> {
    try {
      const queuedMessages = await AsyncStorage.getItem('offline_message_queue');
      
      if (queuedMessages) {
        this.messageQueue = JSON.parse(queuedMessages);
        console.log(`[MessageService] Loaded ${this.messageQueue.length} queued messages from storage`);
      }
    } catch (error) {
      console.error('[MessageService] Failed to load queued messages:', error);
    }
  }
  
  // Process queued messages when back online
  async processQueuedMessages(): Promise<void> {
    // Ensure we're online
    if (!this.isOnline()) {
      console.log('[MessageService] Still offline, cannot process queued messages');
      return;
    }
    
    // Check if we have messages to process
    if (this.messageQueue.length === 0) {
      console.log('[MessageService] No queued messages to process');
      return;
    }
    
    console.log(`[MessageService] Processing ${this.messageQueue.length} queued messages`);
    
    // Create a copy of the queue
    const currentQueue = [...this.messageQueue];
    
    // Clear the queue
    this.messageQueue = [];
    
    // Try to send each message
    for (const message of currentQueue) {
      try {
        await this.sendMessage(
          message.conversationId,
          message.senderId,
          message.content,
          message.attachments
        );
        
        console.log(`[MessageService] Successfully sent queued message for conversation ${message.conversationId}`);
      } catch (error) {
        console.error(`[MessageService] Failed to send queued message:`, error);
        
        // If failed, increment retry count and requeue if under max retries
        if (message.retry < 3) {
          this.messageQueue.push({
            ...message,
            retry: message.retry + 1
          });
        } else {
          console.log(`[MessageService] Discarding message after ${message.retry} failed attempts`);
        }
      }
    }
    
    // Update storage with remaining messages
    if (this.messageQueue.length > 0) {
      await AsyncStorage.setItem('offline_message_queue', JSON.stringify(this.messageQueue));
      console.log(`[MessageService] Updated queue in storage, ${this.messageQueue.length} messages remaining`);
    } else {
      await AsyncStorage.removeItem('offline_message_queue');
      console.log('[MessageService] All messages processed, queue cleared');
    }
  }

  // Create a new message request (fan to athlete)
  async createMessageRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<MessageRequest | null> {
    try {
      console.log(`[MessageService] Creating message request from ${fromUserId} to ${toUserId}`);
      
      const requestId = uuidv4();
      const now = new Date().toISOString();

      // Create message request object
      const messageRequest: MessageRequest = {
        id: requestId,
        fromUserId,
        toUserId,
        message,
        status: 'pending',
        timestamp: now
      };

      // Save message request to Firestore
      await setDoc(doc(db, this.MESSAGE_REQUESTS_COLLECTION, requestId), {
        ...messageRequest,
        timestamp: serverTimestamp() // Use server timestamp for consistency
      });
      
      console.log(`[MessageService] Message request created with ID: ${requestId}`);
      return messageRequest;
    } catch (error) {
      console.error('[MessageService] Error creating message request:', error);
      throw error;
    }
  }

  // Get pending message requests for an athlete
  async getPendingMessageRequests(athleteId: string): Promise<MessageRequest[]> {
    try {
      console.log(`[MessageService] Getting pending message requests for athlete ${athleteId}`);
      
      const requestsRef = collection(db, this.MESSAGE_REQUESTS_COLLECTION);
      const q = query(
        requestsRef,
        where('toUserId', '==', athleteId),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pendingRequests: MessageRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pendingRequests.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toISOString() 
            : data.timestamp
        } as MessageRequest);
      });
      
      console.log(`[MessageService] Found ${pendingRequests.length} pending requests for athlete ${athleteId}`);
      return pendingRequests;
    } catch (error) {
      console.error('[MessageService] Error getting message requests:', error);
      throw error;
    }
  }

  // Approve a message request
  async approveMessageRequest(requestId: string, athleteId: string): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Approving message request ${requestId} for athlete ${athleteId}`);
      
      // Get message request to verify it's for this athlete
      const requestDoc = await getDoc(doc(db, this.MESSAGE_REQUESTS_COLLECTION, requestId));
      if (!requestDoc.exists()) {
        console.error(`[MessageService] Message request ${requestId} not found`);
        return null;
      }

      const request = requestDoc.data() as MessageRequest;

      // Verify the request is for this athlete
      if (request.toUserId !== athleteId) {
        console.error(`[MessageService] Message request ${requestId} is not for athlete ${athleteId}`);
        return null;
      }

      // Update request status
      await updateDoc(doc(db, this.MESSAGE_REQUESTS_COLLECTION, requestId), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      // Create a new conversation
      const conversationId = uuidv4();
      const now = new Date().toISOString();

      const conversation: Conversation = {
        id: conversationId,
        participants: [request.fromUserId, request.toUserId],
        lastMessage: {
          content: request.message,
          senderId: request.fromUserId,
          timestamp: now
        },
        createdAt: now,
        updatedAt: now,
        isGroupChat: false,
        unreadCount: {
          [athleteId]: 1 // One unread message for the athlete
        }
      };

      // Save conversation to Firestore
      await setDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create the first message
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId: request.fromUserId,
        receiverId: request.toUserId,
        content: request.message,
        timestamp: now,
        isRead: false,
        readBy: [request.fromUserId],
        reactions: []
      };

      await setDoc(doc(db, this.MESSAGES_COLLECTION, message.id), {
        ...message,
        timestamp: serverTimestamp()
      });
      
      console.log(`[MessageService] Message request ${requestId} approved, conversation ${conversationId} created`);
      return conversation;
    } catch (error) {
      console.error('[MessageService] Error approving message request:', error);
      throw error;
    }
  }

  // Reject a message request
  async rejectMessageRequest(requestId: string, athleteId: string): Promise<boolean> {
    try {
      console.log(`[MessageService] Rejecting message request ${requestId} for athlete ${athleteId}`);
      
      // Get message request to verify it's for this athlete
      const requestDoc = await getDoc(doc(db, this.MESSAGE_REQUESTS_COLLECTION, requestId));
      if (!requestDoc.exists()) {
        console.error(`[MessageService] Message request ${requestId} not found`);
        return false;
      }

      const request = requestDoc.data() as MessageRequest;

      // Verify the request is for this athlete
      if (request.toUserId !== athleteId) {
        console.error(`[MessageService] Message request ${requestId} is not for athlete ${athleteId}`);
        return false;
      }

      // Update request status
      await updateDoc(doc(db, this.MESSAGE_REQUESTS_COLLECTION, requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      console.log(`[MessageService] Message request ${requestId} rejected`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error rejecting message request:', error);
      throw error;
    }
  }

  // Send a message to a conversation
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Message['attachments']
  ): Promise<Message | null> {
    try {
      console.log(`[MessageService] Sending message to conversation ${conversationId}`);
      
      // Validate input
      if (!conversationId || !senderId || !content.trim()) {
        console.error('[MessageService] Invalid message data');
        return null;
      }
      
      // Get conversation to verify it exists and get participants
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        console.error(`[MessageService] Conversation ${conversationId} not found`);
        return null;
      }
      
      const conversationData = conversationSnap.data() as Conversation;
      
      // Check if sender is a participant
      if (!conversationData.participants.includes(senderId)) {
        console.error(`[MessageService] User ${senderId} is not a participant in conversation ${conversationId}`);
        return null;
      }
      
      // Create message object
      const messageId = uuidv4();
      const now = new Date().toISOString();
      
      const message: Message = {
        id: messageId,
        conversationId,
        senderId,
        receiverId: conversationData.participants.find(id => id !== senderId) || '',
        content,
        timestamp: now,
        isRead: false,
        readBy: [senderId], // Mark as read by sender
        reactions: [],
        attachments: attachments || []
      };
      
      // Use a batch write for atomic operations
      const batch = writeBatch(db);
      
      // Add message document
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      batch.set(messageRef, {
        ...message,
        timestamp: serverTimestamp() // Use server timestamp for consistency
      });
      
      // Update conversation with last message and unread counts
      const participants = conversationData.participants;
      const unreadCount: { [userId: string]: number } = {};
      
      // Update unread count for each participant except sender
      for (const participantId of participants) {
        if (participantId !== senderId) {
          const currentCount = conversationData.unreadCount?.[participantId] || 0;
          unreadCount[participantId] = currentCount + 1;
        } else {
          unreadCount[participantId] = 0; // Sender has no unread messages
        }
      }
      
      // Update conversation document
      batch.update(conversationRef, {
        lastMessage: {
          content,
          senderId,
          timestamp: serverTimestamp()
        },
        unreadCount,
        updatedAt: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`[MessageService] Message sent successfully with ID: ${messageId}`);
      return message;
    } catch (error) {
      console.error('[MessageService] Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(
    conversationId: string, 
    userId: string, 
    limitCount: number = 50,
    lastMessageTimestamp?: string
  ): Promise<Message[]> {
    try {
      console.log(`[MessageService] Getting messages for conversation ${conversationId}`);
      
      // Validate inputs
      if (!conversationId || !userId) {
        console.error('[MessageService] Invalid parameters:', { conversationId, userId });
        throw new Error('Invalid parameters');
      }
      
      // Get conversation to verify user is a participant
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        console.error(`[MessageService] Conversation ${conversationId} not found`);
        throw new Error('Conversation not found');
      }
      
      const conversation = conversationDoc.data() as Conversation;
      
      // Verify user is a participant
      if (!conversation.participants.includes(userId)) {
        console.error(`[MessageService] User ${userId} is not a participant in conversation ${conversationId}`);
        throw new Error('User is not a participant in this conversation');
      }
      
      // Query messages
      const messagesRef = collection(db, this.MESSAGES_COLLECTION);
      let q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      // If we have a last message timestamp, use it for pagination
      if (lastMessageTimestamp) {
        const lastTimestamp = new Date(lastMessageTimestamp);
        q = query(
          messagesRef,
          where('conversationId', '==', conversationId),
          orderBy('timestamp', 'desc'),
          startAfter(lastTimestamp),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toISOString() 
            : data.timestamp
        } as Message);
      });
      
      console.log(`[MessageService] Found ${messages.length} messages in conversation ${conversationId}`);
      return messages;
    } catch (error) {
      console.error('[MessageService] Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark all messages in a conversation as read by a user
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log(`[MessageService] Marking messages as read for user ${userId} in conversation ${conversationId}`);
      
      // Get conversation to update unread count
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        console.error(`[MessageService] Conversation ${conversationId} not found`);
        return;
      }
      
      const conversation = conversationSnap.data();
      
      // Ensure user is a participant
      if (!conversation.participants.includes(userId)) {
        console.error(`[MessageService] User ${userId} is not a participant in conversation ${conversationId}`);
        return;
      }
      
      // Reset unread count for this user
      const unreadCount = conversation.unreadCount || {};
      unreadCount[userId] = 0;
      
      // Update conversation
      await updateDoc(conversationRef, {
        unreadCount
      });
      
      // Find unread messages for this user
      const messagesQuery = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId), // Only messages from others
        where('readBy', 'array-contains-any', [userId]) // Messages not read by this user
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Batch update for better performance
      const batch = writeBatch(db);
      let updateCount = 0;
      
      messagesSnapshot.forEach((messageDoc) => {
        const messageData = messageDoc.data();
        const readBy = messageData.readBy || [];
        
        // Skip if user already marked as read
        if (!readBy.includes(userId)) {
          batch.update(messageDoc.ref, {
            readBy: arrayUnion(userId),
            isRead: true
          });
          updateCount++;
        }
      });
      
      // Commit batch if there are updates
      if (updateCount > 0) {
        await batch.commit();
        console.log(`[MessageService] Marked ${updateCount} messages as read`);
      } else {
        console.log(`[MessageService] No unread messages to mark as read`);
      }
    } catch (error) {
      console.error('[MessageService] Error marking messages as read:', error);
    }
  }

  // Get all conversations for a user
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // Validate input
      if (!userId) {
        console.error('getUserConversations: userId is required');
        return [];
      }

      const conversationsRef = collection(db, this.CONVERSATIONS_COLLECTION);
      
      // Use a simpler query that matches the existing index
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const conversationData = doc.data();
        conversations.push({
          id: doc.id,
          participants: conversationData.participants || [],
          lastMessage: conversationData.lastMessage || null,
          createdAt: conversationData.createdAt || new Date().toISOString(),
          updatedAt: conversationData.updatedAt || new Date().toISOString(),
          isGroupChat: conversationData.isGroupChat || false,
          groupName: conversationData.groupName,
          groupAdminId: conversationData.groupAdminId,
          unreadCount: conversationData.unreadCount || {},
          isAthleteOnly: conversationData.isAthleteOnly || false,
          isFanGroup: conversationData.isFanGroup || false,
          isMonetized: conversationData.isMonetized || false,
        });
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Create a group chat
  async createGroupChat(
    creatorId: string,
    participantIds: string[],
    groupName: string
  ): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Creating group chat "${groupName}" with ${participantIds.length} participants`);
      
      // Ensure creator is included in participants
      if (!participantIds.includes(creatorId)) {
        participantIds.push(creatorId);
      }

      const conversationId = uuidv4();
      const now = new Date().toISOString();

      // Create conversation object
      const conversation: Conversation = {
        id: conversationId,
        participants: participantIds,
        createdAt: now,
        updatedAt: now,
        isGroupChat: true,
        groupName,
        groupAdminId: creatorId,
        unreadCount: {}
      };

      // Initialize unread count for all participants except creator
      participantIds.forEach(participantId => {
        if (participantId !== creatorId) {
          conversation.unreadCount![participantId] = 0;
        }
      });

      // Save conversation to Firestore
      await setDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create a system message
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId: 'system',
        receiverId: '',
        content: `${groupName} group chat created by ${creatorId}`,
        timestamp: now,
        isRead: false,
        readBy: [],
        reactions: []
      };

      await setDoc(doc(db, this.MESSAGES_COLLECTION, message.id), {
        ...message,
        timestamp: serverTimestamp()
      });
      
      console.log(`[MessageService] Group chat created with ID: ${conversationId}`);
      return conversation;
    } catch (error) {
      console.error('[MessageService] Error creating group chat:', error);
      throw error;
    }
  }

  // Add a user to a group chat
  async addUserToGroupChat(
    conversationId: string,
    adminId: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`[MessageService] Adding user ${userId} to group chat ${conversationId}`);
      
      // Get the conversation
      const conversationDoc = await getDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId));
      if (!conversationDoc.exists()) {
        console.error(`[MessageService] Conversation ${conversationId} not found`);
        return false;
      }

      const conversation = conversationDoc.data() as Conversation;

      // Verify it's a group chat
      if (!conversation.isGroupChat) {
        console.error(`[MessageService] Conversation ${conversationId} is not a group chat`);
        return false;
      }

      // Verify the admin is the group admin
      if (conversation.groupAdminId !== adminId) {
        console.error(`[MessageService] User ${adminId} is not the admin of group chat ${conversationId}`);
        return false;
      }

      // Check if user is already in the group
      if (conversation.participants.includes(userId)) {
        console.log(`[MessageService] User ${userId} is already in group chat ${conversationId}`);
        return true;
      }

      // Add user to participants
      const updatedParticipants = [...conversation.participants, userId];
      
      // Update unread count for the new user
      const unreadCount = conversation.unreadCount ? { ...conversation.unreadCount } : {};
      unreadCount[userId] = 0;

      await updateDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        participants: updatedParticipants,
        unreadCount,
        updatedAt: serverTimestamp()
      });

      // Create a system message
      const now = new Date().toISOString();
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId: 'system',
        receiverId: '',
        content: `${userId} was added to the group`,
        timestamp: now,
        isRead: false,
        readBy: [],
        reactions: []
      };

      await setDoc(doc(db, this.MESSAGES_COLLECTION, message.id), {
        ...message,
        timestamp: serverTimestamp()
      });
      
      console.log(`[MessageService] User ${userId} added to group chat ${conversationId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error adding user to group chat:', error);
      throw error;
    }
  }

  // Remove a user from a group chat
  async removeUserFromGroupChat(
    conversationId: string,
    adminId: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`[MessageService] Removing user ${userId} from group chat ${conversationId}`);
      
      // Get the conversation
      const conversationDoc = await getDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId));
      if (!conversationDoc.exists()) {
        console.error(`[MessageService] Conversation ${conversationId} not found`);
        return false;
      }

      const conversation = conversationDoc.data() as Conversation;

      // Verify it's a group chat
      if (!conversation.isGroupChat) {
        console.error(`[MessageService] Conversation ${conversationId} is not a group chat`);
        return false;
      }

      // Verify the admin is the group admin
      if (conversation.groupAdminId !== adminId) {
        console.error(`[MessageService] User ${adminId} is not the admin of group chat ${conversationId}`);
        return false;
      }

      // Check if user is in the group
      if (!conversation.participants.includes(userId)) {
        console.error(`[MessageService] User ${userId} is not in group chat ${conversationId}`);
        return false;
      }

      // Remove user from participants
      const updatedParticipants = conversation.participants.filter(id => id !== userId);
      
      // Remove user from unread count
      const unreadCount = { ...conversation.unreadCount };
      delete unreadCount[userId];

      await updateDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        participants: updatedParticipants,
        unreadCount,
        updatedAt: serverTimestamp()
      });

      // Create a system message
      const now = new Date().toISOString();
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId: 'system',
        receiverId: '',
        content: `${userId} was removed from the group`,
        timestamp: now,
        isRead: false,
        readBy: [],
        reactions: []
      };

      await setDoc(doc(db, this.MESSAGES_COLLECTION, message.id), {
        ...message,
        timestamp: serverTimestamp()
      });
      
      console.log(`[MessageService] User ${userId} removed from group chat ${conversationId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error removing user from group chat:', error);
      throw error;
    }
  }

  // Subscribe to real-time message updates
  subscribeToMessages(
    conversationId: string,
    userId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    console.log(`[MessageService] Subscribing to messages for conversation ${conversationId}`);
    
    try {
      const messagesRef = collection(db, this.MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(100) // Increase limit to ensure we get more messages
      );
      
      // Set up real-time listener with error handling
      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true }, // Add this to handle offline/online state
        (snapshot) => {
          try {
            console.log(`[MessageService] Received message update for conversation ${conversationId}`);
            
            const messages: Message[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              messages.push({
                ...data,
                id: doc.id,
                timestamp: data.timestamp instanceof Timestamp 
                  ? data.timestamp.toDate().toISOString() 
                  : data.timestamp
              } as Message);
            });
            
            // Mark messages as read silently in the background
            this.markMessagesAsRead(conversationId, userId)
              .catch(err => console.error('[MessageService] Error marking messages as read:', err));
            
            // Sort messages by timestamp (newest first, as we use in the query)
            const sortedMessages = messages.sort((a, b) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeB - timeA;
            });
            
            // Return the sorted messages to the callback
            callback(sortedMessages);
          } catch (err) {
            console.error('[MessageService] Error processing message snapshot:', err);
          }
        },
        (error) => {
          console.error('[MessageService] Error in message subscription:', error);
          
          // Attempt to reconnect after a delay if there's an error
          setTimeout(() => {
            console.log('[MessageService] Attempting to reconnect to messages...');
            // The unsubscribe function will be called automatically before this
            this.subscribeToMessages(conversationId, userId, callback);
          }, 5000);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('[MessageService] Error setting up message subscription:', error);
      
      // Return an empty function in case of error
      return () => {};
    }
  }

  // Subscribe to real-time conversation updates
  subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    try {
      // Validate input
      if (!userId) {
        console.error('subscribeToConversations: userId is required');
        callback([]);
        return () => {};
      }

      const conversationsRef = collection(db, this.CONVERSATIONS_COLLECTION);
      
      // Use a simpler query that matches the existing index
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const conversations: Conversation[] = [];
          
          snapshot.forEach((doc) => {
            const conversationData = doc.data();
            conversations.push({
              id: doc.id,
              participants: conversationData.participants || [],
              lastMessage: conversationData.lastMessage || null,
              createdAt: conversationData.createdAt || new Date().toISOString(),
              updatedAt: conversationData.updatedAt || new Date().toISOString(),
              isGroupChat: conversationData.isGroupChat || false,
              groupName: conversationData.groupName,
              groupAdminId: conversationData.groupAdminId,
              unreadCount: conversationData.unreadCount || {},
              isAthleteOnly: conversationData.isAthleteOnly || false,
              isFanGroup: conversationData.isFanGroup || false,
              isMonetized: conversationData.isMonetized || false,
            });
          });
          
          // Sort by recent message
          conversations.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return timeB - timeA;
          });
          
          callback(conversations);
        },
        (error) => {
          console.error('Error subscribing to conversations:', error);
          // Don't throw error to prevent app crashes
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
      return () => {};
    }
  }

  // Upload a message attachment
  async uploadAttachment(
    userId: string,
    conversationId: string,
    file: Blob | File,
    fileName: string,
    fileType: 'image' | 'audio' | 'video' | 'file'
  ): Promise<string> {
    try {
      console.log(`[MessageService] Uploading ${fileType} attachment for conversation ${conversationId}`);
      
      const fileExtension = fileName.split('.').pop() || '';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const storagePath = `messages/${conversationId}/${userId}/${uniqueFileName}`;
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`[MessageService] Attachment uploaded to ${storagePath}`);
      return downloadURL;
    } catch (error) {
      console.error('[MessageService] Error uploading attachment:', error);
      throw error;
    }
  }

  // Send a message with attachments
  async sendMessageWithAttachments(
    conversationId: string,
    senderId: string,
    content: string,
    attachments: {
      file: Blob | File;
      fileName: string;
      type: 'image' | 'audio' | 'video' | 'file';
    }[]
  ): Promise<Message | null> {
    try {
      console.log(`[MessageService] Sending message with ${attachments.length} attachments`);
      
      // Upload all attachments
      const uploadPromises = attachments.map(attachment => 
        this.uploadAttachment(
          senderId,
          conversationId,
          attachment.file,
          attachment.fileName,
          attachment.type
        )
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Create attachments array for the message
      const messageAttachments = attachments.map((attachment, index) => ({
        type: attachment.type,
        url: uploadedUrls[index],
        name: attachment.fileName
      }));
      
      // Send the message with attachments
      return this.sendMessage(conversationId, senderId, content, messageAttachments);
    } catch (error) {
      console.error('[MessageService] Error sending message with attachments:', error);
      throw error;
    }
  }

  /**
   * Add a reaction to a message
   * @param messageId The ID of the message to react to
   * @param userId The ID of the user adding the reaction
   * @param emoji The emoji reaction to add
   * @returns Promise<boolean> indicating success
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    try {
      // Get the message document
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        console.error('[MessageService] Message not found for reaction');
        return false;
      }
      
      // Create the reaction object
      const reaction: MessageReaction = {
        emoji,
        userId,
        timestamp: new Date().toISOString()
      };
      
      // Update the message with the new reaction
      await updateDoc(messageRef, {
        reactions: arrayUnion(reaction)
      });
      
      console.log(`[MessageService] Added reaction ${emoji} to message ${messageId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error adding reaction:', error);
      return false;
    }
  }
  
  /**
   * Remove a reaction from a message
   * @param messageId The ID of the message to remove the reaction from
   * @param userId The ID of the user removing the reaction
   * @param emoji The emoji reaction to remove
   * @returns Promise<boolean> indicating success
   */
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    try {
      // Get the message document
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        console.error('[MessageService] Message not found for removing reaction');
        return false;
      }
      
      const messageData = messageDoc.data() as Message;
      
      // Find the specific reaction to remove
      const reactionToRemove = messageData.reactions?.find(
        r => r.userId === userId && r.emoji === emoji
      );
      
      if (!reactionToRemove) {
        console.error('[MessageService] Reaction not found');
        return false;
      }
      
      // Remove the reaction
      await updateDoc(messageRef, {
        reactions: arrayRemove(reactionToRemove)
      });
      
      console.log(`[MessageService] Removed reaction ${emoji} from message ${messageId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error removing reaction:', error);
      return false;
    }
  }
  
  /**
   * Get all reactions for a message
   * @param messageId The ID of the message to get reactions for
   * @returns Promise<MessageReaction[]> Array of reactions
   */
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        console.error('[MessageService] Message not found for getting reactions');
        return [];
      }
      
      const messageData = messageDoc.data() as Message;
      return messageData.reactions || [];
    } catch (error) {
      console.error('[MessageService] Error getting message reactions:', error);
      return [];
    }
  }
  
  /**
   * Mark a message as read by a user
   * @param messageId The ID of the message to mark as read
   * @param userId The ID of the user who read the message
   * @returns Promise<boolean> indicating success
   */
  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get the message document
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        console.error('[MessageService] Message not found for marking as read');
        return false;
      }
      
      const messageData = messageDoc.data() as Message;
      
      // If the user has already read the message, do nothing
      if (messageData.readBy?.includes(userId)) {
        return true;
      }
      
      // Update the message with the new reader
      await updateDoc(messageRef, {
        readBy: arrayUnion(userId)
      });
      
      console.log(`[MessageService] Marked message ${messageId} as read by user ${userId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Create a new conversation between two users
   */
  async createConversation(
    creatorId: string,
    participantId: string,
    initialMessage?: string
  ): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Creating conversation between ${creatorId} and ${participantId}`);
      
      // Check if a conversation already exists between these users
      const existingConversation = await this.findExistingConversation(creatorId, participantId);
      
      if (existingConversation) {
        console.log(`[MessageService] Conversation already exists: ${existingConversation.id}`);
        return existingConversation;
      }
      
      // Create a new conversation
      const conversationId = uuidv4();
      const now = new Date().toISOString();
      
      const conversation: Conversation = {
        id: conversationId,
        participants: [creatorId, participantId],
        createdAt: now,
        updatedAt: now,
        isGroupChat: false,
        unreadCount: {
          [participantId]: initialMessage ? 1 : 0
        }
      };
      
      // Add conversation to Firestore
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      await setDoc(conversationRef, conversation);
      
      console.log(`[MessageService] Conversation created: ${conversationId}`);
      
      // If there's an initial message, send it
      if (initialMessage) {
        await this.sendMessage(conversationId, creatorId, initialMessage);
        console.log(`[MessageService] Initial message sent`);
      }
      
      return conversation;
    } catch (error) {
      console.error('[MessageService] Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Find an existing conversation between two users
   */
  private async findExistingConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Finding existing conversation between ${userId1} and ${userId2}`);
      
      // Query conversations where both users are participants
      const conversationsRef = collection(db, this.CONVERSATIONS_COLLECTION);
      
      // First, find conversations where userId1 is a participant
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1),
        where('isGroupChat', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`[MessageService] Found ${querySnapshot.size} conversations for user ${userId1}`);
      
      // Find conversation with exactly these two participants
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        if (data.participants.length === 2 && 
            data.participants.includes(userId1) && 
            data.participants.includes(userId2)) {
          
          console.log(`[MessageService] Found existing conversation: ${doc.id}`);
          
          // Format timestamps
          let createdAt = data.createdAt;
          let updatedAt = data.updatedAt;
          let lastMessageTimestamp = data.lastMessage?.timestamp;
          
          // Handle Firestore Timestamp objects
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
          }
          
          if (data.updatedAt instanceof Timestamp) {
            updatedAt = data.updatedAt.toDate().toISOString();
          }
          
          if (data.lastMessage?.timestamp instanceof Timestamp) {
            lastMessageTimestamp = data.lastMessage.timestamp.toDate().toISOString();
          }
          
          // Create conversation object with properly formatted timestamps
          const conversation: Conversation = {
            id: doc.id,
            participants: data.participants,
            createdAt: createdAt,
            updatedAt: updatedAt,
            isGroupChat: false,
            unreadCount: data.unreadCount || {}
          };
          
          // Add lastMessage if it exists
          if (data.lastMessage) {
            conversation.lastMessage = {
              content: data.lastMessage.content,
              senderId: data.lastMessage.senderId,
              timestamp: lastMessageTimestamp
            };
          }
          
          return conversation;
        }
      }
      
      console.log(`[MessageService] No existing conversation found between ${userId1} and ${userId2}`);
      return null;
    } catch (error) {
      console.error('[MessageService] Error finding existing conversation:', error);
      return null;
    }
  }

  // Update typing status for a user in a conversation
  async updateTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      console.log(`[MessageService] Updating typing status for user ${userId} in conversation ${conversationId}: ${isTyping ? 'typing' : 'not typing'}`);
      
      const typingRef = doc(db, 'typing', `${conversationId}_${userId}`);
      
      if (isTyping) {
        // Set typing status with TTL using serverTimestamp
        await setDoc(typingRef, {
          userId,
          conversationId,
          timestamp: serverTimestamp(),
          // This will be used with Firestore TTL to auto-delete after a period of inactivity
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 10000)) // 10 seconds from now
        });
      } else {
        // Remove typing status
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error('[MessageService] Error updating typing status:', error);
    }
  }

  // Subscribe to typing status updates for a conversation
  subscribeToTypingIndicators(
    conversationId: string,
    callback: (typingUsers: string[]) => void
  ): () => void {
    try {
      console.log(`[MessageService] Subscribing to typing indicators for conversation ${conversationId}`);
      
      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('conversationId', '==', conversationId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const typingUsers: string[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only include users who have updated their typing status recently
            const timestamp = data.timestamp?.toDate?.() || new Date(0);
            const now = new Date();
            
            // If the typing status is less than 5 seconds old, consider the user as typing
            if (now.getTime() - timestamp.getTime() < 5000) {
              typingUsers.push(data.userId);
            }
          });
          
          callback(typingUsers);
        } catch (err) {
          console.error('[MessageService] Error processing typing snapshot:', err);
        }
      }, (error) => {
        console.error('[MessageService] Error in typing subscription:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('[MessageService] Error setting up typing subscription:', error);
      return () => {};
    }
  }

  // Create a verified athlete-only group chat
  async createAthleteOnlyGroupChat(
    creatorId: string,
    participantIds: string[],
    groupName: string,
    groupDescription?: string,
    groupIcon?: string
  ): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Creating athlete-only group chat "${groupName}" by ${creatorId}`);
      
      // First validate that all participants are athletes
      const userService = new UserService();
      const allAthletes = await Promise.all(
        [...participantIds, creatorId].map(async (id) => {
          const profile = await userService.getUserProfile(id);
          return profile?.role === 'athlete';
        })
      );
      
      if (!allAthletes.every(isAthlete => isAthlete)) {
        console.error('[MessageService] Cannot create athlete-only group chat - not all participants are athletes');
        throw new Error('All participants must be verified athletes');
      }
      
      // Create the conversation with special athlete-only flag
      const conversationId = uuidv4();
      const now = new Date().toISOString();
      
      const conversation: Conversation = {
        id: conversationId,
        participants: [creatorId, ...participantIds],
        createdAt: now,
        updatedAt: now,
        isGroupChat: true,
        groupName,
        groupAdminId: creatorId,
        isAthleteOnly: true, // Special flag for athlete-only groups
        groupDescription,
        groupIcon,
        verificationLevel: 'verified', // For enhanced security
        unreadCount: {},
        encryptionEnabled: true // Enable end-to-end encryption for athlete chats
      };
      
      // Add unread count entries for all participants (except creator)
      participantIds.forEach(id => {
        conversation.unreadCount![id] = 0;
      });
      
      // Save to Firestore
      await setDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send system message about group creation
      await this.sendSystemMessage(
        conversationId,
        `${groupName} has been created. This is a verified athlete-only group.`
      );
      
      console.log(`[MessageService] Athlete-only group chat created with ID: ${conversationId}`);
      return conversation;
    } catch (error) {
      console.error('[MessageService] Error creating athlete-only group chat:', error);
      throw error;
    }
  }
  
  // Send system message to conversation (for status updates, etc.)
  async sendSystemMessage(
    conversationId: string,
    content: string
  ): Promise<Message | null> {
    try {
      const messageId = uuidv4();
      const now = new Date().toISOString();
      
      // Get conversation to notify all participants
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      const conversationData = conversationSnap.data() as Conversation;
      
      // Create system message
      const message: Message = {
        id: messageId,
        conversationId,
        senderId: 'system',
        receiverId: '',
        content,
        timestamp: now,
        isRead: false,
        readBy: [],
        isSystemMessage: true,
        systemMessageType: 'info'
      };
      
      // Save message to Firestore
      await setDoc(doc(db, this.MESSAGES_COLLECTION, messageId), {
        ...message,
        timestamp: serverTimestamp()
      });
      
      // Update conversation with last message
      await updateDoc(conversationRef, {
        lastMessage: {
          content,
          senderId: 'system',
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      console.log(`[MessageService] System message sent to conversation ${conversationId}`);
      return message;
    } catch (error) {
      console.error('[MessageService] Error sending system message:', error);
      return null;
    }
  }
  
  // Verify conversation participant is an athlete
  async verifyAthleteInGroup(conversationId: string, userId: string): Promise<boolean> {
    try {
      // Get conversation
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      const conversation = conversationSnap.data() as Conversation;
      
      // Check if this is an athlete-only group
      if (!conversation.isAthleteOnly) {
        console.log(`[MessageService] Group ${conversationId} is not athlete-only, no verification needed`);
        return true;
      }
      
      // Verify user is a participant
      if (!conversation.participants.includes(userId)) {
        console.error(`[MessageService] User ${userId} is not a participant in conversation ${conversationId}`);
        return false;
      }
      
      // Verify user is an athlete
      const userService = new UserService();
      const userProfile = await userService.getUserProfile(userId);
      
      if (!userProfile || userProfile.role !== 'athlete') {
        console.error(`[MessageService] User ${userId} is not an athlete`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[MessageService] Error verifying athlete in group:', error);
      return false;
    }
  }

  // Create a monetized athlete-hosted fan group
  async createMonetizedFanGroup(
    athleteId: string,
    groupName: string,
    groupDescription: string,
    price: number,
    subscriptionPeriod: 'weekly' | 'monthly' | 'yearly',
    groupIcon?: string,
    groupRules?: string[],
    maxParticipants?: number
  ): Promise<Conversation | null> {
    try {
      console.log(`[MessageService] Creating monetized fan group "${groupName}" by athlete ${athleteId}`);
      
      // Verify creator is an athlete
      const userService = new UserService();
      const athleteProfile = await userService.getUserProfile(athleteId);
      
      if (!athleteProfile || athleteProfile.role !== 'athlete') {
        console.error('[MessageService] Cannot create monetized fan group - creator is not an athlete');
        throw new Error('Only verified athletes can create monetized fan groups');
      }
      
      // Create the conversation with monetization settings
      const conversationId = uuidv4();
      const now = new Date().toISOString();
      
      const conversation: Conversation = {
        id: conversationId,
        participants: [athleteId], // Start with just the athlete
        createdAt: now,
        updatedAt: now,
        isGroupChat: true,
        groupName,
        groupAdminId: athleteId,
        isFanGroup: true, // Special flag for fan groups
        isMonetized: true, // This group requires payment
        groupDescription,
        groupIcon,
        monetizationSettings: {
          price,
          currency: 'USD',
          subscriptionPeriod,
          trialPeriodDays: 0,
          athleteShare: 0.85, // Athlete gets 85% of subscription revenue
          platformFee: 0.15, // Platform keeps 15%
        },
        groupRules: groupRules || [
          'Be respectful to all members',
          'No hate speech or harassment',
          'Content shared here is private'
        ],
        maxParticipants: maxParticipants || 1000,
        accessControl: 'paid', // 'paid', 'invite', 'open'
        unreadCount: {},
        statistics: {
          memberCount: 1, // Just the athlete initially
          messageCount: 0,
          activeMembers: 1,
          revenue: 0,
          createdAt: now
        }
      };
      
      // Save to Firestore
      await setDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create a payments collection for this group
      await setDoc(doc(db, 'fanGroupPayments', conversationId), {
        groupId: conversationId,
        athleteId,
        totalRevenue: 0,
        subscriberCount: 0,
        lastPayout: null,
        nextPayoutDate: null,
        createdAt: serverTimestamp()
      });
      
      // Send system message about group creation
      await this.sendSystemMessage(
        conversationId,
        `${groupName} has been created. This is a premium fan group hosted by ${athleteProfile.displayName || athleteProfile.username || 'an athlete'}.`
      );
      
      console.log(`[MessageService] Monetized fan group created with ID: ${conversationId}`);
      return conversation;
    } catch (error) {
      console.error('[MessageService] Error creating monetized fan group:', error);
      throw error;
    }
  }
  
  // Join a monetized fan group (post-payment)
  async joinMonetizedFanGroup(
    userId: string,
    groupId: string,
    paymentInfo: {
      paymentId: string,
      amount: number,
      currency: string,
      paymentMethod: string,
    }
  ): Promise<boolean> {
    try {
      console.log(`[MessageService] User ${userId} joining monetized fan group ${groupId}`);
      
      // Get the group info
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, groupId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        console.error(`[MessageService] Fan group ${groupId} not found`);
        return false;
      }
      
      const conversation = conversationSnap.data() as Conversation;
      
      // Verify this is a monetized fan group
      if (!conversation.isFanGroup || !conversation.isMonetized) {
        console.error(`[MessageService] Group ${groupId} is not a monetized fan group`);
        return false;
      }
      
      // Check if user is already a member
      if (conversation.participants.includes(userId)) {
        console.log(`[MessageService] User ${userId} is already a member of group ${groupId}`);
        return true;
      }
      
      // Check if group is at max capacity
      if (conversation.maxParticipants && conversation.participants.length >= conversation.maxParticipants) {
        console.error(`[MessageService] Group ${groupId} is at maximum capacity`);
        return false;
      }
      
      // Add user to participants
      await updateDoc(conversationRef, {
        participants: arrayUnion(userId),
        updatedAt: serverTimestamp(),
        'statistics.memberCount': (conversation.statistics?.memberCount || 0) + 1
      });
      
      // Record subscription payment
      const subscriptionId = uuidv4();
      await setDoc(doc(db, 'fanGroupSubscriptions', subscriptionId), {
        userId,
        groupId,
        athleteId: conversation.groupAdminId,
        paymentId: paymentInfo.paymentId,
        startDate: serverTimestamp(),
        endDate: this.calculateSubscriptionEndDate(new Date(), conversation.monetizationSettings?.subscriptionPeriod || 'monthly'),
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        status: 'active',
        autoRenew: true,
        paymentMethod: paymentInfo.paymentMethod,
        createdAt: serverTimestamp()
      });
      
      // Update payment stats
      const paymentsRef = doc(db, 'fanGroupPayments', groupId);
      await updateDoc(paymentsRef, {
        totalRevenue: increment(paymentInfo.amount),
        subscriberCount: increment(1),
        lastPaymentDate: serverTimestamp()
      });
      
      // Send welcome message
      await this.sendSystemMessage(
        groupId,
        `Welcome ${await this.getUserDisplayName(userId)} to ${conversation.groupName}!`
      );
      
      console.log(`[MessageService] User ${userId} successfully joined monetized fan group ${groupId}`);
      return true;
    } catch (error) {
      console.error('[MessageService] Error joining monetized fan group:', error);
      return false;
    }
  }
  
  // Calculate subscription end date
  private calculateSubscriptionEndDate(
    startDate: Date,
    period: 'weekly' | 'monthly' | 'yearly'
  ): Date {
    const endDate = new Date(startDate);
    
    switch (period) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    
    return endDate;
  }
  
  // Get user display name helper
  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      const userService = new UserService();
      const userProfile = await userService.getUserProfile(userId);
      
      return userProfile?.displayName || userProfile?.username || userId.substring(0, 8) + '...';
    } catch (error) {
      console.error('[MessageService] Error getting user display name:', error);
      return userId.substring(0, 8) + '...';
    }
  }
  
  // Check if a user has active subscription to a fan group
  async checkFanGroupSubscription(userId: string, groupId: string): Promise<boolean> {
    try {
      // Query for active subscriptions
      const subscriptionsRef = collection(db, 'fanGroupSubscriptions');
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      // If we have at least one active subscription
      return !querySnapshot.empty;
    } catch (error) {
      console.error('[MessageService] Error checking fan group subscription:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new MessageService();
