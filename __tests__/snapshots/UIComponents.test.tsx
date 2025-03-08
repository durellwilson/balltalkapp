import React from 'react';
import renderer from 'react-test-renderer';
import SimpleEqualizer from '../../components/audio/SimpleEqualizer';
import LoginScreen from '../../screens/auth/LoginScreen';
import TestScreen from '../../screens/TestScreen';

// Mock components for TestScreen
jest.mock('../../components/FirebaseVerification', () => 'MockFirebaseVerification');
jest.mock('../../components/audio/recorder/BasicRecorder', () => 'MockBasicRecorder');
jest.mock('../../components/audio/SimpleEqualizer', () => 'MockSimpleEqualizer');

// Mock the Slider for SimpleEqualizer
jest.mock('@react-native-community/slider', () => 'MockSlider');

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn()
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: {},
  firebaseDb: {}
}));

describe('UI Component Snapshots', () => {
  it('SimpleEqualizer matches snapshot', () => {
    // Reset the mock to use the real component for this test
    jest.unmock('../../components/audio/SimpleEqualizer');
    
    const tree = renderer.create(<SimpleEqualizer />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('LoginScreen matches snapshot', () => {
    const tree = renderer.create(<LoginScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('TestScreen matches snapshot', () => {
    const tree = renderer.create(<TestScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
}); 