import React from 'react';
import { Song } from '../../models/Song';
import MusicPlayer from './MusicPlayer';

interface MusicPlayerAdapterProps {
  song: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  isVisible?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Adapter component that converts our Song model to the format expected by MusicPlayer
 */
const MusicPlayerAdapter: React.FC<MusicPlayerAdapterProps> = ({
  song,
  isPlaying,
  onPlayPause,
  onClose,
  isVisible = true,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  // Extract the artist name from producedBy or use a default
  const artistName = song.producedBy || 'Unknown Artist';
  
  // Convert our Song model to the format expected by MusicPlayer
  const adaptedSong = {
    id: song.id,
    title: song.title,
    artist: artistName,
    coverArtUrl: song.coverArtUrl,
    fileUrl: song.fileUrl,
    duration: song.duration
  };
  
  return (
    <MusicPlayer
      song={adaptedSong}
      isVisible={isVisible}
      onClose={onClose}
      onNext={onNext}
      onPrevious={onPrevious}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
    />
  );
};

export default MusicPlayerAdapter;
