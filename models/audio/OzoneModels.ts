// models/audio/OzoneModels.ts

/**
 * Base interface for all Ozone-inspired mastering module options
 */
export interface OzoneModuleOptions {
  id?: string;
  moduleType: OzoneModuleType;
  isEnabled: boolean;
}

/**
 * Types of Ozone-inspired mastering modules
 */
export enum OzoneModuleType {
  EQUALIZER = 'equalizer',
  DYNAMIC_EQ = 'dynamic_eq',
  MULTIBAND_COMPRESSOR = 'multiband_compressor',
  EXCITER = 'exciter',
  IMAGER = 'imager',
  MAXIMIZER = 'maximizer',
  LOW_END_FOCUS = 'low_end_focus',
  SPECTRAL_SHAPER = 'spectral_shaper',
  VINTAGE_LIMITER = 'vintage_limiter',
  VINTAGE_TAPE = 'vintage_tape',
  VINTAGE_COMPRESSOR = 'vintage_compressor'
}

/**
 * Equalizer module options
 */
export interface EqualizerOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.EQUALIZER;
  bands: Array<{
    id: string;
    frequency: number;
    gain: number;
    q: number;
    type: 'bell' | 'highpass' | 'lowpass' | 'highshelf' | 'lowshelf';
    isEnabled: boolean;
    processingMode: 'stereo' | 'mid' | 'side';
  }>;
  eqMode: 'digital' | 'analog' | 'vintage' | 'baxandall';
  enableMidSide: boolean;
  autoGainEnabled: boolean;
}

/**
 * Dynamic EQ module options
 */
export interface DynamicEQOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.DYNAMIC_EQ;
  bands: DynamicEQBand[];
  globalThreshold: number;
  globalRatio: number;
  enableMidSide: boolean;
  autoGainEnabled: boolean;
}

/**
 * Dynamic EQ band
 */
export interface DynamicEQBand {
  id: string;
  frequency: number;
  gain: number;
  q: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  type: 'bell' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch';
  mode: 'upward' | 'downward';
  isEnabled: boolean;
  processingMode: 'stereo' | 'mid' | 'side';
}

/**
 * Multiband Compressor module options
 */
export interface MultibandCompressorOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.MULTIBAND_COMPRESSOR;
  bands: Array<{
    id: string;
    frequency: number;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    gain: number;
    isEnabled: boolean;
  }>;
  globalThreshold: number;
  globalRatio: number;
  globalAttack: number;
  globalRelease: number;
  globalGain: number;
}

/**
 * Exciter module options
 */
export interface ExciterOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.EXCITER;
  bands: Array<{
    id: string;
    frequency: number;
    amount: number;
    blend: number;
    isEnabled: boolean;
  }>;
  mode: 'multiband' | 'broadband';
  harmonics: 'even' | 'odd' | 'both';
  saturation: 'tape' | 'tube' | 'warm' | 'retro';
}

/**
 * Imager module options
 */
export interface ImagerOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.IMAGER;
  bands: Array<{
    id: string;
    frequency: number;
    width: number;
    isEnabled: boolean;
  }>;
  globalWidth: number;
  stereoPlacement: number;
  phaseControl: number;
}

/**
 * Maximizer module options
 */
export interface MaximizerOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.MAXIMIZER;
  threshold: number;
  ceiling: number;
  release: number;
  character: 'transparent' | 'modern' | 'classic';
  transientEnhancement: number;
  stereoIndependence: number;
}

/**
 * Low End Focus module options
 */
export interface LowEndFocusOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.LOW_END_FOCUS;
  mode: 'punchy' | 'smooth' | 'tight';
  amount: number;
  contrast: number;
  shelfFrequency: number;
}

/**
 * Spectral Shaper module options
 */
export interface SpectralShaperOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.SPECTRAL_SHAPER;
  maskingReduction: number;
  maskingFrequency: number;
  maskingGain: number;
  detailPreservation: number;
}

/**
 * Vintage Limiter module options
 */
export interface VintageLimiterOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.VINTAGE_LIMITER;
  mode: 'modern' | 'vintage';
  threshold: number;
  character: number;
  speed: number;
  release: number;
}

/**
 * Vintage Tape module options
 */
export interface VintageTapeOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.VINTAGE_TAPE;
  drive: number;
  saturation: number;
  lowFrequency: number;
  highFrequency: number;
  noise: number;
  speed: '15ips' | '30ips';
}

/**
 * Vintage Compressor module options
 */
export interface VintageCompressorOptions extends OzoneModuleOptions {
  moduleType: OzoneModuleType.VINTAGE_COMPRESSOR;
  mode: 'modern' | 'vintage';
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeup: number;
  mix: number;
}

/**
 * Master Assistant analysis result
 */
export interface MasterAssistantResult {
  id: string;
  targetLoudness: number;
  targetGenre: string;
  targetReference: string;
  createdAt: string;
  
  // Recommended modules and settings
  recommendedModules: OzoneModuleOptions[];
  
  // Analysis data
  analysisData: {
    peakLoudness: number;
    averageLoudness: number;
    dynamicRange: number;
    stereoWidth: number;
    frequencyBalance: {
      lowRange: number;
      midRange: number;
      highRange: number;
    };
    transientResponse: number;
    spectralContent: number[];
  };
}

/**
 * Mastering preset
 */
export interface MasteringPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: OzoneModuleOptions[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault: boolean;
}

/**
 * Default mastering presets
 */
export const DEFAULT_MASTERING_PRESETS: MasteringPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'A balanced preset for general mastering',
    category: 'general',
    modules: [
      {
        id: 'eq-balanced',
        moduleType: OzoneModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 30,
            gain: -1.5,
            q: 0.7,
            type: 'highpass',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band2',
            frequency: 100,
            gain: 1.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band3',
            frequency: 250,
            gain: -1.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band4',
            frequency: 2000,
            gain: 1.5,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band5',
            frequency: 8000,
            gain: 2.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band6',
            frequency: 16000,
            gain: 1.0,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true,
            processingMode: 'stereo'
          }
        ],
        eqMode: 'digital',
        enableMidSide: false,
        autoGainEnabled: true
      } as EqualizerOptions,
      {
        id: 'maximizer-balanced',
        moduleType: OzoneModuleType.MAXIMIZER,
        isEnabled: true,
        threshold: -3.0,
        ceiling: -0.1,
        release: 250,
        character: 'transparent',
        transientEnhancement: 0,
        stereoIndependence: 50
      } as MaximizerOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'A warm, analog-inspired mastering preset',
    category: 'general',
    modules: [
      {
        id: 'eq-warm',
        moduleType: OzoneModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 40,
            gain: -1.0,
            q: 0.7,
            type: 'highpass',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band2',
            frequency: 120,
            gain: 2.0,
            q: 0.8,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band3',
            frequency: 500,
            gain: -1.5,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band4',
            frequency: 3000,
            gain: -1.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band5',
            frequency: 10000,
            gain: 1.0,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true,
            processingMode: 'stereo'
          }
        ],
        eqMode: 'analog',
        enableMidSide: false,
        autoGainEnabled: true
      } as EqualizerOptions,
      {
        id: 'vintage-tape-warm',
        moduleType: OzoneModuleType.VINTAGE_TAPE,
        isEnabled: true,
        drive: 2.0,
        saturation: 3.0,
        lowFrequency: 100,
        highFrequency: 8000,
        noise: 0.5,
        speed: '15ips'
      } as VintageTapeOptions,
      {
        id: 'maximizer-warm',
        moduleType: OzoneModuleType.MAXIMIZER,
        isEnabled: true,
        threshold: -3.5,
        ceiling: -0.1,
        release: 300,
        character: 'classic',
        transientEnhancement: 0,
        stereoIndependence: 30
      } as MaximizerOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'bright',
    name: 'Bright',
    description: 'A bright, modern mastering preset',
    category: 'general',
    modules: [
      {
        id: 'eq-bright',
        moduleType: OzoneModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 30,
            gain: -2.0,
            q: 0.7,
            type: 'highpass',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band2',
            frequency: 100,
            gain: -1.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band3',
            frequency: 250,
            gain: -2.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band4',
            frequency: 2000,
            gain: 2.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band5',
            frequency: 5000,
            gain: 3.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band6',
            frequency: 12000,
            gain: 4.0,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true,
            processingMode: 'stereo'
          }
        ],
        eqMode: 'digital',
        enableMidSide: false,
        autoGainEnabled: true
      } as EqualizerOptions,
      {
        id: 'exciter-bright',
        moduleType: OzoneModuleType.EXCITER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 5000,
            amount: 3.0,
            blend: 50,
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 10000,
            amount: 4.0,
            blend: 50,
            isEnabled: true
          }
        ],
        mode: 'multiband',
        harmonics: 'both',
        saturation: 'warm'
      } as ExciterOptions,
      {
        id: 'maximizer-bright',
        moduleType: OzoneModuleType.MAXIMIZER,
        isEnabled: true,
        threshold: -2.5,
        ceiling: -0.1,
        release: 200,
        character: 'modern',
        transientEnhancement: 20,
        stereoIndependence: 70
      } as MaximizerOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'hip-hop',
    name: 'Hip-Hop',
    description: 'A preset optimized for hip-hop and rap',
    category: 'genre',
    modules: [
      {
        id: 'eq-hiphop',
        moduleType: OzoneModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 30,
            gain: -1.0,
            q: 0.7,
            type: 'highpass',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band2',
            frequency: 60,
            gain: 3.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band3',
            frequency: 200,
            gain: -2.0,
            q: 1.0,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band4',
            frequency: 1000,
            gain: -1.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band5',
            frequency: 3000,
            gain: 2.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true,
            processingMode: 'stereo'
          },
          {
            id: 'band6',
            frequency: 10000,
            gain: 1.5,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true,
            processingMode: 'stereo'
          }
        ],
        eqMode: 'digital',
        enableMidSide: false,
        autoGainEnabled: true
      } as EqualizerOptions,
      {
        id: 'low-end-focus-hiphop',
        moduleType: OzoneModuleType.LOW_END_FOCUS,
        isEnabled: true,
        mode: 'punchy',
        amount: 70,
        contrast: 50,
        shelfFrequency: 120
      } as LowEndFocusOptions,
      {
        id: 'maximizer-hiphop',
        moduleType: OzoneModuleType.MAXIMIZER,
        isEnabled: true,
        threshold: -2.0,
        ceiling: -0.1,
        release: 150,
        character: 'modern',
        transientEnhancement: 10,
        stereoIndependence: 50
      } as MaximizerOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  }
]; 