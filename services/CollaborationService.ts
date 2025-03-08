import { db } from '../src/lib/firebase';
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
  addDoc,
  onSnapshot,
  serverTimestamp,
  DocumentReference
} from 'firebase/firestore';
import { ref, getStorage } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseUser } from '../services/AuthService';
import StudioService, { Track } from './StudioService';

// Cast db to proper type
const firebaseDb = db as unknown as Firestore;
const firebaseStorage = getStorage();

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
  trackId: string;
  userId: string;
  displayName: string;
  comment: string;
  timestamp: number; // position in track in seconds
  createdAt: string;
}

export interface Collaborator {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface CollaborationProject {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  ownerId: string;
  ownerName: string;
  collaborators: Collaborator[];
  tracks: CollaborationTrack[];
  status: 'active' | 'archived' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

export interface CollaborationTrack {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  comments: TrackComment[];
}

export interface CollaborationInvite {
  id: string;
  projectId: string;
  projectTitle: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

// Types for collaboration
export interface CollaborationSession {
  id: string;
  projectId: string;
  hostId: string;
  activeUsers: CollaborationUser[];
  startedAt: string;
  status: 'active' | 'ended';
  inviteCode?: string;
}

export interface CollaborationUser {
  userId: string;
  displayName: string;
  role: 'host' | 'guest';
  joinedAt: string;
  isActive: boolean;
  lastActivity: string;
}

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: 'join' | 'leave' | 'track_added' | 'track_deleted' | 'recording_started' | 'recording_stopped';
  timestamp: string;
  metadata?: any;
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

class CollaborationService {
  private sessionListeners: Map<string, () => void> = new Map();
  private messageListeners: Map<string, () => void> = new Map();
  private eventListeners: Map<string, () => void> = new Map();
  
  /**
   * Create a new collaboration project
   */
  async createProject(
    owner: FirebaseUser,
    title: string,
    description?: string,
    coverImageUri?: string
  ): Promise<CollaborationProject> {
    try {
      console.log('[CollaborationService] Creating new project:', title);
      
      // Generate unique ID for the project
      const projectId = uuidv4();
      
      // Upload cover image if provided
      let coverImageUrl = '';
      if (coverImageUri) {
        const coverStorageRef = ref(storage, `projects/${projectId}/cover.jpg`);
        const coverResponse = await fetch(coverImageUri);
        const coverBlob = await coverResponse.blob();
        await uploadBytes(coverStorageRef, coverBlob);
        coverImageUrl = await getDownloadURL(coverStorageRef);
      }
      
      // Create owner collaborator
      const ownerCollaborator: Collaborator = {
        id: owner.uid,
        displayName: owner.displayName || 'Unknown',
        photoURL: owner.photoURL || undefined,
        role: 'owner',
        joinedAt: new Date()
      };
      
      // Create project object
      const project: CollaborationProject = {
        id: projectId,
        title,
        description,
        coverImageUrl,
        ownerId: owner.uid,
        ownerName: owner.displayName || 'Unknown',
        collaborators: [ownerCollaborator],
        tracks: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false
      };
      
      // Save project to Firestore
      await setDoc(doc(firebaseDb, 'collaborationProjects', projectId), {
        ...project,
        collaborators: [
          {
            ...ownerCollaborator,
            joinedAt: serverTimestamp()
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tracks: []
      });
      
      console.log('[CollaborationService] Project created successfully:', projectId);
      return project;
    } catch (error) {
      console.error('[CollaborationService] Failed to create project:', error);
      throw error;
    }
  }
  
  /**
   * Get a collaboration project by ID
   */
  async getProject(projectId: string): Promise<CollaborationProject | null> {
    try {
      console.log('[CollaborationService] Getting project:', projectId);
      
      const projectDoc = await getDoc(doc(firebaseDb, 'collaborationProjects', projectId));
      
      if (!projectDoc.exists()) {
        console.log('[CollaborationService] Project not found:', projectId);
        return null;
      }
      
      const projectData = projectDoc.data();
      
      // Convert Firestore timestamps to JavaScript Dates
      const project: CollaborationProject = {
        ...projectData,
        createdAt: projectData.createdAt?.toDate() || new Date(),
        updatedAt: projectData.updatedAt?.toDate() || new Date(),
        collaborators: projectData.collaborators.map((collaborator: any) => ({
          ...collaborator,
          joinedAt: collaborator.joinedAt?.toDate() || new Date()
        })),
        tracks: projectData.tracks.map((track: any) => ({
          ...track,
          createdAt: track.createdAt?.toDate() || new Date(),
          updatedAt: track.updatedAt?.toDate() || new Date(),
          comments: track.comments?.map((comment: any) => ({
            ...comment,
            timestamp: comment.timestamp?.toDate() || new Date()
          })) || []
        }))
      } as CollaborationProject;
      
      console.log('[CollaborationService] Project retrieved successfully:', projectId);
      return project;
    } catch (error) {
      console.error('[CollaborationService] Failed to get project:', error);
      throw error;
    }
  }
  
  /**
   * Get all projects for a user (both owned and collaborated)
   */
  async getUserProjects(userId: string): Promise<CollaborationProject[]> {
    try {
      console.log('[CollaborationService] Getting projects for user:', userId);
      
      // Query projects where user is a collaborator
      const projectsQuery = query(
        collection(firebaseDb, 'collaborationProjects'),
        where('collaborators', 'array-contains', { id: userId })
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      
      const projects: CollaborationProject[] = [];
      
      projectsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        
        // Convert Firestore timestamps to JavaScript Dates
        const project: CollaborationProject = {
          ...projectData,
          createdAt: projectData.createdAt?.toDate() || new Date(),
          updatedAt: projectData.updatedAt?.toDate() || new Date(),
          collaborators: projectData.collaborators.map((collaborator: any) => ({
            ...collaborator,
            joinedAt: collaborator.joinedAt?.toDate() || new Date()
          })),
          tracks: projectData.tracks.map((track: any) => ({
            ...track,
            createdAt: track.createdAt?.toDate() || new Date(),
            updatedAt: track.updatedAt?.toDate() || new Date(),
            comments: track.comments?.map((comment: any) => ({
              ...comment,
              timestamp: comment.timestamp?.toDate() || new Date()
            })) || []
          }))
        } as CollaborationProject;
        
        projects.push(project);
      });
      
      console.log('[CollaborationService] Retrieved projects for user:', projects.length);
      return projects;
    } catch (error) {
      console.error('[CollaborationService] Failed to get user projects:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time updates for a project
   */
  subscribeToProject(
    projectId: string,
    callback: (project: CollaborationProject) => void
  ): () => void {
    console.log('[CollaborationService] Subscribing to project updates:', projectId);
    
    const projectRef = doc(firebaseDb, 'collaborationProjects', projectId);
    
    const unsubscribe = onSnapshot(projectRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const projectData = docSnapshot.data();
        
        // Convert Firestore timestamps to JavaScript Dates
        const project: CollaborationProject = {
          ...projectData,
          createdAt: projectData.createdAt?.toDate() || new Date(),
          updatedAt: projectData.updatedAt?.toDate() || new Date(),
          collaborators: projectData.collaborators.map((collaborator: any) => ({
            ...collaborator,
            joinedAt: collaborator.joinedAt?.toDate() || new Date()
          })),
          tracks: projectData.tracks.map((track: any) => ({
            ...track,
            createdAt: track.createdAt?.toDate() || new Date(),
            updatedAt: track.updatedAt?.toDate() || new Date(),
            comments: track.comments?.map((comment: any) => ({
              ...comment,
              timestamp: comment.timestamp?.toDate() || new Date()
            })) || []
          }))
        } as CollaborationProject;
        
        callback(project);
      }
    });
    
    return unsubscribe;
  }
  
  /**
   * Add a track to a collaboration project
   */
  async addTrackToProject(
    projectId: string,
    userId: string,
    userName: string,
    track: Track
  ): Promise<CollaborationTrack> {
    try {
      console.log('[CollaborationService] Adding track to project:', projectId);
      
      // Create collaboration track
      const collaborationTrack: CollaborationTrack = {
        id: track.id,
        title: track.title,
        artistId: userId,
        artistName: userName,
        audioUrl: track.audioUrl,
        duration: track.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: []
      };
      
      // Update project in Firestore
      const projectRef = doc(firebaseDb, 'collaborationProjects', projectId);
      
      await updateDoc(projectRef, {
        tracks: arrayUnion({
          ...collaborationTrack,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          comments: []
        }),
        updatedAt: serverTimestamp()
      });
      
      console.log('[CollaborationService] Track added to project successfully:', track.id);
      return collaborationTrack;
    } catch (error) {
      console.error('[CollaborationService] Failed to add track to project:', error);
      throw error;
    }
  }
  
  /**
   * Add a comment to a track
   */
  async addTrackComment(
    trackId: string,
    userId: string,
    displayName: string,
    comment: string,
    timestamp: number // Position in track in seconds
  ): Promise<TrackComment | null> {
    try {
      const commentId = `comment_${uuidv4()}`;
      const newComment: TrackComment = {
        id: commentId,
        trackId,
        userId,
        displayName,
        comment,
        timestamp, // Use the number directly
        createdAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(doc(firebaseDb, 'trackComments', commentId), newComment);
      
      return newComment;
    } catch (error) {
      console.error('Error adding track comment:', error);
      return null;
    }
  }
  
  /**
   * Invite a user to collaborate on a project
   */
  async inviteCollaborator(
    projectId: string,
    projectTitle: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientName: string,
    role: 'editor' | 'viewer'
  ): Promise<CollaborationInvite> {
    try {
      console.log('[CollaborationService] Inviting collaborator to project:', projectId);
      
      // Create invite
      const inviteId = uuidv4();
      const invite: CollaborationInvite = {
        id: inviteId,
        projectId,
        projectTitle,
        senderId,
        senderName,
        recipientId,
        recipientName,
        role,
        status: 'pending',
        createdAt: new Date()
      };
      
      // Save invite to Firestore
      await setDoc(doc(firebaseDb, 'collaborationInvites', inviteId), {
        ...invite,
        createdAt: serverTimestamp()
      });
      
      console.log('[CollaborationService] Collaboration invite sent successfully:', inviteId);
      return invite;
    } catch (error) {
      console.error('[CollaborationService] Failed to invite collaborator:', error);
      throw error;
    }
  }
  
  /**
   * Get all pending invites for a user
   */
  async getUserInvites(userId: string): Promise<CollaborationInvite[]> {
    try {
      console.log('[CollaborationService] Getting invites for user:', userId);
      
      // Query invites where user is the recipient and status is pending
      const invitesQuery = query(
        collection(firebaseDb, 'collaborationInvites'),
        where('recipientId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const invitesSnapshot = await getDocs(invitesQuery);
      
      const invites: CollaborationInvite[] = [];
      
      invitesSnapshot.forEach((doc) => {
        const inviteData = doc.data();
        
        // Convert Firestore timestamp to JavaScript Date
        const invite: CollaborationInvite = {
          ...inviteData,
          createdAt: inviteData.createdAt?.toDate() || new Date()
        } as CollaborationInvite;
        
        invites.push(invite);
      });
      
      console.log('[CollaborationService] Retrieved invites for user:', invites.length);
      return invites;
    } catch (error) {
      console.error('[CollaborationService] Failed to get user invites:', error);
      throw error;
    }
  }
  
  /**
   * Respond to a collaboration invite
   */
  async respondToInvite(
    inviteId: string,
    response: 'accepted' | 'declined'
  ): Promise<void> {
    try {
      console.log('[CollaborationService] Responding to invite:', inviteId, response);
      
      // Get invite
      const inviteRef = doc(firebaseDb, 'collaborationInvites', inviteId);
      const inviteDoc = await getDoc(inviteRef);
      
      if (!inviteDoc.exists()) {
        throw new Error('Invite not found');
      }
      
      const inviteData = inviteDoc.data() as CollaborationInvite;
      
      // Update invite status
      await updateDoc(inviteRef, {
        status: response
      });
      
      // If accepted, add user to project collaborators
      if (response === 'accepted') {
        const projectRef = doc(firebaseDb, 'collaborationProjects', inviteData.projectId);
        
        // Add collaborator to project
        const collaborator: Collaborator = {
          id: inviteData.recipientId,
          displayName: inviteData.recipientName,
          role: inviteData.role,
          joinedAt: new Date()
        };
        
        await updateDoc(projectRef, {
          collaborators: arrayUnion({
            ...collaborator,
            joinedAt: serverTimestamp()
          }),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('[CollaborationService] Invite response processed successfully');
    } catch (error) {
      console.error('[CollaborationService] Failed to respond to invite:', error);
      throw error;
    }
  }
  
  /**
   * Create a new collaboration session for a project
   */
  async createSession(projectId: string, hostId: string, hostDisplayName: string): Promise<CollaborationSession> {
    try {
      // Generate a unique session ID
      const sessionId = uuidv4();
      
      // Generate a 6-character invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create the host user object
      const hostUser: CollaborationUser = {
        userId: hostId,
        displayName: hostDisplayName,
        role: 'host',
        joinedAt: new Date().toISOString(),
        isActive: true,
        lastActivity: new Date().toISOString()
      };
      
      // Create the session object
      const session: CollaborationSession = {
        id: sessionId,
        projectId,
        hostId,
        activeUsers: [hostUser],
        startedAt: new Date().toISOString(),
        status: 'active',
        inviteCode
      };
      
      // Save to Firestore
      const sessionRef = doc(firebaseDb, 'collaborationSessions', sessionId);
      await setDoc(sessionRef, session);
      
      // Log the session creation event
      await this.logEvent(sessionId, hostId, 'join', { role: 'host' });
      
      return session;
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      throw error;
    }
  }
  
  /**
   * Join an existing collaboration session
   */
  async joinSession(inviteCode: string, userId: string, displayName: string): Promise<CollaborationSession | null> {
    try {
      // Find the session with this invite code
      const sessionsRef = collection(firebaseDb, 'collaborationSessions');
      const q = query(sessionsRef, where('inviteCode', '==', inviteCode), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.error('No active session found with this invite code');
        return null;
      }
      
      // Get the session document
      const sessionDoc = querySnapshot.docs[0];
      const session = sessionDoc.data() as CollaborationSession;
      
      // Check if user is already in the session
      const existingUserIndex = session.activeUsers.findIndex(user => user.userId === userId);
      
      if (existingUserIndex >= 0) {
        // User is already in the session, update their status
        const updatedUsers = [...session.activeUsers];
        updatedUsers[existingUserIndex] = {
          ...updatedUsers[existingUserIndex],
          isActive: true,
          lastActivity: new Date().toISOString()
        };
        
        await updateDoc(sessionDoc.ref, {
          activeUsers: updatedUsers
        });
      } else {
        // Add the new user to the session
        const newUser: CollaborationUser = {
          userId,
          displayName,
          role: 'collaborator',
          joinedAt: new Date().toISOString(),
          isActive: true,
          lastActivity: new Date().toISOString()
        };
        
        await updateDoc(sessionDoc.ref, {
          activeUsers: arrayUnion(newUser)
        });
      }
      
      // Log the join event
      await this.logEvent(session.id, userId, 'join', { role: 'collaborator' });
      
      // Get the updated session
      const updatedSessionDoc = await getDoc(sessionDoc.ref);
      return updatedSessionDoc.data() as CollaborationSession;
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      throw error;
    }
  }
  
  /**
   * Leave a collaboration session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(firebaseDb, 'collaborationSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        console.error('Session not found');
        return;
      }
      
      const session = sessionDoc.data() as CollaborationSession;
      
      // Find the user in the session
      const userIndex = session.activeUsers.findIndex(user => user.userId === userId);
      
      if (userIndex >= 0) {
        // If the user is the host and there are other active users, transfer host role
        if (session.hostId === userId && session.activeUsers.length > 1) {
          // Find another active user to make host
          const newHost = session.activeUsers.find(user => 
            user.userId !== userId && user.isActive
          );
          
          if (newHost) {
            // Update the host ID
            await updateDoc(sessionRef, {
              hostId: newHost.userId
            });
            
            // Update the user's role to host
            const updatedUsers = [...session.activeUsers];
            const newHostIndex = updatedUsers.findIndex(user => user.userId === newHost.userId);
            updatedUsers[newHostIndex] = {
              ...updatedUsers[newHostIndex],
              role: 'host'
            };
            
            // Mark the leaving user as inactive
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              isActive: false,
              lastActivity: new Date().toISOString()
            };
            
            await updateDoc(sessionRef, {
              activeUsers: updatedUsers
            });
          } else {
            // No other active users, end the session
            await updateDoc(sessionRef, {
              status: 'ended'
            });
          }
        } else if (session.hostId === userId) {
          // Host is leaving and no other users, end the session
          await updateDoc(sessionRef, {
            status: 'ended'
          });
        } else {
          // Regular user leaving, mark as inactive
          const updatedUsers = [...session.activeUsers];
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            isActive: false,
            lastActivity: new Date().toISOString()
          };
          
          await updateDoc(sessionRef, {
            activeUsers: updatedUsers
          });
        }
      }
      
      // Log the leave event
      await this.logEvent(sessionId, userId, 'leave');
    } catch (error) {
      console.error('Error leaving collaboration session:', error);
      throw error;
    }
  }
  
  /**
   * Send a chat message in a collaboration session
   */
  async sendMessage(sessionId: string, userId: string, displayName: string, message: string): Promise<CollaborationMessage> {
    try {
      const messageId = uuidv4();
      
      const chatMessage: CollaborationMessage = {
        id: messageId,
        sessionId,
        userId,
        displayName,
        message,
        timestamp: new Date().toISOString()
      };
      
      // Save to Firestore
      const messageRef = doc(firebaseDb, 'collaborationMessages', messageId);
      await setDoc(messageRef, chatMessage);
      
      return chatMessage;
    } catch (error) {
      console.error('Error sending collaboration message:', error);
      throw error;
    }
  }
  
  /**
   * Log a collaboration event
   */
  async logEvent(sessionId: string, userId: string, type: CollaborationEvent['type'], metadata?: any): Promise<void> {
    try {
      const eventId = uuidv4();
      
      const event: CollaborationEvent = {
        id: eventId,
        sessionId,
        userId,
        type,
        timestamp: new Date().toISOString(),
        metadata
      };
      
      // Save to Firestore
      const eventRef = doc(firebaseDb, 'collaborationEvents', eventId);
      await setDoc(eventRef, event);
    } catch (error) {
      console.error('Error logging collaboration event:', error);
      // Don't throw here to prevent disrupting the main flow
    }
  }
  
  /**
   * Listen for changes to a collaboration session
   */
  subscribeToSession(sessionId: string, callback: (session: CollaborationSession) => void): () => void {
    // Unsubscribe from any existing listener for this session
    this.unsubscribeFromSession(sessionId);
    
    // Create a new listener
    const sessionRef = doc(firebaseDb, 'collaborationSessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as CollaborationSession);
      }
    }, (error) => {
      console.error('Error listening to session changes:', error);
    });
    
    // Store the unsubscribe function
    this.sessionListeners.set(sessionId, unsubscribe);
    
    return unsubscribe;
  }
  
  /**
   * Stop listening for changes to a collaboration session
   */
  unsubscribeFromSession(sessionId: string): void {
    const unsubscribe = this.sessionListeners.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.sessionListeners.delete(sessionId);
    }
  }
  
  /**
   * Listen for new messages in a collaboration session
   */
  subscribeToMessages(sessionId: string, callback: (messages: CollaborationMessage[]) => void): () => void {
    // Unsubscribe from any existing listener for this session's messages
    this.unsubscribeFromMessages(sessionId);
    
    // Create a new listener
    const messagesRef = collection(firebaseDb, 'collaborationMessages');
    const q = query(messagesRef, where('sessionId', '==', sessionId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: CollaborationMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push(doc.data() as CollaborationMessage);
      });
      
      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      callback(messages);
    }, (error) => {
      console.error('Error listening to message changes:', error);
    });
    
    // Store the unsubscribe function
    this.messageListeners.set(sessionId, unsubscribe);
    
    return unsubscribe;
  }
  
  /**
   * Stop listening for new messages in a collaboration session
   */
  unsubscribeFromMessages(sessionId: string): void {
    const unsubscribe = this.messageListeners.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(sessionId);
    }
  }
  
  /**
   * Listen for events in a collaboration session
   */
  subscribeToEvents(sessionId: string, callback: (events: CollaborationEvent[]) => void): () => void {
    // Unsubscribe from any existing listener for this session's events
    this.unsubscribeFromEvents(sessionId);
    
    // Create a new listener
    const eventsRef = collection(firebaseDb, 'collaborationEvents');
    const q = query(eventsRef, where('sessionId', '==', sessionId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const events: CollaborationEvent[] = [];
      querySnapshot.forEach((doc) => {
        events.push(doc.data() as CollaborationEvent);
      });
      
      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      callback(events);
    }, (error) => {
      console.error('Error listening to event changes:', error);
    });
    
    // Store the unsubscribe function
    this.eventListeners.set(sessionId, unsubscribe);
    
    return unsubscribe;
  }
  
  /**
   * Stop listening for events in a collaboration session
   */
  unsubscribeFromEvents(sessionId: string): void {
    const unsubscribe = this.eventListeners.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.eventListeners.delete(sessionId);
    }
  }
  
  /**
   * Update a user's activity status in a session
   */
  async updateUserActivity(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = doc(firebaseDb, 'collaborationSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        console.error('Session not found');
        return;
      }
      
      const session = sessionDoc.data() as CollaborationSession;
      
      // Find the user in the session
      const userIndex = session.activeUsers.findIndex(user => user.userId === userId);
      
      if (userIndex >= 0) {
        // Update the user's last activity timestamp
        const updatedUsers = [...session.activeUsers];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          lastActivity: new Date().toISOString()
        };
        
        await updateDoc(sessionRef, {
          activeUsers: updatedUsers
        });
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  /**
   * Find a collaboration session by project ID
   * @param projectId The project ID to find a session for
   * @returns The collaboration session if found, null otherwise
   */
  static async findSessionByProject(projectId: string): Promise<CollaborationSession | null> {
    try {
      const sessionsRef = db.collection('collaborationSessions');
      const query = await sessionsRef
        .where('projectId', '==', projectId)
        .where('status', '==', 'active')
        .orderBy('startedAt', 'desc')
        .limit(1)
        .get();

      if (query.empty) {
        return null;
      }

      const sessionDoc = query.docs[0];
      const sessionData = sessionDoc.data() as CollaborationSession;
      
      return {
        ...sessionData,
        id: sessionDoc.id
      };
    } catch (error) {
      console.error('Error finding session by project:', error);
      return null;
    }
  }
}

export default new CollaborationService();
