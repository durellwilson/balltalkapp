/**
 * Options for AI song generation
 */
export interface SongGenerationOptions {
  // Content guidance
  prompt: string; // Detailed prompt describing the song to generate
  genre: string; // Musical genre
  mood: string; // Emotional tone
  
  // Structure options
  duration?: number; // Target duration in seconds
  structure?: {
    includeIntro: boolean;
    includeOutro: boolean;
    verseCount: number;
    chorusCount: number;
    includeBridge: boolean;
  };
  
  // Style options
  styleOptions?: {
    tempo: number; // BPM
    key?: string; // Musical key (e.g., 'C Major')
    vocalStyle?: string; // Description of vocal style
    instrumentFocus?: string[]; // Instruments to emphasize
    referenceArtists?: string[]; // Artists to use as stylistic references
    explicitContent?: boolean; // Whether to allow explicit content
  };
  
  // Technical options
  outputFormat?: {
    fileFormat: 'mp3' | 'wav';
    sampleRate?: 44100 | 48000;
    bitRate?: number;
  };
  
  // API-specific options
  apiProvider?: 'suno' | 'eachlabs';
  apiSpecificOptions?: Record<string, any>; // Provider-specific options
}

/**
 * Result of song generation
 */
export interface SongGenerationResult {
  id: string; // Unique ID for this generation
  songUrl: string; // URL to the generated song
  
  // Metadata
  metadata: {
    title: string; // Generated or provided title
    duration: number; // Actual duration in seconds
    genre: string;
    mood: string;
    tempo: number; // Detected tempo
    key?: string; // Detected musical key
    generatedAt: string; // ISO date string
    apiProvider: 'suno' | 'eachlabs';
    processingTime: number; // in seconds
  };
  
  // Additional outputs
  stems?: { // Separated audio tracks if available
    vocals?: string; // URL to vocals stem
    instruments?: string; // URL to instruments stem
    drums?: string; // URL to drums stem
    bass?: string; // URL to bass stem
  };
  lyrics?: string; // Generated lyrics if available
  
  // Original options used
  options: SongGenerationOptions;
  
  // User info
  userId: string;
  
  // Version tracking
  versionNumber: number;
  previousVersionId?: string;
  
  // Status
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Song generation job status
 */
export interface SongGenerationJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  message?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Song generation history for a user
 */
export interface SongGenerationHistory {
  userId: string;
  generations: {
    id: string; // Generation ID
    title: string;
    createdAt: string;
    genre: string;
    status: 'completed' | 'failed';
    apiProvider: 'suno' | 'eachlabs';
  }[];
}

/**
 * Default genre-based templates for song generation
 */
export const SONG_GENERATION_TEMPLATES = {
  HIP_HOP: {
    structure: {
      includeIntro: true,
      includeOutro: true,
      verseCount: 2,
      chorusCount: 2,
      includeBridge: true
    },
    styleOptions: {
      tempo: 90,
      instrumentFocus: ['drums', 'bass', 'synth'],
      explicitContent: true
    }
  },
  POP: {
    structure: {
      includeIntro: true,
      includeOutro: true,
      verseCount: 2,
      chorusCount: 3,
      includeBridge: true
    },
    styleOptions: {
      tempo: 120,
      instrumentFocus: ['synth', 'guitar', 'drums'],
      explicitContent: false
    }
  },
  R_AND_B: {
    structure: {
      includeIntro: true,
      includeOutro: true,
      verseCount: 2,
      chorusCount: 2,
      includeBridge: true
    },
    styleOptions: {
      tempo: 70,
      instrumentFocus: ['piano', 'bass', 'drums'],
      explicitContent: true
    }
  },
  ROCK: {
    structure: {
      includeIntro: true,
      includeOutro: true,
      verseCount: 2,
      chorusCount: 3,
      includeBridge: true
    },
    styleOptions: {
      tempo: 130,
      instrumentFocus: ['guitar', 'drums', 'bass'],
      explicitContent: true
    }
  }
}; 