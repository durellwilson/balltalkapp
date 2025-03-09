// Add any global setup for Jest tests here
require('@testing-library/jest-native');

// Import dotenv and load environment variables
require('dotenv').config();

// Mock Expo modules that might cause issues in tests
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test-auth-domain',
      firebaseProjectId: 'test-project-id',
      firebaseStorageBucket: 'test-storage-bucket',
      firebaseMessagingSenderId: 'test-messaging-sender-id',
      firebaseAppId: 'test-app-id'
    }
  }
}));

// Mock the @dolbyio/media-processing module
jest.mock('@dolbyio/media-processing', () => ({
  createClient: jest.fn().mockReturnValue({
    analyze: jest.fn().mockResolvedValue({
      loudness: -14,
      peakLevel: -1.2,
      dynamicRange: 12,
      spectralContent: [],
    }),
    process: jest.fn().mockResolvedValue({
      url: 'https://processed-audio-url.com/file.wav',
    }),
  }),
}), { virtual: true });

// Mock AudioBuffer if not available (for audio processing tests)
if (typeof global.AudioBuffer === 'undefined') {
  global.AudioBuffer = class AudioBuffer {
    constructor(options) {
      this.length = options.length || 0;
      this.numberOfChannels = options.numberOfChannels || 2;
      this.sampleRate = options.sampleRate || 44100;
      this._data = new Float32Array(this.length * this.numberOfChannels);
    }
    
    getChannelData(channel) {
      return new Float32Array(this.length);
    }
    
    copyFromChannel(destination, channelNumber, startInChannel = 0) {
      // Mock implementation
    }
    
    copyToChannel(source, channelNumber, startInChannel = 0) {
      // Mock implementation
    }
  };
}

// Mock Web Audio API if not available
if (typeof global.AudioContext === 'undefined') {
  class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.currentTime = 0;
    }
    
    createAnalyser() {
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        getFloatFrequencyData: jest.fn(),
        getByteFrequencyData: jest.fn(),
      };
    }
    
    createGain() {
      return {
        gain: { value: 1, setValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
    }
    
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 440 },
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };
    }
    
    decodeAudioData(arrayBuffer, successCallback) {
      const buffer = new AudioBuffer({ length: 1000, numberOfChannels: 2, sampleRate: 44100 });
      if (successCallback) successCallback(buffer);
      return Promise.resolve(buffer);
    }
    
    createBufferSource() {
      return {
        buffer: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null,
      };
    }
  }
  
  global.AudioContext = MockAudioContext;
}

// Mock the Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSegments: () => [''],
  usePathname: () => '/',
  Link: 'Link',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }
}));

// Mock the Firebase modules
jest.mock('../config/firebase.config', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: jest.fn(() => ({})),
          id: 'mock-doc-id'
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
        onSnapshot: jest.fn(() => jest.fn())
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: [],
          empty: true,
          forEach: jest.fn()
        })),
        onSnapshot: jest.fn(() => jest.fn())
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: [],
          empty: true,
          forEach: jest.fn()
        })),
        onSnapshot: jest.fn(() => jest.fn())
      })),
      add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: [],
          empty: true,
          forEach: jest.fn()
        }))
      }))
    }))
  },
  auth: {
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: { uid: 'mock-user-id', email: 'test@example.com' }
    })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: { uid: 'mock-user-id', email: 'test@example.com' }
    })),
    signOut: jest.fn(() => Promise.resolve())
  },
  storage: {
    ref: jest.fn(() => ({
      child: jest.fn(() => ({
        put: jest.fn(() => Promise.resolve({
          ref: {
            getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/file.jpg'))
          }
        })),
        getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/file.jpg')),
        delete: jest.fn(() => Promise.resolve())
      })),
      put: jest.fn(() => Promise.resolve({
        ref: {
          getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/file.jpg'))
        }
      })),
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/file.jpg')),
      delete: jest.fn(() => Promise.resolve())
    }))
  }
}));

// Mock the Blob API if not available
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
      this.type = options?.type || '';
    }
  };
}

// Mock the File API if not available
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(bits, name, options = {}) {
      super(bits, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// Silence console errors and warnings during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-v4'),
  v5: jest.fn(() => 'test-uuid-v5'),
}));

// Load all mocks
require('./__tests__/mocks/expo-mocks');
require('./__tests__/mocks/navigation-mocks');
require('./__tests__/mocks/firebase-mocks');

// Mock timers
jest.useFakeTimers();

// Mock console.error and console.warn to keep test output clean
global.console = {
  ...console,
  // Keep native behaviour for other methods, use those to test your implementation
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

// Mock React Native's Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Use a simpler mock for React Native's Animated
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  
  return {
    ...reactNative,
    Animated: {
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
      View: 'Animated.View',
      Text: 'Animated.Text',
      Image: 'Animated.Image',
      createAnimatedComponent: jest.fn(component => component),
      timing: jest.fn(() => ({
        start: jest.fn(cb => cb && cb()),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(cb => cb && cb()),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
      })),
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Setup for any global test utilities or extensions
// For example, extending Jest with custom matchers

// Mock the React Native modules that are not available in the test environment
import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock the expo-av module
jest.mock('expo-av');

// Mock the expo-file-system module
jest.mock('expo-file-system');

// Mock the react-native-reanimated module
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock the useTheme hook
jest.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      cardBackground: '#F8F8F8',
      border: '#EEEEEE'
    },
    isDark: false
  })
}));

// Mock the react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 })
  };
});

// Mock the expo-constants module
jest.mock('expo-constants', () => ({
  default: {
    manifest: {
      extra: {
        firebaseApiKey: 'mock-api-key',
        firebaseAuthDomain: 'mock-auth-domain',
        firebaseProjectId: 'mock-project-id',
        firebaseStorageBucket: 'mock-storage-bucket',
        firebaseMessagingSenderId: 'mock-messaging-sender-id',
        firebaseAppId: 'mock-app-id',
        firebaseMeasurementId: 'mock-measurement-id'
      }
    }
  }
}));

// Mock the expo-font module
jest.mock('expo-font', () => ({
  useFonts: () => [true, null]
}));

// Mock the expo-asset module
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn().mockResolvedValue([])
  }
}));

// Mock the expo-status-bar module
jest.mock('expo-status-bar', () => ({
  StatusBar: () => 'StatusBar'
}));

// Mock the react-native-svg module
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockSvg = () => React.createElement('Svg');
  mockSvg.Circle = () => React.createElement('Circle');
  mockSvg.Rect = () => React.createElement('Rect');
  mockSvg.Path = () => React.createElement('Path');
  mockSvg.Line = () => React.createElement('Line');
  mockSvg.G = () => React.createElement('G');
  return mockSvg;
});

// Mock the @react-native-community/slider module
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  return () => React.createElement('Slider');
});

// Mock the react-native-vector-icons module
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const mockIcon = () => React.createElement('Icon');
  return {
    Ionicons: mockIcon,
    MaterialIcons: mockIcon,
    FontAwesome: mockIcon,
    FontAwesome5: mockIcon,
    MaterialCommunityIcons: mockIcon,
    AntDesign: mockIcon,
    Entypo: mockIcon,
    Feather: mockIcon,
    EvilIcons: mockIcon,
    Octicons: mockIcon
  };
});

// Mock NativeAnimatedHelper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  API: {
    createAnimatedNode: jest.fn(),
    startListeningToAnimatedNodeValue: jest.fn(),
    stopListeningToAnimatedNodeValue: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    startAnimatingNode: jest.fn(),
    stopAnimation: jest.fn(),
    setAnimatedNodeValue: jest.fn(),
    connectAnimatedNodeToView: jest.fn(),
    disconnectAnimatedNodeFromView: jest.fn(),
    dropAnimatedNode: jest.fn(),
    addAnimatedEventToView: jest.fn(),
    removeAnimatedEventFromView: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Mock the Expo Audio module
jest.mock('expo-av', () => {
  const mockSound = {
    loadAsync: jest.fn(() => Promise.resolve()),
    setOnPlaybackStatusUpdate: jest.fn(),
    getStatusAsync: jest.fn(() => Promise.resolve({ isLoaded: true, durationMillis: 10000 })),
    setPositionAsync: jest.fn(() => Promise.resolve()),
    setVolumeAsync: jest.fn(() => Promise.resolve()),
    playAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    unloadAsync: jest.fn(() => Promise.resolve()),
    setRateAsync: jest.fn(() => Promise.resolve()),
    setIsLoopingAsync: jest.fn(() => Promise.resolve()),
    setProgressUpdateIntervalAsync: jest.fn(() => Promise.resolve()),
  };

  const mockRecording = {
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    startAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    stopAndUnloadAsync: jest.fn(() => Promise.resolve({ 
      uri: 'file://mock-recording.m4a', 
      status: { canRecord: false, isDoneRecording: true }
    })),
    setOnRecordingStatusUpdate: jest.fn(),
    getStatusAsync: jest.fn(() => Promise.resolve({ 
      canRecord: true, 
      isRecording: false,
      durationMillis: 5000
    })),
    setProgressUpdateIntervalAsync: jest.fn(() => Promise.resolve()),
    createNewLoadedSoundAsync: jest.fn(() => Promise.resolve(mockSound)),
  };

  return {
    Audio: {
      Sound: jest.fn(() => mockSound),
      Recording: jest.fn(() => mockRecording),
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
      RECORDING_OPTIONS_PRESET_HIGH_QUALITY: {
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
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
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      },
      RECORDING_OPTIONS_PRESET_LOW_QUALITY: {
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'aac',
          audioQuality: 'medium',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 64000,
        },
      },
    },
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock-documents/',
  cacheDirectory: 'file://mock-cache/',
  downloadDirectory: 'file://mock-downloads/',
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, uri: 'file://mock-file.txt', size: 100 })),
  readAsStringAsync: jest.fn(() => Promise.resolve('mock file content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve(['file1.txt', 'file2.txt'])),
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve({ uri: 'file://downloaded-file.txt' })),
    pauseAsync: jest.fn(() => Promise.resolve()),
    resumeAsync: jest.fn(() => Promise.resolve()),
    savable: jest.fn(() => ({ url: 'http://example.com/file.txt', fileUri: 'file://downloaded-file.txt' })),
  })),
}));
