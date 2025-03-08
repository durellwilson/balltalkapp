import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

// Types for offline data management
export interface PendingUpload {
  id: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  metadata: {
    duration: number;
    createdAt: number;
    userId: string;
    mimeType: string;
    title?: string;
    description?: string;
    projectId?: string;
    trackId?: string;
    isPublic?: boolean;
    tags?: string[];
  };
  attempts: number;
  lastAttempt?: number;
}

export class OfflineStorageService {
  private static PENDING_UPLOADS_KEY = 'BALLTALK_PENDING_UPLOADS';
  private static OFFLINE_FILES_DIR = `${FileSystem.documentDirectory}offline_audio/`;
  
  /**
   * Initialize the offline storage system
   */
  async initialize(): Promise<void> {
    // Create offline directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(OfflineStorageService.OFFLINE_FILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(OfflineStorageService.OFFLINE_FILES_DIR, {
        intermediates: true
      });
    }
    
    console.log('[OfflineStorageService] Offline storage initialized');
  }
  
  /**
   * Save an audio file to offline storage and queue it for upload
   */
  async saveForUpload(
    fileUri: string, 
    fileName: string,
    fileSize: number,
    metadata: PendingUpload['metadata']
  ): Promise<PendingUpload> {
    // Generate a local copy of the file
    const offlineId = uuidv4();
    const localFileName = `${offlineId}_${fileName}`;
    const localFilePath = `${OfflineStorageService.OFFLINE_FILES_DIR}${localFileName}`;
    
    // Copy file to local storage
    await FileSystem.copyAsync({
      from: fileUri,
      to: localFilePath
    });
    
    // Create pending upload entry
    const pendingUpload: PendingUpload = {
      id: offlineId,
      fileUri: localFilePath,
      fileName,
      fileSize,
      metadata: {
        ...metadata,
        createdAt: Date.now()
      },
      attempts: 0
    };
    
    // Add to pending uploads list
    await this.addPendingUpload(pendingUpload);
    
    return pendingUpload;
  }
  
  /**
   * Add a pending upload to the queue
   */
  private async addPendingUpload(upload: PendingUpload): Promise<void> {
    const pendingUploads = await this.getPendingUploads();
    pendingUploads.push(upload);
    await AsyncStorage.setItem(
      OfflineStorageService.PENDING_UPLOADS_KEY, 
      JSON.stringify(pendingUploads)
    );
  }
  
  /**
   * Get all pending uploads
   */
  async getPendingUploads(): Promise<PendingUpload[]> {
    const data = await AsyncStorage.getItem(OfflineStorageService.PENDING_UPLOADS_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  /**
   * Remove a pending upload after successful upload
   */
  async removePendingUpload(id: string): Promise<void> {
    const pendingUploads = await this.getPendingUploads();
    const updatedUploads = pendingUploads.filter(upload => upload.id !== id);
    
    await AsyncStorage.setItem(
      OfflineStorageService.PENDING_UPLOADS_KEY, 
      JSON.stringify(updatedUploads)
    );
    
    // Clean up the file if it exists
    const upload = pendingUploads.find(upload => upload.id === id);
    if (upload) {
      const fileInfo = await FileSystem.getInfoAsync(upload.fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(upload.fileUri);
      }
    }
  }
  
  /**
   * Update a pending upload's attempts
   */
  async updateUploadAttempt(id: string): Promise<void> {
    const pendingUploads = await this.getPendingUploads();
    const updatedUploads = pendingUploads.map(upload => {
      if (upload.id === id) {
        return {
          ...upload,
          attempts: upload.attempts + 1,
          lastAttempt: Date.now()
        };
      }
      return upload;
    });
    
    await AsyncStorage.setItem(
      OfflineStorageService.PENDING_UPLOADS_KEY, 
      JSON.stringify(updatedUploads)
    );
  }
  
  /**
   * Clear all offline data (for testing/debugging)
   */
  async clearAllData(): Promise<void> {
    // Clear pending uploads list
    await AsyncStorage.removeItem(OfflineStorageService.PENDING_UPLOADS_KEY);
    
    // Delete all files in offline directory
    const files = await FileSystem.readDirectoryAsync(OfflineStorageService.OFFLINE_FILES_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(`${OfflineStorageService.OFFLINE_FILES_DIR}${file}`);
    }
  }
}

export default new OfflineStorageService(); 