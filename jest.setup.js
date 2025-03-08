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
jest.mock('./src/lib/firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  storage: {}
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
