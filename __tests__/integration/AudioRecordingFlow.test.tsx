import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import BasicRecorder from '../../components/audio/recorder/BasicRecorder';
import SimpleEqualizer from '../../components/audio/SimpleEqualizer';

// Mock the expo-av Audio module
jest.mock('expo-av', () => {
  const mockRecording = {
    stopAndUnloadAsync: jest.fn().mockResolvedValue({}),
    getURI: jest.fn().mockReturnValue('file://test/recording.m4a')
  };

  const mockSound = {
    unloadAsync: jest.fn().mockResolvedValue({}),
    playAsync: jest.fn().mockResolvedValue({}),
    setOnPlaybackStatusUpdate: jest.fn((callback) => {
      // Store the callback for later use
      mockSound.callback = callback;
    }),
    callback: null
  };

  return {
    Audio: {
      requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
      setAudioModeAsync: jest.fn().mockResolvedValue({}),
      Recording: {
        createAsync: jest.fn().mockResolvedValue({ recording: mockRecording })
      },
      Sound: {
        createAsync: jest.fn().mockResolvedValue({ sound: mockSound })
      },
      INTERRUPTION_MODE_IOS_DO_NOT_MIX: 'interruption_mode_ios',
      INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 'interruption_mode_android'
    }
  };
});

// Mock the Slider component
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return jest.fn().mockImplementation(props => {
    return (
      <View testID="mock-slider" {...props} />
    );
  });
});

describe('Audio Recording Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records audio and then allows EQ adjustment in an integrated workflow', async () => {
    // Render both components to simulate an integrated workflow
    let recordingComponent;
    let equalizerComponent;
    
    await act(async () => {
      recordingComponent = render(<BasicRecorder />);
    });
    
    equalizerComponent = render(<SimpleEqualizer />);
    
    // Start recording
    const startButton = recordingComponent.getByText('Start Recording');
    await act(async () => {
      fireEvent.press(startButton);
    });
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
    
    // Stop recording
    const stopButton = recordingComponent.getByText('Stop Recording');
    await act(async () => {
      fireEvent.press(stopButton);
    });
    
    // Verify recording is saved
    expect(recordingComponent.getByText(/Recording saved/)).toBeTruthy();
    
    // Play recording
    const playButton = recordingComponent.getByText('Play Recording');
    await act(async () => {
      fireEvent.press(playButton);
    });
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    
    // Verify equalizer is rendered and usable after recording
    const sliders = equalizerComponent.getAllByTestId('mock-slider');
    expect(sliders.length).toBe(5);
    
    // Complete the flow by simulating an audio finished playing event
    await act(async () => {
      // Get the stored callback from the mock and call it with a "finished" status
      const mockSound = Audio.Sound.createAsync().sound;
      if (mockSound.callback) {
        mockSound.callback({ 
          isLoaded: true, 
          didJustFinish: true 
        });
      }
    });
    
    // Verify recording playback finished message
    expect(recordingComponent.getByText('Playback finished')).toBeTruthy();
  });
}); 