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
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  Firestore,
  increment,
  deleteDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseUser } from '../services/AuthService';

// Cast db to proper type
const firebaseDb = db as unknown as Firestore;
const firebaseStorage = storage as any;

// Collaboration request status
export type CollaborationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

// Collaboration role
export type CollaboratorRole = 'featured artist' | 'producer' | 'writer' | 'mixer' | 'vocalist' | 'instrumentalist';

// Collaboration request interface
export interface CollaborationRequest {
  id: string;
  songId: string; // can be empty if creating a new song
  title: string; // title of song/project
  inviterId: string; // person who sent the invite
  inviterName?: string;
  inviteeId: string; // person being invited to collaborate
  inviteeName?: string;
  message?: string;
  role: CollaboratorRole;
  status: CollaborationStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // optional expiration date
}

// Song collaboration with different contribution types
export interface SongCollaboration {
  id: string;
  songId: string;
  title: string;
  description?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  status: 'in-progress' | 'completed';
  collaborators: {
    userId: string;
    name?: string;
    role: CollaboratorRole;
    status: 'invited' | 'active' | 'declined' | 'removed';
    joinedAt?: string;
  }[];
  tracks: {
    id: string;
    name: string;
    type: 'vocals' | 'instrument' | 'beat' | 'mix' | 'master' | 'stems';
    fileUrl?: string;
    recordedBy: string;
    createdAt: string;
    isOriginal: boolean;
    parentTrackId?: string; // for remixes/edits of another track
  }[];
  isPrivate: boolean;
  genre?: string;
  coverArtUrl?: string;
}

// Comment on a specific track in a collaboration
export interface TrackComment {
  id: string;
  collaborationId: string;
  trackId: string;
  userId: string;
  text: string;
  timestamp: number; // position in track in seconds
  createdAt: string;
}

class CollaborationService {
  /**
   * Create a new collaboration project
   */
  async createCollaboration(
    userId: string,
    title: string,
    description: string = '',
    isPrivate: boolean = true,
    genre?: string,
    coverArt?: Blob
  ): Promise<SongCollaboration | null> {
    try {
      const collaborationId = uuidv4();
      const now = new Date().toISOString();

      // Upload cover art if provided
      let coverArtUrl = '';
      if (coverArt) {
        const coverArtRef = ref(firebaseStorage, `collaborations/${collaborationId}/cover.jpg`);
        await uploadBytes(coverArtRef, coverArt);
        coverArtUrl = await getDownloadURL(coverArtRef);
      }

      // Create the collaboration project
      const newCollaboration: SongCollaboration = {
        id: collaborationId,
        songId: '', // Will be set when the song is published
        title,
        description,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        status: 'in-progress',
        collaborators: [
          {
            userId,
            role: 'producer', // Default role for creator
            status: 'active',
            joinedAt: now
          }
        ],
        tracks: [],
        isPrivate,
        genre,
        coverArtUrl
      };

      // Save to Firestore
      await setDoc(doc(firebaseDb, 'collaborations', collaborationId), newCollaboration);

      return newCollaboration;
    } catch (error) {
      console.error('Error creating collaboration:', error);
      return null;
    }
  }

  /**
   * Invite a user to collaborate on a project
   */
  async inviteCollaborator(
    collaborationId: string,
    inviterId: string,
    inviteeId: string,
    role: CollaboratorRole,
    message?: string
  ): Promise<CollaborationRequest | null> {
    try {
      // Check if user is already a collaborator
      const collabDoc = await getDoc(doc(firebaseDb, 'collaborations', collaborationId));
      if (!collabDoc.exists()) {
        return null;
      }

      const collaboration = collabDoc.data() as SongCollaboration;

      // Check if inviter is part of this collaboration
      const isInviterCollaborator = collaboration.collaborators.some(
        collab => collab.userId === inviterId && collab.status === 'active'
      );

      if (!isInviterCollaborator) {
        console.error('Inviter is not an active collaborator on this project');
        return null;
      }

      // Check if invitee is already in the collaboration
      const isInviteeAlreadyCollaborator = collaboration.collaborators.some(
        collab => collab.userId === inviteeId && collab.status === 'active'
      );

      if (isInviteeAlreadyCollaborator) {
        console.error('User is already a collaborator on this project');
        return null;
      }

      // Create collaboration request
      const now = new Date().toISOString();
      const requestId = uuidv4();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Expire in 7 days

      const request: CollaborationRequest = {
        id: requestId,
        songId: collaboration.songId,
        title: collaboration.title,
        inviterId,
        inviteeId,
        message,
        role,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        expiresAt: expirationDate.toISOString()
      };

      // Get user names if possible
      try {
        const inviterDoc = await getDoc(doc(firebaseDb, 'users', inviterId));
        if (inviterDoc.exists()) {
          const userData = inviterDoc.data();
          request.inviterName = userData.displayName || userData.username;
        }

        const inviteeDoc = await getDoc(doc(firebaseDb, 'users', inviteeId));
        if (inviteeDoc.exists()) {
          const userData = inviteeDoc.data();
          request.inviteeName = userData.displayName || userData.username;
        }
      } catch (error) {
        console.warn('Unable to fetch user names:', error);
      }

      // Save request
      await setDoc(doc(firebaseDb, 'collaborationRequests', requestId), request);

      // Update collaboration with pending invite
      await updateDoc(doc(firebaseDb, 'collaborations', collaborationId), {
        collaborators: arrayUnion({
          userId: inviteeId,
          role,
          status: 'invited'
        }),
        updatedAt: now
      });

      return request;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      return null;
    }
  }

  /**
   * Respond to a collaboration request
   */
  async respondToCollaborationRequest(
    requestId: string,
    userId: string,
    accept: boolean
  ): Promise<boolean> {
    try {
      // Get the request
      const requestDoc = await getDoc(doc(firebaseDb, 'collaborationRequests', requestId));
      if (!requestDoc.exists()) {
        return false;
      }

      const request = requestDoc.data() as CollaborationRequest;

      // Verify the user is the invitee
      if (request.inviteeId !== userId) {
        console.error('User is not the invitee for this request');
        return false;
      }

      // Check if request has expired
      if (request.expiresAt) {
        const expirationDate = new Date(request.expiresAt);
        if (expirationDate < new Date()) {
          await updateDoc(doc(firebaseDb, 'collaborationRequests', requestId), {
            status: 'rejected',
            updatedAt: new Date().toISOString()
          });
          return false;
        }
      }

      // Get the collaboration
      const collabQuery = query(
        collection(firebaseDb, 'collaborations'),
        where('songId', '==', request.songId)
      );
      const collabSnapshot = await getDocs(collabQuery);
      
      if (collabSnapshot.empty) {
        console.error('Collaboration not found');
        return false;
      }

      const collabDoc = collabSnapshot.docs[0];
      const collaboration = collabDoc.data() as SongCollaboration;
      const now = new Date().toISOString();

      if (accept) {
        // Accept the invitation - update collaboration
        const updatedCollaborators = collaboration.collaborators.map(collab => {
          if (collab.userId === userId && collab.status === 'invited') {
            return {
              ...collab,
              status: 'active',
              joinedAt: now
            };
          }
          return collab;
        });

        await updateDoc(doc(firebaseDb, 'collaborations', collabDoc.id), {
          collaborators: updatedCollaborators,
          updatedAt: now
        });

        // Update request status
        await updateDoc(doc(firebaseDb, 'collaborationRequests', requestId), {
          status: 'accepted',
          updatedAt: now
        });
      } else {
        // Reject the invitation - update collaboration
        const updatedCollaborators = collaboration.collaborators.map(collab => {
          if (collab.userId === userId && collab.status === 'invited') {
            return {
              ...collab,
              status: 'declined'
            };
          }
          return collab;
        });

        await updateDoc(doc(firebaseDb, 'collaborations', collabDoc.id), {
          collaborators: updatedCollaborators,
          updatedAt: now
        });

        // Update request status
        await updateDoc(doc(firebaseDb, 'collaborationRequests', requestId), {
          status: 'rejected',
          updatedAt: now
        });
      }

      return true;
    } catch (error) {
      console.error('Error responding to collaboration request:', error);
      return false;
    }
  }

  /**
   * Get user's pending collaboration requests
   */
  async getPendingCollaborationRequests(userId: string): Promise<CollaborationRequest[]> {
    try {
      const requestsRef = collection(firebaseDb, 'collaborationRequests');
      const q = query(
        requestsRef,
        where('inviteeId', '==', userId),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as CollaborationRequest);
    } catch (error) {
      console.error('Error getting pending collaboration requests:', error);
      return [];
    }
  }

  /**
   * Get user's active collaborations
   */
  async getUserCollaborations(userId: string): Promise<SongCollaboration[]> {
    try {
      const collabsRef = collection(firebaseDb, 'collaborations');
      const q = query(
        collabsRef,
        where('collaborators', 'array-contains', {
          userId,
          status: 'active'
        })
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as SongCollaboration);
    } catch (error) {
      console.error('Error getting user collaborations:', error);
      return [];
    }
  }

  /**
   * Upload a track to a collaboration
   */
  async uploadTrack(
    collaborationId: string,
    userId: string,
    trackName: string,
    trackType: 'vocals' | 'instrument' | 'beat' | 'mix' | 'master' | 'stems',
    audioFile: Blob,
    isOriginal: boolean = true,
    parentTrackId?: string
  ): Promise<string | null> {
    try {
      // Verify user is a collaborator
      const collabDoc = await getDoc(doc(firebaseDb, 'collaborations', collaborationId));
      if (!collabDoc.exists()) {
        return null;
      }

      const collaboration = collabDoc.data() as SongCollaboration;
      const isCollaborator = collaboration.collaborators.some(
        collab => collab.userId === userId && collab.status === 'active'
      );

      if (!isCollaborator) {
        console.error('User is not an active collaborator on this project');
        return null;
      }

      // Create track ID
      const trackId = uuidv4();
      const now = new Date().toISOString();

      // Upload audio file
      const audioRef = ref(firebaseStorage, `collaborations/${collaborationId}/tracks/${trackId}.mp3`);
      await uploadBytes(audioRef, audioFile);
      const fileUrl = await getDownloadURL(audioRef);

      // Create track object
      const newTrack = {
        id: trackId,
        name: trackName,
        type: trackType,
        fileUrl,
        recordedBy: userId,
        createdAt: now,
        isOriginal,
        ...(parentTrackId && { parentTrackId })
      };

      // Add track to collaboration
      await updateDoc(doc(firebaseDb, 'collaborations', collaborationId), {
        tracks: arrayUnion(newTrack),
        updatedAt: now
      });

      return trackId;
    } catch (error) {
      console.error('Error uploading track:', error);
      return null;
    }
  }

  /**
   * Add a comment to a track in a collaboration
   */
  async addTrackComment(
    collaborationId: string,
    trackId: string,
    userId: string,
    text: string,
    timestamp: number
  ): Promise<TrackComment | null> {
    try {
      // Verify user is a collaborator
      const collabDoc = await getDoc(doc(firebaseDb, 'collaborations', collaborationId));
      if (!collabDoc.exists()) {
        return null;
      }

      const collaboration = collabDoc.data() as SongCollaboration;
      const isCollaborator = collaboration.collaborators.some(
        collab => collab.userId === userId && collab.status === 'active'
      );

      if (!isCollaborator) {
        console.error('User is not an active collaborator on this project');
        return null;
      }

      // Check track exists
      const trackExists = collaboration.tracks.some(track => track.id === trackId);
      if (!trackExists) {
        console.error('Track does not exist in this collaboration');
        return null;
      }

      // Create comment
      const commentId = uuidv4();
      const now = new Date().toISOString();
      const comment: TrackComment = {
        id: commentId,
        collaborationId,
        trackId,
        userId,
        text,
        timestamp,
        createdAt: now
      };

      // Save comment to Firestore
      await setDoc(doc(firebaseDb, 'trackComments', commentId), comment);

      return comment;
    } catch (error) {
      console.error('Error adding track comment:', error);
      return null;
    }
  }

  /**
   * Get comments for a track
   */
  async getTrackComments(collaborationId: string, trackId: string): Promise<TrackComment[]> {
    try {
      const commentsRef = collection(firebaseDb, 'trackComments');
      const q = query(
        commentsRef,
        where('collaborationId', '==', collaborationId),
        where('trackId', '==', trackId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as TrackComment);
    } catch (error) {
      console.error('Error getting track comments:', error);
      return [];
    }
  }

  /**
   * Publish a collaboration as a song
   */
  async publishCollaborationAsSong(
    collaborationId: string,
    userId: string,
    finalMixTrackId: string,
    songDetails: {
      title: string;
      genre: string;
      visibility: 'public' | 'subscribers' | 'private';
      description?: string;
      isExplicit?: boolean;
      releaseDate?: string;
    }
  ): Promise<string | null> {
    try {
      // Verify user is a collaborator
      const collabDoc = await getDoc(doc(firebaseDb, 'collaborations', collaborationId));
      if (!collabDoc.exists()) {
        return null;
      }

      const collaboration = collabDoc.data() as SongCollaboration;
      const isCollaborator = collaboration.collaborators.some(
        collab => collab.userId === userId && collab.status === 'active'
      );

      if (!isCollaborator) {
        console.error('User is not an active collaborator on this project');
        return null;
      }

      // Get final mix track
      const finalTrack = collaboration.tracks.find(track => track.id === finalMixTrackId);
      if (!finalTrack || !finalTrack.fileUrl) {
        console.error('Final mix track not found');
        return null;
      }

      // Create song ID
      const songId = uuidv4();
      const now = new Date().toISOString();
      const releaseDate = songDetails.releaseDate || now;

      // Map collaborators to song format
      const songCollaborators = collaboration.collaborators
        .filter(collab => collab.status === 'active')
        .map(collab => ({
          userId: collab.userId,
          role: collab.role,
          name: collab.name || ''
        }));

      // Create song object
      const newSong = {
        id: songId,
        artistId: userId, // Primary artist
        title: songDetails.title || collaboration.title,
        description: songDetails.description || collaboration.description || '',
        genre: songDetails.genre || collaboration.genre || 'Other',
        releaseDate,
        fileUrl: finalTrack.fileUrl,
        duration: 0, // This would need to be calculated
        visibility: songDetails.visibility,
        coverArtUrl: collaboration.coverArtUrl || '',
        collaborators: songCollaborators,
        isExplicit: songDetails.isExplicit || false,
        createdAt: now,
        updatedAt: now,
        playCount: 0,
        likeCount: 0,
        commentCount: 0
      };

      // Save song to Firestore
      await setDoc(doc(firebaseDb, 'songs', songId), newSong);

      // Update collaboration with song ID and mark as completed
      await updateDoc(doc(firebaseDb, 'collaborations', collaborationId), {
        songId,
        status: 'completed',
        updatedAt: now
      });

      return songId;
    } catch (error) {
      console.error('Error publishing collaboration as song:', error);
      return null;
    }
  }
}

export default new CollaborationService();
