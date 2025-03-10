import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';
import NewGroupChatScreen from '../../app/chat/new-group';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/MessageService', () => ({
  createGroupChat: jest.fn(),
}));

jest.mock('../../services/UserService', () => ({
  getAllUsers: jest.fn(),
}));

describe('NewGroupChatScreen', () => {
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
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock services
    UserService.getAllUsers = jest.fn().mockResolvedValue(mockUsers);
    MessageService.createGroupChat = jest.fn().mockResolvedValue({ id: 'new-group-id' });
  });
  
  it('renders loading state initially', () => {
    const { getByTestId } = render(<NewGroupChatScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders users after loading', async () => {
    const { findByText } = render(<NewGroupChatScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Check if users are rendered (excluding current user)
    expect(await findByText('User One')).toBeTruthy();
    expect(await findByText('User Two')).toBeTruthy();
  });
  
  it('allows selecting and deselecting users', async () => {
    const { findByText, getByText } = render(<NewGroupChatScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Select a user
    const userOneItem = await findByText('User One');
    fireEvent.press(userOneItem);
    
    // Check if user count is updated
    expect(getByText('1 user selected')).toBeTruthy();
    
    // Select another user
    const userTwoItem = await findByText('User Two');
    fireEvent.press(userTwoItem);
    
    // Check if user count is updated
    expect(getByText('2 users selected')).toBeTruthy();
    
    // Deselect a user
    fireEvent.press(userOneItem);
    
    // Check if user count is updated
    expect(getByText('1 user selected')).toBeTruthy();
  });
  
  it('creates a group chat when form is valid', async () => {
    const { findByText, getByPlaceholderText, getByTestId } = render(<NewGroupChatScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Select users
    const userOneItem = await findByText('User One');
    fireEvent.press(userOneItem);
    
    const userTwoItem = await findByText('User Two');
    fireEvent.press(userTwoItem);
    
    // Enter group name
    const groupNameInput = getByPlaceholderText('Group name');
    fireEvent.changeText(groupNameInput, 'Test Group');
    
    // Create group
    const createButton = getByTestId('create-group-button');
    fireEvent.press(createButton);
    
    // Check if group was created
    await waitFor(() => {
      expect(MessageService.createGroupChat).toHaveBeenCalledWith(
        'test-user-id',
        ['test-user-id', 'user1', 'user2'],
        'Test Group'
      );
    });
    
    // Check if navigation occurred
    expect(mockRouter.push).toHaveBeenCalledWith('/chat/new-group-id');
  });
  
  it('does not create a group chat when no users are selected', async () => {
    const { getByPlaceholderText, getByTestId } = render(<NewGroupChatScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Enter group name
    const groupNameInput = getByPlaceholderText('Group name');
    fireEvent.changeText(groupNameInput, 'Test Group');
    
    // Try to create group
    const createButton = getByTestId('create-group-button');
    fireEvent.press(createButton);
    
    // Check that group was not created
    expect(MessageService.createGroupChat).not.toHaveBeenCalled();
  });
  
  it('does not create a group chat when no group name is entered', async () => {
    const { findByText, getByTestId } = render(<NewGroupChatScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Select a user
    const userOneItem = await findByText('User One');
    fireEvent.press(userOneItem);
    
    // Try to create group
    const createButton = getByTestId('create-group-button');
    fireEvent.press(createButton);
    
    // Check that group was not created
    expect(MessageService.createGroupChat).not.toHaveBeenCalled();
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<NewGroupChatScreen />);
    
    // Press back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    // Check if navigation occurred
    expect(mockRouter.back).toHaveBeenCalled();
  });
}); 