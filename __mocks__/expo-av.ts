// Mock for expo-av module
const Audio = {
  Sound: {
    createAsync: jest.fn(() => Promise.resolve({
      sound: {
        playAsync: jest.fn(() => Promise.resolve()),
        pauseAsync: jest.fn(() => Promise.resolve()),
        stopAsync: jest.fn(() => Promise.resolve()),
        unloadAsync: jest.fn(() => Promise.resolve()),
        getStatusAsync: jest.fn(() => Promise.resolve({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: 1000,
          shouldPlay: false,
          rate: 1,
          volume: 1
        })),
        setPositionAsync: jest.fn(() => Promise.resolve()),
        setVolumeAsync: jest.fn(() => Promise.resolve()),
        setOnPlaybackStatusUpdate: jest.fn()
      },
      status: {
        isLoaded: true,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 1000,
        shouldPlay: false,
        rate: 1,
        volume: 1
      }
    }))
  },
  Recording: jest.fn().mockImplementation(() => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    startAsync: jest.fn(() => Promise.resolve()),
    stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
    getURI: jest.fn(() => 'file://test-recording.m4a'),
    setOnRecordingStatusUpdate: jest.fn()
  })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  INTERRUPTION_MODE_IOS_DUCK_OTHERS: 'INTERRUPTION_MODE_IOS_DUCK_OTHERS',
  INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 'INTERRUPTION_MODE_ANDROID_DUCK_OTHERS',
  RecordingOptionsPresets: {
    HIGH_QUALITY: {
      android: {
        extension: '.m4a',
        outputFormat: 'mpeg_4',
        audioEncoder: 'aac',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'mpeg4AAC',
        audioQuality: 'high',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false
      }
    }
  }
};

export { Audio }; 