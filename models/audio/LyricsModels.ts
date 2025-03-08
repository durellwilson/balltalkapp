// models/audio/LyricsModels.ts

/**
 * Options for lyrics generation
 */
export interface LyricsGenerationOptions {
  // Content guidance
  theme: string; // Main theme or topic for the lyrics
  genre: string; // Musical genre (e.g., 'hip-hop', 'r&b', 'pop')
  mood: string; // Emotional tone (e.g., 'energetic', 'reflective', 'uplifting')
  
  // Structure options
  structure?: {
    includeChorus: boolean;
    includeVerse: boolean;
    includeBridge: boolean;
    verseCount: number; // Number of verses to generate
  };
  
  // Style options
  styleOptions?: {
    complexity: number; // 1-10, vocabulary complexity
    metaphorLevel: number; // 1-10, use of metaphors and imagery
    explicitContent: boolean; // Whether to allow explicit content
    rhymeLevel: number; // 1-10, emphasis on rhyming
    storytelling: number; // 1-10, emphasis on narrative
  };
  
  // Reference material
  references?: {
    existingLyrics?: string; // Existing lyrics to use as inspiration
    artistReferences?: string[]; // Artists to use as stylistic references
    keywords?: string[]; // Specific keywords to include
    avoidKeywords?: string[]; // Keywords to avoid
  };
  
  // Technical options
  maxLength?: number; // Maximum length in characters
  language?: string; // Target language (default: 'en')
  apiProvider?: 'topmedia' | 'neuralframes'; // Which API to use
}

/**
 * Result of lyrics generation
 */
export interface LyricsGenerationResult {
  id: string; // Unique ID for this generation
  lyrics: string; // The generated lyrics
  
  // Structured lyrics (if available)
  structuredLyrics?: {
    title?: string;
    verses: string[];
    chorus?: string;
    bridge?: string;
    outro?: string;
  };
  
  // Metadata
  metadata: {
    theme: string;
    genre: string;
    mood: string;
    generatedAt: string; // ISO date string
    apiProvider: 'topmedia' | 'neuralframes' | 'local';
    processingTime: number; // in seconds
    wordCount: number;
    estimatedDuration: number; // Estimated song duration in seconds
  };
  
  // Original options used
  options: LyricsGenerationOptions;
  
  // User and project info
  userId: string;
  projectId?: string;
  
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
 * Lyrics version history
 */
export interface LyricsVersionHistory {
  projectId: string;
  versions: {
    id: string;
    versionNumber: number;
    createdAt: string;
    createdBy: string; // User ID
    isAiGenerated: boolean;
    summary?: string; // Brief description of changes
  }[];
}

/**
 * Lyrics generation job status
 */
export interface LyricsGenerationJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lyrics collaboration session
 */
export interface LyricsCollaborationSession {
  id: string;
  projectId: string;
  lyricsId: string;
  participants: {
    userId: string;
    displayName: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: string;
  }[];
  currentVersion: string; // Current lyrics version ID
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

/**
 * Default genre-based templates for lyrics generation
 */
export const LYRICS_TEMPLATES = {
  HIP_HOP: {
    structure: {
      includeChorus: true,
      includeVerse: true,
      includeBridge: true,
      verseCount: 2
    },
    styleOptions: {
      complexity: 7,
      metaphorLevel: 8,
      explicitContent: true,
      rhymeLevel: 9,
      storytelling: 8
    }
  },
  POP: {
    structure: {
      includeChorus: true,
      includeVerse: true,
      includeBridge: true,
      verseCount: 2
    },
    styleOptions: {
      complexity: 5,
      metaphorLevel: 6,
      explicitContent: false,
      rhymeLevel: 7,
      storytelling: 6
    }
  },
  R_AND_B: {
    structure: {
      includeChorus: true,
      includeVerse: true,
      includeBridge: true,
      verseCount: 2
    },
    styleOptions: {
      complexity: 6,
      metaphorLevel: 8,
      explicitContent: true,
      rhymeLevel: 7,
      storytelling: 7
    }
  },
  ROCK: {
    structure: {
      includeChorus: true,
      includeVerse: true,
      includeBridge: true,
      verseCount: 2
    },
    styleOptions: {
      complexity: 6,
      metaphorLevel: 7,
      explicitContent: true,
      rhymeLevel: 6,
      storytelling: 7
    }
  }
}; 