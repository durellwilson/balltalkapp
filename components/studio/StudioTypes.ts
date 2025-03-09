// components/studio/StudioTypes.ts

/**
 * Project interface
 * 
 * Represents a music production project with tracks and metadata.
 */
export interface Project {
  id: string;
  name: string;
  tracks: Track[];
  tempo: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  collaborators?: string[];
  isPublic?: boolean;
  description?: string;
  tags?: string[];
  coverArtUrl?: string;
}

/**
 * Track interface
 * 
 * Represents an audio track within a project.
 */
export interface Track {
  id: string;
  name: string;
  isPlaying: boolean;
  isRecording: boolean;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  trackNumber: number;
  recordingIds: string[];
  createdAt: string;
  updatedAt?: string;
  effects?: {
    reverb?: number;
    delay?: number;
    eq?: {
      low: number;
      mid: number;
      high: number;
    };
  };
  color?: string;
  icon?: string;
}

/**
 * TrackEffect interface
 * 
 * Represents an audio effect applied to a track.
 */
export interface TrackEffect {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: Record<string, number>;
}

/**
 * Effect types enum
 * 
 * Available audio effect types.
 */
export enum EffectType {
  EQ = 'eq',
  COMPRESSOR = 'compressor',
  REVERB = 'reverb',
  DELAY = 'delay',
  DISTORTION = 'distortion',
  FILTER = 'filter',
  LIMITER = 'limiter',
  GATE = 'gate',
}

/**
 * Recording interface
 * 
 * Represents a recorded audio clip.
 */
export interface Recording {
  id: string;
  uri: string;
  duration: number;
  createdAt: string;
  trackId?: string;
  projectId?: string;
  userId?: string;
  name?: string;
  isProcessed?: boolean;
}

/**
 * Beat interface
 * 
 * Represents a beat or instrumental track.
 */
export interface Beat {
  id: string;
  name: string;
  url: string;
  duration: number;
  tempo: number;
  genre?: string;
  createdAt: string;
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  coverArtUrl?: string;
  price?: number;
  isFree?: boolean;
}

/**
 * AudioProcessingOptions interface
 * 
 * Options for audio processing operations.
 */
export interface AudioProcessingOptions {
  normalize?: boolean;
  normalizationLevel?: number;
  compression?: boolean;
  compressionThreshold?: number;
  compressionRatio?: number;
  compressionAttack?: number;
  compressionRelease?: number;
  reverb?: boolean;
  reverbAmount?: number;
  reverbDecay?: number;
  eq?: boolean;
  eqLow?: number;
  eqMid?: number;
  eqHigh?: number;
  fadeIn?: boolean;
  fadeInDuration?: number;
  fadeOut?: boolean;
  fadeOutDuration?: number;
  trimStart?: number;
  trimEnd?: number;
}

export interface Collaborator {
  id: string;
  displayName: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive?: string;
}

export interface AudioRecording {
    id: string;
    url: string;
    duration: number;
    createdAt: string;
    trackId: string;
    projectId: string;
    userId: string;
}
