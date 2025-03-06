// services/VerificationService.ts
import { db, storage } from '../src/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  Firestore,
  orderBy,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { AthleteVerification } from '../models/User';

// Cast db and storage to proper types
const firebaseDb = db;
const firebaseStorage = storage;

class VerificationService {
  // Submit verification request
  async submitVerificationRequest(
    userId: string,
    leagueAffiliation: string,
    teamAffiliation: string,
    documents: Blob[]
  ): Promise<AthleteVerification | null> {
    try {
      const verificationId = uuidv4();
      const now = new Date().toISOString();
      
      // Upload verification documents
      const documentUrls: string[] = [];
      
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        const documentRef = ref(firebaseStorage, `verifications/${userId}/${verificationId}/document_${i}`);
        await uploadBytes(documentRef, document);
        const url = await getDownloadURL(documentRef);
        documentUrls.push(url);
      }
      
      // Create verification request
      const verification: AthleteVerification = {
        userId,
        documentUrls,
        leagueAffiliation,
        teamAffiliation,
        submittedAt: now,
        status: 'pending'
      };
      
      // Save verification request to Firestore
      await setDoc(doc(firebaseDb, 'verifications', verificationId), verification);
      
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', userId), {
        verificationStatus: 'pending'
      });
      
      return verification;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      return null;
    }
  }
  
  // Get verification requests (for admin)
  async getPendingVerificationRequests(): Promise<AthleteVerification[]> {
    try {
      const verificationsRef = collection(firebaseDb, 'verifications');
      const q = query(
        verificationsRef, 
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as AthleteVerification,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error getting verification requests:', error);
      return [];
    }
  }
  
  // Approve verification request (for admin)
  async approveVerificationRequest(
    verificationId: string,
    adminId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Get verification request
      const verificationDoc = await getDoc(doc(firebaseDb, 'verifications', verificationId));
      if (!verificationDoc.exists()) {
        return false;
      }
      
      const verification = verificationDoc.data() as AthleteVerification;
      
      // Update verification status
      await updateDoc(doc(firebaseDb, 'verifications', verificationId), {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: adminId,
        notes: notes || 'Approved'
      });
      
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', verification.userId), {
        isVerified: true,
        verificationStatus: 'approved'
      });
      
      // Update user's profile to mark as athlete
      const profileDoc = await getDoc(doc(firebaseDb, 'profiles', verification.userId));
      if (profileDoc.exists()) {
        await updateDoc(doc(firebaseDb, 'profiles', verification.userId), {
          isAthlete: true,
          sport: verification.leagueAffiliation.split(' ')[0], // Extract sport from league (e.g., "NBA Basketball" -> "Basketball")
          league: verification.leagueAffiliation,
          team: verification.teamAffiliation,
          updatedAt: now
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error approving verification request:', error);
      return false;
    }
  }
  
  // Reject verification request (for admin)
  async rejectVerificationRequest(
    verificationId: string,
    adminId: string,
    notes: string
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Get verification request
      const verificationDoc = await getDoc(doc(firebaseDb, 'verifications', verificationId));
      if (!verificationDoc.exists()) {
        return false;
      }
      
      const verification = verificationDoc.data() as AthleteVerification;
      
      // Update verification status
      await updateDoc(doc(firebaseDb, 'verifications', verificationId), {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: adminId,
        notes
      });
      
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', verification.userId), {
        verificationStatus: 'rejected'
      });
      
      return true;
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      return false;
    }
  }
  
  // Get user's verification status
  async getUserVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'none';
    lastRequest?: AthleteVerification;
  }> {
    try {
      // Get user document
      const userDoc = await getDoc(doc(firebaseDb, 'users', userId));
      if (!userDoc.exists()) {
        return { isVerified: false, status: 'none' };
      }
      
      const userData = userDoc.data();
      
      // Get user's verification requests
      const verificationsRef = collection(firebaseDb, 'verifications');
      const q = query(
        verificationsRef, 
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          isVerified: userData.isVerified || false,
          status: userData.verificationStatus || 'none'
        };
      }
      
      const lastRequest = querySnapshot.docs[0].data() as AthleteVerification;
      
      return {
        isVerified: userData.isVerified || false,
        status: userData.verificationStatus || 'none',
        lastRequest: {
          ...lastRequest,
          id: querySnapshot.docs[0].id
        }
      };
    } catch (error) {
      console.error('Error getting user verification status:', error);
      return { isVerified: false, status: 'none' };
    }
  }
  
  // Get verified athletes by league
  async getVerifiedAthletesByLeague(league: string): Promise<string[]> {
    try {
      const usersRef = collection(firebaseDb, 'users');
      const q = query(
        usersRef, 
        where('isVerified', '==', true),
        where('role', '==', 'athlete')
      );
      const querySnapshot = await getDocs(q);
      
      const userIds = querySnapshot.docs.map(doc => doc.id);
      
      // Get profiles for these users
      const profilesRef = collection(firebaseDb, 'profiles');
      const profilesQuery = query(
        profilesRef, 
        where('userId', 'in', userIds),
        where('league', '==', league)
      );
      const profilesSnapshot = await getDocs(profilesQuery);
      
      return profilesSnapshot.docs.map(doc => doc.data().userId);
    } catch (error) {
      console.error('Error getting verified athletes by league:', error);
      return [];
    }
  }
  
  // Reset verification status for a user
  async resetVerificationStatus(userId: string): Promise<boolean> {
    try {
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', userId), {
        isVerified: false,
        verificationStatus: 'none'
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting verification status:', error);
      return false;
    }
  }
  
  // Update verification status for a user
  async updateVerificationStatus(
    userId: string, 
    status: 'none' | 'pending' | 'approved' | 'rejected',
    isVerified: boolean = status === 'approved'
  ): Promise<boolean> {
    try {
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', userId), {
        isVerified,
        verificationStatus: status
      });
      
      return true;
    } catch (error) {
      console.error('Error updating verification status:', error);
      return false;
    }
  }
}

export default new VerificationService();
