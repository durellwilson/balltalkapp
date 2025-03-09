import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AudioEffectsPanel from './AudioEffectsPanel.mock';

describe('AudioEffectsPanel', () => {
  const mockOnProcessed = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with audio URI', () => {
    const { getByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    expect(getByText('Audio Effects')).toBeTruthy();
    expect(getByText('Play Original')).toBeTruthy();
    expect(getByText('Preview Effects')).toBeTruthy();
    expect(getByText('Apply Effects')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });
  
  it('calls onProcessed when Apply Effects button is pressed with valid audio URI', () => {
    const { getByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    fireEvent.press(getByText('Apply Effects'));
    
    expect(mockOnProcessed).toHaveBeenCalledWith('processed-uri');
    expect(mockOnError).not.toHaveBeenCalled();
  });
  
  it('calls onError when Apply Effects button is pressed without audio URI', () => {
    const { getByText } = render(
      <AudioEffectsPanel
        audioUri={null}
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    fireEvent.press(getByText('Apply Effects'));
    
    expect(mockOnError).toHaveBeenCalledWith('No audio to process');
    expect(mockOnProcessed).not.toHaveBeenCalled();
  });
}); 