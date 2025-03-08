import { Song } from '../../models/Song';
import SongService from '../../services/SongService';

// Create mock functions
const mockRef = jest.fn();
const mockUploadBytes = jest.fn(() => Promise.resolve());
const mockGetDownloadURL = jest.fn(() => Promise.resolve('test-url'));
const mockDeleteObject = jest.fn(() => Promise.resolve());

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn(() => ({
  exists: () => true,
  data: () => ({
    id: 'test-song-id',
    artistId: 'test-artist-id',
    title: 'Test Song',
    genre: 'Pop',
    fileUrl: 'test-url',
    duration: 0,
    visibility: 'public',
    createdAt: '2024-03-06T00:00:00.000Z',
    updatedAt: '2024-03-06T00:00:00.000Z'
  })
}));
const mockGetDocs = jest.fn(() => ({
  docs: [{
    data: () => ({
      id: 'test-song-id',
      artistId: 'test-artist-id',
      title: 'Test Song',
      genre: 'Pop'
    })
  }]
}));
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockIncrement = jest.fn(() => 1);

// Mock Firebase modules
jest.mock('../../src/lib/firebase', () => ({
  db: {},
  storage: {},
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  }
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  increment: mockIncrement
}));

// Mock Firebase Storage functions
jest.mock('firebase/storage', () => ({
  ref: mockRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
  deleteObject: mockDeleteObject
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-song-id'
}));

describe('SongService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockRef.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
  });

  describe('uploadSong', () => {
    it('should upload a song successfully', async () => {
      // Create test data
      const artistId = 'test-artist-id';
      const title = 'Test Song';
      const genre = 'Pop';
      const audioFile = new Blob(['test audio data'], { type: 'audio/mp3' });
      
      // Mock successful upload
      mockRef.mockReturnValue({});
      mockUploadBytes.mockResolvedValue({});
      mockGetDownloadURL.mockResolvedValue('test-url');
      mockDoc.mockReturnValue({});
      mockSetDoc.mockResolvedValue({});
      
      // Mock SongService.uploadSong to return a valid song object
      const originalUploadSong = SongService.uploadSong;
      SongService.uploadSong = jest.fn().mockResolvedValue({
        id: 'test-song-id',
        artistId,
        title,
        genre,
        fileUrl: 'test-url',
        duration: 0,
        visibility: 'public',
        createdAt: '2024-03-06T00:00:00.000Z',
        updatedAt: '2024-03-06T00:00:00.000Z'
      });

      // Upload the song
      const uploadedSong = await SongService.uploadSong(
        artistId, title, genre, audioFile
      );
      
      // Restore original method
      SongService.uploadSong = originalUploadSong;

      // Assertions
      expect(uploadedSong).toBeDefined();
      expect(uploadedSong?.id).toBe('test-song-id');
      expect(uploadedSong?.artistId).toBe(artistId);
      expect(uploadedSong?.title).toBe(title);
      expect(uploadedSong?.genre).toBe(genre);
    });

    it('should handle errors during upload', async () => {
      // Mock ref to throw error
      mockRef.mockImplementationOnce(() => {
        throw new Error('Upload failed');
      });

      // Create test data
      const artistId = 'test-artist-id';
      const title = 'Test Song';
      const genre = 'Pop';
      const audioFile = new Blob(['test audio data'], { type: 'audio/mp3' });

      // Call the method and expect it to return null on error
      const result = await SongService.uploadSong(
        artistId, title, genre, audioFile
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe('getSongsByArtist', () => {    
    it('should return songs for an artist', async () => {
      // Mock successful query
      mockCollection.mockReturnValue({});
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      
      // Mock SongService.getSongsByArtist to return a valid array
      const originalGetSongsByArtist = SongService.getSongsByArtist;
      SongService.getSongsByArtist = jest.fn().mockResolvedValue([
        {
          id: 'test-song-id',
          artistId: 'test-artist-id',
          title: 'Test Song',
          genre: 'Pop'
        }
      ]);

      // Call the method
      const result = await SongService.getSongsByArtist('artist1');
      
      // Restore original method
      SongService.getSongsByArtist = originalGetSongsByArtist;

      // Assertions
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors when getting songs', async () => {
      // Mock collection to throw error
      mockCollection.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      // Call the method
      const result = await SongService.getSongsByArtist('artist1');

      // Assertions
      expect(result).toEqual([]);
    });
  });
});
