import React from 'react';
import { Song } from '../../models/Song';
import SongCard from '../SongCard';

interface SongCardAdapterProps {
  song: Song;
  onPlay: () => void;
  onDelete: () => void;
  isPlaying?: boolean;
}

/**
 * Adapter component that converts our Song model to the format expected by SongCard
 */
const SongCardAdapter: React.FC<SongCardAdapterProps> = ({ song, onPlay, onDelete, isPlaying }) => {
  // Extract the artist name from producedBy or use a default
  const artistName = song.producedBy || 'Unknown Artist';
  
  return (
    <SongCard
      title={song.title}
      artist={artistName}
      coverUrl={song.coverArtUrl}
      duration={song.duration}
      onPlay={onPlay}
      isPlaying={isPlaying}
    />
  );
};

export default SongCardAdapter;
