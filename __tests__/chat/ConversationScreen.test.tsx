import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';
import ConversationScreen from '../../app/chat/ConversationScreen';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/MessageService', () => ({
  getUserConversations: jest.fn(),
  subscribeToMessages: jest.fn(),
  sendMessage: jest.fn(),
  removeUserFromGroupChat: jest.fn(),
}));

jest.mock('../../services/UserService', () => ({
  getUserProfile: jest.fn(),
}));

describe('ConversationScreen', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
  };
  
  const mockDirectConversation = {
    id: 'conv1',
    participants: ['test-user-id', 'user2'],
    lastMessage: {
      content: 'Hello there!',
      timestamp: new Date().toISOString(),
    },
    unreadCount: { 'test-user-id': 0 },
    isGroupChat: false,
  };
  
  const mockGroupConversation = {
    id: 'group1',
    participants: ['test-user-id', 'user2', 'user3'],
    lastMessage: {
      content: 'Hello group!',
      timestamp: new Date().toISOString(),
    },
    unreadCount: { 'test-user-id': 0 },
    isGroupChat: true,
    groupName: 'Test Group',
    groupAdminId: 'test-user-id',
  };
  
  const mockMessages = [
    {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user2',
      content: 'Hello there!',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      senderId: 'test-user-id',
      content: 'Hi! How are you?',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
  ];
  
  const mockParticipants = [
    {
      id: 'test-user-id',
      displayName: 'Test User',
      role: 'athlete',
    },
    {
      id: 'user2',
      displayName: 'User Two',
      role: 'fan',
    },
    {
      id: 'user3',
      displayName: 'User Three',
      role: 'athlete',
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ conversationId: 'conv1' });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock MessageService
    MessageService.getUserConversations = jest.fn().mockResolvedValue([mockDirectConversation]);
    MessageService.subscribeToMessages = jest.fn().mockImplementation((convId, userId, callback) => {
      callback(mockMessages);
      return jest.fn(); // Return unsubscribe function
    });
    MessageService.sendMessage = jest.fn().mockResolvedValue(true);
    MessageService.removeUserFromGroupChat = jest.fn().mockResolvedValue(true);
    
    // Mock UserService
    UserService.getUserProfile = jest.fn().mockImplementation((userId) => {
      const participant = mockParticipants.find(p => p.id === userId);
      return Promise.resolve(participant || null);
    });
  });
  
  it('renders loading state initially', () => {
    const { getByTestId } = render(<ConversationScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders messages after loading', async () => {
    const { findByText } = render(<ConversationScreen />);
    
    // Wait for messages to load
    await waitFor(() => {
      expect(MessageService.subscribeToMessages).toHaveBeenCalledWith(
        'conv1',
        'test-user-id',
        expect.any(Function)
      );
    });
    
    // Check if messages are rendered
    expect(await findByText('Hello there!')).toBeTruthy();
    expect(await findByText('Hi! How are you?')).toBeTruthy();
  });
  
  it('sends a message when send button is pressed', async () => {
    const { getByTestId, getByPlaceholderText } = render(<ConversationScreen />);
    
    // Wait for messages to load
    await waitFor(() => {
      expect(MessageService.subscribeToMessages).toHaveBeenCalled();
    });
    
    // Type a message
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'New test message');
    
    // Press send button
    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    
    // Check if message was sent
    expect(MessageService.sendMessage).toHaveBeenCalledWith(
      'conv1',
      'test-user-id',
      'New test message'
    );
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<ConversationScreen />);
    
    // Press back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    // Check if navigation occurred
    expect(mockRouter.back).toHaveBeenCalled();
  });
  
  it('shows error state when conversation not found', async () => {
    // Mock empty conversations
    MessageService.getUserConversations = jest.fn().mockResolvedValue([]);
    
    const { findByText } = render(<ConversationScreen />);
    
    // Check if error state is shown
    expect(await findByText('Conversation not found')).toBeTruthy();
  });
  
  // Group chat tests
  describe('Group Chat Features', () => {
    beforeEach(() => {
      // Setup group chat mocks
      (useLocalSearchParams as jest.Mock).mockReturnValue({ conversationId: 'group1' });
      MessageService.getUserConversations = jest.fn().mockResolvedValue([mockGroupConversation]);
    });
    
    it('displays group info button for group chats', async () => {
      const { findByText } = render(<ConversationScreen />);
      
      // Wait for conversation to load
      await waitFor(() => {
        expect(MessageService.getUserConversations).toHaveBeenCalled();
      });
      
      // Check if group name is displayed
      expect(await findByText('Test Group')).toBeTruthy();
    });
    
    it('loads participants for group chats', async () => {
      render(<ConversationScreen />);
      
      // Wait for conversation to load
      await waitFor(() => {
        expect(MessageService.getUserConversations).toHaveBeenCalled();
      });
      
      // Check if participants were loaded
      expect(UserService.getUserProfile).toHaveBeenCalledTimes(3);
      expect(UserService.getUserProfile).toHaveBeenCalledWith('test-user-id');
      expect(UserService.getUserProfile).toHaveBeenCalledWith('user2');
      expect(UserService.getUserProfile).toHaveBeenCalledWith('user3');
    });
    
    it('allows admin to remove users from group', async () => {
      // Mock Alert.alert
      const originalAlert = global.Alert;
      global.Alert = {
        ...originalAlert,
        alert: jest.fn((title, message, buttons) => {
          // Simulate pressing the "Remove" button
          const removeButton = buttons?.find(button => button.text === 'Remove');
          if (removeButton && removeButton.onPress) {
            removeButton.onPress();
          }
        }),
      };
      
      const { findByText, getByText } = render(<ConversationScreen />);
      
      // Wait for conversation to load
      await waitFor(() => {
        expect(MessageService.getUserConversations).toHaveBeenCalled();
      });
      
      // Open group info modal (we can't directly test this due to modal implementation)
      // But we can test the removeUserFromGroup function by mocking it
      
      // Simulate removing a user
      await findByText('Test Group');
      
      // Call the removeUserFromGroup function directly
      const instance = ConversationScreen as any;
      instance.removeUserFromGroup && instance.removeUserFromGroup('user2');
      
      // Check if the user was removed
      await waitFor(() => {
        expect(MessageService.removeUserFromGroupChat).toHaveBeenCalledWith(
          'group1',
          'test-user-id',
          'user2'
        );
      });
      
      // Restore original Alert
      global.Alert = originalAlert;
    });
  });
}); 