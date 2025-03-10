import { db, auth } from '../src/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { User } from '../../models/User';
import { ExtendedUser, UserRole } from '../../contexts/auth';
import NetworkErrorHandler from './NetworkErrorHandler';

// User profile interface
export interface UserProfile {
  id: string;
  displayName?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  bio?: string;
  photoURL?: string;
  createdAt?: string | Timestamp;
  lastLoginAt?: string | Timestamp;
  profileComplete?: boolean;
  followers?: number;
  following?: number;
  isVerified?: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  preferences?: {
    notifications?: boolean;
    privacy?: 'public' | 'private';
    theme?: 'light' | 'dark' | 'system';
  };
}

/**
 * Service for handling user-related operations
 */
class UserService {
  private static instance: UserService;
  private networkErrorHandler: NetworkErrorHandler;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private lastOnlineUpdate: { [userId: string]: { status: boolean; timestamp: number } } = {};

  constructor() {
    this.networkErrorHandler = NetworkErrorHandler.getInstance();
  }

  /**
   * Get user details by ID
   * @param userId - The user ID to fetch
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        console.error('UserService: getUserById called with empty userId');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log(`UserService: No user found with ID ${userId}`);
        return null;
      }
      
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        email: userData.email || '',
        username: userData.username || '',
        role: userData.role || 'fan',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        createdAt: userData.createdAt || '',
        isVerified: userData.isVerified || false,
        verificationStatus: userData.verificationStatus || 'pending',
        sport: userData.sport || '',
        league: userData.league || '',
        team: userData.team || '',
        position: userData.position || '',
        bio: userData.bio || '',
        favoriteAthletes: userData.favoriteAthletes || [],
        favoriteLeagues: userData.favoriteLeagues || [],
        favoriteTeams: userData.favoriteTeams || [],
        subscriptionTier: userData.subscriptionTier || 'free',
        subscriptionExpiresAt: userData.subscriptionExpiresAt || ''
      };
    } catch (error) {
      console.error('UserService: Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Search for users by name or username
   * @param query - The search query
   * @param maxResults - Maximum number of results to return
   * @returns Array of matching users
   */
  async searchUsers(query: string, maxResults: number = 10): Promise<User[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchQuery = query.toLowerCase().trim();
      
      // Search by displayName or username
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(
        query(usersRef, orderBy('username'), limit(50))
      );
      
      const users: User[] = [];
      
      // Filter results client-side for more flexible matching
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const username = (userData.username || '').toLowerCase();
        const displayName = (userData.displayName || '').toLowerCase();
        
        if (username.includes(searchQuery) || displayName.includes(searchQuery)) {
          users.push({
            id: doc.id,
            email: userData.email || '',
            username: userData.username || '',
            role: userData.role || 'fan',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || '',
            createdAt: userData.createdAt || '',
            isVerified: userData.isVerified || false
          } as User);
        }
      });
      
      return users.slice(0, maxResults);
    } catch (error) {
      console.error('UserService: Error searching users:', error);
      return [];
    }
  }

  /**
   * Get user by email address
   * @param email - The email address to search for
   * @returns User object or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!email) {
        console.error('UserService: getUserByEmail called with empty email');
        return null;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`UserService: No user found with email ${email}`);
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        email: userData.email || '',
        username: userData.username || '',
        role: userData.role || 'fan',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        createdAt: userData.createdAt || '',
        isVerified: userData.isVerified || false,
        verificationStatus: userData.verificationStatus || 'pending',
        sport: userData.sport || '',
        league: userData.league || '',
        team: userData.team || '',
        position: userData.position || '',
        bio: userData.bio || '',
        favoriteAthletes: userData.favoriteAthletes || [],
        favoriteLeagues: userData.favoriteLeagues || [],
        favoriteTeams: userData.favoriteTeams || [],
        subscriptionTier: userData.subscriptionTier || 'free',
        subscriptionExpiresAt: userData.subscriptionExpiresAt || ''
      };
    } catch (error) {
      console.error('UserService: Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Get current authenticated user
   * @returns Current user or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('UserService: No authenticated user');
        return null;
      }
      
      return this.getUserById(currentUser.uid);
    } catch (error) {
      console.error('UserService: Error getting current user:', error);
      return null;
    }
  }

  // Collection name
  private USERS_COLLECTION = 'users';
  
  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log(`[UserService] Getting profile for user ${userId}`);
    
    return this.retryOperation(async () => {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`[UserService] User ${userId} not found`);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Format timestamps
      const profile: UserProfile = {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt instanceof Timestamp 
          ? userData.createdAt.toDate().toISOString() 
          : userData.createdAt,
        lastLoginAt: userData.lastLoginAt instanceof Timestamp 
          ? userData.lastLoginAt.toDate().toISOString() 
          : userData.lastLoginAt
      };
      
      return profile;
    });
  }
  
  /**
   * Get all users
   */
  async getAllUsers(limitCount: number = 100): Promise<UserProfile[]> {
    try {
      console.log(`[UserService] Getting all users (limit: ${limitCount})`);
      
      const usersQuery = query(
        collection(db, this.USERS_COLLECTION),
        orderBy('lastLoginAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        users.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt instanceof Timestamp 
            ? userData.createdAt.toDate().toISOString() 
            : userData.createdAt,
          lastLoginAt: userData.lastLoginAt instanceof Timestamp 
            ? userData.lastLoginAt.toDate().toISOString() 
            : userData.lastLoginAt
        });
      });
      
      console.log(`[UserService] Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('[UserService] Error getting all users:', error);
      throw error;
    }
  }
  
  /**
   * Search users by name or username
   */
  async searchUsersByQuery(query: string, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      console.log(`[UserService] Searching users with query: ${query}`);
      
      // Get all users (we'll filter client-side since Firestore doesn't support
      // case-insensitive search or partial text search without additional setup)
      const allUsers = await this.getAllUsers(100);
      
      // Filter users by query
      const searchQuery = query.toLowerCase().trim();
      const filteredUsers = allUsers.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery)) ||
        (user.username && user.username.toLowerCase().includes(searchQuery)) ||
        (user.email && user.email.toLowerCase().includes(searchQuery)) ||
        user.id.toLowerCase().includes(searchQuery)
      ).slice(0, limitCount);
      
      console.log(`[UserService] Found ${filteredUsers.length} users matching query`);
      return filteredUsers;
    } catch (error) {
      console.error('[UserService] Error searching users:', error);
      throw error;
    }
  }
  
  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      console.log(`[UserService] Getting users with role: ${role}`);
      
      const usersQuery = query(
        collection(db, this.USERS_COLLECTION),
        where('role', '==', role),
        orderBy('lastLoginAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        users.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt instanceof Timestamp 
            ? userData.createdAt.toDate().toISOString() 
            : userData.createdAt,
          lastLoginAt: userData.lastLoginAt instanceof Timestamp 
            ? userData.lastLoginAt.toDate().toISOString() 
            : userData.lastLoginAt
        });
      });
      
      console.log(`[UserService] Found ${users.length} users with role ${role}`);
      return users;
    } catch (error) {
      console.error(`[UserService] Error getting users with role ${role}:`, error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    console.log(`[UserService] Updating profile for user ${userId}`);
    
    return this.retryOperation(async () => {
      // Remove id from profileData if present
      const { id, ...dataToUpdate } = profileData;
      
      // Add updatedAt timestamp
      const updateData = {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      };
      
      // Update user document
      await updateDoc(doc(db, this.USERS_COLLECTION, userId), updateData);
      
      // Get updated user profile
      const updatedProfile = await this.getUserProfile(userId);
      
      if (!updatedProfile) {
        throw new Error(`Failed to get updated profile for user ${userId}`);
      }
      
      console.log(`[UserService] Profile updated for user ${userId}`);
      return updatedProfile;
    });
  }
  
  /**
   * Create user profile
   */
  async createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      console.log(`[UserService] Creating profile for user ${userId}`);
      
      // Check if user already exists
      const existingUser = await this.getUserProfile(userId);
      
      if (existingUser) {
        console.log(`[UserService] User ${userId} already exists, updating instead`);
        return this.updateUserProfile(userId, profileData);
      }
      
      // Remove id from profileData if present
      const { id, ...dataToCreate } = profileData;
      
      // Add timestamps
      const userData = {
        ...dataToCreate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      // Create user document
      await setDoc(doc(db, this.USERS_COLLECTION, userId), userData);
      
      // Get created user profile
      const createdProfile = await this.getUserProfile(userId);
      
      if (!createdProfile) {
        throw new Error(`Failed to get created profile for user ${userId}`);
      }
      
      console.log(`[UserService] Profile created for user ${userId}`);
      return createdProfile;
    } catch (error) {
      console.error('[UserService] Error creating user profile:', error);
      throw error;
    }
  }
  
  /**
   * Convert Firebase user to user profile
   */
  convertFirebaseUserToProfile(user: ExtendedUser): UserProfile {
    return {
      id: user.uid,
      displayName: user.displayName || undefined,
      email: user.email || undefined,
      role: user.role,
      username: user.username,
      profileComplete: user.profileComplete,
      lastLoginAt: user.lastLoginAt
    };
  }

  // Methods for tracking user online status
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      if (!userId) {
        console.error('[UserService] No userId provided for updating online status');
        return;
      }

      // Check if we've updated this status recently
      const lastUpdate = this.lastOnlineUpdate[userId];
      const now = Date.now();
      if (lastUpdate && 
          lastUpdate.status === isOnline && 
          now - lastUpdate.timestamp < 5000) { // Don't update if same status within 5 seconds
        console.log(`[UserService] Skipping redundant online status update for user ${userId}`);
        return;
      }
      
      console.log(`[UserService] Updating online status for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
      
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isOnline: isOnline,
        lastSeen: serverTimestamp()
      });

      // Record this update
      this.lastOnlineUpdate[userId] = {
        status: isOnline,
        timestamp: now
      };
    } catch (error) {
      console.error('[UserService] Error updating user online status:', error);
    }
  }

  // Subscribe to user online status
  subscribeToUserOnlineStatus(
    userId: string,
    callback: (isOnline: boolean, lastSeen: Date | null) => void
  ): () => void {
    try {
      console.log(`[UserService] Subscribing to online status for user ${userId}`);
      
      if (!userId) {
        console.error('[UserService] No userId provided for online status subscription');
        return () => {};
      }
      
      const userRef = doc(db, 'users', userId);
      
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const isOnline = userData.isOnline || false;
          let lastSeen = null;
          
          if (userData.lastSeen) {
            lastSeen = userData.lastSeen instanceof Timestamp 
              ? userData.lastSeen.toDate() 
              : new Date(userData.lastSeen);
          }
          
          callback(isOnline, lastSeen);
        } else {
          callback(false, null);
        }
      }, (error) => {
        console.error('[UserService] Error in online status subscription:', error);
        callback(false, null);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('[UserService] Error setting up online status subscription:', error);
      return () => {};
    }
  }

  // Get user online status (one-time check)
  async getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean, lastSeen: Date | null }> {
    try {
      console.log(`[UserService] Getting online status for user ${userId}`);
      
      if (!userId) {
        console.error('[UserService] No userId provided for getting online status');
        return { isOnline: false, lastSeen: null };
      }
      
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const isOnline = userData.isOnline || false;
        let lastSeen = null;
        
        if (userData.lastSeen) {
          lastSeen = userData.lastSeen instanceof Timestamp 
            ? userData.lastSeen.toDate() 
            : new Date(userData.lastSeen);
        }
        
        return { isOnline, lastSeen };
      }
      
      return { isOnline: false, lastSeen: null };
    } catch (error) {
      console.error('[UserService] Error getting user online status:', error);
      return { isOnline: false, lastSeen: null };
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorDetails = this.networkErrorHandler.categorizeError(error);
      
      if (retries > 0 && errorDetails.retryable) {
        console.log(`[UserService] Operation failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryOperation(operation, retries - 1);
      }
      
      throw error;
    }
  }

  public async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    console.log(`[UserService] Updating online status for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
    
    // Check if we have a recent update for this user
    const lastUpdate = this.lastOnlineUpdate[userId];
    const now = Date.now();
    
    if (lastUpdate) {
      const timeSinceLastUpdate = now - lastUpdate.timestamp;
      // If the status is the same and it's been less than 5 minutes, skip the update
      if (lastUpdate.status === isOnline && timeSinceLastUpdate < 5 * 60 * 1000) {
        console.log(`[UserService] Skipping online status update - too recent (${Math.round(timeSinceLastUpdate / 1000)}s ago)`);
        return;
      }
    }
    
    // Update the last update record
    this.lastOnlineUpdate[userId] = {
      status: isOnline,
      timestamp: now
    };
    
    return this.retryOperation(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp()
      });
    });
  }

  public async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    console.log(`[UserService] Updating profile for user ${userId}`);
    
    // Validate the data before updating
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    if (!data || Object.keys(data).length === 0) {
      console.log('[UserService] No data to update');
      return;
    }
    
    // Remove any undefined or null values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    if (Object.keys(cleanData).length === 0) {
      console.log('[UserService] No valid data to update after cleaning');
      return;
    }
    
    return this.retryOperation(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
    });
  }
}

// Export the class
export default UserService; 