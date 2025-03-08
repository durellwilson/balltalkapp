import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
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
import DolbyMasteringService, { DolbyOutputFormat } from './DolbyMasteringService';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const VOCAL_ISOLATION_RESULTS_COLLECTION = 'vocal_isolation_results';

// Dolby.io API credentials
// In production, these should be stored in environment variables
const DOLBY_API_KEY = process.env.EXPO_PUBLIC_DOLBY_API_KEY || 'PC8pXW1sUPX2F1tRyvDzEw==';
const DOLBY_API_SECRET = process.env.EXPO_PUBLIC_DOLBY_API_SECRET || 'W3LLNiTCO3rT5lFWhANBlTlpgc91djWVVwqfdJZDcFc=';
const DOLBY_MEDIA_API_URL = 'https://api.dolby.com/media';

// Use mock implementation for testing
const USE_MOCK_IMPLEMENTATION = true;

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 3;
// Base delay for exponential backoff (in milliseconds)
const BASE_RETRY_DELAY = 1000;

// Vocal isolation modes
export enum VocalIsolationMode {
  VOCALS_ONLY = 'vocals_only',
  INSTRUMENTAL_ONLY = 'instrumental_only',
  SEPARATE_TRACKS = 'separate_tracks'
}

// Vocal isolation options
export interface VocalIsolationOptions {
  mode: VocalIsolationMode;
  outputFormat: DolbyOutputFormat;
  preserveMetadata: boolean;
}

// Vocal isolation result
export interface VocalIsolationResult {
  id: string;
  originalFileUrl: string;
  vocalsFileUrl?: string;
  instrumentalFileUrl?: string;
  mode: VocalIsolationMode;
  outputFormat: DolbyOutputFormat;
  metrics: {
    vocalSeparationQuality: number;
    vocalPresence: number;
  };
  createdAt: string;
  userId: string;
  projectId?: string;
  trackId?: string;
}

class VocalIsolationService {
  // Get authentication headers for Dolby.io API
  private getAuthHeaders() {
    // In a production environment, you would use a more secure method to store and retrieve API credentials
    const credentials = `${DOLBY_API_KEY}:${DOLBY_API_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    
    return {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Helper method for making API requests with retry logic
  private async makeApiRequest(
    url: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    data?: any, 
    retryAttempt: number = 0
  ): Promise<any> {
    try {
      const response = await axios({
        method,
        url,
        headers: this.getAuthHeaders(),
        data
      });
      
      return response.data;
    } catch (error: any) {
      // Check if we should retry
      if (retryAttempt < MAX_RETRY_ATTEMPTS && this.isRetryableError(error)) {
        // Calculate delay with exponential backoff
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryAttempt);
        
        console.log(`API request failed, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`, error.message);
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return this.makeApiRequest(url, method, data, retryAttempt + 1);
      }
      
      // If we've exhausted retries or it's not a retryable error, throw the error
      console.error('API request failed after retries:', error);
      throw error;
    }
  }

  // Determine if an error is retryable
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (!error.response) {
      return true;
    }
    
    // 5xx errors are retryable
    if (error.response.status >= 500 && error.response.status < 600) {
      return true;
    }
    
    // 429 Too Many Requests is retryable
    if (error.response.status === 429) {
      return true;
    }
    
    // Other errors are not retryable
    return false;
  }

  // Isolate vocals from a song
  async isolateVocals(
    userId: string,
    audioFileUrl: string,
    options: VocalIsolationOptions,
    projectId?: string,
    trackId?: string
  ): Promise<VocalIsolationResult> {
    try {
      if (USE_MOCK_IMPLEMENTATION) {
        // Mock implementation for testing
        console.log('Using mock implementation for vocal isolation');
        
        // Generate a unique ID
        const resultId = uuidv4();
        
        // Create mock result
        const result: VocalIsolationResult = {
          id: resultId,
          originalFileUrl: audioFileUrl,
          mode: options.mode,
          outputFormat: options.outputFormat,
          metrics: {
            vocalSeparationQuality: 0.85,
            vocalPresence: 0.75
          },
          createdAt: new Date().toISOString(),
          userId,
          projectId,
          trackId
        };
        
        // Add appropriate URLs based on mode
        if (options.mode === VocalIsolationMode.VOCALS_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS) {
          result.vocalsFileUrl = audioFileUrl; // Use original for mock
        }
        
        if (options.mode === VocalIsolationMode.INSTRUMENTAL_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS) {
          result.instrumentalFileUrl = audioFileUrl; // Use original for mock
        }
        
        // Save result to Firestore
        await this.saveVocalIsolationResult(result);
        
        return result;
      }
      
      // Real implementation
      // Prepare request data
      const requestData = {
        input: audioFileUrl,
        output: {
          format: DolbyMasteringService.mapOutputFormat(options.outputFormat)
        },
        content: {
          type: 'music'
        },
        audio: {
          vocal_isolation: {
            mode: this.mapVocalIsolationMode(options.mode)
          }
        }
      };
      
      // Make API request
      const response = await this.makeApiRequest(
        `${DOLBY_MEDIA_API_URL}/enhance`,
        'POST',
        requestData
      );
      
      // Extract job ID
      const jobId = response.job_id;
      
      // Poll for job completion
      const jobResult = await this.pollJobStatus(jobId);
      
      // Extract output URLs and metrics
      const vocalsFileUrl = options.mode === VocalIsolationMode.VOCALS_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS 
        ? jobResult.output.vocals 
        : undefined;
        
      const instrumentalFileUrl = options.mode === VocalIsolationMode.INSTRUMENTAL_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS 
        ? jobResult.output.instrumental 
        : undefined;
      
      const metrics = jobResult.metrics || {
        vocal_separation_quality: 0,
        vocal_presence: 0
      };
      
      // Format result
      const result: VocalIsolationResult = {
        id: jobId,
        originalFileUrl: audioFileUrl,
        vocalsFileUrl,
        instrumentalFileUrl,
        mode: options.mode,
        outputFormat: options.outputFormat,
        metrics: {
          vocalSeparationQuality: metrics.vocal_separation_quality || 0,
          vocalPresence: metrics.vocal_presence || 0
        },
        createdAt: new Date().toISOString(),
        userId,
        projectId,
        trackId
      };
      
      // Save result to Firestore
      await this.saveVocalIsolationResult(result);
      
      return result;
    } catch (error) {
      console.error('Error isolating vocals:', error);
      throw error;
    }
  }

  // Poll for job status
  private async pollJobStatus(jobId: string, maxAttempts: number = 30, interval: number = 2000): Promise<any> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        // Make API request to get job status
        const response = await this.makeApiRequest(
          `${DOLBY_MEDIA_API_URL}/enhance/job/${jobId}`,
          'GET'
        );
        
        // Check if job is complete
        if (response.status === 'Success') {
          return response;
        }
        
        // Check if job failed
        if (response.status === 'Failed') {
          throw new Error(`Job failed: ${response.error || 'Unknown error'}`);
        }
        
        // Wait for the next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        console.error(`Error polling job status (attempt ${attempts}/${maxAttempts}):`, error);
        
        // If we've exhausted retries, throw the error
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait for the next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      }
    }
    
    throw new Error(`Job timed out after ${maxAttempts} attempts`);
  }

  // Save vocal isolation result to Firestore
  private async saveVocalIsolationResult(result: VocalIsolationResult): Promise<void> {
    try {
      const resultRef = doc(firebaseDb, VOCAL_ISOLATION_RESULTS_COLLECTION, result.id);
      await setDoc(resultRef, {
        ...result,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving vocal isolation result:', error);
      throw error;
    }
  }

  // Get vocal isolation results for a user
  async getVocalIsolationResults(userId: string, limitCount: number = 10): Promise<VocalIsolationResult[]> {
    try {
      const resultsRef = collection(firebaseDb, VOCAL_ISOLATION_RESULTS_COLLECTION);
      const q = query(
        resultsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const resultsSnapshot = await getDocs(q);
      
      return resultsSnapshot.docs.map(doc => doc.data() as VocalIsolationResult);
    } catch (error) {
      console.error('Error getting vocal isolation results:', error);
      return [];
    }
  }

  // Get a specific vocal isolation result
  async getVocalIsolationResult(resultId: string): Promise<VocalIsolationResult | null> {
    try {
      const resultRef = doc(firebaseDb, VOCAL_ISOLATION_RESULTS_COLLECTION, resultId);
      const resultDoc = await getDoc(resultRef);
      
      if (resultDoc.exists()) {
        return resultDoc.data() as VocalIsolationResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting vocal isolation result:', error);
      return null;
    }
  }

  // Map vocal isolation mode to Dolby.io API format
  private mapVocalIsolationMode(mode: VocalIsolationMode): string {
    switch (mode) {
      case VocalIsolationMode.VOCALS_ONLY:
        return 'vocals_only';
      case VocalIsolationMode.INSTRUMENTAL_ONLY:
        return 'instrumental_only';
      case VocalIsolationMode.SEPARATE_TRACKS:
        return 'separate_tracks';
      default:
        return 'vocals_only';
    }
  }

  // Get default vocal isolation options
  getDefaultVocalIsolationOptions(): VocalIsolationOptions {
    return {
      mode: VocalIsolationMode.SEPARATE_TRACKS,
      outputFormat: DolbyOutputFormat.MP3,
      preserveMetadata: true
    };
  }
}

export default new VocalIsolationService(); 