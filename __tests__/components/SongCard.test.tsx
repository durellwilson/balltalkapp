import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SongCard from '../../components/SongCard';

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock the errorDebugger utility
jest.mock('../../utils/errorDebugger', () => ({
  safePrint: (value: any, fallback: string) => value || fallback
}));

describe('SongCard', () => {
  it('renders correctly with required props', () => {
    const { getByText, getByTestId } = render(
      <SongCard
        title="Test Song"
        artist="Test Artist"
        onPlay={() => {}}
      />
    );

    expect(getByTestId('song-card')).toBeTruthy();
    expect(getByText('Test Song')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
  });

  it('renders with fallback values when title or artist are missing', () => {
    const { getByText } = render(
      <SongCard
        title=""
        artist={null as any}
        onPlay={() => {}}
      />
    );

    expect(getByText('Untitled')).toBeTruthy();
    expect(getByText('Unknown Artist')).toBeTruthy();
  });

  it('displays duration when provided', () => {
    const { getByText } = render(
      <SongCard
        title="Test Song"
        artist="Test Artist"
        duration={185} // 3:05
        onPlay={() => {}}
      />
    );

    expect(getByText('3:05')).toBeTruthy();
  });

  it('calls onPlay when play button is pressed', () => {
    const onPlay = jest.fn();
    const { getByTestId } = render(
      <SongCard
        title="Test Song"
        artist="Test Artist"
        onPlay={onPlay}
      />
    );

    fireEvent.press(getByTestId('play-button'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('shows pause icon when isPlaying is true', () => {
    const { UNSAFE_getByProps } = render(
      <SongCard
        title="Test Song"
        artist="Test Artist"
        onPlay={() => {}}
        isPlaying={true}
      />
    );

    // Since we're mocking Ionicons we can check the name prop
    expect(UNSAFE_getByProps({ name: 'pause' })).toBeTruthy();
  });

  it('shows play icon when isPlaying is false', () => {
    const { UNSAFE_getByProps } = render(
      <SongCard
        title="Test Song"
        artist="Test Artist"
        onPlay={() => {}}
        isPlaying={false}
      />
    );

    // Since we're mocking Ionicons we can check the name prop
    expect(UNSAFE_getByProps({ name: 'play' })).toBeTruthy();
  });
});
