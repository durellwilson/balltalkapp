import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import UploadedFileDetails from '../../components/studio/UploadedFileDetails';

// Mock the expo-av module
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
          setPositionAsync: jest.fn(),
        },
        status: { isLoaded: true },
      }),
    },
  },
}));

describe('UploadedFileDetails Component', () => {
  const mockProps = {
    fileName: 'test-audio.mp3',
    fileUrl: 'https://firebasestorage.example.com/test-audio.mp3',
    duration: 120, // 2 minutes
    trackName: 'Test Track',
    createdAt: new Date('2023-08-15T10:30:00Z'),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with all props', () => {
    const { getByText, queryByText } = render(<UploadedFileDetails {...mockProps} />);
    
    // Check if title, file name, and track name are displayed
    expect(getByText('Uploaded File')).toBeTruthy();
    expect(getByText(mockProps.fileName)).toBeTruthy();
    expect(getByText(`Track: ${mockProps.trackName}`)).toBeTruthy();
    
    // Check if duration is properly formatted and displayed
    expect(getByText('Duration: 2:00')).toBeTruthy();
    
    // Check if upload date is displayed
    expect(getByText(/Uploaded:/)).toBeTruthy();
    
    // Check if Firebase URL is displayed
    expect(getByText('File URL Stored in Firebase:')).toBeTruthy();
    expect(getByText(mockProps.fileUrl)).toBeTruthy();
  });
  
  test('renders without trackName when not provided', () => {
    const propsWithoutTrackName = { ...mockProps, trackName: undefined };
    const { queryByText } = render(<UploadedFileDetails {...propsWithoutTrackName} />);
    
    // Track name should not be displayed
    expect(queryByText(/Track:/)).toBeNull();
  });
  
  test('handles play button press', async () => {
    const { getByText } = render(<UploadedFileDetails {...mockProps} />);
    
    // Find and press the play button
    const playText = getByText('Tap to play the uploaded track');
    const playButton = playText.parentNode;
    
    await act(async () => {
      fireEvent.press(playButton);
    });
    
    // Check if Sound.createAsync was called with the correct URL
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: mockProps.fileUrl },
      { shouldPlay: false },
      expect.any(Function)
    );
  });
  
  test('handles close button press', () => {
    const { getByTestId } = render(
      <UploadedFileDetails {...mockProps} testID="uploaded-file-details" />
    );
    
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
  
  test('formats time correctly', () => {
    const { getByText } = render(<UploadedFileDetails {...mockProps} />);
    
    // Initial time should be 0:00 for playback position
    expect(getByText('0:00')).toBeTruthy();
    
    // Duration should be formatted as 2:00 (from 120 seconds)
    expect(getByText('2:00')).toBeTruthy();
  });
  
  test('handles loading state', async () => {
    // Mock Sound.createAsync to simulate loading
    (Audio.Sound.createAsync as jest.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            sound: {
              playAsync: jest.fn(),
              pauseAsync: jest.fn(),
              unloadAsync: jest.fn(),
              setOnPlaybackStatusUpdate: jest.fn(),
            },
            status: { isLoaded: true },
          });
        }, 100);
      });
    });
    
    const { getByTestId } = render(
      <UploadedFileDetails {...mockProps} testID="uploaded-file-details" />
    );
    
    // Trigger loading state
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);
    
    // Loading indicator should be visible initially
    expect(getByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });
  });
  
  test('handles playback status updates', async () => {
    let statusUpdateCallback;
    
    // Mock Sound.createAsync to capture the status update callback
    (Audio.Sound.createAsync as jest.Mock).mockImplementationOnce((source, options, callback) => {
      statusUpdateCallback = callback;
      return Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
          setPositionAsync: jest.fn(),
        },
        status: { isLoaded: true },
      });
    });
    
    const { getByTestId, getByText, rerender } = render(
      <UploadedFileDetails {...mockProps} testID="uploaded-file-details" />
    );
    
    // Trigger loading and playing
    const playButton = getByTestId('play-button');
    await act(async () => {
      fireEvent.press(playButton);
    });
    
    // Simulate playback progress
    await act(async () => {
      statusUpdateCallback({
        isLoaded: true,
        positionMillis: 30000, // 30 seconds
        durationMillis: 120000, // 2 minutes
        didJustFinish: false,
      });
      
      // Re-render to see updates
      rerender(<UploadedFileDetails {...mockProps} testID="uploaded-file-details" />);
    });
    
    // Playback position should now show 0:30
    expect(getByText('0:30')).toBeTruthy();
    
    // Simulate playback completion
    await act(async () => {
      statusUpdateCallback({
        isLoaded: true,
        positionMillis: 120000, // 2 minutes
        durationMillis: 120000, // 2 minutes
        didJustFinish: true,
      });
      
      // Re-render to see updates
      rerender(<UploadedFileDetails {...mockProps} testID="uploaded-file-details" />);
    });
    
    // Should now show "Tap to play" again
    expect(getByText('Tap to play the uploaded track')).toBeTruthy();
  });
  
  test('cleans up resources on unmount', () => {
    const mockUnloadAsync = jest.fn();
    
    // Mock sound object
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({
      sound: {
        playAsync: jest.fn(),
        pauseAsync: jest.fn(),
        unloadAsync: mockUnloadAsync,
        setOnPlaybackStatusUpdate: jest.fn(),
      },
      status: { isLoaded: true },
    });
    
    const { getByTestId, unmount } = render(
      <UploadedFileDetails {...mockProps} testID="uploaded-file-details" />
    );
    
    // Load sound
    const playButton = getByTestId('play-button');
    act(() => {
      fireEvent.press(playButton);
    });
    
    // Unmount component
    unmount();
    
    // Check if sound is unloaded
    expect(mockUnloadAsync).toHaveBeenCalled();
  });
}); 