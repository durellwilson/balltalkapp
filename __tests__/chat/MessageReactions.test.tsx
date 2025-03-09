import MessageService from '../../services/MessageService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn((data) => data),
  arrayRemove: jest.fn((data) => data)
}));

import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

describe('Message Reactions and Read Receipts', () => {
  const mockMessageId = 'test-message-id';
  const mockUserId = 'test-user-id';
  const mockEmoji = '👍';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('addReaction', () => {
    it('should add a reaction to a message', async () => {
      // Mock message document
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockMessageId,
          content: 'Test message',
          reactions: []
        })
      });
      
      // Mock update success
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      // Call the method
      const result = await MessageService.addReaction(mockMessageId, mockUserId, mockEmoji);
      
      // Check result
      expect(result).toBe(true);
      
      // Check if doc was retrieved
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      
      // Check if update was called with correct data
      expect(updateDoc).toHaveBeenCalled();
      expect(arrayUnion).toHaveBeenCalledWith(expect.objectContaining({
        emoji: mockEmoji,
        userId: mockUserId
      }));
    });
    
    it('should return false if message does not exist', async () => {
      // Mock message document not found
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });
      
      // Call the method
      const result = await MessageService.addReaction(mockMessageId, mockUserId, mockEmoji);
      
      // Check result
      expect(result).toBe(false);
      
      // Check if update was not called
      expect(updateDoc).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock error
      (getDoc as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Call the method
      const result = await MessageService.addReaction(mockMessageId, mockUserId, mockEmoji);
      
      // Check result
      expect(result).toBe(false);
      
      // Check if update was not called
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
  
  describe('removeReaction', () => {
    it('should remove a reaction from a message', async () => {
      // Mock message document with existing reaction
      const mockReaction = {
        emoji: mockEmoji,
        userId: mockUserId,
        timestamp: '2023-01-01T00:00:00.000Z'
      };
      
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockMessageId,
          content: 'Test message',
          reactions: [mockReaction]
        })
      });
      
      // Mock update success
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      // Call the method
      const result = await MessageService.removeReaction(mockMessageId, mockUserId, mockEmoji);
      
      // Check result
      expect(result).toBe(true);
      
      // Check if doc was retrieved
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      
      // Check if update was called with correct data
      expect(updateDoc).toHaveBeenCalled();
      expect(arrayRemove).toHaveBeenCalledWith(mockReaction);
    });
    
    it('should return false if reaction not found', async () => {
      // Mock message document without matching reaction
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockMessageId,
          content: 'Test message',
          reactions: [{
            emoji: '❤️',
            userId: 'other-user',
            timestamp: '2023-01-01T00:00:00.000Z'
          }]
        })
      });
      
      // Call the method
      const result = await MessageService.removeReaction(mockMessageId, mockUserId, mockEmoji);
      
      // Check result
      expect(result).toBe(false);
      
      // Check if update was not called
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
  
  describe('markMessageAsRead', () => {
    it('should mark a message as read by a user', async () => {
      // Mock message document
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockMessageId,
          content: 'Test message',
          readBy: ['other-user']
        })
      });
      
      // Mock update success
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      // Call the method
      const result = await MessageService.markMessageAsRead(mockMessageId, mockUserId);
      
      // Check result
      expect(result).toBe(true);
      
      // Check if doc was retrieved
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      
      // Check if update was called with correct data
      expect(updateDoc).toHaveBeenCalled();
      expect(arrayUnion).toHaveBeenCalledWith(mockUserId);
    });
    
    it('should not update if user already read the message', async () => {
      // Mock message document with user already in readBy
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockMessageId,
          content: 'Test message',
          readBy: [mockUserId, 'other-user']
        })
      });
      
      // Call the method
      const result = await MessageService.markMessageAsRead(mockMessageId, mockUserId);
      
      // Check result
      expect(result).toBe(true);
      
      // Check if update was not called
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
  
  describe('markMessagesAsRead', () => {
    const mockConversationId = 'test-conversation-id';
    
    it('should mark all messages in a conversation as read', async () => {
      // Mock conversation document
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: mockConversationId,
          participants: [mockUserId, 'other-user'],
          unreadCount: { [mockUserId]: 5 }
        })
      });
      
      // Mock query snapshot with unread messages
      const mockQueryDocs = [
        {
          ref: 'message-ref-1',
          data: () => ({
            id: 'message-1',
            senderId: 'other-user',
            readBy: []
          })
        },
        {
          ref: 'message-ref-2',
          data: () => ({
            id: 'message-2',
            senderId: 'other-user',
            readBy: []
          })
        }
      ];
      
      const mockGetDocs = jest.fn().mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          mockQueryDocs.forEach(callback);
        }
      });
      
      jest.mock('firebase/firestore', () => ({
        ...jest.requireActual('firebase/firestore'),
        getDocs: mockGetDocs
      }));
      
      // Call the method
      await MessageService.markMessagesAsRead(mockConversationId, mockUserId);
      
      // Check if update was called for conversation
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          unreadCount: expect.objectContaining({
            [mockUserId]: 0
          })
        })
      );
    });
  });
}); 