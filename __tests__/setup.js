// Polyfill for setImmediate and clearImmediate
global.setImmediate = (callback) => setTimeout(callback, 0);
global.clearImmediate = (id) => clearTimeout(id);

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios', // or 'android', depending on your testing needs
  select: jest.fn(obj => obj.ios) // or obj.android
}));

// Mock the AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve())
}));

// Mock React Native components
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');

  // Add any RN component mocks here
  return {
    ...ReactNative,
    // Mock specific components that might be causing issues
    Animated: {
      ...ReactNative.Animated,
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => ({})),
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
      })),
    },
    InteractionManager: {
      runAfterInteractions: jest.fn(callback => {
        if (callback) callback();
      }),
      createInteractionHandle: jest.fn(() => 1),
      clearInteractionHandle: jest.fn(),
    },
    NativeModules: {
      ...ReactNative.NativeModules,
      UIManager: {
        ...ReactNative.NativeModules.UIManager,
        measure: jest.fn(),
        RCTView: {
          // These are view commands needed by RNTL
          Commands: { 
            hotspotUpdate: jest.fn(),
            setPressed: jest.fn() 
          }
        }
      }
    }
  };
});

// Mock the Expo modules
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({ 
        recording: {
          stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
          getURI: jest.fn(() => 'file://test/recording.m4a')
        } 
      }))
    },
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ 
        sound: {
          unloadAsync: jest.fn(() => Promise.resolve()),
          playAsync: jest.fn(() => Promise.resolve()),
          setOnPlaybackStatusUpdate: jest.fn()
        } 
      }))
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {
        android: {},
        ios: {},
        web: {}
      }
    },
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 'interruption_mode_ios',
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 'interruption_mode_android'
  }
}));

// Mock the Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({}))
}));

// Mock firebase/auth with explicit mock functions
jest.mock('firebase/auth', () => {
  const signInMock = jest.fn();
  signInMock.mockResolvedValue({ user: { uid: 'test-uid' } });
  
  return {
    getAuth: jest.fn(() => ({})),
    signInWithEmailAndPassword: signInMock,
    connectAuthEmulator: jest.fn()
  };
});

// Mock firebase/firestore with explicit mock functions
jest.mock('firebase/firestore', () => {
  const queryMock = jest.fn();
  queryMock.mockReturnValue('mock-query');
  
  const getDocsMock = jest.fn();
  getDocsMock.mockResolvedValue({ docs: [] });
  
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(() => ({})),
    getDocs: getDocsMock,
    query: queryMock,
    limit: jest.fn(() => ({})),
    connectFirestoreEmulator: jest.fn()
  };
});

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  connectStorageEmulator: jest.fn()
}));

// Mock the native modules
jest.mock('@react-native-community/slider', () => 'Slider');

// Mock React Native specific implementations
global.window = global;
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();

// Fix for React Native Testing Library
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const { TouchableHighlight } = jest.requireActual('react-native');
  const MockTouchable = (props) => {
    return <TouchableHighlight {...props} />;
  };
  MockTouchable.displayName = 'TouchableOpacity';
  return MockTouchable;
});

jest.mock('react-native/Libraries/Components/Touchable/TouchableHighlight', () => {
  const { View } = jest.requireActual('react-native');
  const MockTouchable = (props) => {
    return <View {...props} />;
  };
  MockTouchable.displayName = 'TouchableHighlight';
  return MockTouchable;
});

// Mock the console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add a global setup for testing libraries
require('@testing-library/jest-native/extend-expect'); 