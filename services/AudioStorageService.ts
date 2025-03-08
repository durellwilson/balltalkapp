import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  listAll, 
  deleteObject,
  getMetadata,
  updateMetadata,
  FirebaseStorage
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
  FieldValue
} from 'firebase/firestore';
import { db, storage } from '../src/lib/firebase';
import { Platform } from 'react-native';
import storage_lib from '@react-native-firebase/storage';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const AUDIO_FILES_COLLECTION = 'audioFiles';
const PROJECTS_COLLECTION = 'projects';
const STREAMING_TRACKS_COLLECTION = 'streamingTracks';

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

// Streaming track interface
export interface StreamingTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverArt?: string;
  audioFileId: string;
  streamingUrl: string;
  duration: number;
  playCount: number;
  likeCount: number;
  commentCount: number;
  isPublic: boolean;
  releaseDate: Timestamp | string | any; // Allow any to accommodate serverTimestamp
  genre?: string;
  tags?: string[];
  description?: string;
  lyrics?: string;
  collaborators?: {
    userId: string;
    displayName: string;
    role: string;
  }[];
  albumId?: string;
  albumName?: string;
  trackNumber?: number;
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
      const storageRef = ref(firebaseStorage, storagePath);
      let uploadTask;
      
      // For web platform
      if (Platform.OS === 'web') {
        try {
          console.log('[AudioStorageService] Uploading on web platform');
          // Fetch the file as a blob
          const response = await fetch(fileUri);
          const blob = await response.blob();
          
          if (onProgress) onProgress(10); // Started fetching
          
          console.log(`[AudioStorageService] Blob created: ${blob.size} bytes`);
          
          // Create upload task
          uploadTask = uploadBytes(storageRef, blob);
          
          // Handle progress if callback provided
          if (onProgress) {
            let progress = 10;
            const interval = setInterval(() => {
              progress += 5;
              if (progress >= 90) {
                clearInterval(interval);
              } else {
                onProgress(progress);
                console.log(`[AudioStorageService] Upload progress: ${progress}%`);
              }
            }, 200);
            
            // Clear interval when upload completes
            uploadTask.then(() => {
              clearInterval(interval);
              onProgress(95);
              console.log('[AudioStorageService] Upload completed');
            }).catch((error) => {
              clearInterval(interval);
              console.error('[AudioStorageService] Upload error:', error);
            });
          }
          
          // Wait for upload to complete
          await uploadTask;
          if (onProgress) onProgress(100);
        } catch (webError) {
          console.error('[AudioStorageService] Web upload error:', webError);
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
      
      // Create metadata document in Firestore
      const audioFileData: Omit<AudioFileMetadata, 'id'> = {
        fileName: uniqueFileName,
        originalFileName: fileName,
        fileSize: fileSize,
        duration: duration,
        format: format,
        mimeType: mimeType,
        uploadedBy: userId,
        uploadedAt: serverTimestamp(),
        projectId: projectId,
        trackId: trackId,
        isPublic: isPublic,
        streamingUrl: streamingURL,
        downloadUrl: downloadURL,
        tags: tags,
        transcoded: false,
        transcodingStatus: 'completed', // Mark as completed for immediate playback
        waveformData: [], // Add empty waveform data (could be generated later)
      };
      
      // Add document to Firestore
      const docRef = await addDoc(collection(firebaseDb, AUDIO_FILES_COLLECTION), audioFileData);
      
      // If this is for a project track, update the track with the audio file ID
      if (projectId && trackId) {
        await this.updateProjectTrackAudio(projectId, trackId, downloadURL, docRef.id);
      }
      
      // Return the complete metadata with the ID
      return {
        id: docRef.id,
        ...audioFileData,
      };
    } catch (error) {
      console.error('[AudioStorageService] Error uploading audio file:', error);
      throw error;
    }
  }
  
  /**
   * Update a project track with audio file information
   */
  async updateProjectTrackAudio(
    projectId: string, 
    trackId: string, 
    audioUrl: string, 
    audioFileId: string
  ): Promise<void> {
    try {
      console.log(`[AudioStorageService] Updating track ${trackId} with audio file ${audioFileId}`);
      
      // Get the project document reference
      const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
      
      // Get the current project data
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const projectData = projectDoc.data();
      
      // Find the track and update its audio URI
      const updatedTracks = projectData.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            audioUri: audioUrl,
            audioFileId: audioFileId,
            updatedAt: new Date().toISOString()
          };
        }
        return track;
      });
      
      // Update the project with the modified tracks
      await updateDoc(projectRef, {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      });
      
      console.log(`[AudioStorageService] Track ${trackId} updated successfully`);
    } catch (error) {
      console.error('[AudioStorageService] Error updating track audio:', error);
      throw error;
    }
  }
  
  /**
   * Get audio file metadata by ID
   */
  async getAudioFileMetadata(audioFileId: string): Promise<AudioFileMetadata | null> {
    try {
      const docRef = doc(firebaseDb, AUDIO_FILES_COLLECTION, audioFileId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as AudioFileMetadata;
      }
      
      return null;
    } catch (error) {
      console.error('[AudioStorageService] Error getting audio file metadata:', error);
      throw error;
    }
  }
  
  /**
   * Get all audio files for a user
   */
  async getUserAudioFiles(userId: string): Promise<AudioFileMetadata[]> {
    try {
      const q = query(
        collection(firebaseDb, AUDIO_FILES_COLLECTION),
        where('uploadedBy', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const audioFiles: AudioFileMetadata[] = [];
      
      querySnapshot.forEach(doc => {
        audioFiles.push({
          id: doc.id,
          ...doc.data()
        } as AudioFileMetadata);
      });
      
      return audioFiles;
    } catch (error) {
      console.error('[AudioStorageService] Error getting user audio files:', error);
      throw error;
    }
  }
  
  /**
   * Get all audio files for a project
   */
  async getProjectAudioFiles(projectId: string): Promise<AudioFileMetadata[]> {
    try {
      const q = query(
        collection(firebaseDb, AUDIO_FILES_COLLECTION),
        where('projectId', '==', projectId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const audioFiles: AudioFileMetadata[] = [];
      
      querySnapshot.forEach(doc => {
        audioFiles.push({
          id: doc.id,
          ...doc.data()
        } as AudioFileMetadata);
      });
      
      return audioFiles;
    } catch (error) {
      console.error('[AudioStorageService] Error getting project audio files:', error);
      throw error;
    }
  }
  
  /**
   * Delete an audio file
   */
  async deleteAudioFile(audioFileId: string): Promise<void> {
    try {
      // Get the audio file metadata
      const audioFile = await this.getAudioFileMetadata(audioFileId);
      
      if (!audioFile) {
        throw new Error(`Audio file ${audioFileId} not found`);
      }
      
      // Delete the file from storage
      const storageRef = ref(firebaseStorage, audioFile.fileName);
      await deleteObject(storageRef);
      
      // Delete the metadata document
      await deleteDoc(doc(firebaseDb, AUDIO_FILES_COLLECTION, audioFileId));
      
      console.log(`[AudioStorageService] Audio file ${audioFileId} deleted successfully`);
    } catch (error) {
      console.error('[AudioStorageService] Error deleting audio file:', error);
      throw error;
    }
  }
  
  /**
   * Create a streaming track from an audio file
   */
  async createStreamingTrack(
    audioFileId: string,
    title: string,
    artist: string,
    artistId: string,
    coverArt?: string,
    isPublic: boolean = true,
    genre?: string,
    tags: string[] = [],
    description?: string,
    lyrics?: string,
    collaborators: { userId: string, displayName: string, role: string }[] = []
  ): Promise<StreamingTrack | null> {
    try {
      // Get the audio file metadata
      const audioFile = await this.getAudioFileMetadata(audioFileId);
      
      if (!audioFile) {
        throw new Error(`Audio file ${audioFileId} not found`);
      }
      
      // Create the streaming track document
      const streamingTrackData: Omit<StreamingTrack, 'id'> = {
        title,
        artist,
        artistId,
        coverArt,
        audioFileId,
        streamingUrl: audioFile.streamingUrl,
        duration: audioFile.duration,
        playCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPublic,
        releaseDate: serverTimestamp(),
        genre,
        tags,
        description,
        lyrics,
        collaborators
      };
      
      // Add document to Firestore
      const docRef = await addDoc(collection(firebaseDb, STREAMING_TRACKS_COLLECTION), streamingTrackData);
      
      // Update the audio file to mark it as public if the track is public
      if (isPublic && !audioFile.isPublic) {
        await updateDoc(doc(firebaseDb, AUDIO_FILES_COLLECTION, audioFileId), {
          isPublic: true
        });
      }
      
      // Return the complete streaming track with the ID
      return {
        id: docRef.id,
        ...streamingTrackData
      };
    } catch (error) {
      console.error('[AudioStorageService] Error creating streaming track:', error);
      throw error;
    }
  }
  
  /**
   * Get all streaming tracks for a user
   */
  async getUserStreamingTracks(userId: string): Promise<StreamingTrack[]> {
    try {
      const q = query(
        collection(firebaseDb, STREAMING_TRACKS_COLLECTION),
        where('artistId', '==', userId),
        orderBy('releaseDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const streamingTracks: StreamingTrack[] = [];
      
      querySnapshot.forEach(doc => {
        streamingTracks.push({
          id: doc.id,
          ...doc.data()
        } as StreamingTrack);
      });
      
      return streamingTracks;
    } catch (error) {
      console.error('[AudioStorageService] Error getting user streaming tracks:', error);
      throw error;
    }
  }
  
  /**
   * Get public streaming tracks
   */
  async getPublicStreamingTracks(limit: number = 20): Promise<StreamingTrack[]> {
    try {
      const q = query(
        collection(firebaseDb, STREAMING_TRACKS_COLLECTION),
        where('isPublic', '==', true),
        orderBy('releaseDate', 'desc'),
        // limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const streamingTracks: StreamingTrack[] = [];
      
      querySnapshot.forEach(doc => {
        streamingTracks.push({
          id: doc.id,
          ...doc.data()
        } as StreamingTrack);
      });
      
      return streamingTracks;
    } catch (error) {
      console.error('[AudioStorageService] Error getting public streaming tracks:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time updates for a project's audio files
   */
  subscribeToProjectAudioFiles(
    projectId: string, 
    callback: (audioFiles: AudioFileMetadata[]) => void
  ): () => void {
    const q = query(
      collection(firebaseDb, AUDIO_FILES_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('uploadedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const audioFiles: AudioFileMetadata[] = [];
      
      querySnapshot.forEach(doc => {
        audioFiles.push({
          id: doc.id,
          ...doc.data()
        } as AudioFileMetadata);
      });
      
      callback(audioFiles);
    }, (error) => {
      console.error('[AudioStorageService] Error subscribing to project audio files:', error);
    });
    
    return unsubscribe;
  }
  
  /**
   * Increment play count for a streaming track
   */
  async incrementPlayCount(trackId: string): Promise<void> {
    try {
      const trackRef = doc(firebaseDb, STREAMING_TRACKS_COLLECTION, trackId);
      
      // Get the current track data
      const trackDoc = await getDoc(trackRef);
      
      if (!trackDoc.exists()) {
        throw new Error(`Track ${trackId} not found`);
      }
      
      const trackData = trackDoc.data();
      
      // Increment the play count
      await updateDoc(trackRef, {
        playCount: (trackData.playCount || 0) + 1
      });
    } catch (error) {
      console.error('[AudioStorageService] Error incrementing play count:', error);
      throw error;
    }
  }
}

export default new AudioStorageService(); 