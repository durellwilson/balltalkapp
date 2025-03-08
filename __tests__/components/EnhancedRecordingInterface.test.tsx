import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EnhancedRecordingInterface from '../../components/studio/EnhancedRecordingInterface';
import { Audio } from 'expo-av';

// Mock the Audio.requestPermissionsAsync function
jest.mock('expo-av', () => {
  const originalModule = jest.requireActual('../../__mocks__/expo-av');
  return {
    ...originalModule,
    Audio: {
      ...originalModule.Audio,
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true }))
    }
  };
});

describe('EnhancedRecordingInterface', () => {
  const mockOnRecordingComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <EnhancedRecordingInterface
        onRecordingComplete={mockOnRecordingComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Record Audio')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('handles cancel button press', () => {
    const { getByText } = render(
      <EnhancedRecordingInterface
        onRecordingComplete={mockOnRecordingComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('starts recording when record button is pressed', async () => {
    const { getByTestId } = render(
      <EnhancedRecordingInterface
        onRecordingComplete={mockOnRecordingComplete}
        onCancel={mockOnCancel}
      />
    );

    // Find the record button by test ID
    const recordButton = getByTestId('record-button');
    
    // Press the record button
    fireEvent.press(recordButton);
    
    // Wait for the recording to start
    await waitFor(() => {
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });
  });
}); 