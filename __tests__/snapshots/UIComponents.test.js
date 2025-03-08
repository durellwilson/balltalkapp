import React from 'react';
import renderer from 'react-test-renderer';
import { View, Text, Button } from 'react-native';

// Simple component for snapshot testing
const SimpleComponent = () => (
  <View>
    <Text>BallTalk Testing</Text>
    <Button title="Record" onPress={() => {}} />
  </View>
);

// Mock Firebase verification component
const MockFirebaseVerification = () => (
  <View>
    <Text>Firebase Verification</Text>
    <Text>Status: Connected ✅</Text>
  </View>
);

// Mock Login screen
const MockLoginScreen = () => (
  <View>
    <Text>Login to BallTalk</Text>
    <View>
      <Text>Email</Text>
      <Text>Password</Text>
      <Button title="Login" onPress={() => {}} />
    </View>
  </View>
);

describe('UI Component Snapshots', () => {
  it('SimpleComponent matches snapshot', () => {
    const tree = renderer.create(<SimpleComponent />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('MockFirebaseVerification matches snapshot', () => {
    const tree = renderer.create(<MockFirebaseVerification />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('MockLoginScreen matches snapshot', () => {
    const tree = renderer.create(<MockLoginScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
}); 