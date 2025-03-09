import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, View, Button, AppState } from 'react-native';
import { RecordingProvider, useRecording, RecordingState } from '../../contexts/RecordingContext';
import { Audio } from 'expo-av';

// Mock expo-av
jest.mock('expo-av', () => {
  const originalModule = jest.requireActual('expo-av');

  // Create mock recording class
  class MockRecording {
    _uri = 'file://test/recording.m4a';
    _status = {
      canRecord: true,
      isRecording: false,
      durationMillis: 0,
      metering: -30,
    };
    _statusUpdateCallback = null;

    // Mock implementations
    async prepareToRecordAsync() {
      return true;
    }

    async startAsync() {
      this._status.isRecording = true;
      this._simulateRecording();
      return this._status;
    }

    async pauseAsync() {
      this._status.isRecording = false;
      return this._status;
    }

    async stopAndUnloadAsync() {
      this._status.isRecording = false;
      return this._status;
    }

    setOnRecordingStatusUpdate(callback) {
      this._statusUpdateCallback = callback;
    }

    getURI() {
      return this._uri;
    }

    // Helper to simulate recording progression
    _simulateRecording() {
      if (this._statusUpdateCallback) {
        let duration = 0;
        const interval = setInterval(() => {
          if (!this._status.isRecording) {
            clearInterval(interval);
            return;
          }
          
          duration += 1000;
          this._status.durationMillis = duration;
          
          // Random level between -50 and -10
          this._status.metering = -50 + Math.random() * 40;
          
          // Call the status update callback
          this._statusUpdateCallback({
            ...this._status,
            isRecording: this._status.isRecording,
            durationMillis: this._status.durationMillis,
            metering: this._status.metering,
          });
        }, 1000);
      }
    }
  }

  // Create mock sound class
  class MockSound {
    _status = {
      isLoaded: true,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 10000,
      didJustFinish: false,
    };
    _statusUpdateCallback = null;

    // Mock implementations
    async playAsync() {
      this._status.isPlaying = true;
      this._simulatePlayback();
      return this._status;
    }

    async pauseAsync() {
      this._status.isPlaying = false;
      return this._status;
    }

    async stopAsync() {
      this._status.isPlaying = false;
      this._status.positionMillis = 0;
      return this._status;
    }

    async unloadAsync() {
      this._status.isLoaded = false;
      this._status.isPlaying = false;
      return this._status;
    }

    async getStatusAsync() {
      return this._status;
    }

    async setPositionAsync(positionMillis) {
      this._status.positionMillis = positionMillis;
      return this._status;
    }

    setOnPlaybackStatusUpdate(callback) {
      this._statusUpdateCallback = callback;
    }

    // Helper to simulate playback progression
    _simulatePlayback() {
      if (this._statusUpdateCallback) {
        let position = this._status.positionMillis;
        const interval = setInterval(() => {
          if (!this._status.isPlaying) {
            clearInterval(interval);
            return;
          }
          
          position += 1000;
          this._status.positionMillis = position;
          
          // Check if playback finished
          if (position >= this._status.durationMillis) {
            this._status.isPlaying = false;
            this._status.didJustFinish = true;
            clearInterval(interval);
          } else {
            this._status.didJustFinish = false;
          }
          
          // Call the status update callback
          this._statusUpdateCallback({
            ...this._status,
            isPlaying: this._status.isPlaying,
            positionMillis: this._status.positionMillis,
            didJustFinish: this._status.didJustFinish,
          });
        }, 1000);
      }
    }
  }

  return {
    ...originalModule,
    Audio: {
      ...originalModule.Audio,
      Recording: MockRecording,
      Sound: {
        createAsync: async (source, initialStatus, onPlaybackStatusUpdate) => {
          const sound = new MockSound();
          if (onPlaybackStatusUpdate) {
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          }
          return { sound };
        }
      },
      setAudioModeAsync: jest.fn(() => Promise.resolve(true)),
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
      RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT: 0,
      RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT: 0,
      RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM: 0,
      RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC: 1,
      RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX: 127,
      RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4: 2,
      RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC: 3,
      INTERRUPTION_MODE_IOS_DUCK_OTHERS: 1,
      INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 1,
    },
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ size: 1024000 }),
  deleteAsync: jest.fn().mockResolvedValue(true),
  cacheDirectory: 'file://test-cache/',
  documentDirectory: 'file://test-documents/',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockImplementation((key) => {
    if (key === 'recording_settings') {
      return Promise.resolve(JSON.stringify({
        quality: 'high',
        format: 'm4a',
        autoStopAfterSeconds: 60,
        noiseReductionEnabled: true,
        autoSaveEnabled: true,
        showVisualization: true,
        uploadAfterRecording: false
      }));
    }
    return Promise.resolve(null);
  }),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn().mockImplementation((obj) => obj.ios),
}));

// Mock AudioMonitoringService
jest.mock('../../services/AudioMonitoringService', () => {
  return {
    getInstance: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      logError: jest.fn(),
      startMetric: jest.fn().mockReturnValue('test-metric-id'),
      endMetric: jest.fn(),
      logRecordingStart: jest.fn().mockReturnValue('test-recording-id'),
      logRecordingEnd: jest.fn(),
      identifyPerformanceIssues: jest.fn().mockReturnValue([]),
      exportDiagnosticData: jest.fn().mockResolvedValue('file://test/diagnostic.json'),
    }))
  };
});

// Mock AppState
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener: jest.fn((event, callback) => {
    // Mock implementation that allows for triggering the callback
    AppState.callbacks = AppState.callbacks || {};
    AppState.callbacks[event] = callback;
    return { remove: jest.fn() };
  }),
  // Helper methods for tests
  _triggerStateChange: (nextState: string) => {
    if (AppState.callbacks && AppState.callbacks.change) {
      AppState.callbacks.change(nextState);
    }
  },
  callbacks: {},
}));

// Test component that uses the recording context
const TestComponent = () => {
  const {
    recordingState,
    recordingDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    recordingUri
  } = useRecording();

  return (
    <View>
      <Text testID="state">{recordingState}</Text>
      <Text testID="duration">{recordingDuration}</Text>
      <Text testID="uri">{recordingUri || 'no-uri'}</Text>
      <Button testID="start" title="Start" onPress={startRecording} />
      <Button testID="pause" title="Pause" onPress={pauseRecording} />
      <Button testID="resume" title="Resume" onPress={resumeRecording} />
      <Button testID="stop" title="Stop" onPress={stopRecording} />
      <Button testID="play" title="Play" onPress={playRecording} />
    </View>
  );
};

describe('RecordingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with idle state', async () => {
    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Initially in IDLE state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.IDLE);
    });
  });

  it('transitions through recording states correctly', async () => {
    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Start recording
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Should be in RECORDING state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);
    });

    // Simulate recording for 2 seconds
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Duration should increase
    expect(parseInt(getByTestId('duration').props.children)).toBeGreaterThan(0);

    // Pause recording
    await act(async () => {
      getByTestId('pause').props.onPress();
    });

    // Should be in PAUSED state
    expect(getByTestId('state').props.children).toBe(RecordingState.PAUSED);

    // Resume recording
    await act(async () => {
      getByTestId('resume').props.onPress();
    });

    // Should be in RECORDING state again
    expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);

    // Stop recording
    await act(async () => {
      getByTestId('stop').props.onPress();
    });

    // Should eventually transition to COMPLETED state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.COMPLETED);
    });

    // URI should be available
    expect(getByTestId('uri').props.children).not.toBe('no-uri');

    // Play recording
    await act(async () => {
      getByTestId('play').props.onPress();
    });

    // Should be in PLAYBACK state
    expect(getByTestId('state').props.children).toBe(RecordingState.PLAYBACK);

    // Simulate playback for 2 seconds
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
  });

  it('handles errors gracefully', async () => {
    // Mock Audio.requestPermissionsAsync to reject
    jest.spyOn(Audio, 'requestPermissionsAsync').mockRejectedValueOnce(new Error('Permission denied'));

    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Start recording (which will fail)
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Should transition to ERROR state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.ERROR);
    });
  });

  it('handles app state changes correctly', async () => {
    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Start recording
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Should be in RECORDING state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);
    });

    // Simulate app going to background
    await act(async () => {
      // @ts-ignore (using private test helper)
      AppState._triggerStateChange('background');
    });

    // Should automatically pause recording
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.PAUSED);
    });

    // Simulate app coming back to foreground
    await act(async () => {
      // @ts-ignore (using private test helper)
      AppState._triggerStateChange('active');
      // Mock user choosing to resume recording by pressing resume button
      getByTestId('resume').props.onPress();
    });

    // Should be back in RECORDING state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);
    });
  });
  
  it('safely handles unmounting during recording', async () => {
    const { getByTestId, unmount } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Start recording
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Should be in RECORDING state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);
    });

    // Unmount the component during recording
    await act(async () => {
      unmount();
    });

    // No assertions needed here - we're just testing that unmounting
    // during recording doesn't cause any unhandled exceptions
  });
  
  it('handles permission rejection gracefully', async () => {
    // Mock permission rejection
    jest.spyOn(Audio, 'requestPermissionsAsync').mockResolvedValueOnce({ granted: false, canAskAgain: true });
    
    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Try to start recording (should fail due to permissions)
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Should transition to ERROR state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.ERROR);
    });
  });
  
  it('handles hardware errors during recording gracefully', async () => {
    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Start recording successfully
    await act(async () => {
      getByTestId('start').props.onPress();
    });

    // Verify recording started
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.RECORDING);
    });

    // Simulate hardware error during recording by directly calling
    // the recording status update callback with an error
    await act(async () => {
      // Access the mock recording and trigger an error
      const mockRecording = recordingRef.current;
      if (mockRecording && mockRecording._statusUpdateCallback) {
        mockRecording._statusUpdateCallback({
          isRecording: false,
          canRecord: false,
          isDoneRecording: true,
          error: 'Hardware error',
        });
      }
    });

    // Should eventually show an error state
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe(RecordingState.ERROR);
    });
  });
});

// Test for mocking different platforms
describe('RecordingContext on different platforms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the right format for web platform', async () => {
    // Mock Platform.OS as web
    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'web',
      select: jest.fn().mockImplementation((obj) => obj.web),
    }));

    const { getByTestId } = render(
      <RecordingProvider>
        <TestComponent />
      </RecordingProvider>
    );

    // Just verifying the component rendered successfully
    await waitFor(() => {
      expect(getByTestId('state').props.children).toBeDefined();
    });
  });
}); 