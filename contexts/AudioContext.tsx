import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AudioEngine from '../services/audio/AudioEngine';
import { ProcessingModule } from '../services/audio/AudioProcessingEngine';
import { 
  DolbyMasteringProfile, 
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyMasteringOptions,
  DolbyMasteringResult
} from '../services/audio/DolbyMasteringService';

// Define the context type
interface AudioContextType {
  audioEngine: AudioEngine;
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isProcessing: boolean;
  processingMode: 'local' | 'dolby' | 'vocal';
  loadAudio: (uri: string) => Promise<boolean>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  setProcessingMode: (mode: 'local' | 'dolby' | 'vocal') => void;
  addProcessingModule: (module: ProcessingModule) => void;
  removeProcessingModule: (moduleId: string) => void;
  clearProcessingChain: () => void;
  getProcessingChain: () => ProcessingModule[];
  processAudio: (userId: string, options?: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  masteringProfiles: typeof DolbyMasteringProfile;
  outputFormats: typeof DolbyOutputFormat;
  stereoEnhancements: typeof DolbyStereoEnhancement;
  loudnessStandards: typeof DolbyLoudnessStandard;
}

// Create the context with a default value
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Provider component
interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // Create the audio engine
  const [audioEngine] = useState<AudioEngine>(() => new AudioEngine());
  
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMode, setProcessingMode] = useState<'local' | 'dolby' | 'vocal'>('local');
  
  // Initialize the audio engine
  useEffect(() => {
    let isMounted = true;
    console.log('AudioContext: Starting initialization...');
    
    const initialize = async () => {
      try {
        // Set a timeout to prevent getting stuck on initialization
        const initPromise = audioEngine.initialize();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.warn('AudioContext: Audio engine initialization timed out after 10 seconds');
            resolve(true); // Resolve with true to allow the app to continue
          }, 10000);
        });
        
        // Race the initialization against the timeout
        const success = await Promise.race([initPromise, timeoutPromise]);
        console.log(`AudioContext: Audio engine initialization ${success ? 'completed' : 'failed'}`);
        
        if (isMounted) {
          setIsInitialized(true); // Always set to true to prevent the app from getting stuck
        }
      } catch (error) {
        console.error('AudioContext: Failed to initialize audio engine:', error);
        if (isMounted) {
          setIsInitialized(true); // Set to true anyway to allow the app to continue
        }
      }
    };
    
    initialize();
    
    // Add event listeners
    const onPlaybackStateChanged = (state: { isPlaying: boolean; currentTime: number; duration: number }) => {
      if (isMounted) {
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.currentTime);
        setDuration(state.duration);
      }
    };
    
    const onProcessingStarted = () => {
      if (isMounted) {
        setIsProcessing(true);
      }
    };
    
    const onProcessingCompleted = () => {
      if (isMounted) {
        setIsProcessing(false);
      }
    };
    
    const onProcessingFailed = () => {
      if (isMounted) {
        setIsProcessing(false);
      }
    };
    
    audioEngine.addEventListener('playbackStateChanged', onPlaybackStateChanged);
    audioEngine.addEventListener('processingStarted', onProcessingStarted);
    audioEngine.addEventListener('processingCompleted', onProcessingCompleted);
    audioEngine.addEventListener('processingFailed', onProcessingFailed);
    
    // Clean up
    return () => {
      isMounted = false;
      audioEngine.removeEventListener('playbackStateChanged', onPlaybackStateChanged);
      audioEngine.removeEventListener('processingStarted', onProcessingStarted);
      audioEngine.removeEventListener('processingCompleted', onProcessingCompleted);
      audioEngine.removeEventListener('processingFailed', onProcessingFailed);
      audioEngine.dispose();
    };
  }, []);
  
  // Load audio with error handling
  const loadAudio = async (uri: string): Promise<boolean> => {
    try {
      console.log('AudioContext: Loading audio from URI:', uri);
      setIsLoading(true);
      
      // Set a timeout to prevent getting stuck on loading
      const loadPromise = audioEngine.loadAudio(uri);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('AudioContext: Audio loading timed out after 15 seconds');
          resolve(false);
        }, 15000);
      });
      
      // Race the loading against the timeout
      const success = await Promise.race([loadPromise, timeoutPromise]);
      console.log(`AudioContext: Audio loading ${success ? 'completed' : 'failed'}`);
      
      setIsLoading(false);
      return success;
    } catch (error) {
      console.error('AudioContext: Failed to load audio:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  // Play audio
  const play = async (): Promise<void> => {
    await audioEngine.play();
  };
  
  // Pause audio
  const pause = async (): Promise<void> => {
    await audioEngine.pause();
  };
  
  // Stop audio
  const stop = async (): Promise<void> => {
    await audioEngine.stop();
  };
  
  // Seek to a specific position
  const seekTo = async (time: number): Promise<void> => {
    await audioEngine.seekTo(time);
  };
  
  // Set processing mode
  const setProcessingModeHandler = (mode: 'local' | 'dolby' | 'vocal'): void => {
    audioEngine.setProcessingMode(mode);
    setProcessingMode(mode);
  };
  
  // Add processing module
  const addProcessingModule = (module: ProcessingModule): void => {
    audioEngine.addProcessingModule(module);
  };
  
  // Remove processing module
  const removeProcessingModule = (moduleId: string): void => {
    audioEngine.removeProcessingModule(moduleId);
  };
  
  // Clear processing chain
  const clearProcessingChain = (): void => {
    audioEngine.clearProcessingChain();
  };
  
  // Get processing chain
  const getProcessingChain = (): ProcessingModule[] => {
    return audioEngine.getProcessingChain();
  };
  
  // Process audio
  const processAudio = async (
    userId: string,
    options?: any
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    return audioEngine.processAudio(userId, options);
  };
  
  // Context value
  const value: AudioContextType = {
    audioEngine,
    isInitialized,
    isLoading,
    isPlaying,
    currentTime,
    duration,
    isProcessing,
    processingMode,
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    setProcessingMode: setProcessingModeHandler,
    addProcessingModule,
    removeProcessingModule,
    clearProcessingChain,
    getProcessingChain,
    processAudio,
    masteringProfiles: DolbyMasteringProfile,
    outputFormats: DolbyOutputFormat,
    stereoEnhancements: DolbyStereoEnhancement,
    loudnessStandards: DolbyLoudnessStandard
  };
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// Custom hook to use the audio context
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return context;
};

export default AudioContext; 