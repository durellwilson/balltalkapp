import React from 'react';
import { render } from '@testing-library/react-native';
import TestScreen from '../../app/TestScreen';

// Mock the components used in TestScreen
jest.mock('../../components/FirebaseVerification', () => {
  const { View, Text } = require('react-native');
  return function MockFirebaseVerification() {
    return (
      <View testID="mock-firebase-verification">
        <Text>Mock Firebase Verification</Text>
      </View>
    );
  };
});

jest.mock('../../components/audio/recorder/BasicRecorder', () => {
  const { View, Text } = require('react-native');
  return function MockBasicRecorder() {
    return (
      <View testID="mock-basic-recorder">
        <Text>Mock Basic Recorder</Text>
      </View>
    );
  };
});

jest.mock('../../components/audio/SimpleEqualizer', () => {
  const { View, Text } = require('react-native');
  return function MockSimpleEqualizer() {
    return (
      <View testID="mock-simple-equalizer">
        <Text>Mock Simple Equalizer</Text>
      </View>
    );
  };
});

describe('TestScreen', () => {
  it('renders header and all sections correctly', () => {
    const { getByText, getAllByTestId } = render(<TestScreen />);
    
    // Check header
    expect(getByText('BallTalk Testing')).toBeTruthy();
    expect(getByText(/Platform:/)).toBeTruthy();
    
    // Check section titles
    expect(getByText('Firebase Connectivity')).toBeTruthy();
    expect(getByText('Audio Recording')).toBeTruthy();
    expect(getByText('Audio Processing')).toBeTruthy();
    
    // Check that all components are rendered
    expect(getAllByTestId('mock-firebase-verification').length).toBe(1);
    expect(getAllByTestId('mock-basic-recorder').length).toBe(1);
    expect(getAllByTestId('mock-simple-equalizer').length).toBe(1);
  });
  
  it('renders footer correctly', () => {
    const { getByText } = render(<TestScreen />);
    
    expect(getByText('BallTalk App - Development Version')).toBeTruthy();
  });
}); 