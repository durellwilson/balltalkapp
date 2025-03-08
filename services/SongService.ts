import { Song, Playlist, SongComment } from '../models/Song';
import { db, storage } from '../src/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
      const songRef = doc(db, 'songs', songId);
      await setDoc(songRef, newSong);

      return newSong;
    } catch (error) {
      console.error('Error uploading song:', error);
      return null;
    }
  }

  // Get a song by ID
  async getSong(songId: string): Promise<Song | null> {
    try {
      const songRef = doc(db, 'songs', songId);
      const songDoc = await getDoc(songRef);

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
      const q = query(
        songsRef, 
        where('artistId', '==', artistId),
        orderBy('releaseDate', 'desc')
      );
      const songsSnapshot = await getDocs(q);

      return songsSnapshot.docs.map(doc => doc.data() as Song);
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
      const songsSnapshot = await getDocs(q);

      return songsSnapshot.docs.map(doc => doc.data() as Song);
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
      const songRef = doc(db, 'songs', songId);
      const songDoc = await getDoc(songRef);
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
      await deleteDoc(songRef);

      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      return false;
    }
  }

  // Record a play for a song
  async recordPlay(songId: string): Promise<boolean> {
    try {
      const songRef = doc(db, 'songs', songId);
      await updateDoc(songRef, {
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
      const playlistRef = doc(db, 'playlists', playlistId);
      await setDoc(playlistRef, newPlaylist);

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
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlistDoc = await getDoc(playlistRef);
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
      await updateDoc(playlistRef, {
        songs: [...playlist.songs, songId],
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      return false;
    }
  }

  // Get user playlists
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    try {
      const playlistsRef = collection(db, 'playlists');
      const q = query(
        playlistsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const playlistsSnapshot = await getDocs(q);

      return playlistsSnapshot.docs.map(doc => doc.data() as Playlist);
    } catch (error) {
      console.error('Error getting user playlists:', error);
      return [];
    }
  }

  // Add a comment to a song
  async addComment(songId: string, userId: string, text: string): Promise<SongComment | null> {
    try {
      const commentId = uuidv4();
      const now = new Date().toISOString();

      const comment: SongComment = {
        id: commentId,
        songId,
        userId,
        text,
        createdAt: now
      };

      // Add comment to song's comments collection
      const commentRef = doc(db, 'songs', songId, 'comments', commentId);
      await setDoc(commentRef, comment);

      // Update comment count on song
      const songRef = doc(db, 'songs', songId);
      await updateDoc(songRef, {
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
      const commentsRef = collection(db, 'songs', songId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const commentsSnapshot = await getDocs(q);

      return commentsSnapshot.docs.map(doc => doc.data() as SongComment);
    } catch (error) {
      console.error('Error getting song comments:', error);
      return [];
    }
  }

  // Remove a song from a playlist
  async removeSongFromPlaylist(playlistId: string, songId: string, userId: string): Promise<boolean> {
    try {
      // Get playlist to check ownership
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlistDoc = await getDoc(playlistRef);
      if (!playlistDoc.exists()) {
        return false;
      }

      const playlist = playlistDoc.data() as Playlist;

      // Verify ownership
      if (playlist.userId !== userId) {
        return false;
      }

      // Remove song from playlist
      const updatedSongs = playlist.songs.filter(id => id !== songId);
      await updateDoc(playlistRef, {
        songs: updatedSongs,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      return false;
    }
  }

  // Delete a playlist
  async deletePlaylist(playlistId: string, userId: string): Promise<boolean> {
    try {
      // Get playlist to check ownership
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlistDoc = await getDoc(playlistRef);
      if (!playlistDoc.exists()) {
        return false;
      }

      const playlist = playlistDoc.data() as Playlist;

      // Verify ownership
      if (playlist.userId !== userId) {
        return false;
      }

      // Delete cover image if it exists
      if (playlist.coverImageUrl) {
        const coverImageRef = ref(storage, `playlists/${userId}/${playlistId}/cover.jpg`);
        await deleteObject(coverImageRef);
      }

      // Delete playlist document
      await deleteDoc(playlistRef);

      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }
}

export default new SongService();
