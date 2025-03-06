// models/User.ts

export interface User {
  id: string; // Unique ID assigned by Firebase Auth
  email: string;
  username: string;
  password?: string; // Only used for registration, not stored in database
  role: 'athlete' | 'fan'; // User type
  displayName?: string; // Full name of the user
  photoURL?: string; // Profile picture URL
  createdAt?: string; // Account creation date
  
  // Athlete-specific fields
  isVerified?: boolean; // Whether the athlete is verified
  verificationStatus?: 'pending' | 'approved' | 'rejected'; // Status of verification
  sport?: string; // Sport the athlete plays
  league?: string; // League the athlete belongs to
  team?: string; // Team the athlete plays for
  position?: string; // Position the athlete plays
  bio?: string; // Athlete bio
  
  // Fan-specific fields
  favoriteAthletes?: string[]; // IDs of favorite athletes
  favoriteLeagues?: string[]; // Favorite leagues
  favoriteTeams?: string[]; // Favorite teams
  
  // Subscription info
  subscriptionTier?: 'free' | 'basic' | 'premium' | 'vip'; // Subscription level
  subscriptionExpiresAt?: string; // When the subscription expires
}

// Extended profile for athletes with verification details
export interface AthleteVerification {
  userId: string;
  documentUrls: string[]; // URLs to verification documents
  leagueAffiliation: string;
  teamAffiliation: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  id?: string; // Document ID in Firestore
}
