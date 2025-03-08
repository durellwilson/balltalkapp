const AudioEngine = require('../services/audio/AudioEngine').default;

// Mock the AudioProcessingEngine
jest.mock('../services/audio/AudioProcessingEngine', () => {
  return jest.fn().mockImplementation(() => {
    return {
      initialize: jest.fn().mockResolvedValue(true),
      loadAudioFile: jest.fn().mockResolvedValue(true),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      seek: jest.fn(),
      addModule: jest.fn(),
      removeModule: jest.fn(),
      clearProcessingChain: jest.fn(),
      getProcessingChain: jest.fn().mockReturnValue([]),
      processAudio: jest.fn().mockResolvedValue({}),
      dispose: jest.fn(),
    };
  });
});

// Mock expo-av
jest.mock('expo-av', () => {
  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockResolvedValue({
          sound: {
            playAsync: jest.fn().mockResolvedValue({}),
            pauseAsync: jest.fn().mockResolvedValue({}),
            stopAsync: jest.fn().mockResolvedValue({}),
            unloadAsync: jest.fn().mockResolvedValue({}),
            setPositionAsync: jest.fn().mockResolvedValue({}),
            getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, positionMillis: 0, durationMillis: 1000 }),
          },
          status: { durationMillis: 1000 },
        }),
      },
      setAudioModeAsync: jest.fn().mockResolvedValue({}),
      INTERRUPTION_MODE_IOS_DUCK_OTHERS: 'INTERRUPTION_MODE_IOS_DUCK_OTHERS',
      INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 'INTERRUPTION_MODE_ANDROID_DUCK_OTHERS',
    },
  };
});

// Mock DolbyMasteringService
jest.mock('../services/audio/DolbyMasteringService', () => {
  return jest.fn().mockImplementation(() => ({}));
});

// Mock NectarVocalService
jest.mock('../services/audio/NectarVocalService', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('AudioEngine', () => {
  let audioEngine;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    audioEngine = new AudioEngine();
  });

  test('should initialize successfully', async () => {
    const result = await audioEngine.initialize();
    expect(result).toBe(true);
  });

  test('should load audio successfully', async () => {
    await audioEngine.initialize();
    const result = await audioEngine.loadAudio('test.mp3');
    expect(result).toBe(true);
  });

  test('should handle play, pause, and stop operations', async () => {
    await audioEngine.initialize();
    await audioEngine.loadAudio('test.mp3');
    
    // Test play
    await audioEngine.play();
    
    // Test pause
    await audioEngine.pause();
    
    // Test stop
    await audioEngine.stop();
  });

  test('should handle event listeners', () => {
    const mockCallback = jest.fn();
    audioEngine.addEventListener('playbackStateChanged', mockCallback);
    
    // Manually trigger the event
    audioEngine.notifyListeners('playbackStateChanged', { isPlaying: true, currentTime: 10, duration: 100 });
    
    expect(mockCallback).toHaveBeenCalledWith({ isPlaying: true, currentTime: 10, duration: 100 });
    
    // Remove the listener
    audioEngine.removeEventListener('playbackStateChanged', mockCallback);
    
    // Trigger again, should not call the callback
    audioEngine.notifyListeners('playbackStateChanged', { isPlaying: false, currentTime: 20, duration: 100 });
    
    // Should still have been called only once
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should handle initialization timeout gracefully', async () => {
    // Mock the processing engine to hang on initialization
    AudioProcessingEngine.mockImplementationOnce(() => {
      return {
        initialize: jest.fn().mockImplementation(() => new Promise(resolve => {
          // This promise never resolves, simulating a hang
          setTimeout(() => resolve(true), 10000);
        })),
        dispose: jest.fn(),
      };
    });
    
    const engine = new AudioEngine();
    
    // The initialize method should resolve with true after the timeout
    const result = await engine.initialize();
    expect(result).toBe(true);
  });
}); 