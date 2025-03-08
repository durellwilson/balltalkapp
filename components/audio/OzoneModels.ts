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

// Define base module options
export interface OzoneModuleOptions {
  id?: string;
  moduleType: OzoneModuleType;
  isEnabled: boolean;
}

// Define specific module options
export interface EqualizerOptions extends OzoneModuleOptions {
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

// Define other module options...

// Define mastering preset
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

// Define master assistant result
export interface MasterAssistantResult {
  id: string;
  targetLoudness: number;
  targetGenre: string;
  targetReference: string;
  createdAt: string;
  recommendedModules: OzoneModuleOptions[];
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

// Define default presets
export const DEFAULT_MASTERING_PRESETS: MasteringPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'A balanced preset for general mastering',
    category: 'general',
    modules: [
      // Add default modules here
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  // Add more default presets
];
