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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';

import { db, storage } from '../../src/lib/firebase';
import AudioProcessingEngine from './AudioProcessingEngine';
import { EqualizerModule } from './modules/EqualizerModule';
import { 
  OzoneModuleType, 
  OzoneModuleOptions, 
  EqualizerOptions,
  MultibandCompressorOptions,
  ExciterOptions,
  ImagerOptions,
  MaximizerOptions,
  LowEndFocusOptions,
  SpectralShaperOptions,
  VintageLimiterOptions,
  VintageTapeOptions,
  VintageCompressorOptions,
  MasteringPreset,
  MasterAssistantResult,
  DEFAULT_MASTERING_PRESETS
} from '../../models/audio/OzoneModels';
import { ProcessingModule } from './AudioProcessingEngine';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

// Collection names
const MASTERING_PRESETS_COLLECTION = 'mastering_presets';
const MASTERING_SESSIONS_COLLECTION = 'mastering_sessions';
const MASTERING_RESULTS_COLLECTION = 'mastering_results';

/**
 * Service for Ozone-inspired mastering functionality
 */
class OzoneMasteringService {
  private engine: AudioProcessingEngine | null = null;
  private modules: Map<string, ProcessingModule> = new Map();
  private currentPresetId: string | null = null;
  private currentSessionId: string | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    this.engine = new AudioProcessingEngine();
  }
  
  /**
   * Initialize the mastering engine
   */
  async initialize(): Promise<boolean> {
    if (!this.engine) {
      this.engine = new AudioProcessingEngine();
    }
    
    return this.engine.initialize();
  }
  
  /**
   * Load an audio file into the mastering engine
   * @param fileUri URI of the audio file to load
   */
  async loadAudioFile(fileUri: string): Promise<boolean> {
    if (!this.engine) {
      await this.initialize();
    }
    
    return this.engine!.loadAudioFile(fileUri);
  }
  
  /**
   * Create a module from options
   * @param options Module options
   * @returns The created module
   */
  private createModule(options: OzoneModuleOptions): ProcessingModule | null {
    switch (options.moduleType) {
      case OzoneModuleType.EQUALIZER:
        return new EqualizerModule(options as EqualizerOptions);
      // Add other module types as they are implemented
      default:
        console.warn(`Module type ${options.moduleType} not implemented yet`);
        return null;
    }
  }
  
  /**
   * Load a preset
   * @param presetId ID of the preset to load
   */
  async loadPreset(presetId: string): Promise<boolean> {
    try {
      // Get the preset from Firestore
      const presetDoc = await getDoc(doc(firebaseDb, MASTERING_PRESETS_COLLECTION, presetId));
      
      if (!presetDoc.exists()) {
        // Check if it's a default preset
        const defaultPreset = DEFAULT_MASTERING_PRESETS.find(preset => preset.id === presetId);
        
        if (!defaultPreset) {
          console.error(`Preset ${presetId} not found`);
          return false;
        }
        
        // Use the default preset
        return this.applyPreset(defaultPreset);
      }
      
      // Get the preset data
      const preset = presetDoc.data() as MasteringPreset;
      
      // Apply the preset
      return this.applyPreset(preset);
    } catch (error) {
      console.error('Error loading preset:', error);
      return false;
    }
  }
  
  /**
   * Apply a preset to the mastering engine
   * @param preset The preset to apply
   */
  private async applyPreset(preset: MasteringPreset): Promise<boolean> {
    if (!this.engine) {
      await this.initialize();
    }
    
    // Clear existing modules
    this.engine!.clearProcessingChain();
    this.modules.clear();
    
    // Create and add modules from the preset
    for (const moduleOptions of preset.modules) {
      const module = this.createModule(moduleOptions);
      
      if (module) {
        this.engine!.addModule(module);
        this.modules.set(module.id, module);
      }
    }
    
    this.currentPresetId = preset.id;
    
    return true;
  }
  
  /**
   * Create a new mastering session
   * @param userId ID of the user creating the session
   * @param name Name of the session
   * @param presetId ID of the preset to use (optional)
   */
  async createSession(userId: string, name: string, presetId?: string): Promise<string> {
    try {
      // Generate a new session ID
      const sessionId = uuidv4();
      
      // Create the session document
      await setDoc(doc(firebaseDb, MASTERING_SESSIONS_COLLECTION, sessionId), {
        id: sessionId,
        userId,
        name,
        presetId: presetId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'created'
      });
      
      this.currentSessionId = sessionId;
      
      // Load the preset if provided
      if (presetId) {
        await this.loadPreset(presetId);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error creating mastering session:', error);
      throw error;
    }
  }
  
  /**
   * Get available presets
   * @param userId ID of the user (for custom presets)
   */
  async getPresets(userId?: string): Promise<MasteringPreset[]> {
    try {
      // Start with default presets
      const presets = [...DEFAULT_MASTERING_PRESETS];
      
      // If a user ID is provided, get their custom presets
      if (userId) {
        const q = query(
          collection(firebaseDb, MASTERING_PRESETS_COLLECTION),
          where('createdBy', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          presets.push(doc.data() as MasteringPreset);
        });
      }
      
      return presets;
    } catch (error) {
      console.error('Error getting presets:', error);
      return DEFAULT_MASTERING_PRESETS;
    }
  }
  
  /**
   * Save a preset
   * @param userId ID of the user saving the preset
   * @param name Name of the preset
   * @param description Description of the preset
   * @param category Category of the preset
   */
  async savePreset(
    userId: string,
    name: string,
    description: string,
    category: 'general' | 'genre' | 'custom' = 'custom'
  ): Promise<string> {
    try {
      if (!this.engine) {
        throw new Error('Mastering engine not initialized');
      }
      
      // Get the current processing chain
      const modules = this.engine.getProcessingChain();
      
      // Convert modules to options
      const moduleOptions: OzoneModuleOptions[] = modules.map(module => {
        return module.getParameters() as OzoneModuleOptions;
      });
      
      // Generate a preset ID
      const presetId = uuidv4();
      
      // Create the preset
      const preset: MasteringPreset = {
        id: presetId,
        name,
        description,
        category,
        modules: moduleOptions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        isDefault: false
      };
      
      // Save the preset to Firestore
      await setDoc(doc(firebaseDb, MASTERING_PRESETS_COLLECTION, presetId), preset);
      
      return presetId;
    } catch (error) {
      console.error('Error saving preset:', error);
      throw error;
    }
  }
  
  /**
   * Process the audio with the current chain
   */
  async processAudio(): Promise<AudioBuffer> {
    if (!this.engine) {
      throw new Error('Mastering engine not initialized');
    }
    
    return this.engine.processAudio();
  }
  
  /**
   * Export the processed audio to a file
   * @param format Output format (wav, mp3, etc.)
   */
  async exportAudio(format: 'wav' | 'mp3' = 'wav'): Promise<Blob> {
    if (!this.engine) {
      throw new Error('Mastering engine not initialized');
    }
    
    return this.engine.exportAudio(format);
  }
  
  /**
   * Save the processed audio
   * @param userId ID of the user saving the audio
   * @param name Name of the processed audio
   * @param projectId ID of the project (optional)
   * @param trackId ID of the track (optional)
   */
  async saveProcessedAudio(
    userId: string,
    name: string,
    projectId?: string,
    trackId?: string
  ): Promise<string> {
    try {
      if (!this.engine) {
        throw new Error('Mastering engine not initialized');
      }
      
      // Export the audio
      const audioBlob = await this.exportAudio('wav');
      
      // Generate a result ID
      const resultId = uuidv4();
      
      // Upload the processed audio to Firebase Storage
      const storageRef = ref(firebaseStorage, `mastering/${userId}/${resultId}.wav`);
      await uploadBytes(storageRef, audioBlob);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Save the result to Firestore
      await setDoc(doc(firebaseDb, MASTERING_RESULTS_COLLECTION, resultId), {
        id: resultId,
        userId,
        name,
        projectId: projectId || null,
        trackId: trackId || null,
        presetId: this.currentPresetId,
        sessionId: this.currentSessionId,
        url: downloadUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return resultId;
    } catch (error) {
      console.error('Error saving processed audio:', error);
      throw error;
    }
  }
  
  /**
   * Run the Master Assistant to analyze audio and suggest settings
   * @param targetLoudness Target loudness in LUFS
   * @param targetGenre Target genre
   * @param targetReference Reference track (optional)
   */
  async runMasterAssistant(
    targetLoudness: number,
    targetGenre: string,
    targetReference?: string
  ): Promise<MasterAssistantResult> {
    try {
      if (!this.engine) {
        throw new Error('Mastering engine not initialized');
      }
      
      // This is a simplified implementation
      // In a real implementation, this would involve sophisticated audio analysis
      
      // Generate a result ID
      const resultId = uuidv4();
      
      // Create a basic analysis result
      const result: MasterAssistantResult = {
        id: resultId,
        targetLoudness,
        targetGenre,
        targetReference: targetReference || '',
        createdAt: new Date().toISOString(),
        
        // Recommended modules and settings
        // This is a simplified implementation - in a real implementation,
        // these would be generated based on analysis of the audio
        recommendedModules: DEFAULT_MASTERING_PRESETS[0].modules,
        
        // Analysis data
        analysisData: {
          peakLoudness: -3,
          averageLoudness: -14,
          dynamicRange: 10,
          stereoWidth: 80,
          frequencyBalance: {
            lowRange: 0.8,
            midRange: 1.0,
            highRange: 0.9
          },
          transientResponse: 0.7,
          spectralContent: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6]
        }
      };
      
      // Apply the recommended modules
      await this.applyMasterAssistantResult(result);
      
      return result;
    } catch (error) {
      console.error('Error running Master Assistant:', error);
      throw error;
    }
  }
  
  /**
   * Apply a Master Assistant result
   * @param result The Master Assistant result to apply
   */
  async applyMasterAssistantResult(result: MasterAssistantResult): Promise<boolean> {
    if (!this.engine) {
      await this.initialize();
    }
    
    // Clear existing modules
    this.engine!.clearProcessingChain();
    this.modules.clear();
    
    // Create and add modules from the result
    for (const moduleOptions of result.recommendedModules) {
      const module = this.createModule(moduleOptions);
      
      if (module) {
        this.engine!.addModule(module);
        this.modules.set(module.id, module);
      }
    }
    
    return true;
  }
  
  /**
   * Play the audio
   */
  async play(): Promise<void> {
    if (!this.engine) {
      throw new Error('Mastering engine not initialized');
    }
    
    return this.engine.play();
  }
  
  /**
   * Pause the audio
   */
  async pause(): Promise<void> {
    if (!this.engine) {
      throw new Error('Mastering engine not initialized');
    }
    
    return this.engine.pause();
  }
  
  /**
   * Stop the audio
   */
  async stop(): Promise<void> {
    if (!this.engine) {
      throw new Error('Mastering engine not initialized');
    }
    
    return this.engine.stop();
  }
  
  /**
   * Get the current playback state
   */
  getPlaybackState(): {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  } {
    if (!this.engine) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0
      };
    }
    
    return this.engine.getPlaybackState();
  }
  
  /**
   * Seek to a specific position in the audio
   * @param time Time in seconds
   */
  seek(time: number): void {
    if (!this.engine) {
      return;
    }
    
    this.engine.seek(time);
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
    
    this.modules.clear();
    this.currentPresetId = null;
    this.currentSessionId = null;
  }
}

export default OzoneMasteringService; 