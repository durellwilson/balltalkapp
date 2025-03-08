import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SimpleEqualizer from '../../components/audio/SimpleEqualizer';

// Mock the Slider component since it's a native module
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return jest.fn().mockImplementation(props => {
    return (
      <View testID="mock-slider" {...props} />
    );
  });
});

describe('SimpleEqualizer', () => {
  it('renders correctly with all frequency bands', () => {
    const { getByText, getAllByTestId } = render(<SimpleEqualizer />);
    
    // Check title and subtitle
    expect(getByText('Simple Equalizer')).toBeTruthy();
    expect(getByText('Adjust frequency bands to shape your sound')).toBeTruthy();
    
    // Check all frequency bands are rendered
    expect(getByText('60 Hz')).toBeTruthy();
    expect(getByText('230 Hz')).toBeTruthy();
    expect(getByText('910 Hz')).toBeTruthy();
    expect(getByText('3600 Hz')).toBeTruthy();
    expect(getByText('14000 Hz')).toBeTruthy();
    
    // Check we have 5 sliders
    const sliders = getAllByTestId('mock-slider');
    expect(sliders.length).toBe(5);
  });
  
  it('renders all gain values initially at 0 dB', () => {
    const { getAllByText } = render(<SimpleEqualizer />);
    
    // Get all gain values
    const gainValues = getAllByText('0.0 dB');
    expect(gainValues.length).toBe(5);
  });
  
  it('shows platform information', () => {
    const { getByText } = render(<SimpleEqualizer />);
    
    // Platform text should contain the current platform
    const platformText = getByText(/Platform:/);
    expect(platformText).toBeTruthy();
  });
  
  it('contains note about the demonstration purpose', () => {
    const { getByText } = render(<SimpleEqualizer />);
    
    const infoText = getByText(/This is a UI demonstration/);
    expect(infoText).toBeTruthy();
  });
}); 