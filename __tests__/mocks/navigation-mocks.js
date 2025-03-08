// Mock for useNavigation
const mockedNavigate = jest.fn();
const mockedGoBack = jest.fn();
const mockedReset = jest.fn();
const mockedIsFocused = jest.fn().mockReturnValue(true);
const mockedAddListener = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockedNavigate,
      goBack: mockedGoBack,
      reset: mockedReset,
      isFocused: mockedIsFocused,
      addListener: mockedAddListener,
    }),
    useRoute: () => ({
      params: {
        // Add your default route params here
      },
    }),
    useIsFocused: () => true,
  };
});

// Mock for React Navigation Stack
jest.mock('@react-navigation/stack', () => {
  return {
    createStackNavigator: jest.fn().mockReturnValue({
      Navigator: 'MockNavigator',
      Screen: 'MockScreen',
    }),
  };
});

// Mock for React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  return {
    createBottomTabNavigator: jest.fn().mockReturnValue({
      Navigator: 'MockTabNavigator',
      Screen: 'MockTabScreen',
    }),
  };
});

// Export the mocked functions so they can be cleared and used in tests
export {
  mockedNavigate,
  mockedGoBack,
  mockedReset,
  mockedIsFocused,
  mockedAddListener,
}; 