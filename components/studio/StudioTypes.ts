// components/studio/StudioTypes.ts

export interface Track {
    trackNumber: number | null;
    recordingIds: never[];
    id: string;
    name: string;
    audioUri?: string; // Path to the recorded audio file
    beatId?: string; // Optional ID of the beat used in this track
    isRecording: boolean;
    isPlaying: boolean;
    volume: number; // Volume level for the track (0.0 to 1.0)
    muted?: boolean;
  }

export interface Collaborator {
  id: string;
  displayName: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive?: string;
}

export interface Project {
    id: string;
    name: string;
    tempo: number; // BPM
    tracks: Track[];
    createdAt: string;
    updatedAt: string;
    ownerId?: string; // ID of the user who created the project
    collaborators?: Collaborator[]; // List of collaborators on the project
    isCollaborative?: boolean; // Whether the project is open for collaboration
    collaborationSessionId?: string; // ID of the active collaboration session
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
