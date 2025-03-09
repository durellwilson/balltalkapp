import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import ChatScreen from '../../screens/chat/ChatScreen';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/MessageService', () => ({
  getUserConversations: jest.fn(),
  subscribeToConversations: jest.fn(),
}));

describe('ChatScreen', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
  };
  
  const mockConversations = [
    {
      id: 'conv1',
      participants: ['test-user-id', 'user2'],
      lastMessage: {
        content: 'Hello there!',
        timestamp: new Date().toISOString(),
      },
      unreadCount: { 'test-user-id': 2 },
      isGroupChat: false,
    },
    {
      id: 'conv2',
      participants: ['test-user-id', 'user3', 'user4'],
      groupName: 'Test Group',
      lastMessage: {
        content: 'Group message',
        timestamp: new Date().toISOString(),
      },
      unreadCount: { 'test-user-id': 0 },
      isGroupChat: true,
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock MessageService
    MessageService.getUserConversations = jest.fn().mockResolvedValue(mockConversations);
    MessageService.subscribeToConversations = jest.fn().mockImplementation((userId, callback) => {
      callback(mockConversations);
      return jest.fn(); // Return unsubscribe function
    });
  });
  
  it('renders loading state initially', () => {
    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders conversations after loading', async () => {
    const { findByText } = render(<ChatScreen />);
    
    // Wait for conversations to load
    await waitFor(() => {
      expect(MessageService.subscribeToConversations).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(Function)
      );
    });
    
    // Check if conversations are rendered
    expect(await findByText('Hello there!')).toBeTruthy();
    expect(await findByText('Group message')).toBeTruthy();
  });
  
  it('navigates to conversation when pressed', async () => {
    const { findByText } = render(<ChatScreen />);
    
    // Wait for conversations to load
    await waitFor(() => {
      expect(MessageService.subscribeToConversations).toHaveBeenCalled();
    });
    
    // Press on a conversation
    const conversationItem = await findByText('Hello there!');
    fireEvent.press(conversationItem);
    
    // Check if navigation occurred
    expect(mockRouter.push).toHaveBeenCalledWith('/chat/conv1');
  });
  
  it('navigates to new conversation screen when new chat button is pressed', () => {
    const { getByTestId } = render(<ChatScreen />);
    
    // Press new chat button
    fireEvent.press(getByTestId('new-chat-button'));
    
    // Check if navigation occurred
    expect(mockRouter.push).toHaveBeenCalledWith('/chat/new');
  });
  
  it('shows empty state when no conversations', async () => {
    // Mock empty conversations
    MessageService.getUserConversations = jest.fn().mockResolvedValue([]);
    MessageService.subscribeToConversations = jest.fn().mockImplementation((userId, callback) => {
      callback([]);
      return jest.fn();
    });
    
    const { findByText } = render(<ChatScreen />);
    
    // Check if empty state is shown
    expect(await findByText('No Conversations Yet')).toBeTruthy();
  });
}); 