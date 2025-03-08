// models/audio/MasteringModels.ts

/**
 * Options for audio mastering process
 */
export interface MasteringOptions {
  // Basic options
  targetLoudness: number; // Target loudness in LUFS (e.g., -14 for streaming)
  enhanceStereoImage: boolean; // Whether to enhance stereo width
  profileName: string; // Mastering profile name (e.g., 'balanced', 'warm', 'bright')
  
  // Advanced options
  dynamicProcessing?: {
    compression: number; // 0-100, amount of compression
    limitingThreshold: number; // dB threshold for limiting (e.g., -0.3)
    noiseReduction: number; // 0-100, amount of noise reduction
  };
  
  // EQ settings
  equalization?: {
    lowBoost: number; // -12 to 12 dB, boost/cut for low frequencies
    midBoost: number; // -12 to 12 dB, boost/cut for mid frequencies
    highBoost: number; // -12 to 12 dB, boost/cut for high frequencies
    lowCutFrequency: number; // Hz, frequency for low cut filter
    highCutFrequency: number; // Hz, frequency for high cut filter
  };
  
  // Output format
  outputFormat?: {
    fileFormat: 'mp3' | 'wav' | 'aac' | 'flac';
    sampleRate: 44100 | 48000 | 96000;
    bitDepth?: 16 | 24 | 32;
    bitRate?: number; // For lossy formats (e.g., 320 for mp3)
  };
}

/**
 * Default mastering profiles
 */
export const MASTERING_PROFILES = {
  BALANCED: {
    name: 'balanced',
    targetLoudness: -14,
    enhanceStereoImage: true,
    dynamicProcessing: {
      compression: 50,
      limitingThreshold: -0.3,
      noiseReduction: 20
    },
    equalization: {
      lowBoost: 0,
      midBoost: 0,
      highBoost: 0,
      lowCutFrequency: 30,
      highCutFrequency: 20000
    }
  },
  WARM: {
    name: 'warm',
    targetLoudness: -14,
    enhanceStereoImage: true,
    dynamicProcessing: {
      compression: 60,
      limitingThreshold: -0.3,
      noiseReduction: 20
    },
    equalization: {
      lowBoost: 2,
      midBoost: 0,
      highBoost: -1,
      lowCutFrequency: 30,
      highCutFrequency: 19000
    }
  },
  BRIGHT: {
    name: 'bright',
    targetLoudness: -14,
    enhanceStereoImage: true,
    dynamicProcessing: {
      compression: 50,
      limitingThreshold: -0.3,
      noiseReduction: 20
    },
    equalization: {
      lowBoost: -1,
      midBoost: 0,
      highBoost: 2,
      lowCutFrequency: 40,
      highCutFrequency: 20000
    }
  },
  LOUD: {
    name: 'loud',
    targetLoudness: -9,
    enhanceStereoImage: true,
    dynamicProcessing: {
      compression: 70,
      limitingThreshold: -0.3,
      noiseReduction: 20
    },
    equalization: {
      lowBoost: 1,
      midBoost: 0,
      highBoost: 1,
      lowCutFrequency: 30,
      highCutFrequency: 20000
    }
  },
  VOCAL_FOCUS: {
    name: 'vocal_focus',
    targetLoudness: -14,
    enhanceStereoImage: true,
    dynamicProcessing: {
      compression: 60,
      limitingThreshold: -0.3,
      noiseReduction: 30
    },
    equalization: {
      lowBoost: -1,
      midBoost: 2,
      highBoost: 1,
      lowCutFrequency: 80,
      highCutFrequency: 20000
    }
  }
};

/**
 * Result of the mastering process
 */
export interface MasteringResult {
  id: string; // Unique ID for this mastering session
  originalFileUrl: string; // URL to the original audio file
  processedFileUrl: string; // URL to the processed/mastered audio file
  waveformDataBefore: number[]; // Waveform data for visualization (before mastering)
  waveformDataAfter: number[]; // Waveform data for visualization (after mastering)
  
  // Processing metadata
  processingMetadata: {
    peakLoudness: number; // Peak loudness in dB
    averageLoudness: number; // Average loudness in LUFS
    dynamicRange: number; // Dynamic range in dB
    stereoWidth: number; // Stereo width measurement (0-100)
    processedAt: string; // ISO date string
    processingTime: number; // Processing time in seconds
    apiProvider: 'dolby' | 'masterchannel' | 'local'; // Which API was used
  };
  
  // Original options used
  options: MasteringOptions;
  
  // Project and user info
  projectId?: string; // ID of the project this mastering is associated with
  trackId?: string; // ID of the track this mastering is associated with
  userId: string; // ID of the user who created this mastering
  
  // Status
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string; // Error message if status is 'failed'
  
  // Timestamps
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Mastering job status for tracking progress
 */
export interface MasteringJobStatus {
  id: string; // Job ID
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  message?: string; // Status message or error
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Mastering session history for a user
 */
export interface MasteringHistory {
  userId: string;
  sessions: {
    id: string; // Mastering session ID
    trackName: string;
    createdAt: string;
    profileUsed: string;
    status: 'completed' | 'failed';
  }[];
}

import { OzoneModuleOptions, MasteringPreset } from './OzoneModels';
import { NectarModuleOptions, VocalPreset } from './NectarModels';

export interface AudioProcessingSettings {
  id?: string;
  name: string;
  description?: string;
  masteringPreset: MasteringPreset;
  vocalPreset: VocalPreset;
  targetLoudness: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault: boolean;
}

export interface AudioProcessingResult {
  id: string;
  originalFileUrl: string;
  processedFileUrl: string;
  waveformDataOriginal: number[];
  waveformDataProcessed: number[];
  spectrogramDataOriginal: number[][];
  spectrogramDataProcessed: number[][];
  loudnessOriginal: number;
  loudnessProcessed: number;
  dynamicRangeOriginal: number;
  dynamicRangeProcessed: number;
  peakLevelOriginal: number;
  peakLevelProcessed: number;
  processingTime: number;
  settings: AudioProcessingSettings;
  createdAt: string;
}

export interface AudioFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: number;
  format: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  waveformData?: number[];
  spectrogramData?: number[][];
  loudness?: number;
  peakLevel?: number;
  dynamicRange?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  originalFileId: string;
  processedFileId?: string;
  settingsId: string;
  error?: string;
  startTime: string;
  endTime?: string;
  userId: string;
}

export enum AudioFileFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  FLAC = 'flac',
  AAC = 'aac',
  OGG = 'ogg'
}

export enum AudioProcessingMode {
  MASTERING = 'mastering',
  VOCAL_PROCESSING = 'vocal_processing',
  FULL_MIX = 'full_mix'
}

export interface ExportSettings {
  format: AudioFileFormat;
  sampleRate: 44100 | 48000 | 96000;
  bitDepth?: 16 | 24 | 32;
  normalizePeak?: number;
  normalizeLUFS?: number;
  addDither: boolean;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
    comment?: string;
  };
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: AudioFileFormat.WAV,
  sampleRate: 44100,
  bitDepth: 24,
  normalizePeak: -0.1,
  normalizeLUFS: -14,
  addDither: true,
  metadata: {
    title: '',
    artist: '',
    album: '',
    year: '',
    genre: '',
    comment: ''
  }
};

export const DEFAULT_PROCESSING_SETTINGS: AudioProcessingSettings[] = [
  {
    id: 'balanced-master',
    name: 'Balanced Master',
    description: 'A balanced preset for general mastering',
    masteringPreset: {
      id: 'balanced',
      name: 'Balanced',
      description: 'A balanced preset for general mastering',
      category: 'general',
      modules: [
        {
          id: 'eq-balanced',
          moduleType: 'equalizer',
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
        },
        {
          id: 'maximizer-balanced',
          moduleType: 'maximizer',
          isEnabled: true,
          threshold: -3.0,
          ceiling: -0.1,
          release: 250,
          character: 'transparent',
          transientEnhancement: 0,
          stereoIndependence: 50
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    vocalPreset: {
      id: 'clean-vocal',
      name: 'Clean Vocal',
      description: 'A clean, transparent vocal preset',
      category: 'general',
      modules: [
        {
          id: 'eq-clean',
          moduleType: 'equalizer',
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
        },
        {
          id: 'comp-clean',
          moduleType: 'compressor',
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
        },
        {
          id: 'de-esser-clean',
          moduleType: 'de_esser',
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
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    targetLoudness: -14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'warm-master',
    name: 'Warm Master',
    description: 'A warm, analog-inspired mastering preset',
    masteringPreset: {
      id: 'warm',
      name: 'Warm',
      description: 'A warm, analog-inspired mastering preset',
      category: 'general',
      modules: [
        {
          id: 'eq-warm',
          moduleType: 'equalizer',
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
        },
        {
          id: 'vintage-tape-warm',
          moduleType: 'vintage_tape',
          isEnabled: true,
          drive: 2.0,
          saturation: 3.0,
          lowFrequency: 100,
          highFrequency: 8000,
          noise: 0.5,
          speed: '15ips'
        },
        {
          id: 'maximizer-warm',
          moduleType: 'maximizer',
          isEnabled: true,
          threshold: -3.5,
          ceiling: -0.1,
          release: 300,
          character: 'classic',
          transientEnhancement: 0,
          stereoIndependence: 30
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    vocalPreset: {
      id: 'warm-vocal',
      name: 'Warm Vocal',
      description: 'A warm, vintage-inspired vocal preset',
      category: 'general',
      modules: [
        {
          id: 'eq-warm',
          moduleType: 'equalizer',
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
        },
        {
          id: 'comp-warm',
          moduleType: 'compressor',
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
        },
        {
          id: 'sat-warm',
          moduleType: 'saturation',
          isEnabled: true,
          drive: 3,
          satType: 'tube',
          mix: 30,
          harmonics: 'even',
          highpass: 200,
          lowpass: 8000
        },
        {
          id: 'reverb-warm',
          moduleType: 'reverb',
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
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    targetLoudness: -14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'bright-master',
    name: 'Bright Master',
    description: 'A bright, modern mastering preset',
    masteringPreset: {
      id: 'bright',
      name: 'Bright',
      description: 'A bright, modern mastering preset',
      category: 'general',
      modules: [
        {
          id: 'eq-bright',
          moduleType: 'equalizer',
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
        },
        {
          id: 'exciter-bright',
          moduleType: 'exciter',
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
        },
        {
          id: 'maximizer-bright',
          moduleType: 'maximizer',
          isEnabled: true,
          threshold: -2.5,
          ceiling: -0.1,
          release: 200,
          character: 'modern',
          transientEnhancement: 20,
          stereoIndependence: 70
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    vocalPreset: {
      id: 'bright-vocal',
      name: 'Bright Vocal',
      description: 'A bright, modern vocal preset',
      category: 'general',
      modules: [
        {
          id: 'eq-bright',
          moduleType: 'equalizer',
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
        },
        {
          id: 'comp-bright',
          moduleType: 'compressor',
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
        },
        {
          id: 'de-esser-bright',
          moduleType: 'de_esser',
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
        },
        {
          id: 'clarity-bright',
          moduleType: 'clarity',
          isEnabled: true,
          amount: 60,
          tone: 70,
          detail: 50,
          mix: 70,
          mode: 'medium'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    targetLoudness: -12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  },
  {
    id: 'hip-hop-master',
    name: 'Hip-Hop Master',
    description: 'A preset optimized for hip-hop and rap',
    masteringPreset: {
      id: 'hip-hop',
      name: 'Hip-Hop',
      description: 'A preset optimized for hip-hop and rap',
      category: 'genre',
      modules: [
        {
          id: 'eq-hiphop',
          moduleType: 'equalizer',
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
        },
        {
          id: 'low-end-focus-hiphop',
          moduleType: 'low_end_focus',
          isEnabled: true,
          mode: 'punchy',
          amount: 70,
          contrast: 50,
          shelfFrequency: 120
        },
        {
          id: 'maximizer-hiphop',
          moduleType: 'maximizer',
          isEnabled: true,
          threshold: -2.0,
          ceiling: -0.1,
          release: 150,
          character: 'modern',
          transientEnhancement: 10,
          stereoIndependence: 50
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    vocalPreset: {
      id: 'rap-vocal',
      name: 'Rap Vocal',
      description: 'A preset optimized for rap and hip-hop vocals',
      category: 'genre',
      modules: [
        {
          id: 'eq-rap',
          moduleType: 'equalizer',
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
        },
        {
          id: 'comp-rap',
          moduleType: 'compressor',
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
        },
        {
          id: 'de-esser-rap',
          moduleType: 'de_esser',
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
        },
        {
          id: 'sat-rap',
          moduleType: 'saturation',
          isEnabled: true,
          drive: 2,
          satType: 'warm',
          mix: 20,
          harmonics: 'both',
          highpass: 200,
          lowpass: 8000
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      isDefault: true
    },
    targetLoudness: -10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    isDefault: true
  }
]; 