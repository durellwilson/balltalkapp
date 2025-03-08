import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, collection, query, where, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { firebaseDb } from '../../config/firebase';
import DolbyMasteringService, { DolbyEnhancementOptions, DolbyEnhancementResult } from './DolbyMasteringService';
import VocalIsolationService, { VocalIsolationOptions, VocalIsolationResult } from './VocalIsolationService';

// Constants
const BATCH_JOBS_COLLECTION = 'batch_processing_jobs';
const USE_MOCK_IMPLEMENTATION = true;

// Enum for batch processing job status
export enum BatchJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Enum for batch processing job type
export enum BatchJobType {
  ENHANCEMENT = 'enhancement',
  MASTERING = 'mastering',
  VOCAL_ISOLATION = 'vocal_isolation',
  ANALYSIS = 'analysis'
}

// Interface for batch processing job item
export interface BatchJobItem {
  id: string;
  audioUri: string;
  audioName?: string;
  status: BatchJobStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// Interface for batch processing job
export interface BatchProcessingJob {
  id: string;
  userId: string;
  jobType: BatchJobType;
  items: BatchJobItem[];
  options: any;
  status: BatchJobStatus;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

class BatchProcessingService {
  /**
   * Create a new batch processing job
   * @param userId User ID
   * @param jobType Job type
   * @param audioUris Array of audio URIs
   * @param audioNames Array of audio names (optional)
   * @param options Job options
   * @param projectId Project ID (optional)
   * @returns Promise with the batch processing job
   */
  public static async createBatchJob(
    userId: string,
    jobType: BatchJobType,
    audioUris: string[],
    audioNames: string[] = [],
    options: any,
    projectId?: string
  ): Promise<BatchProcessingJob> {
    // Create job items
    const items: BatchJobItem[] = audioUris.map((uri, index) => ({
      id: uuidv4(),
      audioUri: uri,
      audioName: audioNames[index] || `Audio ${index + 1}`,
      status: BatchJobStatus.PENDING
    }));
    
    // Create job
    const job: BatchProcessingJob = {
      id: uuidv4(),
      userId,
      jobType,
      items,
      options,
      status: BatchJobStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId
    };
    
    // Save job to Firestore
    await this.saveBatchJob(job);
    
    return job;
  }
  
  /**
   * Start processing a batch job
   * @param jobId Job ID
   * @returns Promise with the updated batch processing job
   */
  public static async startBatchJob(jobId: string): Promise<BatchProcessingJob> {
    // Get job
    const job = await this.getBatchJob(jobId);
    if (!job) {
      throw new Error(`Batch job with ID ${jobId} not found`);
    }
    
    // Check if job is already processing
    if (job.status === BatchJobStatus.PROCESSING) {
      return job;
    }
    
    // Update job status
    job.status = BatchJobStatus.PROCESSING;
    job.updatedAt = new Date();
    
    // Save job to Firestore
    await this.saveBatchJob(job);
    
    // Process job in background
    this.processJob(job).catch(error => {
      console.error(`Error processing batch job ${jobId}:`, error);
    });
    
    return job;
  }
  
  /**
   * Cancel a batch job
   * @param jobId Job ID
   * @returns Promise with the updated batch processing job
   */
  public static async cancelBatchJob(jobId: string): Promise<BatchProcessingJob> {
    // Get job
    const job = await this.getBatchJob(jobId);
    if (!job) {
      throw new Error(`Batch job with ID ${jobId} not found`);
    }
    
    // Check if job can be cancelled
    if (job.status === BatchJobStatus.COMPLETED || job.status === BatchJobStatus.FAILED) {
      throw new Error(`Cannot cancel job with status ${job.status}`);
    }
    
    // Update job status
    job.status = BatchJobStatus.CANCELLED;
    job.updatedAt = new Date();
    
    // Update pending items to cancelled
    job.items.forEach(item => {
      if (item.status === BatchJobStatus.PENDING) {
        item.status = BatchJobStatus.CANCELLED;
      }
    });
    
    // Save job to Firestore
    await this.saveBatchJob(job);
    
    return job;
  }
  
  /**
   * Get a batch job
   * @param jobId Job ID
   * @returns Promise with the batch processing job
   */
  public static async getBatchJob(jobId: string): Promise<BatchProcessingJob | null> {
    try {
      const docRef = doc(firebaseDb, BATCH_JOBS_COLLECTION, jobId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as BatchProcessingJob;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting batch job:', error);
      throw error;
    }
  }
  
  /**
   * Get batch jobs for a user
   * @param userId User ID
   * @param limitCount Optional limit on number of jobs
   * @returns Promise with array of batch processing jobs
   */
  public static async getBatchJobs(
    userId: string,
    limitCount: number = 10
  ): Promise<BatchProcessingJob[]> {
    try {
      const jobsRef = collection(firebaseDb, BATCH_JOBS_COLLECTION);
      const q = query(
        jobsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs: BatchProcessingJob[] = [];
      
      querySnapshot.forEach(doc => {
        jobs.push(doc.data() as BatchProcessingJob);
      });
      
      return jobs;
    } catch (error) {
      console.error('Error getting batch jobs:', error);
      throw error;
    }
  }
  
  /**
   * Save batch job to Firestore
   * @param job Batch processing job
   * @returns Promise
   */
  private static async saveBatchJob(job: BatchProcessingJob): Promise<void> {
    try {
      const docRef = doc(firebaseDb, BATCH_JOBS_COLLECTION, job.id);
      await setDoc(docRef, job);
      console.log(`Saved batch job with ID: ${job.id}`);
    } catch (error) {
      console.error('Error saving batch job:', error);
      throw error;
    }
  }
  
  /**
   * Process a batch job
   * @param job Batch processing job
   * @returns Promise
   */
  private static async processJob(job: BatchProcessingJob): Promise<void> {
    try {
      console.log(`Processing batch job ${job.id} of type ${job.jobType}`);
      
      // Process each item
      for (let i = 0; i < job.items.length; i++) {
        const item = job.items[i];
        
        // Skip items that are not pending
        if (item.status !== BatchJobStatus.PENDING) {
          continue;
        }
        
        // Update item status
        item.status = BatchJobStatus.PROCESSING;
        item.startedAt = new Date();
        
        // Update job progress
        job.progress = Math.floor((i / job.items.length) * 100);
        job.updatedAt = new Date();
        
        // Save job to Firestore
        await this.saveBatchJob(job);
        
        try {
          // Process item based on job type
          let result;
          
          switch (job.jobType) {
            case BatchJobType.ENHANCEMENT:
              result = await DolbyMasteringService.enhanceAudio(
                job.userId,
                item.audioUri,
                job.options as DolbyEnhancementOptions,
                job.projectId
              );
              break;
              
            case BatchJobType.MASTERING:
              result = await DolbyMasteringService.masterAudio(
                job.userId,
                item.audioUri,
                job.options,
                job.projectId
              );
              break;
              
            case BatchJobType.VOCAL_ISOLATION:
              result = await VocalIsolationService.isolateVocals(
                job.userId,
                item.audioUri,
                job.options as VocalIsolationOptions,
                job.projectId
              );
              break;
              
            case BatchJobType.ANALYSIS:
              result = await DolbyMasteringService.analyzeAudio(
                job.userId,
                item.audioUri,
                job.projectId
              );
              break;
              
            default:
              throw new Error(`Unsupported job type: ${job.jobType}`);
          }
          
          // Update item with result
          item.status = BatchJobStatus.COMPLETED;
          item.result = result;
          item.completedAt = new Date();
        } catch (error) {
          // Update item with error
          item.status = BatchJobStatus.FAILED;
          item.error = error instanceof Error ? error.message : String(error);
          item.completedAt = new Date();
        }
        
        // Update job progress
        job.progress = Math.floor(((i + 1) / job.items.length) * 100);
        job.updatedAt = new Date();
        
        // Save job to Firestore
        await this.saveBatchJob(job);
      }
      
      // Check if all items are processed
      const allCompleted = job.items.every(item => 
        item.status === BatchJobStatus.COMPLETED || 
        item.status === BatchJobStatus.FAILED ||
        item.status === BatchJobStatus.CANCELLED
      );
      
      // Update job status
      if (allCompleted) {
        job.status = BatchJobStatus.COMPLETED;
        job.progress = 100;
      }
      
      // Check if any items failed
      const anyFailed = job.items.some(item => item.status === BatchJobStatus.FAILED);
      
      // Update job status if any items failed
      if (anyFailed && job.status === BatchJobStatus.COMPLETED) {
        job.status = BatchJobStatus.COMPLETED; // Still mark as completed, but with failures
      }
      
      // Update job
      job.updatedAt = new Date();
      
      // Save job to Firestore
      await this.saveBatchJob(job);
      
      console.log(`Completed batch job ${job.id} with status ${job.status}`);
    } catch (error) {
      console.error(`Error processing batch job ${job.id}:`, error);
      
      // Update job status
      job.status = BatchJobStatus.FAILED;
      job.updatedAt = new Date();
      
      // Save job to Firestore
      await this.saveBatchJob(job);
    }
  }
  
  /**
   * Get batch job items for a job
   * @param jobId Job ID
   * @param status Optional status filter
   * @returns Promise with array of batch job items
   */
  public static async getBatchJobItems(
    jobId: string,
    status?: BatchJobStatus
  ): Promise<BatchJobItem[]> {
    // Get job
    const job = await this.getBatchJob(jobId);
    if (!job) {
      throw new Error(`Batch job with ID ${jobId} not found`);
    }
    
    // Filter items by status if provided
    if (status) {
      return job.items.filter(item => item.status === status);
    }
    
    return job.items;
  }
  
  /**
   * Get batch job item
   * @param jobId Job ID
   * @param itemId Item ID
   * @returns Promise with the batch job item
   */
  public static async getBatchJobItem(
    jobId: string,
    itemId: string
  ): Promise<BatchJobItem | null> {
    // Get job
    const job = await this.getBatchJob(jobId);
    if (!job) {
      throw new Error(`Batch job with ID ${jobId} not found`);
    }
    
    // Find item
    const item = job.items.find(item => item.id === itemId);
    
    return item || null;
  }
  
  /**
   * Retry a failed batch job item
   * @param jobId Job ID
   * @param itemId Item ID
   * @returns Promise with the updated batch job
   */
  public static async retryBatchJobItem(
    jobId: string,
    itemId: string
  ): Promise<BatchProcessingJob> {
    // Get job
    const job = await this.getBatchJob(jobId);
    if (!job) {
      throw new Error(`Batch job with ID ${jobId} not found`);
    }
    
    // Find item
    const itemIndex = job.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Batch job item with ID ${itemId} not found`);
    }
    
    const item = job.items[itemIndex];
    
    // Check if item can be retried
    if (item.status !== BatchJobStatus.FAILED) {
      throw new Error(`Cannot retry item with status ${item.status}`);
    }
    
    // Update item status
    item.status = BatchJobStatus.PENDING;
    item.error = undefined;
    item.result = undefined;
    item.startedAt = undefined;
    item.completedAt = undefined;
    
    // Update job status if it was completed or failed
    if (job.status === BatchJobStatus.COMPLETED || job.status === BatchJobStatus.FAILED) {
      job.status = BatchJobStatus.PROCESSING;
    }
    
    // Update job
    job.updatedAt = new Date();
    
    // Save job to Firestore
    await this.saveBatchJob(job);
    
    // Process job in background if it's not already processing
    if (job.status !== BatchJobStatus.PROCESSING) {
      this.processJob(job).catch(error => {
        console.error(`Error processing batch job ${jobId}:`, error);
      });
    }
    
    return job;
  }
}

export default BatchProcessingService; 