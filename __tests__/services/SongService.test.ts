import { Song } from '../../models/Song';
import SongService from '../../services/SongService';
import { db, storage } from '../../src/lib/firebase';
import { ref, deleteObject, listAll } from '@react-native-firebase/storage';
import {
  doc, getDocs, getDoc, collection, deleteDoc,
} from '@react-native-firebase/firestore';

// Helper function to upload a test song
const uploadTestSong = async (
  artistId: string,
  title: string,
  genre: string,
  audioFile: Blob
): Promise<Song | null> => {
  return await SongService.uploadSong(artistId, title, genre, audioFile);
};

// Start the tests

describe('SongService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Delete all documents in the 'songs' collection
    const songsCollection = collection(db, 'songs');
    const songsSnapshot = await getDocs(songsCollection);
    await Promise.all(
      songsSnapshot.docs.map((doc) => deleteDoc(doc.ref)),
    );

    // Delete all documents in the 'playlists' collection
    const playlistsCollection = collection(db, 'playlists');
    const playlistsSnapshot = await getDocs(playlistsCollection);
    await Promise.all(
      playlistsSnapshot.docs.map((doc) => deleteDoc(doc.ref)),
    );
    // Delete all audio files from Firebase Storage
    const storageRef = ref(storage);
    const listResult = await listAll(storageRef)
    await Promise.all(listResult.items.map((item) => deleteObject(item)));
  });

  describe('uploadSong', () => {

    it('should upload a song successfully', async () => {
      // Create test data
      const artistId = 'test-artist-id';
      const title = 'Test Song';
      const genre = 'Pop';
      const audioFile = new Blob(['test audio data'], { type: 'audio/mp3' });

      // Upload the song using the helper function
      const uploadedSong = await uploadTestSong(
        artistId, title, genre, audioFile,
      );
      expect(uploadedSong).toBeDefined();

      // Get the song document from Firestore
      const songDocRef = doc(db, 'songs', uploadedSong!.id);
      const songDoc = await getDoc(songDocRef);
      expect(songDoc.exists()).toBeTruthy();

    });
    it('should handle errors during upload', async () => {
      // Create test data
      const artistId = 'test-artist-id';
      const title = 'Test Song';
      const genre = 'Pop';
      const audioFile = new Blob(['test audio data'], { type: 'audio/mp3' });

      // Call the method and expect it to return null on error
      const result = await SongService.uploadSong(
        artistId, title, genre, audioFile,
      );

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe('getSongsByArtist', () => {    
    it('should return songs for an artist', async () => {
      // Call the method
      const result = await SongService.getSongsByArtist('artist1');

      // Assertions
      expect(result).toBeDefined()
    })

    it('should handle errors when getting songs', async () => {
      // Call the method and expect it to return [] on error
      const result = await SongService.getSongsByArtist('artist1');

      expect(result).toEqual([]);
    });
  });
});
