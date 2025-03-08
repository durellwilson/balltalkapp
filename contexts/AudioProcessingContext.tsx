import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { Audio } from 'expo-av';

// Define preset types
export type PresetCategory = 'Master' | 'Vocal' | 'Instrument' | 'Custom';

export interface ProcessingPreset {
  id: string;
  name: string;
  category: PresetCategory;
  settings: AudioProcessingSettings;
  isDefault?: boolean;
}

// Processing settings interface
export interface AudioProcessingSettings {
  // EQ settings
  eqBands: Array<{
    frequency: number;
    gain: number;
    q: number;
    enabled: boolean;
  }>;
  
  // Compression settings
  compressorEnabled: boolean;
  compressorThreshold: number; // dB, -60 to 0
  compressorRatio: number; // 1:1 to 20:1
  compressorAttack: number; // ms, 0 to 100
  compressorRelease: number; // ms, 10 to 1000
  compressorMakeupGain: number; // dB, 0 to 24
  
  // Reverb settings
  reverbEnabled: boolean;
  reverbWet: number; // 0 to 1
  reverbDecay: number; // seconds, 0.1 to 10
  reverbPredelay: number; // ms, 0 to 500
  
  // Limiter settings
  limiterEnabled: boolean;
  limiterThreshold: number; // dB, -20 to 0
  limiterRelease: number; // ms, 10 to 1000
  
  // De-esser settings (for vocals)
  deEsserEnabled: boolean;
  deEsserThreshold: number; // dB, -60 to 0
  deEsserFrequency: number; // Hz, 2000 to 16000
  
  // Exciter settings
  exciterEnabled: boolean;
  exciterAmount: number; // 0 to 100
  exciterFrequency: number; // Hz, 1000 to 16000
  exciterHarmonics: number; // 1 to 5
  
  // Stereo enhancement
  stereoWidthEnabled: boolean;
  stereoWidth: number; // %, 0 to 200
  
  // Output settings
  outputGain: number; // dB, -60 to 12
}

// Default processing settings
export const defaultSettings: AudioProcessingSettings = {
  eqBands: [
    { frequency: 60, gain: 0, q: 1.0, enabled: true },
    { frequency: 200, gain: 0, q: 1.0, enabled: true },
    { frequency: 600, gain: 0, q: 1.0, enabled: true },
    { frequency: 2000, gain: 0, q: 1.0, enabled: true },
    { frequency: 6000, gain: 0, q: 1.0, enabled: true },
    { frequency: 16000, gain: 0, q: 1.0, enabled: true },
  ],
  compressorEnabled: false,
  compressorThreshold: -18,
  compressorRatio: 2,
  compressorAttack: 20,
  compressorRelease: 100,
  compressorMakeupGain: 0,
  reverbEnabled: false,
  reverbWet: 0.2,
  reverbDecay: 1.5,
  reverbPredelay: 20,
  limiterEnabled: true,
  limiterThreshold: -1,
  limiterRelease: 50,
  deEsserEnabled: false,
  deEsserThreshold: -20,
  deEsserFrequency: 6000,
  exciterEnabled: false,
  exciterAmount: 30,
  exciterFrequency: 3000,
  exciterHarmonics: 2,
  stereoWidthEnabled: false,
  stereoWidth: 100,
  outputGain: 0
};

// Default presets
const defaultPresets: ProcessingPreset[] = [
  {
    id: 'default-master',
    name: 'Balanced Master',
    category: 'Master',
    isDefault: true,
    settings: defaultSettings
  },
  {
    id: 'vocal-clarity',
    name: 'Vocal Clarity',
    category: 'Vocal',
    settings: {
      ...defaultSettings,
      compressorEnabled: true,
      compressorThreshold: -24,
      compressorRatio: 2.5,
      deEsserEnabled: true,
      eqBands: [
        { frequency: 60, gain: -3, q: 1.0, enabled: true },
        { frequency: 200, gain: -1, q: 1.0, enabled: true },
        { frequency: 600, gain: 1, q: 1.0, enabled: true },
        { frequency: 2000, gain: 2, q: 1.0, enabled: true },
        { frequency: 6000, gain: 1.5, q: 1.0, enabled: true },
        { frequency: 16000, gain: -1, q: 1.0, enabled: true },
      ]
    }
  },
  {
    id: 'rap-vocal',
    name: 'Rap Vocal',
    category: 'Vocal',
    settings: {
      ...defaultSettings,
      compressorEnabled: true,
      compressorThreshold: -20,
      compressorRatio: 4,
      compressorMakeupGain: 3,
      eqBands: [
        { frequency: 60, gain: -6, q: 1.2, enabled: true },
        { frequency: 200, gain: -2, q: 1.0, enabled: true },
        { frequency: 600, gain: 0, q: 1.0, enabled: true },
        { frequency: 2000, gain: 3, q: 1.0, enabled: true },
        { frequency: 6000, gain: 2, q: 1.0, enabled: true },
        { frequency: 16000, gain: 1, q: 1.0, enabled: true },
      ],
      exciterEnabled: true,
      exciterAmount: 40
    }
  },
  {
    id: 'loud-master',
    name: 'Loud Master',
    category: 'Master',
    settings: {
      ...defaultSettings,
      compressorEnabled: true,
      compressorThreshold: -24,
      compressorRatio: 3,
      compressorMakeupGain: 3,
      limiterEnabled: true,
      limiterThreshold: -0.5,
      exciterEnabled: true,
      exciterAmount: 20,
      outputGain: 2
    }
  }
];

// Action types
type AudioProcessingAction = 
  | { type: 'SET_AUDIO_FILE', payload: { uri: string } }
  | { type: 'SET_PROCESSED_AUDIO', payload: { uri: string } }
  | { type: 'UPDATE_SETTINGS', payload: Partial<AudioProcessingSettings> }
  | { type: 'LOAD_PRESET', payload: ProcessingPreset }
  | { type: 'SAVE_PRESET', payload: { name: string, category: PresetCategory } }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SET_PROCESSING', payload: boolean }
  | { type: 'SET_PLAYING', payload: boolean };

// State interface
interface AudioProcessingState {
  originalAudioUri: string | null;
  processedAudioUri: string | null;
  currentSettings: AudioProcessingSettings;
  presets: ProcessingPreset[];
  isProcessing: boolean;
  isPlaying: boolean;
  activePresetId: string | null;
}

// Initial state
const initialState: AudioProcessingState = {
  originalAudioUri: null,
  processedAudioUri: null,
  currentSettings: defaultSettings,
  presets: defaultPresets,
  isProcessing: false,
  isPlaying: false,
  activePresetId: 'default-master'
};

// Reducer
function audioProcessingReducer(state: AudioProcessingState, action: AudioProcessingAction): AudioProcessingState {
  switch (action.type) {
    case 'SET_AUDIO_FILE':
      return {
        ...state,
        originalAudioUri: action.payload.uri,
        processedAudioUri: null // Reset processed audio when original changes
      };
    case 'SET_PROCESSED_AUDIO':
      return {
        ...state,
        processedAudioUri: action.payload.uri
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        currentSettings: {
          ...state.currentSettings,
          ...action.payload
        },
        activePresetId: null // Custom settings no longer match a preset
      };
    case 'LOAD_PRESET':
      return {
        ...state,
        currentSettings: action.payload.settings,
        activePresetId: action.payload.id
      };
    case 'SAVE_PRESET':
      const newPreset: ProcessingPreset = {
        id: `custom-${Date.now()}`,
        name: action.payload.name,
        category: action.payload.category,
        settings: state.currentSettings
      };
      return {
        ...state,
        presets: [...state.presets, newPreset],
        activePresetId: newPreset.id
      };
    case 'RESET_SETTINGS':
      const defaultPreset = state.presets.find(p => p.isDefault);
      return {
        ...state,
        currentSettings: defaultPreset?.settings || defaultSettings,
        activePresetId: defaultPreset?.id || null
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload
      };
    default:
      return state;
  }
}

// Create context
interface AudioProcessingContextType {
  state: AudioProcessingState;
  setAudioFile: (uri: string) => void;
  processAudio: () => Promise<void>;
  updateSettings: (settings: Partial<AudioProcessingSettings>) => void;
  loadPreset: (presetId: string) => void;
  savePreset: (name: string, category: PresetCategory) => void;
  resetSettings: () => void;
  togglePlayback: () => Promise<void>;
}

const AudioProcessingContext = createContext<AudioProcessingContextType | undefined>(undefined);

// Provider component
export function AudioProcessingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioProcessingReducer, initialState);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  // Set the original audio file
  const setAudioFile = (uri: string) => {
    dispatch({ type: 'SET_AUDIO_FILE', payload: { uri } });
  };
  
  // Process the audio with current settings
  const processAudio = async () => {
    if (!state.originalAudioUri) return;
    
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      
      // In a real implementation, this would call a native module or service
      // to apply actual audio processing. For demo purposes, we'll simulate
      // processing with a timeout and just return the original audio.
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would be the URI to the processed file
      dispatch({ 
        type: 'SET_PROCESSED_AUDIO', 
        payload: { uri: state.originalAudioUri } 
      });
      
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };
  
  // Update current settings
  const updateSettings = (settings: Partial<AudioProcessingSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };
  
  // Load a preset by ID
  const loadPreset = (presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (preset) {
      dispatch({ type: 'LOAD_PRESET', payload: preset });
    }
  };
  
  // Save current settings as a new preset
  const savePreset = (name: string, category: PresetCategory) => {
    dispatch({ type: 'SAVE_PRESET', payload: { name, category } });
  };
  
  // Reset to default settings
  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
  };
  
  // Toggle playback of processed audio
  const togglePlayback = async () => {
    const audioUri = state.processedAudioUri || state.originalAudioUri;
    if (!audioUri) return;
    
    try {
      if (state.isPlaying && sound) {
        await sound.pauseAsync();
        dispatch({ type: 'SET_PLAYING', payload: false });
      } else {
        // Unload previous sound if exists
        if (sound) {
          await sound.unloadAsync();
        }
        
        // Load and play new sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          (status) => {
            if (status.didJustFinish) {
              dispatch({ type: 'SET_PLAYING', payload: false });
            }
          }
        );
        
        setSound(newSound);
        dispatch({ type: 'SET_PLAYING', payload: true });
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };
  
  // Create context value
  const contextValue: AudioProcessingContextType = {
    state,
    setAudioFile,
    processAudio,
    updateSettings,
    loadPreset,
    savePreset,
    resetSettings,
    togglePlayback
  };
  
  return (
    <AudioProcessingContext.Provider value={contextValue}>
      {children}
    </AudioProcessingContext.Provider>
  );
}

// Hook for using the audio processing context
export function useAudioProcessing() {
  const context = useContext(AudioProcessingContext);
  if (context === undefined) {
    throw new Error('useAudioProcessing must be used within an AudioProcessingProvider');
  }
  return context;
} 