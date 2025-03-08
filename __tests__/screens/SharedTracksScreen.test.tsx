import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SharedTracksScreen from '../../screens/SharedTracksScreen';
import { mockedGoBack } from '../mocks/navigation-mocks';
import { Song } from '../../models/Song';
import { TrackShare } from '../../models/TrackSharing';

// Mock the SharedTracksView component
jest.mock('../../components/studio/SharedTracksView', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockSharedTracksView({ mode, onTrackSelect }) {
    // Create some mock data for testing
    const mockSong: Song = {
      id: 'song-1',
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Test Genre',
      description: 'Test Description',
      coverArtUrl: 'https://example.com/image.jpg',
      audioUrl: 'https://example.com/audio.mp3',
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    };
    
    const mockShare: TrackShare = {
      id: 'share-1',
      songId: 'song-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      message: 'Check out this track!',
      permissions: ['LISTEN', 'COMMENT'],
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    
    return (
      <View testID={`shared-tracks-view-${mode}`}>
        <Text>Shared Tracks View: {mode}</Text>
        <TouchableOpacity 
          testID="track-item" 
          onPress={() => onTrackSelect(mockSong, mockShare)}
        >
          <Text>Track: {mockSong.title}</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock the TrackSharingModal component
jest.mock('../../components/studio/TrackSharingModal', () => {
  const { View } = require('react-native');
  return function MockTrackSharingModal() {
    return <View testID="track-sharing-modal" />;
  };
});

describe('SharedTracksScreen', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    const { getByText, getByTestId } = render(<SharedTracksScreen />);
    
    // Check if the screen title is rendered
    expect(getByText('Shared Tracks')).toBeTruthy();
    
    // Check if both tabs are rendered
    expect(getByText('Received')).toBeTruthy();
    expect(getByText('Sent')).toBeTruthy();
    
    // Check if the received tracks view is displayed by default
    expect(getByTestId('shared-tracks-view-received')).toBeTruthy();
  });

  test('switches tabs when buttons are pressed', () => {
    const { getByText, getByTestId, queryByTestId } = render(<SharedTracksScreen />);
    
    // Initially, the 'received' tab should be active
    expect(getByTestId('shared-tracks-view-received')).toBeTruthy();
    
    // Click on the 'Sent' tab
    fireEvent.press(getByText('Sent'));
    
    // Now, the 'sent' tab should be active
    expect(getByTestId('shared-tracks-view-sent')).toBeTruthy();
    
    // And the 'received' tab should not be visible
    expect(queryByTestId('shared-tracks-view-received')).toBeNull();
    
    // Click back on the 'Received' tab
    fireEvent.press(getByText('Received'));
    
    // Now, the 'received' tab should be active again
    expect(getByTestId('shared-tracks-view-received')).toBeTruthy();
  });

  test('goes back when back button is pressed', () => {
    const { getByTestId } = render(<SharedTracksScreen />);
    
    // Find and press the back button
    fireEvent.press(getByTestId('back-button'));
    
    // Expect the navigation.goBack function to have been called
    expect(mockedGoBack).toHaveBeenCalled();
  });

  test('opens details modal when a track is selected', async () => {
    const { getByTestId, queryByTestId } = render(<SharedTracksScreen />);
    
    // Initially, the details modal should not be visible
    expect(queryByTestId('details-modal')).toBeNull();
    
    // Select a track
    fireEvent.press(getByTestId('track-item'));
    
    // Now the details modal should be visible
    await waitFor(() => {
      expect(getByTestId('details-modal')).toBeTruthy();
    });
  });
}); 