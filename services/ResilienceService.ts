import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import AudioMonitoringService from './AudioMonitoringService';
import { LogLevel } from '../models/monitoring/MonitoringModels';
import { Platform } from 'react-native';

// Types for operations that can be queued
export type QueuedOperation = {
  id: string;
  type: 'upload' | 'delete' | 'process';
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  payload: any;
  error?: string;
  lastAttemptAt?: number;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
};

// Types for file uploads
export type FileUploadOperation = QueuedOperation & {
  type: 'upload';
  payload: {
    localUri: string;
    destinationPath: string;
    mimeType: string;
    metadata?: Record<string, any>;
  };
};

// Configuration for the service
interface ResilienceConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  maxConcurrentOperations: number;
  autoStartQueue: boolean;
  persistQueueIntervalMs: number;
  networkCheckIntervalMs: number;
  maxQueueSize: number;
}

/**
 * Service for providing resilient operations that can withstand network 
 * interruptions, app restarts, and other disruptions
 */
class ResilienceService {
  private static instance: ResilienceService;
  private monitoringService: AudioMonitoringService;
  
  // Queue of operations
  private operationQueue: QueuedOperation[] = [];
  
  // Active operations
  private activeOperations: Set<string> = new Set();
  
  // Configuration
  private config: ResilienceConfig = {
    maxRetryAttempts: 5,
    retryDelayMs: 5000,
    maxConcurrentOperations: 3,
    autoStartQueue: true,
    persistQueueIntervalMs: 10000, // 10 seconds
    networkCheckIntervalMs: 30000, // 30 seconds
    maxQueueSize: 50,
  };
  
  // Interval IDs
  private queueProcessorIntervalId: NodeJS.Timeout | null = null;
  private persistQueueIntervalId: NodeJS.Timeout | null = null;
  private networkCheckIntervalId: NodeJS.Timeout | null = null;
  
  // Network state
  private isNetworkAvailable: boolean = true;
  
  // Queue processors for different operation types
  private operationProcessors: Record<string, (op: QueuedOperation) => Promise<boolean>> = {
    upload: this.processUpload.bind(this),
    delete: this.processDelete.bind(this),
    process: this.processProcessing.bind(this),
  };
  
  // Private constructor for singleton pattern
  private constructor() {
    this.monitoringService = AudioMonitoringService.getInstance();
    this.initialize();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ResilienceService {
    if (!ResilienceService.instance) {
      ResilienceService.instance = new ResilienceService();
    }
    return ResilienceService.instance;
  }
  
  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();
      
      // Check initial network state
      const networkState = await NetInfo.fetch();
      this.isNetworkAvailable = networkState.isConnected === true;
      
      // Set up network state listener
      this.setupNetworkListener();
      
      // Start intervals if auto-start is enabled
      if (this.config.autoStartQueue) {
        this.startQueueProcessor();
        this.startPersistQueueInterval();
        this.startNetworkCheckInterval();
      }
      
      this.monitoringService.log(LogLevel.INFO, 'ResilienceService initialized');
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'resilience_service_init'
      );
    }
  }
  
  /**
   * Set up network state listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasAvailable = this.isNetworkAvailable;
      this.isNetworkAvailable = state.isConnected === true;
      
      // Log network state changes
      if (wasAvailable !== this.isNetworkAvailable) {
        this.monitoringService.log(
          LogLevel.INFO, 
          `Network ${this.isNetworkAvailable ? 'connected' : 'disconnected'}`,
          { details: state }
        );
        
        // If network just became available, process queue immediately
        if (this.isNetworkAvailable && !wasAvailable) {
          this.processQueue();
        }
      }
    });
  }
  
  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    if (this.queueProcessorIntervalId) {
      clearInterval(this.queueProcessorIntervalId);
    }
    
    // Process immediately once
    this.processQueue();
    
    // Then set up interval
    this.queueProcessorIntervalId = setInterval(() => {
      this.processQueue();
    }, this.config.retryDelayMs);
  }
  
  /**
   * Start persist queue interval
   */
  private startPersistQueueInterval(): void {
    if (this.persistQueueIntervalId) {
      clearInterval(this.persistQueueIntervalId);
    }
    
    this.persistQueueIntervalId = setInterval(() => {
      this.persistQueue();
    }, this.config.persistQueueIntervalMs);
  }
  
  /**
   * Start network check interval
   */
  private startNetworkCheckInterval(): void {
    if (this.networkCheckIntervalId) {
      clearInterval(this.networkCheckIntervalId);
    }
    
    this.networkCheckIntervalId = setInterval(async () => {
      try {
        const networkState = await NetInfo.fetch();
        this.isNetworkAvailable = networkState.isConnected === true;
      } catch (error) {
        // Ignore errors checking network state
      }
    }, this.config.networkCheckIntervalMs);
  }
  
  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('resilience_operation_queue');
      if (queueData) {
        this.operationQueue = JSON.parse(queueData);
        
        // Trim queue if it's too large
        if (this.operationQueue.length > this.config.maxQueueSize) {
          // Keep newest operations, remove oldest
          this.operationQueue.sort((a, b) => b.createdAt - a.createdAt);
          this.operationQueue = this.operationQueue.slice(0, this.config.maxQueueSize);
          await this.persistQueue();
        }
        
        this.monitoringService.log(LogLevel.INFO, `Loaded ${this.operationQueue.length} operations from queue`);
      }
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'load_resilience_queue'
      );
      
      // Start with empty queue in case of error
      this.operationQueue = [];
    }
  }
  
  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('resilience_operation_queue', JSON.stringify(this.operationQueue));
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'persist_resilience_queue'
      );
    }
  }
  
  /**
   * Process the operation queue
   */
  private async processQueue(): Promise<void> {
    // Skip if network is unavailable
    if (!this.isNetworkAvailable) {
      return;
    }
    
    // Find pending operations that are not already in progress
    const pendingOps = this.operationQueue.filter(op => 
      op.status === 'pending' && !this.activeOperations.has(op.id)
    );
    
    if (pendingOps.length === 0) {
      return;
    }
    
    this.monitoringService.log(LogLevel.DEBUG, `Processing ${pendingOps.length} pending operations`);
    
    // Determine how many new operations we can start
    const availableSlots = this.config.maxConcurrentOperations - this.activeOperations.size;
    if (availableSlots <= 0) {
      return;
    }
    
    // Sort by created time (oldest first)
    pendingOps.sort((a, b) => a.createdAt - b.createdAt);
    
    // Start up to availableSlots operations
    const opsToStart = pendingOps.slice(0, availableSlots);
    for (const op of opsToStart) {
      this.processOperation(op).catch(error => {
        this.monitoringService.logError(
          error instanceof Error ? error : new Error(String(error)),
          'process_operation',
          { operationId: op.id, type: op.type }
        );
      });
    }
  }
  
  /**
   * Process a single operation
   */
  private async processOperation(operation: QueuedOperation): Promise<void> {
    // Mark as in progress
    this.activeOperations.add(operation.id);
    this.updateOperationStatus(operation.id, 'in_progress');
    
    try {
      const processor = this.operationProcessors[operation.type];
      if (!processor) {
        throw new Error(`No processor found for operation type: ${operation.type}`);
      }
      
      // Execute the operation
      const success = await processor(operation);
      
      if (success) {
        // Mark as completed
        this.updateOperationStatus(operation.id, 'completed');
        this.monitoringService.log(LogLevel.INFO, `Operation ${operation.id} completed successfully`);
      } else {
        // Increment attempt count
        operation.attempts += 1;
        operation.lastAttemptAt = Date.now();
        
        if (operation.attempts >= operation.maxAttempts) {
          // Max attempts reached
          this.updateOperationStatus(operation.id, 'failed', 'Maximum retry attempts reached');
          this.monitoringService.log(LogLevel.WARN, `Operation ${operation.id} failed after ${operation.attempts} attempts`);
        } else {
          // Back to pending for retry
          this.updateOperationStatus(operation.id, 'pending');
          this.monitoringService.log(LogLevel.INFO, `Operation ${operation.id} will be retried (attempt ${operation.attempts}/${operation.maxAttempts})`);
        }
      }
    } catch (error) {
      // Handle unexpected errors
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'process_operation',
        { operationId: operation.id, type: operation.type }
      );
      
      // Increment attempt count
      operation.attempts += 1;
      operation.lastAttemptAt = Date.now();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (operation.attempts >= operation.maxAttempts) {
        // Max attempts reached
        this.updateOperationStatus(operation.id, 'failed', errorMessage);
      } else {
        // Back to pending for retry
        this.updateOperationStatus(operation.id, 'pending', errorMessage);
      }
    } finally {
      // Remove from active operations
      this.activeOperations.delete(operation.id);
      
      // Persist queue
      this.persistQueue();
    }
  }
  
  /**
   * Update operation status
   */
  private updateOperationStatus(operationId: string, status: QueuedOperation['status'], error?: string): void {
    const index = this.operationQueue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.operationQueue[index].status = status;
      if (error) {
        this.operationQueue[index].error = error;
      }
    }
  }
  
  /**
   * Process a file upload operation
   * @private
   */
  private async processUpload(operation: QueuedOperation): Promise<boolean> {
    const uploadOp = operation as FileUploadOperation;
    const { localUri, destinationPath, mimeType, metadata } = uploadOp.payload;
    
    try {
      // Verify the local file exists
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error(`Local file does not exist: ${localUri}`);
      }
      
      // Create metric for tracking
      const metricId = this.monitoringService.startMetric('resilient_upload', {
        localUri,
        destinationPath,
        mimeType,
        size: fileInfo.size
      });
      
      // Handle web and native differently
      if (Platform.OS === 'web') {
        // Web upload implementation
        // This will need to be customized based on your actual upload endpoint
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': mimeType,
          },
          body: new Blob([await this.readFileAsArrayBuffer(localUri)], { type: mimeType })
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
      } else {
        // Native upload using Expo FileSystem
        const uploadOptions = {
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': mimeType,
          }
        };
        
        // This implementation uses expo-file-system's uploadAsync
        // Replace YOUR_UPLOAD_URL with the actual upload endpoint
        await FileSystem.uploadAsync('YOUR_UPLOAD_URL', localUri, uploadOptions);
      }
      
      // Record successful upload
      this.monitoringService.endMetric(metricId, { 
        success: true, 
        metadata 
      });
      
      return true;
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'resilient_upload',
        { operationId: operation.id, localUri, destinationPath }
      );
      
      return false;
    }
  }
  
  /**
   * Process a delete operation
   * @private
   */
  private async processDelete(operation: QueuedOperation): Promise<boolean> {
    try {
      // Implementation for delete operation
      // This is a placeholder and should be customized
      const { uri, remoteUri } = operation.payload;
      
      // Delete remote file if specified
      if (remoteUri) {
        // Implementation depends on your backend
        // For example, make an API call to delete the file
      }
      
      return true;
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'resilient_delete',
        { operationId: operation.id }
      );
      
      return false;
    }
  }
  
  /**
   * Process a processing operation
   * @private
   */
  private async processProcessing(operation: QueuedOperation): Promise<boolean> {
    try {
      // Implementation for audio processing operation
      // This is a placeholder and should be customized
      const { uri, processingType, options } = operation.payload;
      
      // Implementation will depend on your audio processing backend
      
      return true;
    } catch (error) {
      this.monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'resilient_processing',
        { operationId: operation.id }
      );
      
      return false;
    }
  }
  
  /**
   * Helper to read a file as ArrayBuffer (for web)
   * @private
   */
  private async readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.arrayBuffer();
    } else {
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
  }
  
  /**
   * Queue a file upload
   */
  public queueFileUpload(
    localUri: string,
    destinationPath: string,
    mimeType: string,
    metadata?: Record<string, any>
  ): string {
    // Create a unique ID for the operation
    const operationId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const operation: FileUploadOperation = {
      id: operationId,
      type: 'upload',
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: this.config.maxRetryAttempts,
      status: 'pending',
      payload: {
        localUri,
        destinationPath,
        mimeType,
        metadata
      }
    };
    
    // Add to queue
    this.operationQueue.push(operation);
    
    // Log the operation
    this.monitoringService.log(LogLevel.INFO, 'File upload queued', {
      operationId,
      localUri,
      destinationPath,
      mimeType
    });
    
    // Persist queue
    this.persistQueue();
    
    // Start processing immediately if auto-start is enabled
    if (this.config.autoStartQueue) {
      this.processQueue();
    }
    
    return operationId;
  }
  
  /**
   * Get the current status of an operation
   */
  public getOperationStatus(operationId: string): QueuedOperation | undefined {
    return this.operationQueue.find(op => op.id === operationId);
  }
  
  /**
   * Get all operations with a specific status
   */
  public getOperationsByStatus(status: QueuedOperation['status']): QueuedOperation[] {
    return this.operationQueue.filter(op => op.status === status);
  }
  
  /**
   * Cancel a pending operation
   */
  public cancelOperation(operationId: string): boolean {
    const index = this.operationQueue.findIndex(op => op.id === operationId && op.status === 'pending');
    if (index !== -1) {
      // Remove from queue
      this.operationQueue.splice(index, 1);
      
      // Persist queue
      this.persistQueue();
      
      this.monitoringService.log(LogLevel.INFO, 'Operation cancelled', { operationId });
      
      return true;
    }
    return false;
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ResilienceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Restart intervals if necessary
    if (this.config.autoStartQueue) {
      this.startQueueProcessor();
      this.startPersistQueueInterval();
      this.startNetworkCheckInterval();
    } else {
      // Stop intervals
      if (this.queueProcessorIntervalId) {
        clearInterval(this.queueProcessorIntervalId);
        this.queueProcessorIntervalId = null;
      }
      if (this.persistQueueIntervalId) {
        clearInterval(this.persistQueueIntervalId);
        this.persistQueueIntervalId = null;
      }
      if (this.networkCheckIntervalId) {
        clearInterval(this.networkCheckIntervalId);
        this.networkCheckIntervalId = null;
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Stop all intervals
    if (this.queueProcessorIntervalId) {
      clearInterval(this.queueProcessorIntervalId);
      this.queueProcessorIntervalId = null;
    }
    if (this.persistQueueIntervalId) {
      clearInterval(this.persistQueueIntervalId);
      this.persistQueueIntervalId = null;
    }
    if (this.networkCheckIntervalId) {
      clearInterval(this.networkCheckIntervalId);
      this.networkCheckIntervalId = null;
    }
    
    // Persist queue one last time
    this.persistQueue();
  }
}

export default ResilienceService; 