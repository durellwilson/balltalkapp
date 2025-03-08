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
  updateDoc,
  Firestore,
  serverTimestamp,
  limit
} from 'firebase/firestore';

import { db } from '../../src/lib/firebase';
import { 
  LyricsGenerationOptions, 
  LyricsGenerationResult, 
  LyricsGenerationJobStatus, 
  LyricsVersionHistory,
  LyricsCollaborationSession,
  LYRICS_TEMPLATES
} from '../../models/audio/LyricsModels';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;

// Collection names
const LYRICS_COLLECTION = 'lyrics';
const LYRICS_JOBS_COLLECTION = 'lyrics_jobs';
const LYRICS_VERSIONS_COLLECTION = 'lyrics_versions';
const LYRICS_COLLABORATION_COLLECTION = 'lyrics_collaboration';

/**
 * Service for AI lyrics generation using TopMediai and Neural Frames APIs
 */
class LyricsGenerationService {
  private readonly topMediaiApiKey: string;
  private readonly topMediaiApiUrl: string;
  private readonly neuralFramesApiKey: string;
  private readonly neuralFramesApiUrl: string;
  
  constructor() {
    // In a real app, these would be loaded from environment variables
    this.topMediaiApiKey = process.env.TOPMEDIA_API_KEY || '';
    this.topMediaiApiUrl = 'https://api.topmediai.com/v1';
    this.neuralFramesApiKey = process.env.NEURALFRAMES_API_KEY || '';
    this.neuralFramesApiUrl = 'https://api.neuralframes.com/v1';
  }
  
  /**
   * Generate lyrics using AI
   * @param options Options for lyrics generation
   * @param userId ID of the user generating the lyrics
   * @param projectId Optional project ID
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the generated lyrics
   */
  async generateLyrics(
    options: LyricsGenerationOptions,
    userId: string,
    projectId?: string,
    onProgress?: (progress: number) => void
  ): Promise<LyricsGenerationResult> {
    try {
      // Generate a unique ID for this lyrics generation
      const lyricsId = uuidv4();
      const now = new Date().toISOString();
      
      // Create initial lyrics result with 'processing' status
      const initialResult: LyricsGenerationResult = {
        id: lyricsId,
        lyrics: '',
        metadata: {
          theme: options.theme,
          genre: options.genre,
          mood: options.mood,
          generatedAt: now,
          apiProvider: options.apiProvider || 'topmedia',
          processingTime: 0,
          wordCount: 0,
          estimatedDuration: 0
        },
        options,
        userId,
        projectId,
        versionNumber: 1,
        status: 'processing',
        createdAt: now,
        updatedAt: now
      };
      
      // Save initial result to Firestore
      await setDoc(doc(firebaseDb, LYRICS_COLLECTION, lyricsId), initialResult);
      
      // Create a job status entry
      const jobId = uuidv4();
      const jobStatus: LyricsGenerationJobStatus = {
        id: jobId,
        status: 'queued',
        progress: 0,
        message: 'Preparing to generate lyrics',
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(firebaseDb, LYRICS_JOBS_COLLECTION, jobId), jobStatus);
      
      // Update progress to 10%
      if (onProgress) onProgress(10);
      await this.updateJobStatus(jobId, 'processing', 10, 'Initializing lyrics generation');
      
      // Process the lyrics generation
      let result: LyricsGenerationResult;
      
      // Use the specified API provider or default to TopMediai
      const apiProvider = options.apiProvider || 'topmedia';
      
      if (apiProvider === 'topmedia') {
        result = await this.processTopMediaiGeneration(
          options,
          lyricsId,
          userId,
          jobId,
          onProgress
        );
      } else {
        result = await this.processNeuralFramesGeneration(
          options,
          lyricsId,
          userId,
          jobId,
          onProgress
        );
      }
      
      // Update job status to completed
      await this.updateJobStatus(jobId, 'completed', 100, 'Lyrics generation completed successfully');
      
      // Add to version history if project ID is provided
      if (projectId) {
        await this.addToVersionHistory(projectId, {
          id: lyricsId,
          versionNumber: 1,
          createdAt: now,
          createdBy: userId,
          isAiGenerated: true,
          summary: `Generated lyrics with theme: ${options.theme}, genre: ${options.genre}, mood: ${options.mood}`
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in generateLyrics:', error);
      throw error;
    }
  }
  
  /**
   * Process lyrics generation using TopMediai API
   * @private
   */
  private async processTopMediaiGeneration(
    options: LyricsGenerationOptions,
    lyricsId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<LyricsGenerationResult> {
    const startTime = Date.now();
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 20, 'Preparing request for TopMediai');
    if (onProgress) onProgress(20);
    
    // In a real implementation, this would make an actual API call to TopMediai
    // For this example, we'll simulate the API call
    
    // Prepare the API request
    const apiRequest = {
      theme: options.theme,
      genre: options.genre,
      mood: options.mood,
      structure: options.structure || {
        includeChorus: true,
        includeVerse: true,
        includeBridge: true,
        verseCount: 2
      },
      styleOptions: options.styleOptions || {
        complexity: 5,
        metaphorLevel: 5,
        explicitContent: false,
        rhymeLevel: 7,
        storytelling: 5
      },
      references: options.references || {},
      maxLength: options.maxLength || 2000,
      language: options.language || 'en'
    };
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 30, 'Sending request to TopMediai');
    if (onProgress) onProgress(30);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 70, 'Receiving lyrics from TopMediai');
    if (onProgress) onProgress(70);
    
    // Simulate API response
    const simulatedLyrics = this.generateSimulatedLyrics(options);
    const wordCount = simulatedLyrics.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount * 0.5); // Rough estimate: 2 words per second
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 90, 'Finalizing lyrics');
    if (onProgress) onProgress(90);
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Create the final result
    const result: LyricsGenerationResult = {
      id: lyricsId,
      lyrics: simulatedLyrics,
      structuredLyrics: this.parseStructuredLyrics(simulatedLyrics),
      metadata: {
        theme: options.theme,
        genre: options.genre,
        mood: options.mood,
        generatedAt: new Date().toISOString(),
        apiProvider: 'topmedia',
        processingTime,
        wordCount,
        estimatedDuration
      },
      options,
      userId,
      projectId: options.projectId,
      versionNumber: 1,
      status: 'completed',
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the result to Firestore
    await setDoc(doc(firebaseDb, LYRICS_COLLECTION, lyricsId), result);
    
    return result;
  }
  
  /**
   * Process lyrics generation using Neural Frames API
   * @private
   */
  private async processNeuralFramesGeneration(
    options: LyricsGenerationOptions,
    lyricsId: string,
    userId: string,
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<LyricsGenerationResult> {
    const startTime = Date.now();
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 20, 'Preparing request for Neural Frames');
    if (onProgress) onProgress(20);
    
    // In a real implementation, this would make an actual API call to Neural Frames
    // For this example, we'll simulate the API call
    
    // Prepare the API request
    const apiRequest = {
      prompt: `Generate ${options.genre} lyrics about ${options.theme} with a ${options.mood} mood`,
      parameters: {
        genre: options.genre,
        mood: options.mood,
        theme: options.theme,
        structure: options.structure,
        style: options.styleOptions,
        references: options.references
      },
      max_length: options.maxLength || 2000,
      language: options.language || 'en'
    };
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 30, 'Sending request to Neural Frames');
    if (onProgress) onProgress(30);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 70, 'Receiving lyrics from Neural Frames');
    if (onProgress) onProgress(70);
    
    // Simulate API response
    const simulatedLyrics = this.generateSimulatedLyrics(options);
    const wordCount = simulatedLyrics.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount * 0.5); // Rough estimate: 2 words per second
    
    // Update job status
    await this.updateJobStatus(jobId, 'processing', 90, 'Finalizing lyrics');
    if (onProgress) onProgress(90);
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;
    
    // Create the final result
    const result: LyricsGenerationResult = {
      id: lyricsId,
      lyrics: simulatedLyrics,
      structuredLyrics: this.parseStructuredLyrics(simulatedLyrics),
      metadata: {
        theme: options.theme,
        genre: options.genre,
        mood: options.mood,
        generatedAt: new Date().toISOString(),
        apiProvider: 'neuralframes',
        processingTime,
        wordCount,
        estimatedDuration
      },
      options,
      userId,
      projectId: options.projectId,
      versionNumber: 1,
      status: 'completed',
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the result to Firestore
    await setDoc(doc(firebaseDb, LYRICS_COLLECTION, lyricsId), result);
    
    return result;
  }
  
  /**
   * Update the status of a lyrics generation job
   * @private
   */
  private async updateJobStatus(
    jobId: string,
    status: LyricsGenerationJobStatus['status'],
    progress: number,
    message?: string
  ): Promise<void> {
    await updateDoc(doc(firebaseDb, LYRICS_JOBS_COLLECTION, jobId), {
      status,
      progress,
      message,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Add a lyrics version to the project's version history
   * @private
   */
  private async addToVersionHistory(
    projectId: string,
    version: {
      id: string;
      versionNumber: number;
      createdAt: string;
      createdBy: string;
      isAiGenerated: boolean;
      summary?: string;
    }
  ): Promise<void> {
    // Get the project's version history
    const historyRef = doc(firebaseDb, LYRICS_VERSIONS_COLLECTION, projectId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      // Update existing history
      const history = historyDoc.data() as LyricsVersionHistory;
      history.versions.unshift(version); // Add to beginning of array
      
      await updateDoc(historyRef, { versions: history.versions });
    } else {
      // Create new history
      const history: LyricsVersionHistory = {
        projectId,
        versions: [version]
      };
      
      await setDoc(historyRef, history);
    }
  }
  
  /**
   * Generate simulated lyrics for testing
   * @private
   */
  private generateSimulatedLyrics(options: LyricsGenerationOptions): string {
    const { theme, genre, mood } = options;
    
    // Simple template-based lyrics generation for simulation
    let lyrics = '';
    
    // Add title
    lyrics += `${theme.toUpperCase()}\n\n`;
    
    // Add verse
    if (!options.structure || options.structure.includeVerse) {
      lyrics += `[Verse 1]\n`;
      lyrics += `In this ${mood} world, I find my way\n`;
      lyrics += `Thinking about ${theme} every day\n`;
      lyrics += `The rhythm of ${genre} keeps me going strong\n`;
      lyrics += `Even when everything feels so wrong\n\n`;
      
      if (options.structure && options.structure.verseCount > 1) {
        lyrics += `[Verse 2]\n`;
        lyrics += `Days go by, and I'm still here\n`;
        lyrics += `${theme} on my mind, crystal clear\n`;
        lyrics += `The ${mood} feeling never goes away\n`;
        lyrics += `In this ${genre} life, I'm here to stay\n\n`;
      }
    }
    
    // Add chorus
    if (!options.structure || options.structure.includeChorus) {
      lyrics += `[Chorus]\n`;
      lyrics += `Oh, ${theme}, you're all I need\n`;
      lyrics += `In this ${mood} moment, I feel free\n`;
      lyrics += `${genre} beats pumping through my veins\n`;
      lyrics += `Breaking all these chains\n\n`;
    }
    
    // Add bridge
    if (!options.structure || options.structure.includeBridge) {
      lyrics += `[Bridge]\n`;
      lyrics += `Sometimes I wonder where we'll go\n`;
      lyrics += `With ${theme} in my heart, I'll never be low\n`;
      lyrics += `This ${mood} journey is just beginning\n`;
      lyrics += `${genre} is the soundtrack to my winning\n\n`;
    }
    
    // Repeat chorus
    if (!options.structure || options.structure.includeChorus) {
      lyrics += `[Chorus]\n`;
      lyrics += `Oh, ${theme}, you're all I need\n`;
      lyrics += `In this ${mood} moment, I feel free\n`;
      lyrics += `${genre} beats pumping through my veins\n`;
      lyrics += `Breaking all these chains\n\n`;
    }
    
    // Add outro
    lyrics += `[Outro]\n`;
    lyrics += `${theme}, ${theme}, ${theme}\n`;
    lyrics += `Forever in my ${mood} heart\n`;
    
    return lyrics;
  }
  
  /**
   * Parse structured lyrics from text
   * @private
   */
  private parseStructuredLyrics(lyrics: string): LyricsGenerationResult['structuredLyrics'] {
    // Simple parser for structured lyrics
    const lines = lyrics.split('\n');
    const structuredLyrics: LyricsGenerationResult['structuredLyrics'] = {
      verses: []
    };
    
    let currentSection: 'title' | 'verse' | 'chorus' | 'bridge' | 'outro' | null = null;
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check for section headers
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          if (currentSection === 'title') {
            structuredLyrics.title = currentContent.join('\n');
          } else if (currentSection === 'verse') {
            structuredLyrics.verses.push(currentContent.join('\n'));
          } else if (currentSection === 'chorus') {
            structuredLyrics.chorus = currentContent.join('\n');
          } else if (currentSection === 'bridge') {
            structuredLyrics.bridge = currentContent.join('\n');
          } else if (currentSection === 'outro') {
            structuredLyrics.outro = currentContent.join('\n');
          }
          
          currentContent = [];
        }
        
        // Determine new section
        const sectionName = trimmedLine.slice(1, -1).toLowerCase();
        if (sectionName.includes('verse')) {
          currentSection = 'verse';
        } else if (sectionName.includes('chorus')) {
          currentSection = 'chorus';
        } else if (sectionName.includes('bridge')) {
          currentSection = 'bridge';
        } else if (sectionName.includes('outro')) {
          currentSection = 'outro';
        } else {
          currentSection = null;
        }
      } else if (!currentSection && lines.indexOf(line) === 0) {
        // First line is likely the title
        structuredLyrics.title = trimmedLine;
      } else if (currentSection) {
        // Add line to current section
        currentContent.push(trimmedLine);
      }
    }
    
    // Save the last section
    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'verse') {
        structuredLyrics.verses.push(currentContent.join('\n'));
      } else if (currentSection === 'chorus') {
        structuredLyrics.chorus = currentContent.join('\n');
      } else if (currentSection === 'bridge') {
        structuredLyrics.bridge = currentContent.join('\n');
      } else if (currentSection === 'outro') {
        structuredLyrics.outro = currentContent.join('\n');
      }
    }
    
    return structuredLyrics;
  }
  
  /**
   * Get lyrics by ID
   */
  async getLyrics(lyricsId: string): Promise<LyricsGenerationResult | null> {
    const lyricsRef = doc(firebaseDb, LYRICS_COLLECTION, lyricsId);
    const lyricsDoc = await getDoc(lyricsRef);
    
    if (lyricsDoc.exists()) {
      return lyricsDoc.data() as LyricsGenerationResult;
    } else {
      return null;
    }
  }
  
  /**
   * Get lyrics for a user
   */
  async getUserLyrics(userId: string, limit?: number): Promise<LyricsGenerationResult[]> {
    const lyricsRef = collection(firebaseDb, LYRICS_COLLECTION);
    const q = query(
      lyricsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      ...(limit ? [limit(limit)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LyricsGenerationResult);
  }
  
  /**
   * Get lyrics for a project
   */
  async getProjectLyrics(projectId: string): Promise<LyricsGenerationResult[]> {
    const lyricsRef = collection(firebaseDb, LYRICS_COLLECTION);
    const q = query(
      lyricsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LyricsGenerationResult);
  }
  
  /**
   * Get the status of a lyrics generation job
   */
  async getJobStatus(jobId: string): Promise<LyricsGenerationJobStatus | null> {
    const jobRef = doc(firebaseDb, LYRICS_JOBS_COLLECTION, jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (jobDoc.exists()) {
      return jobDoc.data() as LyricsGenerationJobStatus;
    } else {
      return null;
    }
  }
  
  /**
   * Get version history for a project
   */
  async getVersionHistory(projectId: string): Promise<LyricsVersionHistory | null> {
    const historyRef = doc(firebaseDb, LYRICS_VERSIONS_COLLECTION, projectId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      return historyDoc.data() as LyricsVersionHistory;
    } else {
      return null;
    }
  }
  
  /**
   * Update existing lyrics
   */
  async updateLyrics(
    lyricsId: string,
    lyrics: string,
    userId: string,
    summary?: string
  ): Promise<LyricsGenerationResult | null> {
    try {
      // Get the current lyrics
      const lyricsRef = doc(firebaseDb, LYRICS_COLLECTION, lyricsId);
      const lyricsDoc = await getDoc(lyricsRef);
      
      if (!lyricsDoc.exists()) {
        return null;
      }
      
      const currentLyrics = lyricsDoc.data() as LyricsGenerationResult;
      
      // Create a new version
      const newLyricsId = uuidv4();
      const now = new Date().toISOString();
      
      // Calculate word count and estimated duration
      const wordCount = lyrics.split(/\s+/).length;
      const estimatedDuration = Math.round(wordCount * 0.5); // Rough estimate: 2 words per second
      
      // Create the new lyrics result
      const newLyrics: LyricsGenerationResult = {
        id: newLyricsId,
        lyrics,
        structuredLyrics: this.parseStructuredLyrics(lyrics),
        metadata: {
          ...currentLyrics.metadata,
          generatedAt: now,
          apiProvider: 'local', // Manual update
          processingTime: 0,
          wordCount,
          estimatedDuration
        },
        options: currentLyrics.options,
        userId,
        projectId: currentLyrics.projectId,
        versionNumber: currentLyrics.versionNumber + 1,
        previousVersionId: lyricsId,
        status: 'completed',
        createdAt: now,
        updatedAt: now
      };
      
      // Save the new lyrics to Firestore
      await setDoc(doc(firebaseDb, LYRICS_COLLECTION, newLyricsId), newLyrics);
      
      // Add to version history if project ID is provided
      if (currentLyrics.projectId) {
        await this.addToVersionHistory(currentLyrics.projectId, {
          id: newLyricsId,
          versionNumber: newLyrics.versionNumber,
          createdAt: now,
          createdBy: userId,
          isAiGenerated: false,
          summary: summary || 'Manual update to lyrics'
        });
      }
      
      return newLyrics;
    } catch (error) {
      console.error('Error updating lyrics:', error);
      return null;
    }
  }
  
  /**
   * Create a collaboration session for lyrics
   */
  async createCollaborationSession(
    lyricsId: string,
    projectId: string,
    ownerId: string,
    ownerDisplayName: string
  ): Promise<LyricsCollaborationSession | null> {
    try {
      const sessionId = uuidv4();
      const now = new Date().toISOString();
      
      const session: LyricsCollaborationSession = {
        id: sessionId,
        projectId,
        lyricsId,
        participants: [
          {
            userId: ownerId,
            displayName: ownerDisplayName,
            role: 'owner',
            joinedAt: now
          }
        ],
        currentVersion: lyricsId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastActivity: now
      };
      
      await setDoc(doc(firebaseDb, LYRICS_COLLABORATION_COLLECTION, sessionId), session);
      
      return session;
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      return null;
    }
  }
  
  /**
   * Add a participant to a collaboration session
   */
  async addParticipant(
    sessionId: string,
    userId: string,
    displayName: string,
    role: 'editor' | 'viewer' = 'editor'
  ): Promise<boolean> {
    try {
      const sessionRef = doc(firebaseDb, LYRICS_COLLABORATION_COLLECTION, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        return false;
      }
      
      const session = sessionDoc.data() as LyricsCollaborationSession;
      const now = new Date().toISOString();
      
      // Check if participant already exists
      const existingParticipantIndex = session.participants.findIndex(p => p.userId === userId);
      
      if (existingParticipantIndex >= 0) {
        // Update existing participant
        session.participants[existingParticipantIndex].role = role;
      } else {
        // Add new participant
        session.participants.push({
          userId,
          displayName,
          role,
          joinedAt: now
        });
      }
      
      // Update session
      await updateDoc(sessionRef, {
        participants: session.participants,
        updatedAt: now,
        lastActivity: now
      });
      
      return true;
    } catch (error) {
      console.error('Error adding participant:', error);
      return false;
    }
  }
  
  /**
   * Get available lyrics templates
   */
  getAvailableTemplates(): typeof LYRICS_TEMPLATES {
    return LYRICS_TEMPLATES;
  }
}

export default new LyricsGenerationService(); 