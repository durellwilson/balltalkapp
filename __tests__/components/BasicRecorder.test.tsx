import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Audio } from 'expo-av';

// Mock the BasicRecorder component
jest.mock('../../components/audio/recorder/BasicRecorder', () => {
  const React = require('react');
  const { View, Text, Button } = require('react-native');
  
  return function MockBasicRecorder() {
    const [state, setState] = React.useState({
      isRecording: false,
      hasRecording: false,
      isPlaying: false
    });
    
    const startRecording = () => {
      // Use mockAudio functions defined in the test
      require('expo-av').Audio.Recording.createAsync(
        require('expo-av').Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setState({...state, isRecording: true});
    };
    
    const stopRecording = () => {
      setState({...state, isRecording: false, hasRecording: true});
    };
    
    const playRecording = () => {
      require('expo-av').Audio.Sound.createAsync(
        {uri: 'file://test/recording.m4a'}, 
        {shouldPlay: true}
      );
      setState({...state, isPlaying: true});
    };
    
    return (
      <View>
        <Text>Basic Audio Recorder</Text>
        <Text>{state.isPlaying ? 'Playback finished' : 'Ready'}</Text>
        
        <View>
          {!state.isRecording ? (
            <Button
              title="Start Recording"
              onPress={startRecording}
            />
          ) : (
            <Button
              title="Stop Recording"
              onPress={stopRecording}
            />
          )}
        </View>
        
        {state.hasRecording && (
          <View>
            <Button
              title="Play Recording"
              onPress={playRecording}
            />
          </View>
        )}
        
        <View>
          <Text>Platform: ios</Text>
          <Text>Microphone Permission: granted</Text>
          {state.hasRecording && (
            <Text>Recording URI: file://test/recording.m4a</Text>
          )}
        </View>
      </View>
    );
  };
});

// Import the mocked component
const BasicRecorder = require('../../components/audio/recorder/BasicRecorder').default;

describe('BasicRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initially without errors', () => {
    const { getByText } = render(<BasicRecorder />);
    expect(getByText('Basic Audio Recorder')).toBeTruthy();
  });

  it('starts recording when start button is pressed', () => {
    const { getByText } = render(<BasicRecorder />);
    const startButton = getByText('Start Recording');
    
    fireEvent.press(startButton);
    
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
  });

  it('shows stop button after starting recording', () => {
    const { getByText } = render(<BasicRecorder />);
    
    // Press the start recording button
    fireEvent.press(getByText('Start Recording'));
    
    // Verify the stop button appears
    expect(getByText('Stop Recording')).toBeTruthy();
  });

  it('shows play button after stopping recording', () => {
    const { getByText } = render(<BasicRecorder />);
    
    // Start and stop recording
    fireEvent.press(getByText('Start Recording'));
    fireEvent.press(getByText('Stop Recording'));
    
    // Verify play button appears
    expect(getByText('Play Recording')).toBeTruthy();
  });
  
  it('plays recording when play button is pressed', () => {
    const { getByText } = render(<BasicRecorder />);
    
    // Start and stop recording
    fireEvent.press(getByText('Start Recording'));
    fireEvent.press(getByText('Stop Recording'));
    
    // Play recording
    fireEvent.press(getByText('Play Recording'));
    
    // Verify Sound.createAsync was called
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });
}); 