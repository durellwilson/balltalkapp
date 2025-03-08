import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, Button } from 'react-native';

// Define a simple component for testing
const SimpleComponent = () => (
  <View>
    <Text>BallTalk Testing</Text>
    <Button title="Record" onPress={() => {}} />
  </View>
);

describe('Simple Component Test', () => {
  it('renders without errors', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('BallTalk Testing')).toBeTruthy();
  });

  it('has the correct button', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Record')).toBeTruthy();
  });
}); 