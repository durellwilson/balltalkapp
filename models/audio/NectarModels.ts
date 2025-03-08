// models/audio/NectarModels.ts

/**
 * Base interface for all Nectar-inspired vocal processing module options
 */
export interface NectarModuleOptions {
  id?: string;
  moduleType: NectarModuleType;
  isEnabled: boolean;
}

/**
 * Types of Nectar-inspired vocal processing modules
 */
export enum NectarModuleType {
  EQUALIZER = 'equalizer',
  COMPRESSOR = 'compressor',
  DE_ESSER = 'de_esser',
  GATE = 'gate',
  SATURATION = 'saturation',
  DELAY = 'delay',
  REVERB = 'reverb',
  PITCH = 'pitch',
  HARMONY = 'harmony',
  DIMENSION = 'dimension',
  CLARITY = 'clarity',
  BREATH = 'breath'
}

/**
 * Pitch module options
 */
export interface PitchOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.PITCH;
  mode: 'natural' | 'robot' | 'formant';
  correction: number; // 0-100, amount of pitch correction
  speed: number; // 0-100, speed of pitch correction
  scale: string; // e.g., 'C Major', 'A Minor'
  formantShift: number; // -12 to 12 semitones
  transpose: number; // -12 to 12 semitones
  notes: {
    note: string; // e.g., 'C4', 'A#3'
    enabled: boolean;
  }[];
}

/**
 * EQ module options
 */
export interface VocalEQOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.EQUALIZER;
  bands: VocalEQBand[];
  eqMode: 'digital' | 'analog' | 'vintage' | 'transparent';
  enableMidSide: boolean;
  autoGainEnabled: boolean;
}

/**
 * EQ band
 */
export interface VocalEQBand {
  id: string;
  frequency: number;
  gain: number;
  q: number;
  type: 'bell' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch';
  isEnabled: boolean;
}

/**
 * Compressor module options
 */
export interface VocalCompressorOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.COMPRESSOR;
  mode: 'vintage' | 'modern' | 'optical' | 'digital';
  threshold: number; // dB
  ratio: number; // compression ratio
  attack: number; // ms
  release: number; // ms
  gain: number; // dB
  kneeWidth: number;
  mix: number; // 0-100%
  autoGainEnabled: boolean;
  sidechain: boolean;
  sidechainFrequency: number;
  sidechainQ: number;
}

/**
 * Gate module options
 */
export interface GateOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.GATE;
  threshold: number; // dB
  ratio: number; // gate ratio
  attack: number; // ms
  release: number; // ms
  hysteresis: number; // dB
  hold: number; // ms
  sidechain: boolean;
  sidechainFrequency: number;
  sidechainQ: number;
}

/**
 * De-esser module options
 */
export interface DeEsserOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.DE_ESSER;
  threshold: number;
  ratio: number;
  frequency: number; // Hz
  range: number; // dB
  listenMode: boolean; // Whether to listen to the processed signal only
  mode: 'broadband' | 'multiband';
  attack: number; // ms
  release: number; // ms
  width: number;
}

/**
 * Saturation module options
 */
export interface SaturationOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.SATURATION;
  drive: number; // 0-100%
  satType: 'tape' | 'tube' | 'warm' | 'retro' | 'distortion';
  mix: number; // 0-100%
  harmonics: 'even' | 'odd' | 'both';
  highpass: number;
  lowpass: number;
}

/**
 * Delay module options
 */
export interface DelayOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.DELAY;
  time: number; // ms
  feedback: number; // 0-100%
  mix: number; // 0-100%
  pingPong: boolean;
  syncToTempo: boolean;
  filterFrequency: number;
  filterResonance: number;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
}

/**
 * Reverb module options
 */
export interface ReverbOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.REVERB;
  size: number;
  decay: number;
  predelay: number;
  mix: number; // 0-100%
  highCut: number; // Hz
  lowCut: number; // Hz
  earlyReflections: number; // 0-100%
  diffusion: number; // 0-100%
  type: 'room' | 'hall' | 'plate' | 'chamber' | 'spring';
}

/**
 * Auto Level module options
 */
export interface AutoLevelOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.EQUALIZER;
  targetLevel: number; // dB
  responsiveness: number; // 0-100%
  release: number; // ms
  gainRange: number; // dB
  enableLimiter: boolean;
  limiterThreshold: number; // dB
}

/**
 * Harmony module options
 */
export interface HarmonyOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.HARMONY;
  voices: HarmonyVoice[];
  scale: string; // e.g., 'C Major', 'A Minor'
  keyCenter: string; // e.g., 'C', 'A#'
  formantPreservation: number; // 0-100%
  humanization: number; // 0-100%
}

/**
 * Harmony voice
 */
export interface HarmonyVoice {
  id: string;
  interval: number; // semitones from the original
  pan: number; // -100 to 100
  level: number; // dB
  formantShift: number; // -12 to 12 semitones
  delay: number; // ms
  isEnabled: boolean;
}

/**
 * Dimension module options
 */
export interface DimensionOptions extends NectarModuleOptions {
  moduleType: NectarModuleType.DIMENSION;
  width: number; // 0-200%
  depth: number; // 0-100%
  size: number; // 0-100%
  mix: number; // 0-100%
  mode: 'natural' | 'wide' | 'extreme';
}

/**
 * Clarity module options
 */
export interface ClarityOptions extends NectarModuleOptions {
  amount: number;
  tone: number;
  detail: number;
  mix: number;
  mode: 'gentle' | 'medium' | 'aggressive';
}

/**
 * Breath module options
 */
export interface BreathOptions extends NectarModuleOptions {
  amount: number;
  tone: number;
  attack: number;
  release: number;
  mix: number;
}

/**
 * Vocal Assistant analysis result
 */
export interface VocalAssistantResult {
  id: string;
  targetGenre: string;
  targetReference: string;
  createdAt: string;
  
  // Recommended modules and settings
  recommendedModules: NectarModuleOptions[];
  
  // Analysis data
  analysisData: {
    clarity: number;
    presence: number;
    sibilance: number;
    breathiness: number;
    dynamicRange: number;
    pitchStability: number;
    frequencyBalance: {
      lowRange: number;
      midRange: number;
      highRange: number;
    };
  };
}

/**
 * Vocal processing preset
 */
export interface VocalPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: NectarModuleOptions[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault: boolean;
}

/**
 * Default vocal presets
 */
export const DEFAULT_VOCAL_PRESETS: VocalPreset[] = [
  {
    id: 'clean-vocal',
    name: 'Clean Vocal',
    description: 'A clean, transparent vocal preset',
    category: 'general',
    modules: [
      {
        id: 'eq-clean',
        moduleType: NectarModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 80,
            gain: -18,
            q: 0.7,
            type: 'highpass',
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 240,
            gain: -2,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band3',
            frequency: 900,
            gain: 1.5,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band4',
            frequency: 3000,
            gain: 2.5,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band5',
            frequency: 12000,
            gain: 1.5,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true
          }
        ],
        eqMode: 'transparent',
        autoGainEnabled: true
      } as VocalEQOptions,
      {
        id: 'comp-clean',
        moduleType: NectarModuleType.COMPRESSOR,
        isEnabled: true,
        threshold: -18,
        ratio: 2.5,
        attack: 15,
        release: 150,
        gain: 2,
        kneeWidth: 10,
        mode: 'digital',
        mix: 100,
        autoGainEnabled: true,
        sidechain: false,
        sidechainFrequency: 0,
        sidechainQ: 0
      } as VocalCompressorOptions,
      {
        id: 'de-esser-clean',
        moduleType: NectarModuleType.DE_ESSER,
        isEnabled: true,
        threshold: -12,
        ratio: 3,
        frequency: 7500,
        range: 6,
        listenMode: false,
        mode: 'broadband',
        attack: 0.1,
        release: 80,
        width: 2
      } as DeEsserOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'warm-vocal',
    name: 'Warm Vocal',
    description: 'A warm, vintage-inspired vocal preset',
    category: 'general',
    modules: [
      {
        id: 'eq-warm',
        moduleType: NectarModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 100,
            gain: -12,
            q: 0.7,
            type: 'highpass',
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 200,
            gain: 1.5,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band3',
            frequency: 500,
            gain: -1.5,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band4',
            frequency: 3000,
            gain: -1.0,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band5',
            frequency: 8000,
            gain: 1.0,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true
          }
        ],
        eqMode: 'vintage',
        autoGainEnabled: true
      } as VocalEQOptions,
      {
        id: 'comp-warm',
        moduleType: NectarModuleType.COMPRESSOR,
        isEnabled: true,
        threshold: -20,
        ratio: 3,
        attack: 25,
        release: 200,
        gain: 2.5,
        kneeWidth: 15,
        mode: 'optical',
        mix: 100,
        autoGainEnabled: true,
        sidechain: false,
        sidechainFrequency: 0,
        sidechainQ: 0
      } as VocalCompressorOptions,
      {
        id: 'sat-warm',
        moduleType: NectarModuleType.SATURATION,
        isEnabled: true,
        drive: 3,
        satType: 'tube',
        mix: 30,
        harmonics: 'even',
        highpass: 200,
        lowpass: 8000
      } as SaturationOptions,
      {
        id: 'reverb-warm',
        moduleType: NectarModuleType.REVERB,
        isEnabled: true,
        size: 20,
        decay: 1.2,
        predelay: 10,
        mix: 15,
        highCut: 6000,
        lowCut: 300,
        earlyReflections: 30,
        diffusion: 70,
        type: 'plate'
      } as ReverbOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'bright-vocal',
    name: 'Bright Vocal',
    description: 'A bright, modern vocal preset',
    category: 'general',
    modules: [
      {
        id: 'eq-bright',
        moduleType: NectarModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 100,
            gain: -18,
            q: 0.7,
            type: 'highpass',
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 250,
            gain: -3,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band3',
            frequency: 900,
            gain: 2,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band4',
            frequency: 3500,
            gain: 3,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band5',
            frequency: 10000,
            gain: 4,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true
          }
        ],
        eqMode: 'digital',
        autoGainEnabled: true
      } as VocalEQOptions,
      {
        id: 'comp-bright',
        moduleType: NectarModuleType.COMPRESSOR,
        isEnabled: true,
        threshold: -18,
        ratio: 2.5,
        attack: 10,
        release: 100,
        gain: 2,
        kneeWidth: 5,
        mode: 'modern',
        mix: 100,
        autoGainEnabled: true,
        sidechain: false,
        sidechainFrequency: 0,
        sidechainQ: 0
      } as VocalCompressorOptions,
      {
        id: 'de-esser-bright',
        moduleType: NectarModuleType.DE_ESSER,
        isEnabled: true,
        threshold: -15,
        ratio: 4,
        frequency: 7000,
        range: 8,
        listenMode: false,
        mode: 'multiband',
        attack: 0.1,
        release: 80,
        width: 2
      } as DeEsserOptions,
      {
        id: 'clarity-bright',
        moduleType: NectarModuleType.CLARITY,
        isEnabled: true,
        amount: 60,
        tone: 70,
        detail: 50,
        mix: 70,
        mode: 'medium'
      } as ClarityOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'rap-vocal',
    name: 'Rap Vocal',
    description: 'A preset optimized for rap and hip-hop vocals',
    category: 'genre',
    modules: [
      {
        id: 'eq-rap',
        moduleType: NectarModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 80,
            gain: -18,
            q: 0.7,
            type: 'highpass',
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 200,
            gain: -2,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band3',
            frequency: 500,
            gain: -1,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band4',
            frequency: 2000,
            gain: 2,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band5',
            frequency: 5000,
            gain: 3,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band6',
            frequency: 10000,
            gain: 2,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true
          }
        ],
        eqMode: 'digital',
        autoGainEnabled: true
      } as VocalEQOptions,
      {
        id: 'comp-rap',
        moduleType: NectarModuleType.COMPRESSOR,
        isEnabled: true,
        threshold: -15,
        ratio: 4,
        attack: 5,
        release: 80,
        gain: 2,
        kneeWidth: 3,
        mode: 'modern',
        mix: 100,
        autoGainEnabled: true,
        sidechain: false,
        sidechainFrequency: 0,
        sidechainQ: 0
      } as VocalCompressorOptions,
      {
        id: 'de-esser-rap',
        moduleType: NectarModuleType.DE_ESSER,
        isEnabled: true,
        threshold: -12,
        ratio: 3,
        frequency: 7000,
        range: 6,
        listenMode: false,
        mode: 'broadband',
        attack: 0.1,
        release: 80,
        width: 2
      } as DeEsserOptions,
      {
        id: 'sat-rap',
        moduleType: NectarModuleType.SATURATION,
        isEnabled: true,
        drive: 2,
        satType: 'warm',
        mix: 20,
        harmonics: 'both',
        highpass: 200,
        lowpass: 8000
      } as SaturationOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'auto-tune',
    name: 'Auto-Tune Effect',
    description: 'A modern auto-tune effect for vocals',
    category: 'effect',
    modules: [
      {
        id: 'eq-autotune',
        moduleType: NectarModuleType.EQUALIZER,
        isEnabled: true,
        bands: [
          {
            id: 'band1',
            frequency: 100,
            gain: -18,
            q: 0.7,
            type: 'highpass',
            isEnabled: true
          },
          {
            id: 'band2',
            frequency: 250,
            gain: -2,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band3',
            frequency: 900,
            gain: 1.5,
            q: 1.0,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band4',
            frequency: 3000,
            gain: 2,
            q: 0.7,
            type: 'bell',
            isEnabled: true
          },
          {
            id: 'band5',
            frequency: 8000,
            gain: 3,
            q: 0.7,
            type: 'highshelf',
            isEnabled: true
          }
        ],
        eqMode: 'digital',
        autoGainEnabled: true
      } as VocalEQOptions,
      {
        id: 'comp-autotune',
        moduleType: NectarModuleType.COMPRESSOR,
        isEnabled: true,
        threshold: -15,
        ratio: 3,
        attack: 10,
        release: 80,
        gain: 2,
        kneeWidth: 5,
        mode: 'modern',
        mix: 100,
        autoGainEnabled: true,
        sidechain: false,
        sidechainFrequency: 0,
        sidechainQ: 0
      } as VocalCompressorOptions,
      {
        id: 'pitch-autotune',
        moduleType: NectarModuleType.PITCH,
        isEnabled: true,
        pitch: 0,
        formant: 0,
        mix: 100,
        quality: 'high',
        preserveFormants: true,
        latency: 'medium'
      } as PitchOptions,
      {
        id: 'delay-autotune',
        moduleType: NectarModuleType.DELAY,
        isEnabled: true,
        time: 125,
        feedback: 15,
        mix: 20,
        pingPong: true,
        syncToTempo: true,
        filterFrequency: 2000,
        filterResonance: 0.5,
        filterType: 'lowpass'
      } as DelayOptions
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  }
]; 