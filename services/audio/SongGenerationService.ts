// services/audio/SongGenerationService.ts

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
  SongGenerationOptions, 
  SongGenerationResult, 
  SongGenerationJobStatus, 
  SongGenerationHistory,
  SONG_GENERATION_TEMPLATES 
} from '../../models/audio/SongGenerationModels';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const SONG_GENERATION_COLLECTION = 'song_generations';
const SONG_GENERATION_JOBS_COLLECTION = 'song_generation_jobs';
const SONG_GENERATION_HISTORY_COLLECTION = 'song_generation_history';

/**
 * Service for AI song generation using Suno and Eachlabs APIs
 */
class SongGenerationService {
  private readonly sunoApiKey: string;
  private readonly sunoApiUrl: string;
  private readonly eachlabsApiKey: string;
  private readonly eachlabsApiUrl: string;
  
  constructor() {
    // In a real app, these would be loaded from environment variables
    this.sunoApiKey = process.env.SUNO_API_KEY || '';
    this.sunoApiUrl = 'https://api.suno.ai/v1';
    this.eachlabsApiKey = process.env.EACHLABS_API_KEY || '';
    this.eachlabsApiUrl = 'https://api.eachlabs.com/v1';
  }
  
  /**
   * Generate a song using AI
   * @param options Options for song generation
   * @param userId ID of the user generating the song
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the generated song
   */
  async generateSong(
    options: SongGenerationOptions,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<SongGenerationResult> {
    try {
      // Generate a unique ID for this song generation
      const songId = uuidv4();
      const now = new Date().toISOString();
      
      // Create initial song result with 'processing' status
      const initialResult: SongGenerationResult = {
        id: songId,
        songUrl: '',
        metadata: {
          title: options.prompt.split(' ').slice(0, 4).join(' '), // Simple title generation
          duration: 0,
          genre: options.genre,
          mood: options.mood,
          tempo: options.styleOptions?.tempo || 120,
          key: options.styleOptions?.key,
          generatedAt: now,
          apiProvider: options.apiProvider || 'suno',
          processingTime: 0
        },
        options,
        userId,
        versionNumber: 1,
        status: 'processing',
        createdAt: now,
        updatedAt: now
      };
      
      // Save initial result to Firestore
      await setDoc(doc(firebaseDb, SONG_GENERATION_COLLECTION, songId), initialResult);
      
      // Create a job status entry
      const jobId = uuidv4();
      const jobStatus: SongGenerationJobStatus = {
        id: jobId,
        status: 'queued',
        progress: 0,
        message: 'Preparing to generate song',
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(firebaseDb, SONG_GENERATION_JOBS_COLLECTION, jobId), jobStatus);
      
      // Update progress to 10%
      if (onProgress) onProgress(10);
      await this.updateJobStatus(jobId, 'processing', 10, 'Initializing song generation');
      
      // Process the song generation
      let result: SongGenerationResult;
      
      // Use the specified API provider or default to Suno
      const apiProvider = options.apiProvider || 'suno';
      
      if (apiProvider === 'suno') {
        result = await this.processSunoGeneration(
          options,
          songId,
          userId,
          jobId,
          onProgress
        );
      } else {
        result = await this.processEachlabsGeneration(
          options,
          songId,
          userId,
          jobId,
          onProgress
        );
      }
      
      // Update job status to completed
      await this.updateJobStatus(jobId, 'completed', 100, 'Song generation completed successfully');
      
      // Add to user's song generation history
      await this.addToSongGenerationHistory(userId, {
        id: songId,
        title: result.metadata.title,
        createdAt: now,
        genre: options.genre,
        status: 'completed',
        apiProvider: apiProvider as 'suno' | 'eachlabs'
      });
      
      return result;
    } catch (error) {
      console.error('Error in generateSong:', error);
      throw error;
    }
  }
  
  /**
   * Process song generation using Suno API
   * @private
   */
  private async processSunoGeneration(
    options: SongGenerationOptions,
    songId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<SongGenerationResult> {
    const startTime = Date.now();
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 20, 'Preparing request for Suno');
    if (onProgress) onProgress(20);
    
    // In a real implementation, this would make an actual API call to Suno
    // For this example, we'll simulate the API call
    
    // Prepare the API request
    const apiRequest = {
      prompt: options.prompt,
      genre: options.genre,
      mood: options.mood,
      tempo: options.styleOptions?.tempo || 120,
      duration: options.duration || 180, // Default to 3 minutes
      vocals: true,
      reference_artists: options.styleOptions?.referenceArtists || [],
      output_format: options.outputFormat?.fileFormat || 'mp3'
    };
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 30, 'Sending request to Suno');
    if (onProgress) onProgress(30);
    
    // Simulate API processing time (longer for song generation)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 50, 'Generating song with Suno');
    if (onProgress) onProgress(50);
    
    // Simulate more processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 70, 'Finalizing song generation');
    if (onProgress) onProgress(70);
    
    // Simulate uploading the generated song to Firebase Storage
    // In a real implementation, we would download from Suno and upload to Firebase
    
    // Create a dummy audio file (this would be the actual generated audio in a real implementation)
    const dummyAudioUrl = 'https://firebasestorage.googleapis.com/v0/b/balltalkapp.appspot.com/o/sample_audio.mp3?alt=media';
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 90, 'Saving generated song');
    if (onProgress) onProgress(90);
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Generate a title based on the prompt
    const title = this.generateTitleFromPrompt(options.prompt);
    
    // Create the final result
    const result: SongGenerationResult = {
      id: songId,
      songUrl: dummyAudioUrl,
      metadata: {
        title,
        duration: options.duration || 180,
        genre: options.genre,
        mood: options.mood,
        tempo: options.styleOptions?.tempo || 120,
        key: options.styleOptions?.key,
        generatedAt: new Date().toISOString(),
        apiProvider: 'suno',
        processingTime
      },
      stems: {
        vocals: dummyAudioUrl,
        instruments: dummyAudioUrl
      },
      lyrics: this.generateSimulatedLyrics(options),
      options,
      userId,
      versionNumber: 1,
      status: 'completed',
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the result to Firestore
    await setDoc(doc(firebaseDb, SONG_GENERATION_COLLECTION, songId), result);
    
    return result;
  }
  
  /**
   * Process song generation using Eachlabs API
   * @private
   */
  private async processEachlabsGeneration(
    options: SongGenerationOptions,
    songId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<SongGenerationResult> {
    const startTime = Date.now();
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 20, 'Preparing request for Eachlabs');
    if (onProgress) onProgress(20);
    
    // In a real implementation, this would make an actual API call to Eachlabs
    // For this example, we'll simulate the API call
    
    // Prepare the API request
    const apiRequest = {
      prompt: options.prompt,
      genre: options.genre,
      mood: options.mood,
      bpm: options.styleOptions?.tempo || 120,
      duration_seconds: options.duration || 180,
      include_vocals: true,
      artists: options.styleOptions?.referenceArtists || [],
      output_format: options.outputFormat?.fileFormat || 'mp3'
    };
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 30, 'Sending request to Eachlabs');
    if (onProgress) onProgress(30);
    
    // Simulate API processing time (longer for song generation)
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 50, 'Generating song with Eachlabs');
    if (onProgress) onProgress(50);
    
    // Simulate more processing time
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 70, 'Finalizing song generation');
    if (onProgress) onProgress(70);
    
    // Simulate uploading the generated song to Firebase Storage
    // In a real implementation, we would download from Eachlabs and upload to Firebase
    
    // Create a dummy audio file (this would be the actual generated audio in a real implementation)
    const dummyAudioUrl = 'https://firebasestorage.googleapis.com/v0/b/balltalkapp.appspot.com/o/sample_audio.mp3?alt=media';
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 90, 'Saving generated song');
    if (onProgress) onProgress(90);
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Generate a title based on the prompt
    const title = this.generateTitleFromPrompt(options.prompt);
    
    // Create the final result
    const result: SongGenerationResult = {
      id: songId,
      songUrl: dummyAudioUrl,
      metadata: {
        title,
        duration: options.duration || 180,
        genre: options.genre,
        mood: options.mood,
        tempo: options.styleOptions?.tempo || 120,
        key: options.styleOptions?.key,
        generatedAt: new Date().toISOString(),
        apiProvider: 'eachlabs',
        processingTime
      },
      stems: {
        vocals: dummyAudioUrl,
        instruments: dummyAudioUrl,
        drums: dummyAudioUrl,
        bass: dummyAudioUrl
      },
      lyrics: this.generateSimulatedLyrics(options),
      options,
      userId,
      versionNumber: 1,
      status: 'completed',
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the result to Firestore
    await setDoc(doc(firebaseDb, SONG_GENERATION_COLLECTION, songId), result);
    
    return result;
  }
  
  /**
   * Update the status of a song generation job
   * @private
   */
  private async updateJobStatus(
    jobId: string,
    status: SongGenerationJobStatus['status'],
    progress: number,
    message?: string
  ): Promise<void> {
    await updateDoc(doc(firebaseDb, SONG_GENERATION_JOBS_COLLECTION, jobId), {
      status,
      progress,
      message,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Add a song generation to the user's history
   * @private
   */
  private async addToSongGenerationHistory(
    userId: string,
    generation: {
      id: string;
      title: string;
      createdAt: string;
      genre: string;
      status: 'completed' | 'failed';
      apiProvider: 'suno' | 'eachlabs';
    }
  ): Promise<void> {
    // Get the user's song generation history
    const historyRef = doc(firebaseDb, SONG_GENERATION_HISTORY_COLLECTION, userId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      // Update existing history
      const history = historyDoc.data() as SongGenerationHistory;
      history.generations.unshift(generation); // Add to beginning of array
      
      // Limit to 50 generations
      if (history.generations.length > 50) {
        history.generations = history.generations.slice(0, 50);
      }
      
      await updateDoc(historyRef, { generations: history.generations });
    } else {
      // Create new history
      const history: SongGenerationHistory = {
        userId,
        generations: [generation]
      };
      
      await setDoc(historyRef, history);
    }
  }
  
  /**
   * Generate a title from the prompt
   * @private
   */
  private generateTitleFromPrompt(prompt: string): string {
    // Simple title generation logic
    // In a real implementation, this would be more sophisticated
    
    // Extract first few words and capitalize them
    const words = prompt.split(' ').slice(0, 4);
    const title = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return title;
  }
  
  /**
   * Generate simulated lyrics for testing
   * @private
   */
  private generateSimulatedLyrics(options: SongGenerationOptions): string {
    const { prompt, genre, mood } = options;
    
    // Simple template-based lyrics generation for simulation
    let lyrics = '';
    
    // Add title
    lyrics += `${this.generateTitleFromPrompt(prompt)}\n\n`;
    
    // Add verse
    lyrics += `[Verse 1]\n`;
    lyrics += `In this ${mood} world, I find my way\n`;
    lyrics += `Thinking about ${prompt.split(' ')[0]} every day\n`;
    lyrics += `The rhythm of ${genre} keeps me going strong\n`;
    lyrics += `Even when everything feels so wrong\n\n`;
    
    // Add chorus
    lyrics += `[Chorus]\n`;
    lyrics += `Oh, ${prompt.split(' ')[0]}, you're all I need\n`;
    lyrics += `In this ${mood} moment, I feel free\n`;
    lyrics += `${genre} beats pumping through my veins\n`;
    lyrics += `Breaking all these chains\n\n`;
    
    // Add verse 2
    lyrics += `[Verse 2]\n`;
    lyrics += `Days go by, and I'm still here\n`;
    lyrics += `${prompt.split(' ')[1] || prompt.split(' ')[0]} on my mind, crystal clear\n`;
    lyrics += `The ${mood} feeling never goes away\n`;
    lyrics += `In this ${genre} life, I'm here to stay\n\n`;
    
    // Repeat chorus
    lyrics += `[Chorus]\n`;
    lyrics += `Oh, ${prompt.split(' ')[0]}, you're all I need\n`;
    lyrics += `In this ${mood} moment, I feel free\n`;
    lyrics += `${genre} beats pumping through my veins\n`;
    lyrics += `Breaking all these chains\n\n`;
    
    // Add bridge
    lyrics += `[Bridge]\n`;
    lyrics += `Sometimes I wonder where we'll go\n`;
    lyrics += `With ${prompt.split(' ')[0]} in my heart, I'll never be low\n`;
    lyrics += `This ${mood} journey is just beginning\n`;
    lyrics += `${genre} is the soundtrack to my winning\n\n`;
    
    // Repeat chorus
    lyrics += `[Chorus]\n`;
    lyrics += `Oh, ${prompt.split(' ')[0]}, you're all I need\n`;
    lyrics += `In this ${mood} moment, I feel free\n`;
    lyrics += `${genre} beats pumping through my veins\n`;
    lyrics += `Breaking all these chains\n\n`;
    
    // Add outro
    lyrics += `[Outro]\n`;
    lyrics += `${prompt.split(' ')[0]}, ${prompt.split(' ')[0]}, ${prompt.split(' ')[0]}\n`;
    lyrics += `Forever in my ${mood} heart\n`;
    
    return lyrics;
  }
  
  /**
   * Get a generated song by ID
   */
  async getGeneratedSong(songId: string): Promise<SongGenerationResult | null> {
    const songRef = doc(firebaseDb, SONG_GENERATION_COLLECTION, songId);
    const songDoc = await getDoc(songRef);
    
    if (songDoc.exists()) {
      return songDoc.data() as SongGenerationResult;
    } else {
      return null;
    }
  }
  
  /**
   * Get generated songs for a user
   */
  async getUserGeneratedSongs(userId: string, limit?: number): Promise<SongGenerationResult[]> {
    const songsRef = collection(firebaseDb, SONG_GENERATION_COLLECTION);
    const q = query(
      songsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      ...(limit ? [limit(limit)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SongGenerationResult);
  }
  
  /**
   * Get the status of a song generation job
   */
  async getJobStatus(jobId: string): Promise<SongGenerationJobStatus | null> {
    const jobRef = doc(firebaseDb, SONG_GENERATION_JOBS_COLLECTION, jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (jobDoc.exists()) {
      return jobDoc.data() as SongGenerationJobStatus;
    } else {
      return null;
    }
  }
  
  /**
   * Get a user's song generation history
   */
  async getSongGenerationHistory(userId: string): Promise<SongGenerationHistory> {
    const historyRef = doc(firebaseDb, SONG_GENERATION_HISTORY_COLLECTION, userId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      return historyDoc.data() as SongGenerationHistory;
    } else {
      return { userId, generations: [] };
    }
  }
  
  /**
   * Get available song generation templates
   */
  getAvailableTemplates(): typeof SONG_GENERATION_TEMPLATES {
    return SONG_GENERATION_TEMPLATES;
  }
}

export default new SongGenerationService(); 