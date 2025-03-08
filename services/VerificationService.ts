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
  deleteDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { AthleteVerification } from '../models/User';

// Cast db and storage to proper types
const firebaseDb = db;
const firebaseStorage = storage;

// Define verification document types
export type VerificationDocumentType = 
  | 'id_card' 
  | 'passport' 
  | 'drivers_license' 
  | 'team_contract' 
  | 'league_id' 
  | 'social_media_verification'
  | 'other';

// Define verification document status
export type VerificationDocumentStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'needs_more_info';

// Define verification document interface
export interface VerificationDocument {
  id: string;
  verificationId: string;
  userId: string;
  type: VerificationDocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: any; // Timestamp
  status: VerificationDocumentStatus;
  reviewedAt?: any; // Timestamp
  reviewedBy?: string;
  notes?: string;
}

// Define verification status
export type VerificationStatus = 
  | 'pending' 
  | 'in_review' 
  | 'approved' 
  | 'rejected' 
  | 'needs_more_info';

// Define enhanced athlete verification interface
export interface EnhancedAthleteVerification {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth?: string;
  sport: string;
  league: string;
  team?: string;
  position?: string;
  jerseyNumber?: string;
  careerStartYear?: number;
  socialMediaHandles?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    facebook?: string;
    youtube?: string;
  };
  documents: string[]; // Array of document IDs
  submittedAt: any; // Timestamp
  status: VerificationStatus;
  reviewedAt?: any; // Timestamp
  reviewedBy?: string;
  notes?: string;
  rejectionReason?: string;
  verificationLevel: 'basic' | 'verified' | 'official';
}

// Define verification history entry
export interface VerificationHistoryEntry {
  id: string;
  verificationId: string;
  userId: string;
  action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'requested_more_info' | 'provided_more_info';
  performedBy: string;
  performedAt: any; // Timestamp
  notes?: string;
  previousStatus?: VerificationStatus;
  newStatus: VerificationStatus;
}

class VerificationService {
  // Submit verification request with enhanced information
  async submitVerificationRequest(
    userId: string,
    fullName: string,
    sport: string,
    league: string,
    team?: string,
    position?: string,
    jerseyNumber?: string,
    dateOfBirth?: string,
    careerStartYear?: number,
    socialMediaHandles?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      facebook?: string;
      youtube?: string;
    }
  ): Promise<EnhancedAthleteVerification | null> {
    try {
      const verificationId = uuidv4();
      const now = serverTimestamp();
      
      // Create verification request
      const verification: EnhancedAthleteVerification = {
        id: verificationId,
        userId,
        fullName,
        dateOfBirth,
        sport,
        league,
        team,
        position,
        jerseyNumber,
        careerStartYear,
        socialMediaHandles,
        documents: [],
        submittedAt: now,
        status: 'pending',
        verificationLevel: 'basic'
      };
      
      // Save verification request to Firestore
      await setDoc(doc(firebaseDb, 'verifications', verificationId), verification);
      
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', userId), {
        verificationStatus: 'pending'
      });
      
      // Add to verification history
      await this.addVerificationHistoryEntry(
        verificationId,
        userId,
        'submitted',
        userId,
        'Verification request submitted',
        undefined,
        'pending'
      );
      
      return {
        ...verification,
        submittedAt: new Date().toISOString() // Convert for return value
      };
    } catch (error) {
      console.error('Error submitting verification request:', error);
      return null;
    }
  }
  
  // Upload verification document
  async uploadVerificationDocument(
    userId: string,
    verificationId: string,
    file: Blob,
    fileName: string,
    fileSize: number,
    mimeType: string,
    documentType: VerificationDocumentType
  ): Promise<VerificationDocument | null> {
    try {
      const documentId = uuidv4();
      const now = serverTimestamp();
      
      // Create storage path
      const storagePath = `verifications/${userId}/${verificationId}/${documentId}_${fileName}`;
      
      // Upload file to storage
      const documentRef = ref(firebaseStorage, storagePath);
      await uploadBytes(documentRef, file, {
        contentType: mimeType,
        customMetadata: {
          userId,
          verificationId,
          documentType
        }
      });
      
      // Get download URL
      const fileUrl = await getDownloadURL(documentRef);
      
      // Create document record
      const document: VerificationDocument = {
        id: documentId,
        verificationId,
        userId,
        type: documentType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        uploadedAt: now,
        status: 'pending'
      };
      
      // Save document record to Firestore
      await setDoc(doc(firebaseDb, 'verificationDocuments', documentId), document);
      
      // Update verification record to include this document
      await updateDoc(doc(firebaseDb, 'verifications', verificationId), {
        documents: arrayUnion(documentId),
        updatedAt: now,
        status: 'in_review' // Update status to in_review once documents are uploaded
      });
      
      // Update user's verification status
      await updateDoc(doc(firebaseDb, 'users', userId), {
        verificationStatus: 'in_review'
      });
      
      // Add to verification history
      await this.addVerificationHistoryEntry(
        verificationId,
        userId,
        'provided_more_info',
        userId,
        `Document uploaded: ${documentType}`,
        'pending',
        'in_review'
      );
      
      return {
        ...document,
        uploadedAt: new Date().toISOString() // Convert for return value
      };
    } catch (error) {
      console.error('Error uploading verification document:', error);
      return null;
    }
  }
  
  // Get verification documents
  async getVerificationDocuments(verificationId: string): Promise<VerificationDocument[]> {
    try {
      const documentsRef = collection(firebaseDb, 'verificationDocuments');
      const q = query(
        documentsRef, 
        where('verificationId', '==', verificationId),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as VerificationDocument;
        return {
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
          reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt
        };
      });
    } catch (error) {
      console.error('Error getting verification documents:', error);
      return [];
    }
  }
  
  // Get verification by ID
  async getVerification(verificationId: string): Promise<EnhancedAthleteVerification | null> {
    try {
      const verificationDoc = await getDoc(doc(firebaseDb, 'verifications', verificationId));
      if (!verificationDoc.exists()) {
        return null;
      }
      
      const verification = verificationDoc.data() as EnhancedAthleteVerification;
      return {
        ...verification,
        submittedAt: verification.submittedAt?.toDate?.() || verification.submittedAt,
        reviewedAt: verification.reviewedAt?.toDate?.() || verification.reviewedAt
      };
    } catch (error) {
      console.error('Error getting verification:', error);
      return null;
    }
  }
  
  // Get pending verification requests (for admin)
  async getPendingVerificationRequests(status?: VerificationStatus, limit?: number): Promise<EnhancedAthleteVerification[]> {
    try {
      const verificationsRef = collection(firebaseDb, 'verifications');
      let q;
      
      if (status) {
        q = query(
          verificationsRef, 
          where('status', '==', status),
          orderBy('submittedAt', 'asc'),
          ...(limit ? [limit(limit)] : [])
        );
      } else {
        q = query(
          verificationsRef, 
          where('status', 'in', ['pending', 'in_review']),
          orderBy('submittedAt', 'asc'),
          ...(limit ? [limit(limit)] : [])
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as EnhancedAthleteVerification;
        return {
          ...data,
          id: doc.id,
          submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
          reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt
        };
      });
    } catch (error) {
      console.error('Error getting verification requests:', error);
      return [];
    }
  }
  
  // Review document (for admin)
  async reviewDocument(
    documentId: string,
    adminId: string,
    status: VerificationDocumentStatus,
    notes?: string
  ): Promise<boolean> {
    try {
      const now = serverTimestamp();
      
      // Get document
      const documentDoc = await getDoc(doc(firebaseDb, 'verificationDocuments', documentId));
      if (!documentDoc.exists()) {
        return false;
      }
      
      const document = documentDoc.data() as VerificationDocument;
      
      // Update document status
      await updateDoc(doc(firebaseDb, 'verificationDocuments', documentId), {
        status,
        reviewedAt: now,
        reviewedBy: adminId,
        notes: notes || `Document ${status} by admin`
      });
      
      // Check if all documents for this verification have been reviewed
      const verificationId = document.verificationId;
      const allDocuments = await this.getVerificationDocuments(verificationId);
      const allReviewed = allDocuments.every(doc => doc.status !== 'pending');
      
      if (allReviewed) {
        // If all documents are approved, update verification status
        const allApproved = allDocuments.every(doc => doc.status === 'approved');
        const anyRejected = allDocuments.some(doc => doc.status === 'rejected');
        const anyNeedsMoreInfo = allDocuments.some(doc => doc.status === 'needs_more_info');
        
        let newStatus: VerificationStatus;
        if (allApproved) {
          newStatus = 'approved';
        } else if (anyRejected) {
          newStatus = 'rejected';
        } else if (anyNeedsMoreInfo) {
          newStatus = 'needs_more_info';
        } else {
          newStatus = 'in_review';
        }
        
        // Update verification status
        await this.updateVerificationStatus(verificationId, document.userId, adminId, newStatus, notes);
      }
      
      return true;
    } catch (error) {
      console.error('Error reviewing document:', error);
      return false;
    }
  }
  
  // Approve verification request (for admin)
  async approveVerificationRequest(
    verificationId: string,
    adminId: string,
    verificationLevel: 'basic' | 'verified' | 'official' = 'verified',
    notes?: string
  ): Promise<boolean> {
    try {
      return await this.updateVerificationStatus(
        verificationId, 
        null, // Will be fetched in the method
        adminId, 
        'approved', 
        notes,
        verificationLevel
      );
    } catch (error) {
      console.error('Error approving verification request:', error);
      return false;
    }
  }
  
  // Reject verification request (for admin)
  async rejectVerificationRequest(
    verificationId: string,
    adminId: string,
    rejectionReason: string,
    notes?: string
  ): Promise<boolean> {
    try {
      return await this.updateVerificationStatus(
        verificationId, 
        null, // Will be fetched in the method
        adminId, 
        'rejected', 
        notes,
        undefined,
        rejectionReason
      );
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      return false;
    }
  }
  
  // Request more information (for admin)
  async requestMoreInformation(
    verificationId: string,
    adminId: string,
    notes: string
  ): Promise<boolean> {
    try {
      return await this.updateVerificationStatus(
        verificationId, 
        null, // Will be fetched in the method
        adminId, 
        'needs_more_info', 
        notes
      );
    } catch (error) {
      console.error('Error requesting more information:', error);
      return false;
    }
  }
  
  // Update verification status (internal method)
  private async updateVerificationStatus(
    verificationId: string,
    userId: string | null, // If null, will be fetched from verification
    adminId: string,
    status: VerificationStatus,
    notes?: string,
    verificationLevel?: 'basic' | 'verified' | 'official',
    rejectionReason?: string
  ): Promise<boolean> {
    try {
      const now = serverTimestamp();
      
      // Get verification request if userId is not provided
      let verification: EnhancedAthleteVerification | null = null;
      if (!userId) {
        verification = await this.getVerification(verificationId);
        if (!verification) {
          return false;
        }
        userId = verification.userId;
      }
      
      if (!verification) {
        verification = await this.getVerification(verificationId);
        if (!verification) {
          return false;
        }
      }
      
      const previousStatus = verification.status;
      
      // Update verification status
      const updateData: any = {
        status,
        reviewedAt: now,
        reviewedBy: adminId,
        updatedAt: now
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      if (verificationLevel) {
        updateData.verificationLevel = verificationLevel;
      }
      
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      await updateDoc(doc(firebaseDb, 'verifications', verificationId), updateData);
      
      // Update user's verification status
      const userUpdateData: any = {
        verificationStatus: status
      };
      
      if (status === 'approved') {
        userUpdateData.isVerified = true;
        userUpdateData.verificationLevel = verificationLevel || 'verified';
      } else {
        userUpdateData.isVerified = false;
      }
      
      await updateDoc(doc(firebaseDb, 'users', userId), userUpdateData);
      
      // Update user's profile if approved
      if (status === 'approved') {
        const profileDoc = await getDoc(doc(firebaseDb, 'profiles', userId));
        if (profileDoc.exists()) {
          await updateDoc(doc(firebaseDb, 'profiles', userId), {
            isAthlete: true,
            isVerified: true,
            verificationLevel: verificationLevel || 'verified',
            sport: verification.sport,
            league: verification.league,
            team: verification.team,
            position: verification.position,
            jerseyNumber: verification.jerseyNumber,
            updatedAt: now
          });
        }
      }
      
      // Add to verification history
      let action: 'reviewed' | 'approved' | 'rejected' | 'requested_more_info';
      switch (status) {
        case 'approved':
          action = 'approved';
          break;
        case 'rejected':
          action = 'rejected';
          break;
        case 'needs_more_info':
          action = 'requested_more_info';
          break;
        default:
          action = 'reviewed';
      }
      
      await this.addVerificationHistoryEntry(
        verificationId,
        userId,
        action,
        adminId,
        notes || `Verification ${status} by admin`,
        previousStatus,
        status
      );
      
      return true;
    } catch (error) {
      console.error('Error updating verification status:', error);
      return false;
    }
  }
  
  // Add verification history entry
  private async addVerificationHistoryEntry(
    verificationId: string,
    userId: string,
    action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'requested_more_info' | 'provided_more_info',
    performedBy: string,
    notes?: string,
    previousStatus?: VerificationStatus,
    newStatus?: VerificationStatus
  ): Promise<string | null> {
    try {
      const historyId = uuidv4();
      const now = serverTimestamp();
      
      const historyEntry: VerificationHistoryEntry = {
        id: historyId,
        verificationId,
        userId,
        action,
        performedBy,
        performedAt: now,
        notes,
        previousStatus,
        newStatus: newStatus || 'pending'
      };
      
      await setDoc(doc(firebaseDb, 'verificationHistory', historyId), historyEntry);
      
      return historyId;
    } catch (error) {
      console.error('Error adding verification history entry:', error);
      return null;
    }
  }
  
  // Get verification history
  async getVerificationHistory(verificationId: string): Promise<VerificationHistoryEntry[]> {
    try {
      const historyRef = collection(firebaseDb, 'verificationHistory');
      const q = query(
        historyRef, 
        where('verificationId', '==', verificationId),
        orderBy('performedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as VerificationHistoryEntry;
        return {
          ...data,
          performedAt: data.performedAt?.toDate?.() || data.performedAt
        };
      });
    } catch (error) {
      console.error('Error getting verification history:', error);
      return [];
    }
  }
  
  // Get user's verification status
  async getUserVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    status: VerificationStatus | 'none';
    verificationLevel?: 'basic' | 'verified' | 'official';
    lastRequest?: EnhancedAthleteVerification;
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
          status: userData.verificationStatus || 'none',
          verificationLevel: userData.verificationLevel
        };
      }
      
      const lastRequest = querySnapshot.docs[0].data() as EnhancedAthleteVerification;
      
      return {
        isVerified: userData.isVerified || false,
        status: userData.verificationStatus || 'none',
        verificationLevel: userData.verificationLevel,
        lastRequest: {
          ...lastRequest,
          id: querySnapshot.docs[0].id,
          submittedAt: lastRequest.submittedAt?.toDate?.() || lastRequest.submittedAt,
          reviewedAt: lastRequest.reviewedAt?.toDate?.() || lastRequest.reviewedAt
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
  
  // Reset verification status (for testing)
  async resetVerificationStatus(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(firebaseDb, 'users', userId), {
        isVerified: false,
        verificationStatus: 'none',
        verificationLevel: null
      });
      
      // Update profile
      const profileDoc = await getDoc(doc(firebaseDb, 'profiles', userId));
      if (profileDoc.exists()) {
        await updateDoc(doc(firebaseDb, 'profiles', userId), {
          isVerified: false,
          verificationLevel: null
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error resetting verification status:', error);
      return false;
    }
  }
}

export default new VerificationService();
