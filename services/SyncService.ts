import NetInfo from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import OfflineStorageService, { PendingUpload } from './OfflineStorageService';
import AudioUploadService from './AudioUploadService';
import NetworkErrorHandler from './NetworkErrorHandler';

class SyncService {
  private isInitialized = false;
  private isSyncing = false;
  private networkListeners: (() => void)[] = [];
  private networkHandler: NetworkErrorHandler;
  private audioUploadService: typeof AudioUploadService;
  
  constructor() {
    this.networkHandler = NetworkErrorHandler.getInstance();
    this.audioUploadService = AudioUploadService;
  }
  
  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize the offline storage
    await OfflineStorageService.initialize();
    
    // Configure background fetch
    await this.configureBackgroundFetch();
    
    // Set up network listeners
    this.setupNetworkListeners();
    
    this.isInitialized = true;
    console.log('[SyncService] Sync service initialized');
  }
  
  /**
   * Set up network change listeners
   */
  private setupNetworkListeners(): void {
    // Clean up any existing listeners
    while (this.networkListeners.length) {
      const unsubscribe = this.networkListeners.pop();
      unsubscribe?.();
    }
    
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.sync();
      }
    });
    
    this.networkListeners.push(unsubscribe);
  }
  
  /**
   * Configure background fetch for periodic sync
   */
  private async configureBackgroundFetch(): Promise<void> {
    try {
      // Configure background fetch
      await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // Fetch at least every 15 minutes
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
        },
        async taskId => {
          console.log('[SyncService] Background fetch task:', taskId);
          await this.sync();
          // Required: Signal completion of your task
          BackgroundFetch.finish(taskId);
        },
        error => {
          console.error('[SyncService] Failed to configure background fetch:', error);
        }
      );
      
      // Optional: Check status
      const status = await BackgroundFetch.status();
      console.log('[SyncService] Background fetch status:', status);
    } catch (error) {
      console.error('[SyncService] Failed to configure background fetch:', error);
    }
  }
  
  /**
   * Sync pending uploads
   */
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    
    // Check network connection
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('[SyncService] No network connection, skipping sync');
      return;
    }
    
    try {
      this.isSyncing = true;
      console.log('[SyncService] Starting sync process');
      
      // Get all pending uploads
      const pendingUploads = await OfflineStorageService.getPendingUploads();
      
      if (pendingUploads.length === 0) {
        console.log('[SyncService] No pending uploads to sync');
        return;
      }
      
      console.log(`[SyncService] Found ${pendingUploads.length} pending uploads to sync`);
      
      // Process each pending upload
      for (const upload of pendingUploads) {
        await this.processPendingUpload(upload);
      }
      
    } catch (error) {
      console.error('[SyncService] Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Process a single pending upload
   */
  private async processPendingUpload(upload: PendingUpload): Promise<void> {
    try {
      console.log(`[SyncService] Processing upload: ${upload.id} (${upload.fileName})`);
      
      // Update attempt counter
      await OfflineStorageService.updateUploadAttempt(upload.id);
      
      // Skip if too many failed attempts (max 5 attempts)
      if (upload.attempts >= 5) {
        console.log(`[SyncService] Upload ${upload.id} has too many failed attempts, skipping`);
        return;
      }
      
      // Upload the file
      const result = await this.audioUploadService.uploadAudioFile(
        upload.metadata.userId,
        upload.fileUri,
        upload.fileName,
        upload.fileSize,
        upload.metadata.duration,
        upload.metadata.mimeType,
        upload.metadata.projectId,
        upload.metadata.trackId,
        upload.metadata.isPublic || false,
        upload.metadata.tags || [],
        (progress) => console.log(`[SyncService] Upload progress for ${upload.id}: ${progress}%`)
      );
      
      if (result.success) {
        console.log(`[SyncService] Successfully uploaded ${upload.id}`);
        // Remove from pending uploads
        await OfflineStorageService.removePendingUpload(upload.id);
      } else {
        console.error(`[SyncService] Failed to upload ${upload.id}:`, result.error);
      }
    } catch (error) {
      console.error(`[SyncService] Error processing upload ${upload.id}:`, error);
    }
  }
  
  /**
   * Add a new upload to the sync queue
   */
  async queueUpload(
    fileUri: string, 
    fileName: string,
    fileSize: number,
    userId: string, 
    duration: number, 
    mimeType: string,
    projectId?: string,
    trackId?: string,
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<PendingUpload> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const pendingUpload = await OfflineStorageService.saveForUpload(
      fileUri, 
      fileName,
      fileSize,
      {
        userId,
        duration,
        mimeType,
        projectId,
        trackId,
        isPublic,
        tags
      }
    );
    
    // Try to sync immediately if we have a network connection
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected && !this.isSyncing) {
      this.sync();
    }
    
    return pendingUpload;
  }
  
  /**
   * Check if there are any pending uploads
   */
  async hasPendingUploads(): Promise<boolean> {
    const pendingUploads = await OfflineStorageService.getPendingUploads();
    return pendingUploads.length > 0;
  }
  
  /**
   * Get the count of pending uploads
   */
  async getPendingUploadCount(): Promise<number> {
    const pendingUploads = await OfflineStorageService.getPendingUploads();
    return pendingUploads.length;
  }
  
  /**
   * Get all pending uploads
   */
  async getPendingUploads(): Promise<PendingUpload[]> {
    return OfflineStorageService.getPendingUploads();
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clean up network listeners
    while (this.networkListeners.length) {
      const unsubscribe = this.networkListeners.pop();
      unsubscribe?.();
    }
  }
}

export default new SyncService(); 