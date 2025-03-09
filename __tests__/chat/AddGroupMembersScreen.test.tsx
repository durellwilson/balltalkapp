import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';
import AddGroupMembersScreen from '../../screens/chat/AddGroupMembersScreen';

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
  addUserToGroupChat: jest.fn(),
}));

jest.mock('../../services/UserService', () => ({
  getAllUsers: jest.fn(),
}));

describe('AddGroupMembersScreen', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
  };
  
  const mockConversation = {
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
  
  const mockUsers = [
    {
      id: 'user4',
      displayName: 'User Four',
      role: 'athlete',
    },
    {
      id: 'user5',
      displayName: 'User Five',
      role: 'fan',
    },
    {
      id: 'test-user-id', // Current user
      displayName: 'Test User',
      role: 'athlete',
    },
    {
      id: 'user2', // Already in group
      displayName: 'User Two',
      role: 'fan',
    },
    {
      id: 'user3', // Already in group
      displayName: 'User Three',
      role: 'athlete',
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ conversationId: 'group1' });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock services
    MessageService.getUserConversations = jest.fn().mockResolvedValue([mockConversation]);
    MessageService.addUserToGroupChat = jest.fn().mockResolvedValue(true);
    UserService.getAllUsers = jest.fn().mockResolvedValue(mockUsers);
  });
  
  it('renders loading state initially', () => {
    const { getByTestId } = render(<AddGroupMembersScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('filters out existing group members', async () => {
    const { findByText, queryByText } = render(<AddGroupMembersScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Check if only non-members are shown
    expect(await findByText('User Four')).toBeTruthy();
    expect(await findByText('User Five')).toBeTruthy();
    
    // Existing members should not be shown
    expect(queryByText('User Two')).toBeNull();
    expect(queryByText('User Three')).toBeNull();
  });
  
  it('allows selecting and adding users to the group', async () => {
    // Mock Alert.alert
    const originalAlert = global.Alert;
    global.Alert = {
      ...originalAlert,
      alert: jest.fn((title, message, buttons) => {
        // Simulate pressing the "OK" button
        const okButton = buttons?.find(button => button.text === 'OK');
        if (okButton && okButton.onPress) {
          okButton.onPress();
        }
      }),
    };
    
    const { findByText, getByTestId } = render(<AddGroupMembersScreen />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });
    
    // Select users
    const userFourItem = await findByText('User Four');
    fireEvent.press(userFourItem);
    
    const userFiveItem = await findByText('User Five');
    fireEvent.press(userFiveItem);
    
    // Add users to group
    const addButton = getByTestId('add-members-button');
    fireEvent.press(addButton);
    
    // Check if users were added
    await waitFor(() => {
      expect(MessageService.addUserToGroupChat).toHaveBeenCalledWith(
        'group1',
        'test-user-id',
        'user4'
      );
      expect(MessageService.addUserToGroupChat).toHaveBeenCalledWith(
        'group1',
        'test-user-id',
        'user5'
      );
    });
    
    // Check if navigation occurred
    expect(mockRouter.back).toHaveBeenCalled();
    
    // Restore original Alert
    global.Alert = originalAlert;
  });
  
  it('shows error when user is not admin', async () => {
    // Mock non-admin user
    const nonAdminConversation = {
      ...mockConversation,
      groupAdminId: 'user2',
    };
    
    MessageService.getUserConversations = jest.fn().mockResolvedValue([nonAdminConversation]);
    
    const { findByText } = render(<AddGroupMembersScreen />);
    
    // Check if error is shown
    expect(await findByText('Only the group admin can add members')).toBeTruthy();
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<AddGroupMembersScreen />);
    
    // Press back button
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    // Check if navigation occurred
    expect(mockRouter.back).toHaveBeenCalled();
  });
}); 