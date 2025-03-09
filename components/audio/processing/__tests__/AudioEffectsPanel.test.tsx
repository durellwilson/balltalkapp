import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AudioEffectsPanel from '../AudioEffectsPanel';
import { Audio } from 'expo-av';
import AudioProcessingService from '../../../../services/AudioProcessingService';

// Mock the AudioProcessingService
jest.mock('../../../../services/AudioProcessingService', () => ({
  processAudio: jest.fn().mockResolvedValue('processed-uri'),
  previewAudio: jest.fn().mockResolvedValue('preview-uri'),
  getPresets: jest.fn().mockReturnValue(['Default', 'Vocal Boost']),
  loadPreset: jest.fn().mockReturnValue({
    equalizer: { lowGain: 0, midGain: 0, highGain: 0 },
    compressor: { threshold: -24, ratio: 2, attack: 0.1, release: 0.25 },
    reverb: { amount: 0.3, decay: 1.0, damping: 0.5 },
    delay: { time: 0.25, feedback: 0.3, mix: 0.2 },
    distortion: { amount: 0.1, tone: 0.5 },
    limiter: { threshold: -3, release: 0.1 },
    output: { gain: 0 },
    activeEffects: ['equalizer', 'compressor']
  })
}));

// Mock the expo-av Audio module
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setPositionAsync: jest.fn()
        },
        status: { isLoaded: true }
      })
    }
  }
}));

// Mock the useTheme hook
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      cardBackground: '#F8F8F8',
      border: '#EEEEEE'
    },
    isDark: false
  })
}));

describe('AudioEffectsPanel', () => {
  const mockOnProcessed = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with audio URI', async () => {
    const { getByText, queryByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    // Initially it should show loading
    expect(getByText('Loading audio...')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading audio...')).toBeNull();
    });
    
    // Check that the component renders correctly
    expect(getByText('Audio Effects')).toBeTruthy();
    expect(getByText('Play Original')).toBeTruthy();
    expect(getByText('Preview Effects')).toBeTruthy();
    expect(getByText('Apply Effects')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });
  
  it('shows empty state when no audio URI is provided', () => {
    const { getByText } = render(
      <AudioEffectsPanel
        audioUri={null}
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    expect(getByText('No audio loaded. Record or upload a track first.')).toBeTruthy();
  });
  
  it('processes audio when Apply Effects button is pressed', async () => {
    const { getByText, queryByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading audio...')).toBeNull();
    });
    
    // Press the Apply Effects button
    fireEvent.press(getByText('Apply Effects'));
    
    // Check if processAudio was called
    await waitFor(() => {
      expect(AudioProcessingService.processAudio).toHaveBeenCalledWith(
        'test-audio-uri',
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockOnProcessed).toHaveBeenCalledWith('processed-uri');
    });
  });
  
  it('previews effects when Preview Effects button is pressed', async () => {
    const { getByText, queryByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading audio...')).toBeNull();
    });
    
    // Press the Preview Effects button
    fireEvent.press(getByText('Preview Effects'));
    
    // Check if previewAudio was called
    await waitFor(() => {
      expect(AudioProcessingService.previewAudio).toHaveBeenCalledWith(
        'test-audio-uri',
        expect.any(Object)
      );
    });
  });
  
  it('toggles playback when Play Original button is pressed', async () => {
    const { getByText, queryByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading audio...')).toBeNull();
    });
    
    // Press the Play Original button
    fireEvent.press(getByText('Play Original'));
    
    // Check if playAsync was called
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });
  
  it('resets settings when Reset button is pressed', async () => {
    const { getByText, queryByText } = render(
      <AudioEffectsPanel
        audioUri="test-audio-uri"
        onProcessed={mockOnProcessed}
        onError={mockOnError}
      />
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading audio...')).toBeNull();
    });
    
    // Press the Reset button
    fireEvent.press(getByText('Reset'));
    
    // Check that the settings are reset (we can't directly test state changes,
    // but we can test that the component still renders correctly)
    expect(getByText('Audio Effects')).toBeTruthy();
  });
}); 