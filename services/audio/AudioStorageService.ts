import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for audio file metadata
 */
export interface AudioFileMetadata {
  id: string;
  userId: string;
  originalFileName: string;
  fileSize: number;
  duration: number;
  fileType: string;
  downloadUrl: string;
  storagePath: string;
  title?: string;
  genre?: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * AudioStorageService
 * 
 * A service for storing and retrieving audio files.
 * Handles uploading, downloading, and managing audio files in Firebase Storage.
 */
export class AudioStorageService {
  private static readonly STORAGE_FOLDER = 'audio_files';
  private static readonly COLLECTION_NAME = 'audio_files';
  
  /**
   * Save a processed audio file to storage
   * 
   * @param {string} userId - ID of the user who owns the file
   * @param {string} audioUri - URI of the audio file to save
   * @param {Object} metadata - Metadata for the audio file
   * @returns {Promise<AudioFileMetadata>} Metadata of the saved file
   */
  static async saveProcessedAudio(
    userId: string,
    audioUri: string,
    metadata: {
      title: string;
      genre?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<AudioFileMetadata> {
    try {
      // Validate input
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!audioUri) {
        throw new Error('Audio URI is required');
      }
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }
      
      // Get file extension
      const fileExtension = audioUri.split('.').pop()?.toLowerCase() || 'mp3';
      
      // Generate a unique filename
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storagePath = `${this.STORAGE_FOLDER}/${userId}/${fileName}`;
      
      // Get audio duration
      const duration = await this.getAudioDuration(audioUri);
      
      // Upload to Firebase Storage
      const downloadUrl = await this.uploadToFirebaseStorage(audioUri, storagePath);
      
      // Create metadata document in Firestore
      const fileMetadata: AudioFileMetadata = {
        id: uuidv4(),
        userId,
        originalFileName: metadata.title || 'Untitled Track',
        fileSize: fileInfo.size || 0,
        duration,
        fileType: `audio/${fileExtension}`,
        downloadUrl,
        storagePath,
        title: metadata.title,
        genre: metadata.genre || 'Other',
        description: metadata.description || '',
        isPublic: metadata.isPublic !== undefined ? metadata.isPublic : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save metadata to Firestore
      await this.saveMetadataToFirestore(fileMetadata);
      
      return fileMetadata;
    } catch (error) {
      console.error('Error saving processed audio:', error);
      throw new Error(`Failed to save processed audio: ${error.message}`);
    }
  }
  
  /**
   * Get the duration of an audio file
   * 
   * @param {string} audioUri - URI of the audio file
   * @returns {Promise<number>} Duration in seconds
   */
  static async getAudioDuration(audioUri: string): Promise<number> {
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      // Get duration from status
      const duration = status.isLoaded ? status.durationMillis / 1000 : 0;
      
      // Unload the sound to free resources
      await sound.unloadAsync();
      
      return duration;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0; // Return 0 if we can't determine the duration
    }
  }
  
  /**
   * Upload a file to Firebase Storage
   * 
   * @param {string} uri - URI of the file to upload
   * @param {string} storagePath - Path in Firebase Storage
   * @returns {Promise<string>} Download URL of the uploaded file
   */
  static async uploadToFirebaseStorage(uri: string, storagePath: string): Promise<string> {
    try {
      // Get Firebase Storage instance
      const storage = getStorage();
      const storageRef = ref(storage, storagePath);
      
      // For web, we need to fetch the file as a blob
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Upload the blob
        await uploadBytes(storageRef, blob);
      } else {
        // For native platforms, we need to read the file as a blob
        const fileContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to blob
        const blob = this.base64ToBlob(fileContent);
        
        // Upload the blob
        await uploadBytes(storageRef, blob);
      }
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Save file metadata to Firestore
   * 
   * @param {AudioFileMetadata} metadata - Metadata to save
   * @returns {Promise<void>}
   */
  static async saveMetadataToFirestore(metadata: AudioFileMetadata): Promise<void> {
    try {
      // Get Firestore instance
      const db = getFirestore();
      
      // Add document to collection
      await addDoc(collection(db, this.COLLECTION_NAME), metadata);
    } catch (error) {
      console.error('Error saving metadata to Firestore:', error);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
  }
  
  /**
   * Get audio files for a user
   * 
   * @param {string} userId - ID of the user
   * @returns {Promise<AudioFileMetadata[]>} Array of audio file metadata
   */
  static async getUserAudioFiles(userId: string): Promise<AudioFileMetadata[]> {
    try {
      // Validate input
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Get Firestore instance
      const db = getFirestore();
      
      // Query for user's audio files
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Convert query snapshot to array of metadata
      const audioFiles: AudioFileMetadata[] = [];
      querySnapshot.forEach((doc) => {
        audioFiles.push(doc.data() as AudioFileMetadata);
      });
      
      return audioFiles;
    } catch (error) {
      console.error('Error getting user audio files:', error);
      throw new Error(`Failed to get user audio files: ${error.message}`);
    }
  }
  
  /**
   * Get public audio files
   * 
   * @param {number} limit - Maximum number of files to return
   * @returns {Promise<AudioFileMetadata[]>} Array of audio file metadata
   */
  static async getPublicAudioFiles(limit: number = 50): Promise<AudioFileMetadata[]> {
    try {
      // Get Firestore instance
      const db = getFirestore();
      
      // Query for public audio files
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isPublic', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Convert query snapshot to array of metadata
      const audioFiles: AudioFileMetadata[] = [];
      querySnapshot.forEach((doc) => {
        if (audioFiles.length < limit) {
          audioFiles.push(doc.data() as AudioFileMetadata);
        }
      });
      
      return audioFiles;
    } catch (error) {
      console.error('Error getting public audio files:', error);
      throw new Error(`Failed to get public audio files: ${error.message}`);
    }
  }
  
  /**
   * Delete an audio file
   * 
   * @param {string} fileId - ID of the file to delete
   * @returns {Promise<void>}
   */
  static async deleteAudioFile(fileId: string): Promise<void> {
    try {
      // Validate input
      if (!fileId) {
        throw new Error('File ID is required');
      }
      
      // Get Firestore instance
      const db = getFirestore();
      
      // Query for the file
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('id', '==', fileId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('File not found');
      }
      
      // Get the file metadata
      const fileDoc = querySnapshot.docs[0];
      const fileMetadata = fileDoc.data() as AudioFileMetadata;
      
      // Delete the file from Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, fileMetadata.storagePath);
      await deleteObject(storageRef);
      
      // Delete the metadata from Firestore
      await deleteDoc(doc(db, this.COLLECTION_NAME, fileDoc.id));
    } catch (error) {
      console.error('Error deleting audio file:', error);
      throw new Error(`Failed to delete audio file: ${error.message}`);
    }
  }
  
  /**
   * Update audio file metadata
   * 
   * @param {string} fileId - ID of the file to update
   * @param {Partial<AudioFileMetadata>} updates - Updates to apply
   * @returns {Promise<AudioFileMetadata>} Updated metadata
   */
  static async updateAudioFileMetadata(
    fileId: string,
    updates: Partial<AudioFileMetadata>
  ): Promise<AudioFileMetadata> {
    try {
      // Validate input
      if (!fileId) {
        throw new Error('File ID is required');
      }
      
      // Get Firestore instance
      const db = getFirestore();
      
      // Query for the file
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('id', '==', fileId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('File not found');
      }
      
      // Get the file metadata
      const fileDoc = querySnapshot.docs[0];
      const fileMetadata = fileDoc.data() as AudioFileMetadata;
      
      // Create updated metadata
      const updatedMetadata: AudioFileMetadata = {
        ...fileMetadata,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Update the document in Firestore
      await updateDoc(doc(db, this.COLLECTION_NAME, fileDoc.id), updatedMetadata);
      
      return updatedMetadata;
    } catch (error) {
      console.error('Error updating audio file metadata:', error);
      throw new Error(`Failed to update audio file metadata: ${error.message}`);
    }
  }
  
  /**
   * Convert a base64 string to a Blob
   * 
   * @param {string} base64 - Base64 string to convert
   * @returns {Blob} Converted blob
   */
  private static base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: 'audio/mpeg' });
  }
} 