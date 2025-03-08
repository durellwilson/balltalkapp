import { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { EqualizerModule } from '../services/audio/modules/EqualizerModule';
import { DeEsserModule } from '../services/audio/modules/DeEsserModule';
import { 
  EqualizerOptions, 
  OzoneModuleType 
} from '../models/audio/OzoneModels';
import { 
  DeEsserOptions, 
  NectarModuleType 
} from '../models/audio/NectarModels';

// Define the mastering parameters type
export interface MasteringParams {
  loudness: number;
  clarity: number;
  stereoWidth: number;
  bassBoost: number;
  highBoost: number;
  compression: number;
  limiterThreshold: number;
  profile: string;
}

// Define the vocal processing parameters type
export interface VocalParams {
  deEsser: {
    enabled: boolean;
    frequency: number;
    threshold: number;
    reduction: number;
  };
  compression: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  eq: {
    enabled: boolean;
    lowCut: number;
    lowGain: number;
    midGain: number;
    highGain: number;
    presence: number;
  };
  reverb: {
    enabled: boolean;
    amount: number;
    size: number;
    decay: number;
  };
}

/**
 * Custom hook for audio processing
 */
export function useAudioProcessor() {
  const { 
    audioEngine, 
    processingMode, 
    setProcessingMode,
    addProcessingModule,
    removeProcessingModule,
    clearProcessingChain,
    getProcessingChain,
    processAudio,
    isProcessing
  } = useAudio();
  
  // Mastering parameters
  const [masteringParams, setMasteringParams] = useState<MasteringParams>({
    loudness: -3,
    clarity: 50,
    stereoWidth: 100,
    bassBoost: 0,
    highBoost: 0,
    compression: 50,
    limiterThreshold: -0.3,
    profile: 'balanced'
  });
  
  // Vocal processing parameters
  const [vocalParams, setVocalParams] = useState<VocalParams>({
    deEsser: {
      enabled: true,
      frequency: 7500,
      threshold: -12,
      reduction: 6
    },
    compression: {
      enabled: true,
      threshold: -20,
      ratio: 3,
      attack: 10,
      release: 100
    },
    eq: {
      enabled: true,
      lowCut: 100,
      lowGain: -2,
      midGain: 1,
      highGain: 2,
      presence: 3
    },
    reverb: {
      enabled: false,
      amount: 20,
      size: 50,
      decay: 1.5
    }
  });
  
  // Update mastering parameters
  const updateMasteringParam = (param: keyof MasteringParams, value: number | string) => {
    setMasteringParams(prev => ({
      ...prev,
      [param]: value
    }));
    
    // Apply the parameter to the processing chain
    applyMasteringParams();
  };
  
  // Update vocal parameters
  const updateVocalParam = (
    category: keyof VocalParams,
    param: string,
    value: number | boolean
  ) => {
    setVocalParams(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [param]: value
      }
    }));
    
    // Apply the parameter to the processing chain
    applyVocalParams();
  };
  
  // Apply mastering parameters to the processing chain
  const applyMasteringParams = () => {
    // Clear the current processing chain
    clearProcessingChain();
    
    // Create an equalizer module
    const eqOptions: EqualizerOptions = {
      isEnabled: true,
      moduleType: OzoneModuleType.EQUALIZER,
      bands: [
        {
          id: 'eq1',
          frequency: 80,
          gain: masteringParams.bassBoost,
          q: 0.7,
          type: 'bell',
          isEnabled: true,
          processingMode: 'stereo'
        },
        {
          id: 'eq2',
          frequency: 250,
          gain: -1,
          q: 1.0,
          type: 'bell',
          isEnabled: true,
          processingMode: 'stereo'
        },
        {
          id: 'eq3',
          frequency: 2500,
          gain: masteringParams.clarity / 25, // Scale from 0-100 to 0-4
          q: 0.7,
          type: 'bell',
          isEnabled: true,
          processingMode: 'stereo'
        },
        {
          id: 'eq4',
          frequency: 8000,
          gain: masteringParams.highBoost,
          q: 0.7,
          type: 'bell',
          isEnabled: true,
          processingMode: 'stereo'
        }
      ],
      eqMode: 'digital',
      enableMidSide: false,
      autoGainEnabled: true
    };
    
    const eqModule = new EqualizerModule(eqOptions);
    addProcessingModule(eqModule);
    
    // Add more modules as needed
    // For example, compressor, limiter, etc.
  };
  
  // Apply vocal parameters to the processing chain
  const applyVocalParams = () => {
    // Clear the current processing chain
    clearProcessingChain();
    
    // Add de-esser if enabled
    if (vocalParams.deEsser.enabled) {
      const deEsserOptions: DeEsserOptions = {
        isEnabled: true,
        moduleType: NectarModuleType.DE_ESSER,
        mode: 'broadband',
        frequency: vocalParams.deEsser.frequency,
        range: vocalParams.deEsser.reduction,
        threshold: vocalParams.deEsser.threshold,
        attack: 1,
        release: 100,
        listenMode: false,
        shelfBoost: 0
      };
      
      const deEsserModule = new DeEsserModule(deEsserOptions);
      addProcessingModule(deEsserModule);
    }
    
    // Add EQ if enabled
    if (vocalParams.eq.enabled) {
      const eqOptions: EqualizerOptions = {
        isEnabled: true,
        moduleType: OzoneModuleType.EQUALIZER,
        bands: [
          {
            id: 'eq1',
            frequency: vocalParams.eq.lowCut,
            gain: 0,
            q: 0.7,
            type: 'highpass',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'eq2',
            frequency: 250,
            gain: vocalParams.eq.lowGain,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'eq3',
            frequency: 1000,
            gain: vocalParams.eq.midGain,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'eq4',
            frequency: 3500,
            gain: vocalParams.eq.presence,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'eq5',
            frequency: 8000,
            gain: vocalParams.eq.highGain,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          }
        ],
        eqMode: 'digital',
        enableMidSide: false,
        autoGainEnabled: true
      };
      
      const eqModule = new EqualizerModule(eqOptions);
      addProcessingModule(eqModule);
    }
    
    // Add more modules as needed
    // For example, compressor, reverb, etc.
  };
  
  // Set the processing mode
  const setMode = (mode: 'local' | 'dolby' | 'vocal') => {
    setProcessingMode(mode);
    
    // Apply the appropriate parameters
    if (mode === 'local' || mode === 'dolby') {
      applyMasteringParams();
    } else if (mode === 'vocal') {
      applyVocalParams();
    }
  };
  
  // Process the audio
  const process = async (userId: string, options?: any) => {
    // Apply the current parameters
    if (processingMode === 'local' || processingMode === 'dolby') {
      applyMasteringParams();
    } else if (processingMode === 'vocal') {
      applyVocalParams();
    }
    
    // Process the audio
    return processAudio(userId, options);
  };
  
  // Initialize the processing chain
  useEffect(() => {
    if (processingMode === 'local' || processingMode === 'dolby') {
      applyMasteringParams();
    } else if (processingMode === 'vocal') {
      applyVocalParams();
    }
  }, [processingMode]);
  
  return {
    masteringParams,
    vocalParams,
    updateMasteringParam,
    updateVocalParam,
    setMode,
    process,
    isProcessing,
    processingMode
  };
} 