import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { storage, firebaseDb } from '../config/firebase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import NetworkErrorHandler, { NetworkErrorType } from './NetworkErrorHandler';

// Use React Native Firebase for native platforms if available
let rnFirebaseStorage: any = null;
if (Platform.OS !== 'web') {
  try {
    rnFirebaseStorage = require('@react-native-firebase/storage').default;
  } catch (e) {
    console.log('React Native Firebase storage not available, falling back to Web SDK');
  }
}

// Define a discriminated union for better typed error handling
type UploadSuccess = {
  success: true;
  fileId: string;
  downloadUrl: string;
  metadata: AudioFileMetadata;
};

type UploadFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    type?: NetworkErrorType;
    isNetworkError?: boolean;
    isRetryable?: boolean;
  };
};

export type UploadResult = UploadSuccess | UploadFailure;

// Interface for the audio file metadata
export interface AudioFileMetadata {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  duration: number;
  format: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Timestamp | any; // Allow any for serverTimestamp()
  projectId?: string;
  trackId?: string;
  isPublic: boolean;
  streamingUrl: string;
  downloadUrl: string;
  waveformData?: number[];
  tags?: string[];
  transcoded: boolean;
  transcodingStatus: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Service for handling audio file uploads to Firebase Storage
 * with metadata storage in Firestore
 */
class AudioUploadService {
  private static instance: AudioUploadService;
  private networkHandler: NetworkErrorHandler;
  private activeUploads: Map<string, UploadTask> = new Map();
  
  private constructor() {
    this.networkHandler = NetworkErrorHandler.getInstance();
  }
  
  /**
   * Get the singleton instance of AudioUploadService
   */
  public static getInstance(): AudioUploadService {
    if (!AudioUploadService.instance) {
      AudioUploadService.instance = new AudioUploadService();
    }
    return AudioUploadService.instance;
  }
  
  /**
   * Upload an audio file to Firebase Storage and store its metadata in Firestore
   * 
   * @param userId User ID of the uploader
   * @param fileUri Local URI of the audio file
   * @param fileName Name to use for the file
   * @param fileSize Size of the file in bytes
   * @param duration Duration of the audio in milliseconds
   * @param mimeType MIME type of the audio file
   * @param projectId Optional project ID to associate with the audio
   * @param trackId Optional track ID to associate with the audio
   * @param isPublic Whether the audio is publicly accessible
   * @param tags Optional tags for the audio file
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to UploadResult
   */
  async uploadAudioFile(
    userId: string,
    fileUri: string,
    fileName: string,
    fileSize: number,
    duration: number,
    mimeType: string = 'audio/mpeg',
    projectId?: string,
    trackId?: string,
    isPublic: boolean = false,
    tags: string[] = [],
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Check network connectivity before starting upload
      const isConnected = await this.networkHandler.checkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          error: {
            code: 'network/no-connection',
            message: 'No internet connection available',
            type: NetworkErrorType.NO_CONNECTION,
            isNetworkError: true,
            isRetryable: true
          }
        };
      }
      
      // Use the network handler's executeWithRetry for the upload process
      return await this.networkHandler.executeWithRetry(async () => {
        // Generate a unique file name to prevent collisions
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = fileName.split('.').pop() || 'mp3';
        const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;
        
        // Create the storage path
        const storagePath = `audio/${userId}/${uniqueFileName}`;
        
        // Get file data
        let fileData: Blob | Uint8Array;
        
        if (Platform.OS === 'web') {
          // For web, fetch the file and get it as a blob
          const response = await fetch(fileUri);
          fileData = await response.blob();
        } else {
          // For native platforms, read the file as a base64 string and convert to Uint8Array
          const base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          fileData = bytes;
        }
        
        // Create a storage reference
        const storageRef = ref(storage, storagePath);
        
        // Start the upload
        let uploadTask: UploadTask;
        
        if (rnFirebaseStorage && Platform.OS !== 'web') {
          // Use React Native Firebase for native platforms if available
          const rnStorageRef = rnFirebaseStorage().ref(storagePath);
          uploadTask = rnStorageRef.putFile(fileUri) as unknown as UploadTask;
        } else {
          // Use Web SDK
          uploadTask = uploadBytesResumable(storageRef, fileData);
        }
        
        // Store the upload task for potential cancellation
        this.activeUploads.set(uniqueFileName, uploadTask);
        
        // Create a promise that resolves when the upload is complete
        const uploadPromise = new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              // Calculate and report progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (onProgress) {
                onProgress(progress);
              }
            },
            (error) => {
              // Handle unsuccessful uploads
              this.activeUploads.delete(uniqueFileName);
              
              // Categorize the error
              const errorDetails = this.networkHandler.categorizeError(error);
              
              reject({
                code: error.code || 'storage/unknown',
                message: error.message || 'Unknown upload error',
                type: errorDetails.type,
                isNetworkError: errorDetails.type !== NetworkErrorType.UNKNOWN,
                isRetryable: errorDetails.retryable
              });
            },
            async () => {
              try {
                // Upload completed successfully
                this.activeUploads.delete(uniqueFileName);
                
                // Get download URL
                const downloadUrl = await getDownloadURL(storageRef);
                resolve(downloadUrl);
              } catch (error: any) {
                reject({
                  code: error.code || 'storage/download-url-failed',
                  message: error.message || 'Failed to get download URL',
                  isRetryable: true
                });
              }
            }
          );
        });
        
        // Wait for the upload to complete and get the download URL
        const downloadUrl = await uploadPromise;
        
        // Create metadata object
        const metadata: Omit<AudioFileMetadata, 'id'> = {
          fileName: uniqueFileName,
          originalFileName: fileName,
          fileSize,
          duration,
          format: fileExtension,
          mimeType: this.getMimeTypeFromExtension(fileExtension),
          uploadedBy: userId,
          uploadedAt: serverTimestamp(),
          projectId,
          trackId,
          isPublic,
          streamingUrl: downloadUrl,
          downloadUrl,
          tags,
          transcoded: false,
          transcodingStatus: 'not_started'
        };
        
        // Store metadata in Firestore
        const docRef = await addDoc(collection(firebaseDb, 'audioFiles'), metadata);
        
        // If this is for a project track, update the track with the audio file
        if (projectId && trackId) {
          await this.updateProjectTrackAudio(projectId, trackId, docRef.id, downloadUrl);
        }
        
        // Return success result
        return {
          success: true,
          fileId: docRef.id,
          downloadUrl,
          metadata: {
            ...metadata,
            id: docRef.id
          } as AudioFileMetadata
        };
      });
    } catch (error: any) {
      console.error('Audio upload error:', error);
      
      // If the error is already formatted by our retry logic
      if (error.code && error.message) {
        return {
          success: false,
          error
        };
      }
      
      // Otherwise, categorize the error
      const errorDetails = this.networkHandler.categorizeError(error);
      
      return {
        success: false,
        error: {
          code: error.code || 'upload/unknown-error',
          message: error.message || 'An unknown error occurred during upload',
          type: errorDetails.type,
          isNetworkError: errorDetails.type !== NetworkErrorType.UNKNOWN,
          isRetryable: errorDetails.retryable
        }
      };
    }
  }
  
  /**
   * Cancel an active upload by file name
   * @param fileName Name of the file being uploaded
   * @returns True if the upload was cancelled, false if not found
   */
  cancelUpload(fileName: string): boolean {
    const uploadTask = this.activeUploads.get(fileName);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(fileName);
      return true;
    }
    return false;
  }
  
  /**
   * Cancel all active uploads
   */
  cancelAllUploads(): void {
    this.activeUploads.forEach((uploadTask) => {
      uploadTask.cancel();
    });
    this.activeUploads.clear();
  }
  
  /**
   * Update a project track with the audio file information
   * @param projectId Project ID
   * @param trackId Track ID
   * @param audioFileId Audio file ID
   * @param audioFileUrl Audio file URL
   */
  private async updateProjectTrackAudio(
    projectId: string,
    trackId: string,
    audioFileId: string,
    audioFileUrl: string
  ): Promise<void> {
    try {
      const trackRef = doc(firebaseDb, 'projects', projectId, 'tracks', trackId);
      await updateDoc(trackRef, {
        audioFileId,
        audioFileUrl,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating project track audio:', error);
      // We don't throw here to avoid failing the whole upload
      // The audio file is still uploaded and stored in Firestore
    }
  }
  
  /**
   * Get the MIME type from a file extension
   * @param fileExtension File extension
   * @returns MIME type
   */
  getMimeTypeFromExtension(fileExtension: string): string {
    const extension = fileExtension.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'webm': 'audio/webm'
    };
    
    return mimeTypes[extension] || 'audio/mpeg';
  }
  
  /**
   * Get a user-friendly error message for an upload error
   * @param error The error object
   * @returns User-friendly error message
   */
  getErrorMessage(error: UploadFailure['error']): string {
    // If it's a network error, use the NetworkErrorHandler to format it
    if (error.type) {
      return this.networkHandler.formatErrorMessage({
        type: error.type,
        message: error.message,
        originalError: error,
        timestamp: Date.now(),
        retryable: error.isRetryable || false
      });
    }
    
    // Otherwise, format based on the error code
    switch (error.code) {
      case 'storage/unauthorized':
        return 'You don\'t have permission to upload this file.';
      case 'storage/canceled':
        return 'Upload was cancelled.';
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded. Please contact support.';
      case 'storage/invalid-format':
        return 'Invalid file format. Please upload a supported audio file.';
      case 'storage/file-too-large':
        return 'File is too large. Maximum size is 100MB.';
      default:
        return error.message || 'An unknown error occurred during upload.';
    }
  }
}

export default AudioUploadService; 