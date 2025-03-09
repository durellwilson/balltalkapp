// Mock for expo-av module
const mockSound = {
  playAsync: jest.fn().mockResolvedValue({}),
  pauseAsync: jest.fn().mockResolvedValue({}),
  stopAsync: jest.fn().mockResolvedValue({}),
  unloadAsync: jest.fn().mockResolvedValue({}),
  setPositionAsync: jest.fn().mockResolvedValue({}),
  setVolumeAsync: jest.fn().mockResolvedValue({}),
  setRateAsync: jest.fn().mockResolvedValue({}),
  setIsMutedAsync: jest.fn().mockResolvedValue({}),
  setIsLoopingAsync: jest.fn().mockResolvedValue({}),
  getStatusAsync: jest.fn().mockResolvedValue({
    isLoaded: true,
    positionMillis: 0,
    durationMillis: 30000,
    isPlaying: false,
    rate: 1,
    shouldCorrectPitch: false,
    volume: 1,
    isMuted: false,
    isLooping: false,
    didJustFinish: false
  })
};

const mockRecording = {
  prepareToRecordAsync: jest.fn().mockResolvedValue({}),
  startAsync: jest.fn().mockResolvedValue({}),
  pauseAsync: jest.fn().mockResolvedValue({}),
  stopAndUnloadAsync: jest.fn().mockResolvedValue({}),
  getStatusAsync: jest.fn().mockResolvedValue({
    isRecording: false,
    durationMillis: 10000
  }),
  getURI: jest.fn().mockReturnValue('file://mock-recording.m4a'),
  createNewLoadedSoundAsync: jest.fn().mockResolvedValue({
    sound: mockSound,
    status: { isLoaded: true }
  })
};

const Audio = {
  Sound: {
    createAsync: jest.fn().mockResolvedValue({
      sound: mockSound,
      status: { isLoaded: true }
    })
  },
  Recording: {
    createAsync: jest.fn().mockResolvedValue({
      recording: mockRecording,
      status: { canRecord: true }
    })
  },
  setAudioModeAsync: jest.fn().mockResolvedValue({}),
  InterruptionModeIOS: {
    MixWithOthers: 0,
    DoNotMix: 1,
    DuckOthers: 2
  },
  InterruptionModeAndroid: {
    MixWithOthers: 0,
    DoNotMix: 1,
    DuckOthers: 2
  },
  RecordingOptionsPresets: {
    HIGH_QUALITY: {
      android: {
        extension: '.m4a',
        outputFormat: 2,
        audioEncoder: 3,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'aac',
        audioQuality: 'high',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false
      }
    },
    LOW_QUALITY: {
      android: {
        extension: '.3gp',
        outputFormat: 3,
        audioEncoder: 1,
        sampleRate: 8000,
        numberOfChannels: 1,
        bitRate: 24000
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'aac',
        audioQuality: 'low',
        sampleRate: 8000,
        numberOfChannels: 1,
        bitRate: 24000,
        linearPCMBitDepth: 8,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false
      }
    }
  }
};

export { Audio }; 