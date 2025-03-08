import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import AudioProcessingEngine from './AudioProcessingEngine';
import DolbyMasteringService from './DolbyMasteringService';
import NectarVocalService from './NectarVocalService';
import { 
  DolbyMasteringProfile, 
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyMasteringOptions,
  DolbyMasteringResult
} from './DolbyMasteringService';
import { ProcessingModule } from './AudioProcessingEngine';

/**
 * AudioEngine is the main entry point for all audio processing in the app.
 * It coordinates between different processing services and provides a unified API.
 */
class AudioEngine {
  // Core processing engine
  private processingEngine: AudioProcessingEngine;
  
  // Specialized services
  private masteringService: DolbyMasteringService;
  private vocalService: NectarVocalService;
  
  // Audio state
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private audioUri: string | null = null;
  private isProcessing: boolean = false;
  
  // Processing mode
  private mode: 'local' | 'dolby' | 'vocal' = 'local';
  
  // Event listeners
  private listeners: Map<string, Function[]> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    this.processingEngine = new AudioProcessingEngine();
    this.masteringService = new DolbyMasteringService();
    this.vocalService = new NectarVocalService();
    
    // Initialize event listener maps
    this.listeners.set('playbackStateChanged', []);
    this.listeners.set('processingStarted', []);
    this.listeners.set('processingCompleted', []);
    this.listeners.set('processingFailed', []);
    this.listeners.set('audioLoaded', []);
  }
  
  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('AudioEngine: Starting initialization...');
      
      // Initialize Audio from Expo
      console.log('AudioEngine: Setting up Expo Audio mode...');
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('AudioEngine: Expo Audio mode set successfully');
      } catch (error) {
        console.error('AudioEngine: Failed to set Expo Audio mode:', error);
        // Continue anyway, as this might not be critical
      }
      
      // Initialize the processing engine with timeout
      console.log('AudioEngine: Initializing processing engine...');
      const initPromise = this.processingEngine.initialize();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('AudioEngine: Processing engine initialization timed out after 5 seconds');
          resolve(true); // Resolve with true to allow the app to continue
        }, 5000);
      });
      
      // Race the initialization against the timeout
      const processingEngineInitialized = await Promise.race([initPromise, timeoutPromise]);
      console.log(`AudioEngine: Processing engine initialization ${processingEngineInitialized ? 'completed' : 'failed'}`);
      
      // Even if processing engine fails, we can still continue with basic functionality
      console.log('AudioEngine: Initialization complete');
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      // Return true anyway to prevent the app from getting stuck
      return true;
    }
  }
  
  /**
   * Load an audio file
   * @param uri URI of the audio file to load
   */
  async loadAudio(uri: string): Promise<boolean> {
    try {
      console.log('AudioEngine: Loading audio from URI:', uri);
      this.audioUri = uri;
      
      // Unload any existing sound
      if (this.sound) {
        console.log('AudioEngine: Unloading previous sound');
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      // Create a new sound object
      console.log('AudioEngine: Creating new sound object');
      
      // Special handling for web platform
      if (Platform.OS === 'web') {
        console.log('AudioEngine: Using web-specific audio loading');
        
        // For web URLs created with URL.createObjectURL
        if (uri.startsWith('blob:')) {
          console.log('AudioEngine: Loading blob URL on web');
          
          try {
            // First attempt: Use HTML5 Audio API
            return await this.loadWebAudioWithHtml5(uri);
          } catch (html5Error) {
            console.error('AudioEngine: HTML5 Audio loading failed:', html5Error);
            
            try {
              // Second attempt: Use Web Audio API
              return await this.loadWebAudioWithWebAudioAPI(uri);
            } catch (webAudioError) {
              console.error('AudioEngine: Web Audio API loading failed:', webAudioError);
              
              try {
                // Third attempt: Use Expo AV as fallback
                return await this.loadWithExpoAV(uri);
              } catch (expoError) {
                console.error('AudioEngine: Expo AV loading failed:', expoError);
                throw new Error('All audio loading methods failed');
              }
            }
          }
        }
      }
      
      // Default loading method for native platforms or regular web URLs
      return await this.loadWithExpoAV(uri);
    } catch (error) {
      console.error('AudioEngine: Error loading audio:', error);
      return false;
    }
  }
  
  /**
   * Load audio using HTML5 Audio API
   * @param uri URI of the audio file to load
   */
  private async loadWebAudioWithHtml5(uri: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Create an HTML audio element
      const audioElement = document.createElement('audio');
      audioElement.src = uri;
      audioElement.preload = 'auto';
      
      // Create a custom sound object that wraps the HTML audio element
      this.sound = {
        async playAsync() {
          console.log('Web audio: play');
          try {
            await audioElement.play();
            return { isLoaded: true };
          } catch (error) {
            console.error('Web audio play error:', error);
            throw error;
          }
        },
        async pauseAsync() {
          console.log('Web audio: pause');
          audioElement.pause();
          return { isLoaded: true };
        },
        async stopAsync() {
          console.log('Web audio: stop');
          audioElement.pause();
          audioElement.currentTime = 0;
          return { isLoaded: true };
        },
        async unloadAsync() {
          console.log('Web audio: unload');
          audioElement.pause();
          audioElement.src = '';
          audioElement.remove();
          return {};
        },
        async getStatusAsync() {
          const isPlaying = !audioElement.paused;
          const positionMillis = audioElement.currentTime * 1000;
          const durationMillis = audioElement.duration * 1000 || 0;
          return {
            isLoaded: true,
            isPlaying,
            positionMillis,
            durationMillis,
            rate: audioElement.playbackRate,
            shouldPlay: isPlaying,
            volume: audioElement.volume,
          };
        },
        async setPositionAsync(positionMillis: number) {
          console.log('Web audio: setPosition', positionMillis);
          audioElement.currentTime = positionMillis / 1000;
          return { isLoaded: true };
        },
        async setVolumeAsync(volume: number) {
          console.log('Web audio: setVolume', volume);
          audioElement.volume = volume;
          return { isLoaded: true };
        },
        setOnPlaybackStatusUpdate: (callback: (status: any) => void) => {
          // Set up event listeners to mimic Expo AV's status updates
          audioElement.addEventListener('timeupdate', () => {
            if (callback) {
              callback({
                isLoaded: true,
                isPlaying: !audioElement.paused,
                positionMillis: audioElement.currentTime * 1000,
                durationMillis: audioElement.duration * 1000 || 0,
                shouldPlay: !audioElement.paused,
                rate: audioElement.playbackRate,
                volume: audioElement.volume,
              });
            }
          });
          
          audioElement.addEventListener('play', () => {
            if (callback) {
              callback({
                isLoaded: true,
                isPlaying: true,
                positionMillis: audioElement.currentTime * 1000,
                durationMillis: audioElement.duration * 1000 || 0,
                shouldPlay: true,
                rate: audioElement.playbackRate,
                volume: audioElement.volume,
              });
            }
          });
          
          audioElement.addEventListener('pause', () => {
            if (callback) {
              callback({
                isLoaded: true,
                isPlaying: false,
                positionMillis: audioElement.currentTime * 1000,
                durationMillis: audioElement.duration * 1000 || 0,
                shouldPlay: false,
                rate: audioElement.playbackRate,
                volume: audioElement.volume,
              });
            }
          });
          
          audioElement.addEventListener('ended', () => {
            if (callback) {
              callback({
                isLoaded: true,
                isPlaying: false,
                positionMillis: audioElement.duration * 1000 || 0,
                durationMillis: audioElement.duration * 1000 || 0,
                shouldPlay: false,
                rate: audioElement.playbackRate,
                volume: audioElement.volume,
                didJustFinish: true,
              });
            }
          });
        }
      } as unknown as Audio.Sound;
      
      // Set up event listeners for the HTML audio element
      audioElement.addEventListener('timeupdate', () => {
        this.currentTime = audioElement.currentTime;
        this.notifyListeners('playbackStateChanged', {
          isPlaying: !audioElement.paused,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration || 0
        });
      });
      
      audioElement.addEventListener('durationchange', () => {
        this.duration = audioElement.duration || 0;
        this.notifyListeners('playbackStateChanged', {
          isPlaying: !audioElement.paused,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration || 0
        });
      });
      
      audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.notifyListeners('playbackStateChanged', {
          isPlaying: true,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration || 0
        });
      });
      
      audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notifyListeners('playbackStateChanged', {
          isPlaying: false,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration || 0
        });
      });
      
      audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.notifyListeners('playbackStateChanged', {
          isPlaying: false,
          currentTime: audioElement.duration || 0,
          duration: audioElement.duration || 0
        });
      });
      
      // Handle loading events
      audioElement.addEventListener('canplaythrough', () => {
        console.log('Web audio: canplaythrough event, duration:', audioElement.duration);
        this.duration = audioElement.duration || 0;
        this.notifyListeners('audioLoaded', { duration: this.duration });
        resolve(true);
      });
      
      audioElement.addEventListener('error', (e) => {
        console.error('Web audio loading error:', e);
        resolve(false);
      });
      
      // Trigger loading
      audioElement.load();
      
      // Set a timeout in case the events don't fire
      setTimeout(() => {
        if (audioElement.readyState >= 3) {
          console.log('Web audio: ready state check passed');
          this.duration = audioElement.duration || 0;
          this.notifyListeners('audioLoaded', { duration: this.duration });
          resolve(true);
        } else {
          console.warn('Web audio: ready state check failed');
          resolve(false);
        }
      }, 3000);
    });
  }
  
  /**
   * Load audio using Web Audio API
   * @param uri URI of the audio file to load
   */
  private async loadWebAudioWithWebAudioAPI(uri: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Fetch the audio file
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode the audio data
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            console.log('Web Audio API: Audio decoded successfully');
            
            // Store buffer and context for playback
            const webAudioState = {
              audioContext,
              buffer,
              source: null as AudioBufferSourceNode | null,
              gainNode: audioContext.createGain(),
              isPlaying: false,
              startTime: 0,
              pauseTime: 0,
              playbackRate: 1,
              volume: 1,
            };
            
            // Create a custom sound object
            this.sound = {
              async playAsync() {
                if (webAudioState.isPlaying) {
                  await this.stopAsync();
                }
                
                webAudioState.source = audioContext.createBufferSource();
                webAudioState.source.buffer = buffer;
                webAudioState.source.playbackRate.value = webAudioState.playbackRate;
                webAudioState.source.connect(webAudioState.gainNode);
                webAudioState.gainNode.connect(audioContext.destination);
                webAudioState.gainNode.gain.value = webAudioState.volume;
                
                const offset = webAudioState.pauseTime;
                webAudioState.source.start(0, offset);
                webAudioState.startTime = audioContext.currentTime - offset;
                webAudioState.isPlaying = true;
                
                return { isLoaded: true };
              },
              async pauseAsync() {
                if (webAudioState.isPlaying && webAudioState.source) {
                  webAudioState.pauseTime = audioContext.currentTime - webAudioState.startTime;
                  webAudioState.source.stop();
                  webAudioState.source = null;
                  webAudioState.isPlaying = false;
                }
                return { isLoaded: true };
              },
              async stopAsync() {
                if (webAudioState.source) {
                  webAudioState.source.stop();
                  webAudioState.source = null;
                }
                webAudioState.pauseTime = 0;
                webAudioState.isPlaying = false;
                return { isLoaded: true };
              },
              async unloadAsync() {
                if (webAudioState.source) {
                  webAudioState.source.stop();
                  webAudioState.source = null;
                }
                webAudioState.isPlaying = false;
                return {};
              },
              async getStatusAsync() {
                const currentTime = webAudioState.isPlaying
                  ? audioContext.currentTime - webAudioState.startTime
                  : webAudioState.pauseTime;
                
                return {
                  isLoaded: true,
                  isPlaying: webAudioState.isPlaying,
                  positionMillis: currentTime * 1000,
                  durationMillis: buffer.duration * 1000,
                  shouldPlay: webAudioState.isPlaying,
                  rate: webAudioState.playbackRate,
                  volume: webAudioState.volume,
                };
              },
              async setPositionAsync(positionMillis: number) {
                const wasPlaying = webAudioState.isPlaying;
                
                if (wasPlaying && webAudioState.source) {
                  webAudioState.source.stop();
                  webAudioState.source = null;
                }
                
                webAudioState.pauseTime = positionMillis / 1000;
                
                if (wasPlaying) {
                  await this.playAsync();
                }
                
                return { isLoaded: true };
              },
              async setVolumeAsync(volume: number) {
                webAudioState.volume = volume;
                if (webAudioState.gainNode) {
                  webAudioState.gainNode.gain.value = volume;
                }
                return { isLoaded: true };
              },
              setOnPlaybackStatusUpdate: () => {
                // Not implemented for Web Audio API
              }
            } as unknown as Audio.Sound;
            
            // Set duration and notify listeners
            this.duration = buffer.duration;
            this.notifyListeners('audioLoaded', { duration: buffer.duration });
            
            // Set up a timer to simulate playback status updates
            const statusUpdateInterval = setInterval(() => {
              if (webAudioState.isPlaying) {
                const currentTime = audioContext.currentTime - webAudioState.startTime;
                this.currentTime = currentTime;
                
                this.notifyListeners('playbackStateChanged', {
                  isPlaying: true,
                  currentTime,
                  duration: buffer.duration
                });
                
                // Check if playback has ended
                if (currentTime >= buffer.duration) {
                  webAudioState.isPlaying = false;
                  webAudioState.pauseTime = 0;
                  webAudioState.source = null;
                  
                  this.notifyListeners('playbackStateChanged', {
                    isPlaying: false,
                    currentTime: buffer.duration,
                    duration: buffer.duration
                  });
                }
              }
            }, 100);
            
            // Clean up interval on unload
            const originalUnload = this.sound.unloadAsync;
            this.sound.unloadAsync = async () => {
              clearInterval(statusUpdateInterval);
              return originalUnload.call(this.sound);
            };
            
            resolve(true);
          },
          (error) => {
            console.error('Web Audio API: Error decoding audio data:', error);
            reject(error);
          }
        );
      } catch (error) {
        console.error('Web Audio API: Error loading audio:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Load audio using Expo AV
   * @param uri URI of the audio file to load
   */
  private async loadWithExpoAV(uri: string): Promise<boolean> {
    try {
      console.log('AudioEngine: Loading with Expo AV:', uri);
      this.sound = new Audio.Sound();
      await this.sound.loadAsync({ uri });
      
      // Get the duration
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        this.duration = status.durationMillis ? status.durationMillis / 1000 : 0;
        console.log('AudioEngine: Audio loaded successfully, duration:', this.duration);
        
        // Set up status update callback
        this.sound.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
        
        this.notifyListeners('audioLoaded', { duration: this.duration });
        return true;
      } else {
        console.error('AudioEngine: Failed to load audio, status not loaded');
        return false;
      }
    } catch (error) {
      console.error('AudioEngine: Error loading with Expo AV:', error);
      return false;
    }
  }
  
  /**
   * Unload the current audio
   */
  async unloadAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      this.audioUri = null;
      this.currentTime = 0;
      this.duration = 0;
      this.isPlaying = false;
    } catch (error) {
      console.error('Failed to unload audio:', error);
    }
  }
  
  /**
   * Play the audio
   */
  async play(): Promise<void> {
    if (!this.sound) {
      return;
    }
    
    try {
      await this.sound.playAsync();
      this.isPlaying = true;
      this.notifyListeners('playbackStateChanged', this.getPlaybackState());
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }
  
  /**
   * Pause the audio
   */
  async pause(): Promise<void> {
    if (!this.sound) {
      return;
    }
    
    try {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.notifyListeners('playbackStateChanged', this.getPlaybackState());
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }
  
  /**
   * Stop the audio and reset position
   */
  async stop(): Promise<void> {
    if (!this.sound) {
      return;
    }
    
    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
      this.isPlaying = false;
      this.currentTime = 0;
      this.notifyListeners('playbackStateChanged', this.getPlaybackState());
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }
  
  /**
   * Seek to a specific position
   * @param time Time in seconds
   */
  async seekTo(time: number): Promise<void> {
    if (!this.sound) {
      return;
    }
    
    try {
      await this.sound.setPositionAsync(time * 1000);
      this.currentTime = time;
      this.notifyListeners('playbackStateChanged', this.getPlaybackState());
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  }
  
  /**
   * Get the current playback state
   */
  getPlaybackState(): {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  } {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration
    };
  }
  
  /**
   * Playback status update handler
   */
  private onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    
    this.isPlaying = status.isPlaying;
    this.currentTime = status.positionMillis / 1000;
    
    if (status.didJustFinish) {
      this.isPlaying = false;
      this.currentTime = 0;
    }
    
    this.notifyListeners('playbackStateChanged', this.getPlaybackState());
  };
  
  /**
   * Set the processing mode
   * @param mode Processing mode
   */
  setProcessingMode(mode: 'local' | 'dolby' | 'vocal'): void {
    this.mode = mode;
  }
  
  /**
   * Get the current processing mode
   */
  getProcessingMode(): 'local' | 'dolby' | 'vocal' {
    return this.mode;
  }
  
  /**
   * Add a processing module to the local processing chain
   * @param module Processing module to add
   */
  addProcessingModule(module: ProcessingModule): void {
    this.processingEngine.addModule(module);
  }
  
  /**
   * Remove a processing module from the local processing chain
   * @param moduleId ID of the module to remove
   */
  removeProcessingModule(moduleId: string): void {
    this.processingEngine.removeModule(moduleId);
  }
  
  /**
   * Clear all processing modules from the local processing chain
   */
  clearProcessingChain(): void {
    this.processingEngine.clearProcessingChain();
  }
  
  /**
   * Get the current processing chain
   */
  getProcessingChain(): ProcessingModule[] {
    return this.processingEngine.getProcessingChain();
  }
  
  /**
   * Process the audio using the current processing chain or service
   * @param userId User ID for cloud processing
   * @param options Processing options
   */
  async processAudio(
    userId: string,
    options?: any
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    if (!this.audioUri) {
      return { success: false, error: 'No audio loaded' };
    }
    
    try {
      this.isProcessing = true;
      this.notifyListeners('processingStarted', { mode: this.mode });
      
      let result;
      
      switch (this.mode) {
        case 'local':
          // Process using the local processing engine
          const processedBuffer = await this.processingEngine.processAudio();
          const blob = await this.processingEngine.exportAudio('wav');
          
          // Create a URL for the processed audio
          const url = URL.createObjectURL(blob);
          
          result = {
            id: uuidv4(),
            originalFileUrl: this.audioUri,
            processedFileUrl: url,
            createdAt: new Date().toISOString(),
            userId
          };
          break;
          
        case 'dolby':
          // Process using Dolby.io
          if (!options || !options.dolby) {
            return { success: false, error: 'Missing Dolby mastering options' };
          }
          
          result = await this.masteringService.masterAudio(
            userId,
            this.audioUri,
            options.dolby
          );
          break;
          
        case 'vocal':
          // Process using vocal processing
          // First, process with the local engine
          await this.vocalService.loadAudioFile(this.audioUri);
          const processedVocalBuffer = await this.vocalService.processAudio();
          const vocalBlob = await this.vocalService.exportAudio('wav');
          
          // Save the processed audio
          const resultId = await this.vocalService.saveProcessedAudio(
            userId,
            'Processed Vocal',
            options?.projectId,
            options?.trackId
          );
          
          // Get the result
          // This is a simplified implementation
          result = {
            id: resultId,
            originalFileUrl: this.audioUri,
            processedFileUrl: URL.createObjectURL(vocalBlob),
            createdAt: new Date().toISOString(),
            userId
          };
          break;
      }
      
      this.isProcessing = false;
      this.notifyListeners('processingCompleted', { result });
      
      return { success: true, result };
    } catch (error) {
      this.isProcessing = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notifyListeners('processingFailed', { error: errorMessage });
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Check if audio is currently being processed
   */
  isAudioProcessing(): boolean {
    return this.isProcessing;
  }
  
  /**
   * Add an event listener
   * @param event Event name
   * @param callback Callback function
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function
   */
  removeEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of an event
   * @param event Event name
   * @param data Event data
   */
  private notifyListeners(event: string, data: any): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    for (const callback of this.listeners.get(event)!) {
      callback(data);
    }
  }
  
  /**
   * Get the Dolby mastering service
   */
  getDolbyMasteringService(): DolbyMasteringService {
    return this.masteringService;
  }
  
  /**
   * Get the vocal processing service
   */
  getVocalProcessingService(): NectarVocalService {
    return this.vocalService;
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.unloadAudio();
    this.processingEngine.dispose();
    this.vocalService.dispose();
    this.listeners.clear();
  }
}

export default AudioEngine; 