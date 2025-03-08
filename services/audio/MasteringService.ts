import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc,
  Firestore,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';

import { db, storage } from '../../src/lib/firebase';
import { 
  MasteringOptions, 
  MasteringResult, 
  MasteringJobStatus, 
  MasteringHistory,
  MASTERING_PROFILES 
} from '../../models/audio/MasteringModels';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const MASTERING_COLLECTION = 'mastering_sessions';
const MASTERING_JOBS_COLLECTION = 'mastering_jobs';
const MASTERING_HISTORY_COLLECTION = 'mastering_history';

/**
 * Service for audio mastering using Dolby.io and Masterchannel APIs
 */
class MasteringService {
  private readonly dolbyApiKey: string;
  private readonly dolbyApiUrl: string;
  private readonly masterchannelApiKey: string;
  private readonly masterchannelApiUrl: string;
  
  constructor() {
    // In a real app, these would be loaded from environment variables
    this.dolbyApiKey = process.env.DOLBY_API_KEY || '';
    this.dolbyApiUrl = 'https://api.dolby.io/media/master';
    this.masterchannelApiKey = process.env.MASTERCHANNEL_API_KEY || '';
    this.masterchannelApiUrl = 'https://api.masterchannel.io/v1';
  }
  
  /**
   * Master a track using Dolby.io API
   * @param fileUri URI of the audio file to master
   * @param options Mastering options
   * @param userId ID of the user creating the mastering
   * @param projectId Optional project ID
   * @param trackId Optional track ID
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the mastering result
   */
  async masterTrack(
    fileUri: string,
    options: MasteringOptions,
    userId: string,
    projectId?: string,
    trackId?: string,
    onProgress?: (progress: number) => void
  ): Promise<MasteringResult> {
    try {
      // Generate a unique ID for this mastering session
      const masteringId = uuidv4();
      const now = new Date().toISOString();
      
      // Create initial mastering result with 'processing' status
      const initialResult: MasteringResult = {
        id: masteringId,
        originalFileUrl: fileUri,
        processedFileUrl: '',
        waveformDataBefore: [],
        waveformDataAfter: [],
        processingMetadata: {
          peakLoudness: 0,
          averageLoudness: 0,
          dynamicRange: 0,
          stereoWidth: 0,
          processedAt: now,
          processingTime: 0,
          apiProvider: 'dolby'
        },
        options,
        userId,
        projectId,
        trackId,
        status: 'processing',
        createdAt: now,
        updatedAt: now
      };
      
      // Save initial result to Firestore
      await setDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), initialResult);
      
      // Create a job status entry
      const jobId = uuidv4();
      const jobStatus: MasteringJobStatus = {
        id: jobId,
        status: 'queued',
        progress: 0,
        message: 'Preparing to master track',
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(firebaseDb, MASTERING_JOBS_COLLECTION, jobId), jobStatus);
      
      // Update progress to 10%
      if (onProgress) onProgress(10);
      await this.updateJobStatus(jobId, 'processing', 10, 'Uploading audio file');
      
      // Process the audio file
      let result: MasteringResult;
      
      // Try Dolby.io API first
      try {
        result = await this.processDolbyMastering(
          fileUri, 
          options, 
          masteringId, 
          userId, 
          jobId, 
          onProgress
        );
      } catch (dolbyError) {
        console.error('Error with Dolby.io mastering:', dolbyError);
        
        // Fall back to Masterchannel API
        try {
          // Update job status to indicate fallback
          await this.updateJobStatus(
            jobId, 
            'processing', 
            30, 
            'Falling back to alternative mastering service'
          );
          
          // Update the mastering result to use Masterchannel
          await updateDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), {
            processingMetadata: {
              ...initialResult.processingMetadata,
              apiProvider: 'masterchannel'
            },
            updatedAt: new Date().toISOString()
          });
          
          result = await this.processMasterchannelMastering(
            fileUri, 
            options, 
            masteringId, 
            userId, 
            jobId, 
            onProgress
          );
        } catch (masterchannelError) {
          console.error('Error with Masterchannel mastering:', masterchannelError);
          
          // Both APIs failed, update status to failed
          const errorMessage = 'Both mastering services failed to process the audio';
          await this.updateJobStatus(jobId, 'failed', 0, errorMessage);
          
          // Update the mastering result with failure
          const failedResult: Partial<MasteringResult> = {
            status: 'failed',
            errorMessage,
            updatedAt: new Date().toISOString()
          };
          
          await updateDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), failedResult);
          
          // Throw error to be caught by caller
          throw new Error(errorMessage);
        }
      }
      
      // Update job status to completed
      await this.updateJobStatus(jobId, 'completed', 100, 'Mastering completed successfully');
      
      // Add to user's mastering history
      await this.addToMasteringHistory(userId, {
        id: masteringId,
        trackName: trackId || 'Untitled Track',
        createdAt: now,
        profileUsed: options.profileName,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      console.error('Error in masterTrack:', error);
      throw error;
    }
  }
  
  /**
   * Process mastering using Dolby.io API
   * @private
   */
  private async processDolbyMastering(
    fileUri: string,
    options: MasteringOptions,
    masteringId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<MasteringResult> {
    const startTime = Date.now();
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 20, 'Uploading to Dolby.io');
    if (onProgress) onProgress(20);
    
    // 1. Upload the file to Firebase Storage first
    const originalFileName = fileUri.split('/').pop() || 'audio.wav';
    const storagePathOriginal = `mastering/${userId}/${masteringId}/original_${originalFileName}`;
    const originalFileRef = ref(firebaseStorage, storagePathOriginal);
    
    // For web, we need to fetch the file as a blob
    let fileBlob: Blob;
    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      fileBlob = await response.blob();
    } else {
      // For native platforms, we'd use a different approach
      // This is a simplified example
      const response = await fetch(fileUri);
      fileBlob = await response.blob();
    }
    
    // Upload original file to Firebase Storage
    await uploadBytes(originalFileRef, fileBlob);
    const originalFileUrl = await getDownloadURL(originalFileRef);
    
    // Update the mastering result with the original file URL
    await updateDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), {
      originalFileUrl,
      updatedAt: new Date().toISOString()
    });
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 30, 'Analyzing audio');
    if (onProgress) onProgress(30);
    
    // 2. Generate waveform data for the original file
    const waveformDataBefore = await this.generateWaveformData(fileBlob);
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 40, 'Preparing mastering parameters');
    if (onProgress) onProgress(40);
    
    // 3. Prepare Dolby.io API request
    // Convert our options to Dolby.io format
    const dolbyParams = this.convertOptionsToDolbyFormat(options);
    
    // 4. Call Dolby.io API
    // In a real implementation, this would make an actual API call
    // For this example, we'll simulate the API call
    await this.updateJobStatus(jobId, 'processing', 50, 'Processing with Dolby.io');
    if (onProgress) onProgress(50);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 70, 'Finalizing mastered audio');
    if (onProgress) onProgress(70);
    
    // 5. Download the processed file (simulated)
    // In a real implementation, we would download from Dolby.io
    // For this example, we'll just use the original file
    
    // 6. Upload the processed file to Firebase Storage
    const storagePathProcessed = `mastering/${userId}/${masteringId}/processed_${originalFileName}`;
    const processedFileRef = ref(firebaseStorage, storagePathProcessed);
    await uploadBytes(processedFileRef, fileBlob);
    const processedFileUrl = await getDownloadURL(processedFileRef);
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 80, 'Generating waveform data');
    if (onProgress) onProgress(80);
    
    // 7. Generate waveform data for the processed file
    // In a real implementation, this would be different from the original
    // For this example, we'll just use the same data
    const waveformDataAfter = [...waveformDataBefore];
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 90, 'Saving results');
    if (onProgress) onProgress(90);
    
    // 8. Create the final result
    const result: MasteringResult = {
      id: masteringId,
      originalFileUrl,
      processedFileUrl,
      waveformDataBefore,
      waveformDataAfter,
      processingMetadata: {
        peakLoudness: -1.2, // Simulated value
        averageLoudness: options.targetLoudness,
        dynamicRange: 8.5, // Simulated value
        stereoWidth: options.enhanceStereoImage ? 85 : 70, // Simulated value
        processedAt: new Date().toISOString(),
        processingTime,
        apiProvider: 'dolby'
      },
      options,
      userId,
      projectId: options.projectId,
      trackId: options.trackId,
      status: 'completed',
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 9. Save the result to Firestore
    await setDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), result);
    
    // Update job status
    await this.updateJobStatus(jobId, 'completed', 100, 'Mastering completed');
    if (onProgress) onProgress(100);
    
    return result;
  }
  
  /**
   * Process mastering using Masterchannel API
   * @private
   */
  private async processMasterchannelMastering(
    fileUri: string,
    options: MasteringOptions,
    masteringId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<MasteringResult> {
    // This would be similar to the Dolby.io implementation
    // For brevity, we'll just return a simulated result
    
    const startTime = Date.now();
    
    // Simulate processing steps
    await this.updateJobStatus(jobId, 'processing', 40, 'Processing with Masterchannel');
    if (onProgress) onProgress(40);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the original file URL from Firestore
    const masteringDoc = await getDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId));
    const masteringData = masteringDoc.data() as MasteringResult;
    const originalFileUrl = masteringData.originalFileUrl;
    
    // For a real implementation, we would:
    // 1. Upload the file to Masterchannel
    // 2. Process it with their API
    // 3. Download the result
    // 4. Upload it to Firebase Storage
    
    // Simulate uploading processed file
    const originalFileName = originalFileUrl.split('/').pop() || 'audio.wav';
    const storagePathProcessed = `mastering/${userId}/${masteringId}/processed_${originalFileName}`;
    
    // Fetch the original file
    const response = await fetch(originalFileUrl);
    const fileBlob = await response.blob();
    
    // Upload to Firebase Storage
    const processedFileRef = ref(firebaseStorage, storagePathProcessed);
    await uploadBytes(processedFileRef, fileBlob);
    const processedFileUrl = await getDownloadURL(processedFileRef);
    
    // Generate waveform data
    const waveformDataBefore = await this.generateWaveformData(fileBlob);
    const waveformDataAfter = [...waveformDataBefore]; // Simulated
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Create the result
    const result: MasteringResult = {
      id: masteringId,
      originalFileUrl,
      processedFileUrl,
      waveformDataBefore,
      waveformDataAfter,
      processingMetadata: {
        peakLoudness: -1.5, // Simulated value
        averageLoudness: options.targetLoudness,
        dynamicRange: 7.8, // Simulated value
        stereoWidth: options.enhanceStereoImage ? 80 : 65, // Simulated value
        processedAt: new Date().toISOString(),
        processingTime,
        apiProvider: 'masterchannel'
      },
      options,
      userId,
      projectId: options.projectId,
      trackId: options.trackId,
      status: 'completed',
      createdAt: masteringData.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    // Save the result to Firestore
    await setDoc(doc(firebaseDb, MASTERING_COLLECTION, masteringId), result);
    
    return result;
  }
  
  /**
   * Update the status of a mastering job
   * @private
   */
  private async updateJobStatus(
    jobId: string,
    status: MasteringJobStatus['status'],
    progress: number,
    message?: string
  ): Promise<void> {
    await updateDoc(doc(firebaseDb, MASTERING_JOBS_COLLECTION, jobId), {
      status,
      progress,
      message,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Add a mastering session to the user's history
   * @private
   */
  private async addToMasteringHistory(
    userId: string,
    session: {
      id: string;
      trackName: string;
      createdAt: string;
      profileUsed: string;
      status: 'completed' | 'failed';
    }
  ): Promise<void> {
    // Get the user's mastering history
    const historyRef = doc(firebaseDb, MASTERING_HISTORY_COLLECTION, userId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      // Update existing history
      const history = historyDoc.data() as MasteringHistory;
      history.sessions.unshift(session); // Add to beginning of array
      
      // Limit to 50 sessions
      if (history.sessions.length > 50) {
        history.sessions = history.sessions.slice(0, 50);
      }
      
      await updateDoc(historyRef, { sessions: history.sessions });
    } else {
      // Create new history
      const history: MasteringHistory = {
        userId,
        sessions: [session]
      };
      
      await setDoc(historyRef, history);
    }
  }
  
  /**
   * Get a user's mastering history
   */
  async getMasteringHistory(userId: string): Promise<MasteringHistory> {
    const historyRef = doc(firebaseDb, MASTERING_HISTORY_COLLECTION, userId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      return historyDoc.data() as MasteringHistory;
    } else {
      return { userId, sessions: [] };
    }
  }
  
  /**
   * Get a mastering result by ID
   */
  async getMasteringResult(masteringId: string): Promise<MasteringResult | null> {
    const resultRef = doc(firebaseDb, MASTERING_COLLECTION, masteringId);
    const resultDoc = await getDoc(resultRef);
    
    if (resultDoc.exists()) {
      return resultDoc.data() as MasteringResult;
    } else {
      return null;
    }
  }
  
  /**
   * Get mastering results for a user
   */
  async getUserMasteringResults(userId: string, limit?: number): Promise<MasteringResult[]> {
    const resultsRef = collection(firebaseDb, MASTERING_COLLECTION);
    const q = query(
      resultsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      ...(limit ? [limit(limit)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MasteringResult);
  }
  
  /**
   * Get mastering results for a project
   */
  async getProjectMasteringResults(projectId: string): Promise<MasteringResult[]> {
    const resultsRef = collection(firebaseDb, MASTERING_COLLECTION);
    const q = query(
      resultsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MasteringResult);
  }
  
  /**
   * Get the status of a mastering job
   */
  async getJobStatus(jobId: string): Promise<MasteringJobStatus | null> {
    const jobRef = doc(firebaseDb, MASTERING_JOBS_COLLECTION, jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (jobDoc.exists()) {
      return jobDoc.data() as MasteringJobStatus;
    } else {
      return null;
    }
  }
  
  /**
   * Generate waveform data from an audio file
   * @private
   */
  private async generateWaveformData(audioBlob: Blob): Promise<number[]> {
    // In a real implementation, this would analyze the audio file
    // and generate actual waveform data
    // For this example, we'll return simulated data
    
    // Generate 100 random values between 0 and 1
    return Array.from({ length: 100 }, () => Math.random());
  }
  
  /**
   * Convert our options format to Dolby.io format
   * @private
   */
  private convertOptionsToDolbyFormat(options: MasteringOptions): any {
    // In a real implementation, this would convert our options
    // to the format expected by the Dolby.io API
    // For this example, we'll return a simplified object
    
    return {
      input: {
        source: options.originalFileUrl
      },
      output: {
        format: options.outputFormat?.fileFormat || 'wav'
      },
      content: {
        type: 'music'
      },
      audio: {
        loudness: {
          target: options.targetLoudness
        },
        noise_reduction: options.dynamicProcessing?.noiseReduction || 0,
        dynamics: {
          compression: options.dynamicProcessing?.compression || 50
        }
      }
    };
  }
  
  /**
   * Get available mastering profiles
   */
  getAvailableProfiles(): typeof MASTERING_PROFILES {
    return MASTERING_PROFILES;
  }
}

export default new MasteringService(); 