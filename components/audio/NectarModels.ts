export enum NectarModuleType {
  PITCH = 'pitch',
  VOCAL_EQ = 'vocal_eq',
  COMPRESSOR = 'compressor',
  GATE = 'gate',
  DE_ESSER = 'de_esser',
  SATURATION = 'saturation',
  DELAY = 'delay',
  REVERB = 'reverb',
  AUTO_LEVEL = 'auto_level',
  HARMONY = 'harmony',
  DIMENSION = 'dimension',
  BACKER = 'backer'
}

// Define base module options
export interface NectarModuleOptions {
  id?: string;
  moduleType: NectarModuleType;
  isEnabled: boolean;
}

// Define specific module options
export interface DeEsserOptions extends NectarModuleOptions {
  mode: 'broadband' | 'multiband';
  frequency: number;
  range: number;
  threshold: number;
  attack: number;
  release: number;
  listenMode: boolean;
  shelfBoost: number;
}

// Define other module options...

// Define vocal preset
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

// Define vocal assistant result
export interface VocalAssistantResult {
  id: string;
  targetGenre: string;
  targetReference: string;
  createdAt: string;
  recommendedModules: NectarModuleOptions[];
  analysisData: {
    pitchRange: {
      min: number;
      max: number;
      average: number;
    };
    dynamicRange: number;
    sibilanceLevel: number;
    breathinessLevel: number;
    roomAcoustics: number;
    backgroundNoiseLevel: number;
    spectralBalance: {
      lowRange: number;
      midRange: number;
      highRange: number;
    };
  };
}

// Define default presets
export const DEFAULT_VOCAL_PRESETS: VocalPreset[] = [
  {
    id: 'clean_vocal',
    name: 'Clean Vocal',
    description: 'A clean vocal preset with light processing',
    category: 'lead',
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
