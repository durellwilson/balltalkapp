// Mock for @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const mockIcon = () => 'Icon';
  mockIcon.propTypes = {};
  
  return {
    Ionicons: mockIcon,
    MaterialIcons: mockIcon,
    FontAwesome: mockIcon,
    FontAwesome5: mockIcon,
    MaterialCommunityIcons: mockIcon,
    Entypo: mockIcon,
    Feather: mockIcon,
    AntDesign: mockIcon,
    // Add any other icon sets your app uses
  };
});

// Mock for expo-av
jest.mock('expo-av', () => {
  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockResolvedValue({
          sound: {
            playAsync: jest.fn(),
            pauseAsync: jest.fn(),
            stopAsync: jest.fn(),
            unloadAsync: jest.fn(),
            getStatusAsync: jest.fn().mockResolvedValue({
              isLoaded: true,
              isPlaying: false,
              positionMillis: 0,
              durationMillis: 30000,
            }),
            setOnPlaybackStatusUpdate: jest.fn(),
          },
          status: {
            isLoaded: true,
            durationMillis: 30000,
          }
        }),
      },
      Recording: {
        createAsync: jest.fn().mockResolvedValue({
          recording: {
            prepareToRecordAsync: jest.fn(),
            startAsync: jest.fn(),
            pauseAsync: jest.fn(),
            stopAndUnloadAsync: jest.fn(),
            getStatusAsync: jest.fn().mockResolvedValue({
              canRecord: true,
              isRecording: false,
              isDoneRecording: true,
              durationMillis: 15000,
            }),
          },
        }),
      },
    },
  };
});

// Mock for expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///document-directory/',
  cacheDirectory: 'file:///cache-directory/',
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1000 }),
  downloadAsync: jest.fn().mockResolvedValue({ uri: 'downloaded-file-uri' }),
  uploadAsync: jest.fn().mockResolvedValue({ status: 200 }),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn().mockResolvedValue(['file1', 'file2']),
  readAsStringAsync: jest.fn().mockResolvedValue('file-content'),
  writeAsStringAsync: jest.fn(),
  createDownloadResumable: jest.fn().mockReturnValue({
    downloadAsync: jest.fn().mockResolvedValue({ uri: 'downloaded-file-uri' }),
    pauseAsync: jest.fn(),
    resumeAsync: jest.fn(),
    savable: jest.fn(),
  }),
}));

// Mock for expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{ uri: 'file://picked-image.jpg', type: 'image', width: 100, height: 100 }],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{ uri: 'file://camera-image.jpg', type: 'image', width: 100, height: 100 }],
  }),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
}));

// Mock for expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn(),
      width: 100,
      height: 100,
      uri: 'asset-uri',
    }),
  },
}));

// Mock for expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(true),
  isLoaded: jest.fn().mockReturnValue(true),
  useFonts: jest.fn().mockReturnValue([true, null]),
}));

// Add more mocks for any other Expo modules your app uses 