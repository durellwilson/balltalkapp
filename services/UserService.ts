import { db, auth } from '../src/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy
} from 'firebase/firestore';
import { User } from '../models/User';

/**
 * Service for handling user-related operations
 */
class UserService {
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
}

// Export the class
export default UserService; 