// models/Song.ts

export interface Song {
  id: string; // Unique ID for the song
  artistId: string; // The ID of the athlete who created the song
  title: string;
  description?: string; // Description or story behind the song
  genre: string;
  subGenres?: string[]; // Additional genre tags
  mood?: string[]; // Mood tags (e.g., "energetic", "chill", "motivational")
  releaseDate: string; // ISO date string
  scheduledReleaseDate?: string; // For scheduled future releases
  
  // Audio files
  fileUrl: string; // URL to the full audio file
  previewUrl?: string; // URL to a shorter preview clip
  duration: number; // Duration in seconds
  
  // Metadata
  coverArtUrl?: string; // URL to cover art image
  lyrics?: string; // Song lyrics
  bpm?: number; // Beats per minute
  key?: string; // Musical key
  isExplicit?: boolean; // Whether the song contains explicit content
  
  // Collaboration
  collaborators?: {
    userId: string;
    role: string; // e.g., "featured artist", "producer", "writer"
    name: string;
  }[];
  
  // Stats and engagement
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  
  // Access control
  visibility: 'public' | 'subscribers' | 'private';
  exclusivityLevel?: 'free' | 'basic' | 'premium' | 'vip';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Production details
  producedBy?: string;
  recordedAt?: string;
  mixedBy?: string;
  masteredBy?: string;
  
  // Additional metadata
  tags?: string[]; // Custom tags
  isOriginal?: boolean; // Whether it's an original composition
  isCover?: boolean; // Whether it's a cover
  originalSongInfo?: {
    title: string;
    artist: string;
  };
}

// Interface for playlists
export interface Playlist {
  id: string;
  userId: string; // Creator of the playlist
  title: string;
  description?: string;
  coverImageUrl?: string;
  songs: string[]; // Array of song IDs
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  playCount?: number;
  followCount?: number;
}

// Interface for comments on songs
export interface SongComment {
  id: string;
  songId: string;
  userId: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: SongComment[];
}
