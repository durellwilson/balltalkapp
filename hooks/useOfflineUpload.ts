import { useState, useEffect, useCallback } from 'react';
import SyncService from '../services/SyncService';
import { PendingUpload } from '../services/OfflineStorageService';
import { useNetworkStatus } from './useNetworkStatus';

interface UseOfflineUploadResult {
  queueUpload: (
    fileUri: string, 
    fileName: string, 
    fileSize: number,
    userId: string, 
    duration: number, 
    mimeType: string,
    projectId?: string,
    trackId?: string,
    isPublic?: boolean,
    tags?: string[]
  ) => Promise<PendingUpload>;
  pendingUploads: number;
  pendingUploadsList: PendingUpload[];
  isOnline: boolean;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  refreshPendingUploads: () => Promise<void>;
}

/**
 * Hook for managing uploads with offline support
 * 
 * @returns Object with upload functions and status
 * 
 * @example
 * const { 
 *   queueUpload, 
 *   pendingUploads, 
 *   isOnline, 
 *   isSyncing, 
 *   syncNow 
 * } = useOfflineUpload();
 * 
 * // Queue an upload
 * const handleUpload = async () => {
 *   await queueUpload(
 *     fileUri, 
 *     fileName, 
 *     fileSize,
 *     userId, 
 *     duration, 
 *     mimeType
 *   );
 * };
 */
export function useOfflineUpload(): UseOfflineUploadResult {
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pendingUploadsList, setPendingUploadsList] = useState<PendingUpload[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isConnected: isOnline } = useNetworkStatus();
  
  // Initialize SyncService and set up polling
  useEffect(() => {
    // Initialize SyncService
    SyncService.initialize().catch(error => {
      console.error('[useOfflineUpload] Failed to initialize SyncService:', error);
    });
    
    // Set up polling to check pending uploads count
    const checkPendingInterval = setInterval(refreshPendingUploads, 10000);
    
    // Initial check
    refreshPendingUploads();
    
    return () => {
      clearInterval(checkPendingInterval);
    };
  }, []);
  
  // Refresh pending uploads count and list
  const refreshPendingUploads = useCallback(async () => {
    try {
      const count = await SyncService.getPendingUploadCount();
      setPendingUploads(count);
      
      const uploads = await SyncService.getPendingUploads();
      setPendingUploadsList(uploads);
    } catch (error) {
      console.error('[useOfflineUpload] Error refreshing pending uploads:', error);
    }
  }, []);
  
  // Queue an upload
  const queueUpload = useCallback(async (
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
  ): Promise<PendingUpload> => {
    const pendingUpload = await SyncService.queueUpload(
      fileUri, 
      fileName,
      fileSize,
      userId, 
      duration, 
      mimeType,
      projectId,
      trackId,
      isPublic,
      tags
    );
    
    // Update pending count and list
    await refreshPendingUploads();
    
    return pendingUpload;
  }, [refreshPendingUploads]);
  
  // Manually trigger sync
  const syncNow = useCallback(async (): Promise<void> => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await SyncService.sync();
      
      // Update pending count and list
      await refreshPendingUploads();
    } catch (error) {
      console.error('[useOfflineUpload] Error during manual sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshPendingUploads]);
  
  return {
    queueUpload,
    pendingUploads,
    pendingUploadsList,
    isOnline,
    isSyncing,
    syncNow,
    refreshPendingUploads
  };
}

export default useOfflineUpload; 