import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AudioRecorder from '../../components/audio/recorder/AudioRecorder';

// Mock the expo-av Audio module
jest.mock('expo-av', () => ({
  Audio: {
    Recording: {
      createAsync: jest.fn().mockImplementation(() => Promise.resolve({
        recording: {
          stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
          getURI: jest.fn().mockReturnValue('file:///test/recording.m4a')
        }
      })),
    },
    Sound: {
      createAsync: jest.fn().mockImplementation(() => Promise.resolve({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          getStatusAsync: jest.fn().mockResolvedValue({
            isLoaded: true,
            positionMillis: 0,
            durationMillis: 10000
          }),
          setPositionAsync: jest.fn().mockResolvedValue(undefined)
        },
        status: {
          isLoaded: true,
          durationMillis: 10000
        }
      })),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 1,
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 1,
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' })
  }
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    uri: 'file:///test/recording.m4a',
    size: 10240,
    modificationTime: 1609459200
  })
}));

// Mock timers for duration tracking
jest.useFakeTimers();

describe('AudioRecorder Component', () => {
  const mockOnRecordingComplete = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state while checking permissions', () => {
    // Don't resolve permission request yet
    (Audio.requestPermissionsAsync as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    
    const { getByTestId, getByText } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(getByTestId('audio-recorder-container')).toBeTruthy();
    expect(getByTestId('loading-indicator')).toBeTruthy();
    expect(getByText('Checking permissions...')).toBeTruthy();
  });
  
  test('renders permission denied state when permission is not granted', async () => {
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    
    const { getByTestId, getByText } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    await waitFor(() => {
      expect(getByTestId('error-text')).toBeTruthy();
      expect(getByText(/Permission to record audio was denied/)).toBeTruthy();
    });
    
    // Test cancel button
    fireEvent.press(getByTestId('cancel-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  test('renders recording interface correctly', async () => {
    const { getByTestId, getByText } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    await waitFor(() => {
      expect(getByTestId('record-button')).toBeTruthy();
    });
    
    expect(getByText('Tap the microphone to start recording')).toBeTruthy();
    expect(getByTestId('duration-text')).toHaveTextContent('0:00');
  });
  
  test('handles recording flow correctly', async () => {
    const { getByTestId, getByText } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByTestId('record-button')).toBeTruthy();
    });
    
    // Start recording
    fireEvent.press(getByTestId('record-button'));
    
    // Verify recording started
    await waitFor(() => {
      expect(Audio.Recording.createAsync).toHaveBeenCalled();
      expect(getByTestId('stop-button')).toBeTruthy();
    });
    
    // Simulate recording duration (2 seconds)
    jest.advanceTimersByTime(2000);
    
    // Verify duration update
    expect(getByTestId('duration-text')).toHaveTextContent('0:02');
    
    // Stop recording
    fireEvent.press(getByTestId('stop-button'));
    
    // Verify recording stopped and playback available
    await waitFor(() => {
      expect(getByTestId('play-button')).toBeTruthy();
    });
    
    // Verify Save button is available
    expect(getByTestId('save-button')).toBeTruthy();
    
    // Save recording
    fireEvent.press(getByTestId('save-button'));
    
    // Verify callback called with correct params
    expect(mockOnRecordingComplete).toHaveBeenCalledWith(
      'file:///test/recording.m4a', 
      2 // duration
    );
  });
  
  test('handles playback correctly', async () => {
    const { getByTestId } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByTestId('record-button')).toBeTruthy();
    });
    
    // Start and stop recording
    fireEvent.press(getByTestId('record-button'));
    jest.advanceTimersByTime(1000);
    fireEvent.press(getByTestId('stop-button'));
    
    // Wait for playback controls to appear
    await waitFor(() => {
      expect(getByTestId('play-button')).toBeTruthy();
    });
    
    // Test play button
    fireEvent.press(getByTestId('play-button'));
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    
    // Test reset button
    fireEvent.press(getByTestId('reset-button'));
    expect(Audio.Recording.createAsync).toHaveBeenCalledTimes(2);
  });
  
  test('handles cancel correctly', async () => {
    const { getByTestId } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
    
    // Press cancel
    fireEvent.press(getByTestId('cancel-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  test('respects maxDuration prop', async () => {
    const maxDuration = 5; // 5 seconds
    
    const { getByTestId } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel}
        maxDuration={maxDuration}
      />
    );
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByTestId('record-button')).toBeTruthy();
    });
    
    // Start recording
    fireEvent.press(getByTestId('record-button'));
    
    // Simulate recording reaching max duration
    jest.advanceTimersByTime(maxDuration * 1000);
    
    // Verify recording stopped automatically
    await waitFor(() => {
      expect(getByTestId('play-button')).toBeTruthy();
    });
  });
}); 