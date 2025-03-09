import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  listAll, 
  deleteObject,
  getMetadata,
  updateMetadata,
  FirebaseStorage,
  uploadBytesResumable
} from 'firebase/storage';
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp,
  deleteDoc,
  Firestore,
  limit,
  startAfter
} from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { Platform } from 'react-native';
import storage_lib from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const AUDIO_FILES_COLLECTION = 'audioFiles';
const PROJECTS_COLLECTION = 'projects';
const STREAMING_TRACKS_COLLECTION = 'streamingTracks';
const SONGS_COLLECTION = 'songs';
const PENDING_UPLOADS_COLLECTION = 'pendingUploads';

// Audio file metadata interface
export interface AudioFileMetadata {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  duration: number;
  format: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Timestamp | string | any; // Allow any to accommodate serverTimestamp
  projectId?: string;
  trackId?: string;
  isPublic: boolean;
  streamingUrl: string;
  downloadUrl: string;
  waveformData?: number[];
  tags?: string[];
  bpm?: number;
  key?: string;
  collaborators?: string[];
  lastModified?: Timestamp | string;
  transcoded: boolean;
  transcodingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  versions?: {
    id: string;
    quality: 'low' | 'medium' | 'high';
    url: string;
    size: number;
  }[];
}

// Song interface
export interface Song {
  id: string;
  artistId: string;
  title: string;
  genre?: string;
  releaseDate: string;
  fileUrl: string;
  coverArtUrl?: string;
  duration: number;
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
  plays?: number;
  likes?: number;
  comments?: number;
  description?: string;
  lyrics?: string;
  tags?: string[];
  audioFileId?: string;
  isProcessed?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

// Pending upload interface
export interface PendingUpload {
  id: string;
  userId: string;
  fileName: string;
  fileUri: string;
  fileSize: number;
  mimeType: string;
  title?: string;
  genre?: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
  status: 'pending' | 'uploading' | 'failed';
  error?: string;
  retryCount: number;
  lastRetryAt?: string;
}

class AudioStorageService {
  /**
   * Upload an audio file to Firebase Storage and store its metadata in Firestore
   */
  async uploadAudioFile(
    userId: string,
    fileUri: string,
    fileName: string,
    fileSize: number,
    duration: number,
    mimeType: string,
    projectId?: string,
    trackId?: string,
    isPublic: boolean = false,
    tags: string[] = [],
    onProgress?: (progress: number) => void
  ): Promise<AudioFileMetadata | null> {
    try {
      console.log(`[AudioStorageService] Uploading audio file: ${fileName}`, {
        userId,
        fileSize,
        duration,
        projectId,
        trackId,
        isPublic
      });
      
      // Create a unique filename with timestamp and random string
      const fileExtension = fileName.split('.').pop() || 'mp3';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      
      // Create storage path based on visibility and project
      let storagePath = '';
      if (isPublic) {
        storagePath = `public/audio/${userId}/${uniqueFileName}`;
      } else if (projectId) {
        storagePath = `projects/${projectId}/audio/${uniqueFileName}`;
      } else {
        storagePath = `users/${userId}/audio/${uniqueFileName}`;
      }
      
      console.log(`[AudioStorageService] Storage path: ${storagePath}`);
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, storagePath);
      
      // Upload the file based on platform
      // For web platform
      if (Platform.OS === 'web') {
        try {
          console.log(`[AudioStorageService] Uploading on web platform`);
          const response = await fetch(fileUri);
          const blob = await response.blob();
          
          if (onProgress) {
            // Use resumable upload for progress tracking
            const uploadTask = uploadBytesResumable(storageRef, blob);
            
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
                console.log(`[AudioStorageService] Upload progress: ${progress}%`);
              },
              (error) => {
                console.error(`[AudioStorageService] Upload error:`, error);
                throw error;
              }
            );
            
            // Wait for upload to complete
            await uploadTask;
          } else {
            // Use simple upload without progress tracking
            await uploadBytes(storageRef, blob);
          }
        } catch (webError) {
          console.error(`[AudioStorageService] Web upload error:`, webError);
          throw webError;
        }
      }
      // For native platforms
      else {
        try {
          console.log(`[AudioStorageService] Uploading on ${Platform.OS} platform`);
          // Use React Native Firebase for native platforms
          if (Platform.OS === 'android' || Platform.OS === 'ios') {
            // For native platforms, use the React Native Firebase SDK
            const reference = storage_lib().ref(storagePath);
            const task = reference.putFile(fileUri);
            
            // Handle progress if callback provided
            if (onProgress) {
              task.on('state_changed', snapshot => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
                console.log(`[AudioStorageService] Upload progress: ${progress}%`);
              });
            }
            
            // Wait for upload to complete
            await task;
          } else {
            throw new Error(`[AudioStorageService] Unsupported platform: ${Platform.OS}`);
          }
        } catch (nativeError) {
          console.error(`[AudioStorageService] ${Platform.OS} upload error:`, nativeError);
          throw nativeError;
        }
      }
      
      // Get the download URL
      console.log('[AudioStorageService] Getting download URL');
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`[AudioStorageService] Download URL: ${downloadURL}`);
      
      // Create a streaming URL (same as download URL for now, but could be different in production)
      const streamingURL = downloadURL;
      
      // Determine file format from extension
      const format = fileExtension.toUpperCase();
      
      // Create metadata object
      const metadata: AudioFileMetadata = {
        id: '', // Will be set after Firestore document is created
        fileName: uniqueFileName,
        originalFileName: fileName,
        fileSize,
        duration,
        format,
        mimeType,
        uploadedBy: userId,
        uploadedAt: serverTimestamp(),
        isPublic,
        streamingUrl: streamingURL,
        downloadUrl: downloadURL,
        tags: tags || [],
        transcoded: false,
        transcodingStatus: 'pending',
      };
      
      // Add project and track IDs if provided
      if (projectId) metadata.projectId = projectId;
      if (trackId) metadata.trackId = trackId;
      
      // Save metadata to Firestore
      console.log('[AudioStorageService] Saving metadata to Firestore');
      const docRef = await addDoc(collection(db, AUDIO_FILES_COLLECTION), metadata);
      
      // Update the metadata with the document ID
      metadata.id = docRef.id;
      await updateDoc(docRef, { id: docRef.id });
      
      console.log(`[AudioStorageService] Audio file uploaded successfully with ID: ${docRef.id}`);
      
      return {
        ...metadata,
        id: docRef.id
      };
    } catch (error) {
      console.error('[AudioStorageService] Error uploading audio file:', error);
      throw error;
    }
  }
  
  /**
   * Upload a song with metadata and audio file
   */
  async uploadSong(
    artistId: string,
    title: string,
    genre: string,
    audioFile: Blob | File,
    coverArt?: Blob | File,
    songData: Partial<Song> = {},
    onProgress?: (progress: number) => void
  ): Promise<Song | null> {
    try {
      const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const now = new Date().toISOString();
      
      // Upload audio file to storage
      const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
      
      if (onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(audioRef, audioFile);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
            console.log(`[AudioStorageService] Song upload progress: ${progress}%`);
          },
          (error) => {
            console.error(`[AudioStorageService] Song upload error:`, error);
            throw error;
          }
        );
        
        // Wait for upload to complete
        await uploadTask;
      } else {
        // Use simple upload without progress tracking
        await uploadBytes(audioRef, audioFile);
      }
      
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
        plays: 0,
        likes: 0,
        comments: 0,
        isProcessed: false,
        processingStatus: 'pending',
        ...(coverArtUrl && { coverArtUrl }),
        ...songData
      };
      
      // Save to Firestore
      await setDoc(doc(db, SONGS_COLLECTION, songId), newSong);
      
      console.log(`[AudioStorageService] Song uploaded successfully with ID: ${songId}`);
      return newSong;
    } catch (error) {
      console.error('[AudioStorageService] Error uploading song:', error);
      throw error;
    }
  }
  
  /**
   * Get songs by artist
   */
  async getSongsByArtist(artistId: string, limitCount: number = 20, startAfterDoc?: any): Promise<{ songs: Song[], lastDoc: any }> {
    try {
      let songsQuery;
      
      if (startAfterDoc) {
        songsQuery = query(
          collection(db, SONGS_COLLECTION),
          where('artistId', '==', artistId),
          orderBy('createdAt', 'desc'),
          startAfter(startAfterDoc),
          limit(limitCount)
        );
      } else {
        songsQuery = query(
          collection(db, SONGS_COLLECTION),
          where('artistId', '==', artistId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(songsQuery);
      const songs: Song[] = [];
      let lastDoc = null;
      
      querySnapshot.forEach((doc) => {
        songs.push(doc.data() as Song);
        lastDoc = doc;
      });
      
      return { songs, lastDoc };
    } catch (error) {
      console.error('[AudioStorageService] Error getting songs by artist:', error);
      throw error;
    }
  }
  
  /**
   * Get public songs
   */
  async getPublicSongs(limitCount: number = 20, startAfterDoc?: any): Promise<{ songs: Song[], lastDoc: any }> {
    try {
      let songsQuery;
      
      if (startAfterDoc) {
        songsQuery = query(
          collection(db, SONGS_COLLECTION),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          startAfter(startAfterDoc),
          limit(limitCount)
        );
      } else {
        songsQuery = query(
          collection(db, SONGS_COLLECTION),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(songsQuery);
      const songs: Song[] = [];
      let lastDoc = null;
      
      querySnapshot.forEach((doc) => {
        songs.push(doc.data() as Song);
        lastDoc = doc;
      });
      
      return { songs, lastDoc };
    } catch (error) {
      console.error('[AudioStorageService] Error getting public songs:', error);
      throw error;
    }
  }
  
  /**
   * Get song by ID
   */
  async getSongById(songId: string): Promise<Song | null> {
    try {
      const songDoc = await getDoc(doc(db, SONGS_COLLECTION, songId));
      
      if (songDoc.exists()) {
        return songDoc.data() as Song;
      }
      
      return null;
    } catch (error) {
      console.error(`[AudioStorageService] Error getting song with ID ${songId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete song
   */
  async deleteSong(songId: string, artistId: string): Promise<boolean> {
    try {
      // Get the song to check ownership
      const songDoc = await getDoc(doc(db, SONGS_COLLECTION, songId));
      
      if (!songDoc.exists()) {
        throw new Error(`Song with ID ${songId} not found`);
      }
      
      const song = songDoc.data() as Song;
      
      // Check if the user is the owner of the song
      if (song.artistId !== artistId) {
        throw new Error('You do not have permission to delete this song');
      }
      
      // Delete audio file from storage
      const audioRef = ref(storage, `songs/${artistId}/${songId}/audio.mp3`);
      await deleteObject(audioRef);
      
      // Delete cover art if it exists
      if (song.coverArtUrl) {
        const coverArtRef = ref(storage, `songs/${artistId}/${songId}/cover.jpg`);
        await deleteObject(coverArtRef);
      }
      
      // Delete song document from Firestore
      await deleteDoc(doc(db, SONGS_COLLECTION, songId));
      
      console.log(`[AudioStorageService] Song with ID ${songId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`[AudioStorageService] Error deleting song with ID ${songId}:`, error);
      throw error;
    }
  }
  
  /**
   * Store a pending upload for offline support
   */
  async storePendingUpload(
    userId: string,
    fileUri: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    title?: string,
    genre?: string,
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<string> {
    try {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const now = new Date().toISOString();
      
      // Create pending upload object
      const pendingUpload: PendingUpload = {
        id: uploadId,
        userId,
        fileName,
        fileUri,
        fileSize,
        mimeType,
        title,
        genre,
        isPublic,
        tags,
        createdAt: now,
        status: 'pending',
        retryCount: 0
      };
      
      // Store in AsyncStorage for offline support
      await AsyncStorage.setItem(`pendingUpload_${uploadId}`, JSON.stringify(pendingUpload));
      
      // Also store in Firestore if online
      try {
        await setDoc(doc(db, PENDING_UPLOADS_COLLECTION, uploadId), {
          ...pendingUpload,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn('[AudioStorageService] Could not store pending upload in Firestore, will sync later:', firestoreError);
      }
      
      console.log(`[AudioStorageService] Pending upload stored with ID: ${uploadId}`);
      return uploadId;
    } catch (error) {
      console.error('[AudioStorageService] Error storing pending upload:', error);
      throw error;
    }
  }
  
  /**
   * Get all pending uploads for a user
   */
  async getPendingUploads(userId: string): Promise<PendingUpload[]> {
    try {
      // Try to get from Firestore first
      try {
        const pendingUploadsQuery = query(
          collection(db, PENDING_UPLOADS_COLLECTION),
          where('userId', '==', userId),
          where('status', '==', 'pending')
        );
        
        const querySnapshot = await getDocs(pendingUploadsQuery);
        const pendingUploads: PendingUpload[] = [];
        
        querySnapshot.forEach((doc) => {
          pendingUploads.push(doc.data() as PendingUpload);
        });
        
        return pendingUploads;
      } catch (firestoreError) {
        console.warn('[AudioStorageService] Could not get pending uploads from Firestore, falling back to AsyncStorage:', firestoreError);
      }
      
      // Fall back to AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const pendingUploadKeys = keys.filter(key => key.startsWith('pendingUpload_'));
      
      if (pendingUploadKeys.length === 0) {
        return [];
      }
      
      const pendingUploadValues = await AsyncStorage.multiGet(pendingUploadKeys);
      const pendingUploads: PendingUpload[] = [];
      
      pendingUploadValues.forEach(([key, value]) => {
        if (value) {
          const pendingUpload = JSON.parse(value) as PendingUpload;
          
          if (pendingUpload.userId === userId && pendingUpload.status === 'pending') {
            pendingUploads.push(pendingUpload);
          }
        }
      });
      
      return pendingUploads;
    } catch (error) {
      console.error('[AudioStorageService] Error getting pending uploads:', error);
      throw error;
    }
  }
  
  /**
   * Process pending uploads
   */
  async processPendingUploads(userId: string, onProgress?: (uploadId: string, progress: number) => void): Promise<{ success: string[], failed: string[] }> {
    try {
      const pendingUploads = await this.getPendingUploads(userId);
      
      if (pendingUploads.length === 0) {
        return { success: [], failed: [] };
      }
      
      const successfulUploads: string[] = [];
      const failedUploads: string[] = [];
      
      for (const pendingUpload of pendingUploads) {
        try {
          // Update status to uploading
          await this.updatePendingUploadStatus(pendingUpload.id, 'uploading');
          
          // Check if file still exists
          if (Platform.OS !== 'web') {
            const fileInfo = await FileSystem.getInfoAsync(pendingUpload.fileUri);
            
            if (!fileInfo.exists) {
              throw new Error(`File no longer exists at ${pendingUpload.fileUri}`);
            }
          }
          
          // Upload the file
          await this.uploadAudioFile(
            pendingUpload.userId,
            pendingUpload.fileUri,
            pendingUpload.fileName,
            pendingUpload.fileSize,
            0, // Duration unknown at this point
            pendingUpload.mimeType,
            undefined, // No project ID
            undefined, // No track ID
            pendingUpload.isPublic,
            pendingUpload.tags,
            progress => {
              if (onProgress) {
                onProgress(pendingUpload.id, progress);
              }
            }
          );
          
          // Delete the pending upload
          await this.deletePendingUpload(pendingUpload.id);
          
          successfulUploads.push(pendingUpload.id);
        } catch (uploadError) {
          console.error(`[AudioStorageService] Error processing pending upload ${pendingUpload.id}:`, uploadError);
          
          // Update status to failed
          await this.updatePendingUploadStatus(
            pendingUpload.id, 
            'failed', 
            uploadError instanceof Error ? uploadError.message : 'Unknown error'
          );
          
          failedUploads.push(pendingUpload.id);
        }
      }
      
      return { success: successfulUploads, failed: failedUploads };
    } catch (error) {
      console.error('[AudioStorageService] Error processing pending uploads:', error);
      throw error;
    }
  }
  
  /**
   * Update pending upload status
   */
  private async updatePendingUploadStatus(uploadId: string, status: 'pending' | 'uploading' | 'failed', error?: string): Promise<void> {
    try {
      // Update in AsyncStorage
      const pendingUploadJson = await AsyncStorage.getItem(`pendingUpload_${uploadId}`);
      
      if (pendingUploadJson) {
        const pendingUpload = JSON.parse(pendingUploadJson) as PendingUpload;
        
        pendingUpload.status = status;
        
        if (status === 'failed' && error) {
          pendingUpload.error = error;
          pendingUpload.retryCount += 1;
          pendingUpload.lastRetryAt = new Date().toISOString();
        }
        
        await AsyncStorage.setItem(`pendingUpload_${uploadId}`, JSON.stringify(pendingUpload));
      }
      
      // Update in Firestore if possible
      try {
        const updateData: any = { status };
        
        if (status === 'failed' && error) {
          updateData.error = error;
          updateData.retryCount = increment(1);
          updateData.lastRetryAt = serverTimestamp();
        }
        
        await updateDoc(doc(db, PENDING_UPLOADS_COLLECTION, uploadId), updateData);
      } catch (firestoreError) {
        console.warn('[AudioStorageService] Could not update pending upload status in Firestore:', firestoreError);
      }
    } catch (error) {
      console.error(`[AudioStorageService] Error updating pending upload status for ${uploadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete pending upload
   */
  private async deletePendingUpload(uploadId: string): Promise<void> {
    try {
      // Delete from AsyncStorage
      await AsyncStorage.removeItem(`pendingUpload_${uploadId}`);
      
      // Delete from Firestore if possible
      try {
        await deleteDoc(doc(db, PENDING_UPLOADS_COLLECTION, uploadId));
      } catch (firestoreError) {
        console.warn('[AudioStorageService] Could not delete pending upload from Firestore:', firestoreError);
      }
    } catch (error) {
      console.error(`[AudioStorageService] Error deleting pending upload ${uploadId}:`, error);
      throw error;
    }
  }
}

export default new AudioStorageService(); 