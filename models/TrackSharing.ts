// models/TrackSharing.ts

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
  REMIX = 'remix',
  DOWNLOAD = 'download',
  FULL = 'full'
}

export enum ShareStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  REVOKED = 'revoked'
}

export interface TrackShare {
  id: string;
  trackId: string;
  ownerId: string; // User who owns the track
  recipientId: string; // User who receives the share
  permissions: SharePermission[];
  message?: string; // Optional message from the owner
  status: ShareStatus;
  expiresAt?: string; // ISO date string, optional expiration date
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string; // When the recipient last accessed the track
  accessCount?: number; // Number of times the track was accessed
}

export interface TrackShareResponse {
  id: string;
  shareId: string;
  recipientId: string;
  message?: string; // Optional message from the recipient
  status: ShareStatus;
  createdAt: string;
}

export interface SharedTrackAccess {
  id: string;
  shareId: string;
  userId: string; // User who accessed the track
  accessedAt: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface SharedTrackActivity {
  id: string;
  shareId: string;
  trackId: string;
  userId: string;
  activityType: 'view' | 'play' | 'download' | 'edit' | 'remix' | 'comment';
  timestamp: string;
  details?: any; // Additional details specific to the activity type
}

export interface SharedTrackComment {
  id: string;
  shareId: string;
  trackId: string;
  userId: string;
  text: string;
  timestamp: string;
  isPrivate: boolean; // Whether the comment is visible only to the owner and the commenter
  parentId?: string; // For replies to other comments
  mentions?: string[]; // User IDs mentioned in the comment
  timestamp_position?: number; // Position in the track (in seconds) where the comment was made
}

export interface SharedTrackEdit {
  id: string;
  shareId: string;
  trackId: string;
  userId: string;
  editType: 'trim' | 'effect' | 'mix' | 'master' | 'other';
  description: string;
  timestamp: string;
  parameters?: any; // Parameters of the edit
  beforeUrl?: string; // URL to the track before the edit
  afterUrl: string; // URL to the track after the edit
}

export interface SharedTrackRemix {
  id: string;
  shareId: string;
  originalTrackId: string;
  remixTrackId: string;
  userId: string;
  title: string;
  description?: string;
  timestamp: string;
  isPublic: boolean; // Whether the remix is publicly available
  credits?: {
    userId: string;
    role: string;
    name: string;
  }[];
}

// Notification types for track sharing
export enum TrackShareNotificationType {
  SHARE_RECEIVED = 'share_received',
  SHARE_ACCEPTED = 'share_accepted',
  SHARE_DECLINED = 'share_declined',
  SHARE_REVOKED = 'share_revoked',
  TRACK_ACCESSED = 'track_accessed',
  TRACK_COMMENTED = 'track_commented',
  TRACK_EDITED = 'track_edited',
  TRACK_REMIXED = 'track_remixed'
}

export interface TrackShareNotification {
  id: string;
  userId: string; // User who receives the notification
  type: TrackShareNotificationType;
  shareId: string;
  trackId: string;
  senderId: string; // User who triggered the notification
  message?: string;
  isRead: boolean;
  timestamp: string;
  data?: any; // Additional data specific to the notification type
} 