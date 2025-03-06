// models/Profile.ts
export type ProfileData = {
  id: string; // Unique ID for the profile (can be the same as the user ID)
  userId: string; // The ID of the user this profile belongs to
  bio: string; // A short description of the user
  displayName: string; // Full name to display
  photoURL?: string; // Profile picture URL
  coverPhotoURL?: string; // Cover photo URL
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  createdAt: string; // When the profile was created
  updatedAt: string; // When the profile was last updated
    
  // Athlete-specific fields
  isAthlete?: boolean;
    sport?: string;
    league?: string;
  team?: string;
  position?: string;
    highlights?: string[]; // Professional highlights
  careerStats?: {
    [key: string]: any;
  };
  achievements?: string[];

  // Music-related fields
  musicGenres?: string[];
  featuredSongs?: string[]; // IDs of featured songs
  playlists?: string[]; // IDs of playlists
  
  // Privacy settings
  privacySettings?: {
    profileVisibility: 'public' | 'subscribers' | 'private';
    messageRequests: 'all' | 'subscribers' | 'none';
    commentPermissions: 'all' | 'subscribers' | 'none';
  };
  
  // Subscription and fan-related fields
  subscriberCount?: number;
  isSubscriptionEnabled?: boolean;
  subscriptionTiers?: {
    basic?: {
      price: number;
      benefits: string[];
    };
    premium?: {
      price: number;
      benefits: string[];
    };
    vip?: {
      price: number;
      benefits: string[];
    };
  };
}
export type Profile = ProfileData;
