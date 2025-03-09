import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';
import NewConversationScreen from '../../screens/chat/NewConversationScreen';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/MessageService', () => ({
  getUserConversations: jest.fn(),
  createGroupChat: jest.fn(),
}));

jest.mock('../../services/UserService', () => ({
  getAllUsers: jest.fn(),
}));

describe('NewConversationScreen', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
  };
  
  const mockUsers = [
    {
      id: 'user1',
      displayName: 'User One',
      role: 'athlete',
    },
    {
      id: 'user2',
      displayName: 'User Two',
      role: 'fan',
    },
    {
      id: 'test-user-id', // Current user
      displayName: 'Test User',
      role: 'athlete',
    },
  ];
  
  const mockConversations = [
    {
      id: 'conv1',
      participants: ['test-user-id', 'user3'],
      isGroupChat: false,
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock services
    UserService.getAllUsers = jest.fn().mockResolvedValue(mockUsers);
    MessageService.getUserConversations = jest.fn().mockResolvedValue(mockConversations);
    MessageService.createGroupChat = jest.fn().mockResolvedValue({ id: 'new-conv-id' });
  });
  
  it('renders loading state initially', () => {
    const { getByTestId } = render(<NewConversationScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders users after loading', async () => {
    const { findByText } = render(<NewConversationScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Check if users are rendered (excluding current user)
    expect(await findByText('User One')).toBeTruthy();
    expect(await findByText('User Two')).toBeTruthy();
  });
  
  it('filters users based on search query', async () => {
    const { findByText, getByPlaceholderText, queryByText } = render(<NewConversationScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Type search query
    const searchInput = getByPlaceholderText('Search users...');
    fireEvent.changeText(searchInput, 'One');
    
    // Check if filtered correctly
    expect(await findByText('User One')).toBeTruthy();
    expect(queryByText('User Two')).toBeNull();
  });
  
  it('creates a new conversation when user is selected', async () => {
    const { findByText } = render(<NewConversationScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Select a user
    const userItem = await findByText('User One');
    fireEvent.press(userItem);
    
    // Check if conversation was created
    expect(MessageService.getUserConversations).toHaveBeenCalledWith('test-user-id');
    expect(MessageService.createGroupChat).toHaveBeenCalledWith(
      'test-user-id',
      ['test-user-id', 'user1'],
      expect.any(String)
    );
    
    // Check if navigation occurred
    expect(mockRouter.push).toHaveBeenCalledWith('/chat/new-conv-id');
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<NewConversationScreen />);
    
    // Press back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    // Check if navigation occurred
    expect(mockRouter.back).toHaveBeenCalled();
  });
  
  it('shows empty state when no users found', async () => {
    // Mock empty users
    UserService.getAllUsers = jest.fn().mockResolvedValue([]);
    
    const { findByText } = render(<NewConversationScreen />);
    
    // Check if empty state is shown
    expect(await findByText('No users available')).toBeTruthy();
  });
}); 