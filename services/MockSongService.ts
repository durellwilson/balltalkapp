import { Song } from '../models/Song';

// Mock data for testing
const mockSongs: Song[] = [
  {
    id: 'song1',
    title: 'Champion Mindset',
    artistId: 'user1',
    description: 'A track about the mindset of a champion athlete',
    genre: 'Hip Hop',
    releaseDate: '2025-02-15T12:00:00Z',
    fileUrl: 'https://example.com/songs/champion-mindset.mp3',
    duration: 180, // 3 minutes
    visibility: 'public',
    createdAt: '2025-02-15T12:00:00Z',
    updatedAt: '2025-02-15T12:00:00Z',
    coverArtUrl: 'https://example.com/covers/champion-mindset.jpg',
    playCount: 1250,
    producedBy: 'LeBron James',
    mood: ['motivational', 'energetic']
  },
  {
    id: 'song2',
    title: 'Court Vision',
    artistId: 'user1',
    description: 'Seeing the game from a different perspective',
    genre: 'R&B',
    releaseDate: '2025-01-20T12:00:00Z',
    fileUrl: 'https://example.com/songs/court-vision.mp3',
    duration: 210, // 3:30 minutes
    visibility: 'public',
    createdAt: '2025-01-20T12:00:00Z',
    updatedAt: '2025-01-20T12:00:00Z',
    coverArtUrl: 'https://example.com/covers/court-vision.jpg',
    playCount: 980,
    producedBy: 'Stephen Curry',
    mood: ['reflective', 'chill']
  },
  {
    id: 'song3',
    title: 'Touchdown',
    artistId: 'user1',
    description: 'Celebrating the victories in life',
    genre: 'Pop',
    releaseDate: '2025-03-05T12:00:00Z',
    fileUrl: 'https://example.com/songs/touchdown.mp3',
    duration: 195, // 3:15 minutes
    visibility: 'public',
    createdAt: '2025-03-05T12:00:00Z',
    updatedAt: '2025-03-05T12:00:00Z',
    coverArtUrl: 'https://example.com/covers/touchdown.jpg',
    playCount: 750,
    producedBy: 'Tom Brady',
    mood: ['celebratory', 'upbeat']
  }
];

class MockSongService {
  // Get songs by user ID
  async getUserSongs(userId: string): Promise<Song[]> {
    console.log(`Getting songs for user: ${userId}`);
    // In a real app, we would filter by userId
    // For the mock, we'll just return all songs
    return mockSongs;
  }

  // Get a song by ID
  async getSong(songId: string): Promise<Song | null> {
    console.log(`Getting song with ID: ${songId}`);
    const song = mockSongs.find(s => s.id === songId);
    return song || null;
  }

  // Delete a song
  async deleteSong(songId: string): Promise<boolean> {
    console.log(`Deleting song with ID: ${songId}`);
    // In a real app, we would delete from the database
    // For the mock, we'll just return success
    return true;
  }

  // Record a play for a song
  async recordPlay(songId: string): Promise<boolean> {
    console.log(`Recording play for song with ID: ${songId}`);
    // In a real app, we would update the play count
    // For the mock, we'll just return success
    return true;
  }

  // Add a new song
  async addSong(song: Song): Promise<Song> {
    console.log(`Adding song: ${song.title}`);
    const newSong = {
      ...song,
      id: `song-${Date.now()}`, // Generate a unique ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      playCount: 0, // Initialize play count
    };
    mockSongs.push(newSong);
    return newSong;
  }
}

export default new MockSongService();
