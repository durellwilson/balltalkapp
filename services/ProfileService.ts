// services/ProfileService.ts
import type { Profile} from '../../models/Profile';
import type {ProfileData} from '../../models/Profile';
import { db } from '../src/lib/firebase'
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, DocumentData } from '@react-native-firebase/firestore';
// Cast db to Firestore type

export class ProfileService {
  // Function to create or update a profile

  async saveProfile(profile: Profile): Promise<Profile | null> {
    try {
      const now = new Date().toISOString();
      
      // Check if profile exists
      const profileDoc = await getDoc(doc(db, 'profiles', profile.id));
      
      if (profileDoc.exists()) {
        // Update existing profile
        const updatedProfile = {
          ...profile,
          updatedAt: now
        };
        
        await updateDoc(doc(db, 'profiles', profile.id), updatedProfile);
        return updatedProfile;
      } else {
        // Create new profile
        const newProfile = {
          ...profile,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(doc(db, 'profiles', profile.id), newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      return null;
    }
  }

  // Function to get a profile by ID
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log("Fetching profile for userId:", userId);
      
      // First try to get profile by ID (if ID is the profile ID)
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log("Profile found by ID:", JSON.stringify(profileData, null, 2));
        
        // Validate profile data
        const validatedProfile: Profile = {
          id: profileData.id || userId,
          userId: profileData.userId || userId,
          displayName: profileData.displayName || 'Unknown User',
          bio: profileData.bio || '',
          createdAt: profileData.createdAt || new Date().toISOString(),
          updatedAt: profileData.updatedAt || new Date().toISOString(),
          // Include optional fields only if they exist
          ...(profileData.photoURL && { photoURL: profileData.photoURL }),
          ...(profileData.coverPhotoURL && { coverPhotoURL: profileData.coverPhotoURL }),
          ...(profileData.socialLinks && { socialLinks: profileData.socialLinks }),
          ...(profileData.isAthlete && { isAthlete: profileData.isAthlete }),
          ...(profileData.sport && { sport: profileData.sport }),
          ...(profileData.league && { league: profileData.league }),
          ...(profileData.team && { team: profileData.team }),
          ...(profileData.position && { position: profileData.position }),
          ...(profileData.careerStats && { careerStats: profileData.careerStats }),
          ...(profileData.achievements && { achievements: profileData.achievements }),
          ...(profileData.musicGenres && { musicGenres: profileData.musicGenres }),
          ...(profileData.featuredSongs && { featuredSongs: profileData.featuredSongs }),
          ...(profileData.playlists && { playlists: profileData.playlists }),
          ...(profileData.privacySettings && { privacySettings: profileData.privacySettings }),
          ...(profileData.subscriberCount && { subscriberCount: profileData.subscriberCount }),
          ...(profileData.isSubscriptionEnabled && { isSubscriptionEnabled: profileData.isSubscriptionEnabled }),
          ...(profileData.subscriptionTiers && { subscriptionTiers: profileData.subscriptionTiers })
        };
        
        return validatedProfile;
      }
      
      // If not found, try to find by userId
      console.log("Profile not found by ID, searching by userId");
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        console.log("Profile found by userId:", JSON.stringify(profileData, null, 2));
        
        // Validate profile data
        const validatedProfile: Profile = {
          id: profileData.id || querySnapshot.docs[0].id,
          userId: profileData.userId || userId,
          displayName: profileData.displayName || 'Unknown User',
          bio: profileData.bio || '',
          createdAt: profileData.createdAt || new Date().toISOString(),
          updatedAt: profileData.updatedAt || new Date().toISOString(),
          // Include optional fields only if they exist
          ...(profileData.photoURL && { photoURL: profileData.photoURL }),
          ...(profileData.coverPhotoURL && { coverPhotoURL: profileData.coverPhotoURL }),
          ...(profileData.socialLinks && { socialLinks: profileData.socialLinks }),
          ...(profileData.isAthlete && { isAthlete: profileData.isAthlete }),
          ...(profileData.sport && { sport: profileData.sport }),
          ...(profileData.league && { league: profileData.league }),
          ...(profileData.team && { team: profileData.team }),
          ...(profileData.position && { position: profileData.position }),
          ...(profileData.careerStats && { careerStats: profileData.careerStats }),
          ...(profileData.achievements && { achievements: profileData.achievements }),
          ...(profileData.musicGenres && { musicGenres: profileData.musicGenres }),
          ...(profileData.featuredSongs && { featuredSongs: profileData.featuredSongs }),
          ...(profileData.playlists && { playlists: profileData.playlists }),
          ...(profileData.privacySettings && { privacySettings: profileData.privacySettings }),
          ...(profileData.subscriberCount && { subscriberCount: profileData.subscriberCount }),
          ...(profileData.isSubscriptionEnabled && { isSubscriptionEnabled: profileData.isSubscriptionEnabled }),
          ...(profileData.subscriptionTiers && { subscriptionTiers: profileData.subscriptionTiers })
        };
        
        return validatedProfile;
      }
      
      // If no profile found, return null
      console.log("No profile found for userId:", userId);
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }
  
  // Function to create a new profile
  async createProfile(userId: string, displayName: string, bio: string = ''): Promise<Profile | null> {
    try {
      const now = new Date().toISOString();
      const profileId = userId; // Use userId as profile ID for simplicity
      
      const defaultProfile: Profile = {
        id: profileId,
        userId: userId,
        displayName: displayName,
        bio: bio,
        createdAt: now,
        updatedAt: now,
        privacySettings: {
          profileVisibility: 'public',
          messageRequests: 'all',
          commentPermissions: 'all'
        }
      };
      
      await setDoc(doc(db, 'profiles', profileId), defaultProfile);
      return defaultProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }
  
  // Function to get profiles by sport or league
  async getProfilesByCategory(category: 'sport' | 'league', value: string): Promise<Profile[]> {
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where(category, '==', value), where('isAthlete', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Profile);
    } catch (error) {
      console.error(`Error getting profiles by ${category}:`, error);
      return [];
    }
  }
  
  async createAthleteProfile(userId: string, profileData: Omit<ProfileData, 'id'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const profile: Omit<Profile, 'id'> = {
        ...profileData,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'profiles', userId), profile);
    } catch (error) {
      console.error('Error creating athlete profile:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  // Function to update subscription settings
  async updateSubscriptionSettings(
    profileId: string, 
    isEnabled: boolean, 
    tiers?: Profile['subscriptionTiers']
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'profiles', profileId), {
        isSubscriptionEnabled: isEnabled,
        subscriptionTiers: tiers || {},
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating subscription settings:', error);
      return false;
    }
  }
  
  // Function to update privacy settings
  async updatePrivacySettings(
    profileId: string,
    settings: Profile['privacySettings']
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'profiles', profileId), {
        privacySettings: settings,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  }
}
const profileService = new ProfileService();
export default profileService;
