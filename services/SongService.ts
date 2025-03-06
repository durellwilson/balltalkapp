import { Song, Playlist, SongComment } from '../models/Song';
import { db, storage } from '../src/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  where,
  increment, deleteDoc
} from '@react-native-firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from '@react-native-firebase/storage';
import { v4 as uuidv4 } from 'uuid';


class SongService {
  // Upload a new song
  async uploadSong(
    artistId: string,
    title: string,
    genre: string,
    audioFile: Blob,
    coverArt?: Blob,
    songData?: Partial<Song>
  ): Promise<Song | null> {
    try {
      const songId = uuidv4();
      const now = new Date().toISOString();

      // Upload audio file to storage
      const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
      await uploadBytes(audioRef, audioFile);
      const fileUrl = await getDownloadURL(audioRef);

      // Upload cover art if provided
      let coverArtUrl = '';
      if (coverArt) {
        const coverArtRef = ref(storage, `songs/${artistId}/${songId}/cover.jpg`);
        await uploadBytes(coverArtRef, coverArt);
        coverArtUrl = await getDownloadURL(coverArtRef);
      }

      // Create song object
      const newSong: Song = {
        id: songId,
        artistId,
        title,
        genre,
        releaseDate: now,
        fileUrl,
        duration: 0, // This would be calculated from the audio file
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
        ...(coverArtUrl && { coverArtUrl }),
        ...songData
      };

      // Save song to Firestore
      await setDoc(doc(db, 'songs', songId), newSong);

      return newSong;
    } catch (error) {
      console.error('Error uploading song:', error);
      return null;
    }
  }

  // Get a song by ID
  async getSong(songId: string): Promise<Song | null> {
    try {
      const songDoc = await getDoc(doc(db, 'songs', songId));

      if (songDoc.exists()) {
        return songDoc.data() as Song;
      }

      return null;
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }

  // Get songs by artist
  async getSongsByArtist(artistId: string): Promise<Song[]> {
    try {
      const songsRef = collection(db, 'songs');
      const q = query(songsRef, where('artistId', '==', artistId), orderBy('releaseDate', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as Song);
    } catch (error) {
      console.error('Error getting songs by artist:', error);
      return [];
    }
  }

  // Get songs by genre
  async getSongsByGenre(genre: string, limitCount: number = 20): Promise<Song[]> {
    try {
      const songsRef = collection(db, 'songs');
      const q = query(
        songsRef,
        where('genre', '==', genre),
        where('visibility', '==', 'public'),
        orderBy('releaseDate', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as Song);
    } catch (error) {
      console.error('Error getting songs by genre:', error);
      return [];
    }
  }

  // Update a song
  async updateSong(songId: string, updates: Partial<Song>): Promise<boolean> {
    try {
      const songRef = doc(db, 'songs', songId);

      // Get current song to check ownership
      const songDoc = await getDoc(songRef);
      if (!songDoc.exists()) {
        return false;
      }

      // Update the song
      await updateDoc(songRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      return false;
    }
  }

  // Delete a song
  async deleteSong(songId: string, artistId: string): Promise<boolean> {
    try {
      // Get the song to check ownership and get file URLs
      const songDoc = await getDoc(doc(db, 'songs', songId));
      if (!songDoc.exists()) {
        return false;
      }

      const song = songDoc.data() as Song;

      // Verify ownership
      if (song.artistId !== artistId) {
        return false;
      }

      // Delete audio file from storage
      const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
      await deleteObject(audioRef);

      // Delete cover art if it exists
      if (song.coverArtUrl) {
        const coverArtRef = ref(storage, `songs/${artistId}/${songId}/cover.jpg`);
        await deleteObject(coverArtRef);
      }

      // Delete song document
      await deleteDoc(doc(db, 'songs', songId));

      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      return false;
    }
  }

  // Record a play for a song
  async recordPlay(songId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'songs', songId), {
        playCount: increment(1)
      });

      return true;
    } catch (error) {
      console.error('Error recording play:', error);
      return false;
    }
  }

  // Create a playlist
  async createPlaylist(
    userId: string,
    title: string,
    isPublic: boolean = true,
    description: string = '',
    coverImage?: Blob
  ): Promise<Playlist | null> {
    try {
      const playlistId = uuidv4();
      const now = new Date().toISOString();

      // Upload cover image if provided
      let coverImageUrl = '';
      if (coverImage) {
        const coverImageRef = ref(storage, `playlists/${userId}/${playlistId}/cover.jpg`);
        await uploadBytes(coverImageRef, coverImage);
        coverImageUrl = await getDownloadURL(coverImageRef);
      }

      // Create playlist object
      const newPlaylist: Playlist = {
        id: playlistId,
        userId,
        title,
        description,
        songs: [],
        isPublic,
        createdAt: now,
        updatedAt: now,
        ...(coverImageUrl && { coverImageUrl })
      };

      // Save playlist to Firestore
      await setDoc(doc(db, 'playlists', playlistId), newPlaylist);

      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }

  // Add song to playlist
  async addSongToPlaylist(playlistId: string, songId: string, userId: string): Promise<boolean> {
    try {
      // Get playlist to check ownership
      const playlistDoc = await getDoc(doc(db, 'playlists', playlistId));
      if (!playlistDoc.exists()) {
        return false;
      }

      const playlist = playlistDoc.data() as Playlist;

      // Verify ownership
      if (playlist.userId !== userId) {
        return false;
      }

      // Check if song already in playlist
      if (playlist.songs.includes(songId)) {
        return true; // Song already in playlist
      }

      // Add song to playlist
      await updateDoc(doc(db, 'playlists', playlistId), {
        songs: [...playlist.songs, songId],
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      return false;
    }
  }

  // Get user's playlists
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    try {
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as Playlist);
    } catch (error) {
      console.error('Error getting user playlists:', error);
      return [];
    }
  }

  // Add comment to song
  async addComment(songId: string, userId: string, text: string): Promise<SongComment | null> {
    try {
      const commentId = uuidv4();
      const now = new Date().toISOString();

      const comment: SongComment = {
        id: commentId,
        songId,
        userId,
        text,
        timestamp: now,
        likes: 0
      };

      // Save comment to Firestore
      await setDoc(doc(db, 'songComments', commentId), comment);

      // Increment comment count on song
       await updateDoc(doc(db, 'songs', songId), {
         commentCount: increment(1)
      });

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  // Get comments for a song
  async getSongComments(songId: string): Promise<SongComment[]> {
    try {
      const commentsRef = collection(db, 'songComments');
      const q = query(
        commentsRef,
        where('songId', '==', songId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);

      // Validate each document before returning
      const songComments = querySnapshot.docs.map((doc) => {
        const data = doc.data();
     
        // Ensure all required fields are present
        const validatedComment: SongComment = {
          id: data.id || doc.id,
          songId: data.songId || songId,
          userId: data.userId || 'unknown',
          text: data.text || '',
          timestamp: data.timestamp || new Date().toISOString(),
          likes: data.likes || 0
        };

        return validatedComment;
      });

      return songComments;
    } catch (error) {
      console.error('Error getting song comments:', error);
      return [];
    }
  }
}

export default new SongService();
