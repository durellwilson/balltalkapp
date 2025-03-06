import { db } from '../src/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Firestore,
  orderBy,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Profile } from '../models/Profile';

// Use db with proper type
const firebaseDb = db;

// Message interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: {
    type: 'image' | 'audio' | 'video' | 'file';
    url: string;
    name: string;
  }[];
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
  // Create a new message request (fan to athlete)
  async createMessageRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<MessageRequest | null> {
    try {
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
      await setDoc(doc(firebaseDb, 'messageRequests', requestId), messageRequest);

      return messageRequest;
    } catch (error) {
      console.error('Error creating message request:', error);
      return null;
    }
  }

  // Get pending message requests for an athlete
  async getPendingMessageRequests(athleteId: string): Promise<MessageRequest[]> {
    try {
      const requestsRef = collection(firebaseDb, 'messageRequests');
      const q = query(
        requestsRef,
        where('toUserId', '==', athleteId),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as MessageRequest);
    } catch (error) {
      console.error('Error getting message requests:', error);
      return [];
    }
  }

  // Approve a message request
  async approveMessageRequest(requestId: string, athleteId: string): Promise<Conversation | null> {
    try {
      // Get message request to verify it's for this athlete
      const requestDoc = await getDoc(doc(firebaseDb, 'messageRequests', requestId));
      if (!requestDoc.exists()) {
        return null;
      }

      const request = requestDoc.data() as MessageRequest;

      // Verify the request is for this athlete
      if (request.toUserId !== athleteId) {
        return null;
      }

      // Update request status
      await updateDoc(doc(firebaseDb, 'messageRequests', requestId), {
        status: 'approved'
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
        isGroupChat: false
      };

      // Save conversation to Firestore
      await setDoc(doc(firebaseDb, 'conversations', conversationId), conversation);

      // Create the first message
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId: request.fromUserId,
        receiverId: request.toUserId,
        content: request.message,
        timestamp: now,
        isRead: false
      };

      await setDoc(doc(firebaseDb, 'messages', message.id), message);

      return conversation;
    } catch (error) {
      console.error('Error approving message request:', error);
      return null;
    }
  }

  // Reject a message request
  async rejectMessageRequest(requestId: string, athleteId: string): Promise<boolean> {
    try {
      // Get message request to verify it's for this athlete
      const requestDoc = await getDoc(doc(firebaseDb, 'messageRequests', requestId));
      if (!requestDoc.exists()) {
        return false;
      }

      const request = requestDoc.data() as MessageRequest;

      // Verify the request is for this athlete
      if (request.toUserId !== athleteId) {
        return false;
      }

      // Update request status
      await updateDoc(doc(firebaseDb, 'messageRequests', requestId), {
        status: 'rejected'
      });

      return true;
    } catch (error) {
      console.error('Error rejecting message request:', error);
      return false;
    }
  }

  // Send a message in an existing conversation
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Message['attachments']
  ): Promise<Message | null> {
    try {
      // Get conversation to verify sender is a participant
      const conversationDoc = await getDoc(doc(firebaseDb, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        return null;
      }

      const conversation = conversationDoc.data() as Conversation;

      // Verify sender is a participant
      if (!conversation.participants.includes(senderId)) {
        return null;
      }

      // Determine receiver ID (for direct messages)
      const receiverId = conversation.participants.find(id => id !== senderId);

      if (!receiverId && !conversation.isGroupChat) {
        return null;
      }

      const now = new Date().toISOString();

      // Create message
      const message: Message = {
        id: uuidv4(),
        conversationId,
        senderId,
        receiverId: receiverId || '', // Empty for group chats
        content,
        timestamp: now,
        isRead: false,
        ...(attachments && { attachments })
      };

      // Save message to Firestore
      await setDoc(doc(firebaseDb, 'messages', message.id), message);

      // Update conversation's last message
      await updateDoc(doc(firebaseDb, 'conversations', conversationId), {
        lastMessage: {
          content,
          senderId,
          timestamp: now
        },
        updatedAt: now
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, userId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      console.log("Fetching messages for conversationId:", conversationId, "userId:", userId);

      // Get conversation to verify user is a participant
      const conversationDoc = await getDoc(doc(firebaseDb, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        console.log("Conversation not found");
        return [];
      }

      const conversation = conversationDoc.data() as Conversation;
      console.log("Conversation data:", JSON.stringify(conversation, null, 2));

      // Verify user is a participant
      if (!conversation.participants.includes(userId)) {
        console.log("User is not a participant in this conversation");
        return [];
      }

      // Get messages
      const messagesRef = collection(firebaseDb, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      console.log("Number of messages found:", querySnapshot.docs.length);

      // Mark messages as read if user is the receiver and validate message data
      const messages = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`Message ${index + 1} data:`, JSON.stringify(data, null, 2));

        // Ensure all required fields are present
        const message: Message = {
          id: data.id || doc.id,
          conversationId: data.conversationId || conversationId,
          senderId: data.senderId || 'unknown',
          receiverId: data.receiverId || '',
          content: data.content || '',
          timestamp: data.timestamp || new Date().toISOString(),
          isRead: data.isRead || false,
          ...(data.attachments && { attachments: data.attachments })
        };

        // If user is the receiver and message is unread, mark as read
        if (message.receiverId === userId && !message.isRead) {
          updateDoc(doc.ref, { isRead: true });
          return { ...message, isRead: true };
        }

        return message;
      });

      console.log("Processed messages:", JSON.stringify(messages, null, 2));

      // Sort messages by timestamp (oldest first)
      const sortedMessages = messages.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return sortedMessages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Get user's conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log("Fetching conversations for userId:", userId);

      const conversationsRef = collection(firebaseDb, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      console.log("Number of conversations found:", querySnapshot.docs.length);

      // Validate each conversation
      const conversations = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`Conversation ${index + 1} data:`, JSON.stringify(data, null, 2));

        // Ensure all required fields are present
        const conversation: Conversation = {
          id: data.id || doc.id,
          participants: data.participants || [userId],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isGroupChat: data.isGroupChat || false,
          ...(data.lastMessage && {
            lastMessage: {
              content: data.lastMessage.content || '',
              senderId: data.lastMessage.senderId || '',
              timestamp: data.lastMessage.timestamp || new Date().toISOString()
            }
          }),
          ...(data.groupName && { groupName: data.groupName }),
          ...(data.groupAdminId && { groupAdminId: data.groupAdminId })
        };

        return conversation;
      });

      console.log("Processed conversations:", JSON.stringify(conversations, null, 2));
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
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
      // Ensure creator is included in participants
      if (!participantIds.includes(creatorId)) {
        participantIds.push(creatorId);
      }

      const conversationId = uuidv4();
      const now = new Date().toISOString();

      // Create conversation
      const conversation: Conversation = {
        id: conversationId,
        participants: participantIds,
        createdAt: now,
        updatedAt: now,
        isGroupChat: true,
        groupName,
        groupAdminId: creatorId
      };

      // Save conversation to Firestore
      await setDoc(doc(firebaseDb, 'conversations', conversationId), conversation);

      return conversation;
    } catch (error) {
      console.error('Error creating group chat:', error);
      return null;
    }
  }

  // Add user to group chat
  async addUserToGroupChat(
    conversationId: string,
    adminId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get conversation to verify it's a group and admin is the admin
      const conversationDoc = await getDoc(doc(firebaseDb, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        return false;
      }

      const conversation = conversationDoc.data() as Conversation;

      // Verify it's a group chat and admin is the admin
      if (!conversation.isGroupChat || conversation.groupAdminId !== adminId) {
        return false;
      }

      // Check if user is already in the group
      if (conversation.participants.includes(userId)) {
        return true; // User already in group
      }

      // Add user to group
      await updateDoc(doc(firebaseDb, 'conversations', conversationId), {
        participants: [...conversation.participants, userId],
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error adding user to group chat:', error);
      return false;
    }
  }
}

export default new MessageService();
