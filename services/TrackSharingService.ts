import { 
  TrackShare, 
  SharePermission, 
  ShareStatus, 
  TrackShareResponse, 
  SharedTrackAccess,
  SharedTrackActivity,
  SharedTrackComment,
  SharedTrackEdit,
  SharedTrackRemix,
  TrackShareNotification,
  TrackShareNotificationType
} from '../models/TrackSharing';
import { Song } from '../models/Song';
import { db, storage } from '../src/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import SongService from './SongService';

class TrackSharingService {
  // Collection names
  private static readonly SHARES_COLLECTION = 'track_shares';
  private static readonly SHARE_RESPONSES_COLLECTION = 'track_share_responses';
  private static readonly SHARE_ACCESSES_COLLECTION = 'track_share_accesses';
  private static readonly SHARE_ACTIVITIES_COLLECTION = 'track_share_activities';
  private static readonly SHARE_COMMENTS_COLLECTION = 'track_share_comments';
  private static readonly SHARE_EDITS_COLLECTION = 'track_share_edits';
  private static readonly SHARE_REMIXES_COLLECTION = 'track_share_remixes';
  private static readonly SHARE_NOTIFICATIONS_COLLECTION = 'track_share_notifications';

  /**
   * Share a track with another user
   * @param shareData - The TrackShare data
   * @returns The created TrackShare object or null if an error occurred
   */
  async shareTrack(shareData: {
    trackId: string;
    senderId: string;
    recipientId: string;
    permissions: SharePermission[];
    message?: string;
    expiresAt?: string;
    status?: ShareStatus;
  }): Promise<TrackShare | null>;

  /**
   * Share a track with another user
   * @param trackId - The ID of the track to share
   * @param ownerId - The ID of the user who owns the track
   * @param recipientId - The ID of the user to share the track with
   * @param permissions - The permissions to grant to the recipient
   * @param message - Optional message to include with the share
   * @param expiresAt - Optional expiration date for the share
   * @returns The created TrackShare object or null if an error occurred
   */
  async shareTrack(
    trackId: string,
    ownerId: string,
    recipientId: string,
    permissions: SharePermission[],
    message?: string,
    expiresAt?: Date
  ): Promise<TrackShare | null>;

  /**
   * Share a track with another user (implementation)
   */
  async shareTrack(
    trackIdOrShareData: string | {
      trackId: string;
      senderId: string;
      recipientId: string;
      permissions: SharePermission[];
      message?: string;
      expiresAt?: string;
      status?: ShareStatus;
    },
    ownerId?: string,
    recipientId?: string,
    permissions?: SharePermission[],
    message?: string,
    expiresAt?: Date
  ): Promise<TrackShare | null> {
    try {
      // Handle overloaded method
      let trackId: string;
      let actualOwnerId: string;
      let actualRecipientId: string;
      let actualPermissions: SharePermission[];
      let actualMessage: string | undefined;
      let actualExpiresAt: string | undefined;
      let actualStatus: ShareStatus = ShareStatus.PENDING;

      if (typeof trackIdOrShareData === 'string') {
        // Using the original method signature
        trackId = trackIdOrShareData;
        actualOwnerId = ownerId!;
        actualRecipientId = recipientId!;
        actualPermissions = permissions!;
        actualMessage = message;
        actualExpiresAt = expiresAt?.toISOString();
      } else {
        // Using the new method signature with shareData object
        trackId = trackIdOrShareData.trackId;
        actualOwnerId = trackIdOrShareData.senderId;
        actualRecipientId = trackIdOrShareData.recipientId;
        actualPermissions = trackIdOrShareData.permissions;
        actualMessage = trackIdOrShareData.message;
        actualExpiresAt = trackIdOrShareData.expiresAt;
        actualStatus = trackIdOrShareData.status || ShareStatus.PENDING;
      }

      // Verify that the track exists and is owned by the specified user
      const songService = new SongService();
      const track = await songService.getSong(trackId);
      
      if (!track) {
        throw new Error(`Track with ID ${trackId} not found`);
      }
      
      if (track.artistId !== actualOwnerId) {
        throw new Error(`User ${actualOwnerId} does not own track ${trackId}`);
      }
      
      // Create a new share
      const shareId = uuidv4();
      const now = new Date().toISOString();
      
      const share: TrackShare = {
        id: shareId,
        trackId,
        ownerId: actualOwnerId,
        recipientId: actualRecipientId,
        permissions: actualPermissions,
        message: actualMessage,
        status: actualStatus,
        createdAt: now,
        updatedAt: now,
        ...(actualExpiresAt && { expiresAt: actualExpiresAt })
      };
      
      // Save the share to Firestore
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      await setDoc(shareRef, share);
      
      // Create a notification for the recipient
      await this.createNotification(
        actualRecipientId,
        TrackShareNotificationType.SHARE_RECEIVED,
        shareId,
        trackId,
        actualOwnerId,
        `${track.title} has been shared with you`
      );
      
      return share;
    } catch (error) {
      console.error('Error sharing track:', error);
      return null;
    }
  }
  
  /**
   * Get a track share by ID
   * @param shareId ID of the share to retrieve
   * @returns The TrackShare object or null if not found
   */
  async getShare(shareId: string): Promise<TrackShare | null> {
    try {
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      const shareDoc = await getDoc(shareRef);
      
      if (shareDoc.exists()) {
        return shareDoc.data() as TrackShare;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting share:', error);
      return null;
    }
  }
  
  /**
   * Get all shares for a track
   * @param trackId ID of the track
   * @returns Array of TrackShare objects
   */
  async getSharesByTrack(trackId: string): Promise<TrackShare[]> {
    try {
      const sharesRef = collection(db, TrackSharingService.SHARES_COLLECTION);
      const q = query(
        sharesRef,
        where('trackId', '==', trackId),
        orderBy('createdAt', 'desc')
      );
      
      const sharesSnapshot = await getDocs(q);
      return sharesSnapshot.docs.map(doc => doc.data() as TrackShare);
    } catch (error) {
      console.error('Error getting shares by track:', error);
      return [];
    }
  }
  
  /**
   * Get all shares owned by a user
   * @param userId ID of the user
   * @returns Array of TrackShare objects
   */
  async getSharesByOwner(userId: string): Promise<TrackShare[]> {
    try {
      const sharesRef = collection(db, TrackSharingService.SHARES_COLLECTION);
      const q = query(
        sharesRef,
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const sharesSnapshot = await getDocs(q);
      return sharesSnapshot.docs.map(doc => doc.data() as TrackShare);
    } catch (error) {
      console.error('Error getting shares by owner:', error);
      return [];
    }
  }
  
  /**
   * Get all shares received by a user
   * @param userId ID of the user
   * @returns Array of TrackShare objects
   */
  async getSharesByRecipient(userId: string): Promise<TrackShare[]> {
    try {
      const sharesRef = collection(db, TrackSharingService.SHARES_COLLECTION);
      const q = query(
        sharesRef,
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const sharesSnapshot = await getDocs(q);
      return sharesSnapshot.docs.map(doc => doc.data() as TrackShare);
    } catch (error) {
      console.error('Error getting shares by recipient:', error);
      return [];
    }
  }
  
  /**
   * Get recent shares by a user (as sender)
   * @param userId - The ID of the user who shared the tracks
   * @param limit - Maximum number of shares to return
   * @returns Array of TrackShare objects
   */
  async getRecentShares(userId: string, limit: number = 5): Promise<TrackShare[]> {
    try {
      const sharesRef = collection(db, TrackSharingService.SHARES_COLLECTION);
      const q = query(
        sharesRef,
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const shares: TrackShare[] = [];
      
      querySnapshot.forEach((doc) => {
        shares.push(doc.data() as TrackShare);
      });
      
      return shares;
    } catch (error) {
      console.error('Error getting recent shares:', error);
      return [];
    }
  }
  
  /**
   * Update a track share
   * @param shareId ID of the share to update
   * @param updates Updates to apply to the share
   * @returns True if the update was successful, false otherwise
   */
  async updateShare(shareId: string, updates: Partial<TrackShare>): Promise<boolean> {
    try {
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      
      // Get the current share to verify it exists
      const shareDoc = await getDoc(shareRef);
      if (!shareDoc.exists()) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      // Update the share
      await updateDoc(shareRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating share:', error);
      return false;
    }
  }
  
  /**
   * Revoke a track share
   * @param shareId ID of the share to revoke
   * @param userId ID of the user revoking the share (must be the owner)
   * @returns True if the revocation was successful, false otherwise
   */
  async revokeShare(shareId: string, userId: string): Promise<boolean> {
    try {
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      
      // Get the current share to verify ownership
      const shareDoc = await getDoc(shareRef);
      if (!shareDoc.exists()) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      const share = shareDoc.data() as TrackShare;
      
      // Verify ownership
      if (share.ownerId !== userId) {
        throw new Error(`User ${userId} does not own share ${shareId}`);
      }
      
      // Update the share status
      await updateDoc(shareRef, {
        status: ShareStatus.REVOKED,
        updatedAt: new Date().toISOString()
      });
      
      // Create a notification for the recipient
      await this.createNotification(
        share.recipientId,
        TrackShareNotificationType.SHARE_REVOKED,
        shareId,
        share.trackId,
        userId,
        `Access to ${share.trackId} has been revoked`
      );
      
      return true;
    } catch (error) {
      console.error('Error revoking share:', error);
      return false;
    }
  }
  
  /**
   * Respond to a track share
   * @param shareId ID of the share to respond to
   * @param userId ID of the user responding to the share (must be the recipient)
   * @param status New status for the share (ACCEPTED or DECLINED)
   * @param message Optional message to include with the response
   * @returns True if the response was successful, false otherwise
   */
  async respondToShare(
    shareId: string,
    userId: string,
    status: ShareStatus.ACCEPTED | ShareStatus.DECLINED,
    message?: string
  ): Promise<boolean> {
    try {
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      
      // Get the current share to verify recipient
      const shareDoc = await getDoc(shareRef);
      if (!shareDoc.exists()) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      const share = shareDoc.data() as TrackShare;
      
      // Verify recipient
      if (share.recipientId !== userId) {
        throw new Error(`User ${userId} is not the recipient of share ${shareId}`);
      }
      
      // Verify the share is pending
      if (share.status !== ShareStatus.PENDING) {
        throw new Error(`Share ${shareId} is not pending`);
      }
      
      // Update the share status
      await updateDoc(shareRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Create a response
      const responseId = uuidv4();
      const now = new Date().toISOString();
      
      const response: TrackShareResponse = {
        id: responseId,
        shareId,
        recipientId: userId,
        message,
        status,
        createdAt: now
      };
      
      // Save the response to Firestore
      const responseRef = doc(db, TrackSharingService.SHARE_RESPONSES_COLLECTION, responseId);
      await setDoc(responseRef, response);
      
      // Create a notification for the owner
      const notificationType = status === ShareStatus.ACCEPTED
        ? TrackShareNotificationType.SHARE_ACCEPTED
        : TrackShareNotificationType.SHARE_DECLINED;
      
      const notificationMessage = status === ShareStatus.ACCEPTED
        ? `Your share of ${share.trackId} has been accepted`
        : `Your share of ${share.trackId} has been declined`;
      
      await this.createNotification(
        share.ownerId,
        notificationType,
        shareId,
        share.trackId,
        userId,
        notificationMessage,
        { responseId }
      );
      
      return true;
    } catch (error) {
      console.error('Error responding to share:', error);
      return false;
    }
  }
  
  /**
   * Record an access to a shared track
   * @param shareId ID of the share
   * @param userId ID of the user accessing the track
   * @param deviceInfo Optional device information
   * @param ipAddress Optional IP address
   * @param location Optional location information
   * @returns True if the access was recorded successfully, false otherwise
   */
  async recordAccess(
    shareId: string,
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
    location?: { country?: string; region?: string; city?: string }
  ): Promise<boolean> {
    try {
      const shareRef = doc(db, TrackSharingService.SHARES_COLLECTION, shareId);
      
      // Get the current share to verify it exists and is active
      const shareDoc = await getDoc(shareRef);
      if (!shareDoc.exists()) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      const share = shareDoc.data() as TrackShare;
      
      // Verify the share is accepted
      if (share.status !== ShareStatus.ACCEPTED) {
        throw new Error(`Share ${shareId} is not accepted`);
      }
      
      // Verify the share has not expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        throw new Error(`Share ${shareId} has expired`);
      }
      
      // Verify the user is the recipient
      if (share.recipientId !== userId && share.ownerId !== userId) {
        throw new Error(`User ${userId} is not authorized to access share ${shareId}`);
      }
      
      // Create an access record
      const accessId = uuidv4();
      const now = new Date().toISOString();
      
      const access: SharedTrackAccess = {
        id: accessId,
        shareId,
        userId,
        accessedAt: now,
        ...(deviceInfo && { deviceInfo }),
        ...(ipAddress && { ipAddress }),
        ...(location && { location })
      };
      
      // Save the access to Firestore
      const accessRef = doc(db, TrackSharingService.SHARE_ACCESSES_COLLECTION, accessId);
      await setDoc(accessRef, access);
      
      // Update the share with the last access time and increment the access count
      await updateDoc(shareRef, {
        lastAccessedAt: now,
        accessCount: increment(1),
        updatedAt: now
      });
      
      // If the user is the recipient, create a notification for the owner
      if (userId === share.recipientId) {
        await this.createNotification(
          share.ownerId,
          TrackShareNotificationType.TRACK_ACCESSED,
          shareId,
          share.trackId,
          userId,
          `Your shared track ${share.trackId} was accessed`,
          { accessId }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error recording access:', error);
      return false;
    }
  }
  
  /**
   * Record an activity on a shared track
   * @param shareId ID of the share
   * @param trackId ID of the track
   * @param userId ID of the user performing the activity
   * @param activityType Type of activity
   * @param details Optional details about the activity
   * @returns The created SharedTrackActivity object or null if the operation failed
   */
  async recordActivity(
    shareId: string,
    trackId: string,
    userId: string,
    activityType: 'view' | 'play' | 'download' | 'edit' | 'remix' | 'comment',
    details?: any
  ): Promise<SharedTrackActivity | null> {
    try {
      // Verify the share exists and is active
      const share = await this.getShare(shareId);
      if (!share) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      // Verify the share is accepted
      if (share.status !== ShareStatus.ACCEPTED) {
        throw new Error(`Share ${shareId} is not accepted`);
      }
      
      // Verify the share has not expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        throw new Error(`Share ${shareId} has expired`);
      }
      
      // Verify the user is authorized
      if (share.recipientId !== userId && share.ownerId !== userId) {
        throw new Error(`User ${userId} is not authorized for share ${shareId}`);
      }
      
      // Create an activity record
      const activityId = uuidv4();
      const now = new Date().toISOString();
      
      const activity: SharedTrackActivity = {
        id: activityId,
        shareId,
        trackId,
        userId,
        activityType,
        timestamp: now,
        ...(details && { details })
      };
      
      // Save the activity to Firestore
      const activityRef = doc(db, TrackSharingService.SHARE_ACTIVITIES_COLLECTION, activityId);
      await setDoc(activityRef, activity);
      
      return activity;
    } catch (error) {
      console.error('Error recording activity:', error);
      return null;
    }
  }
  
  /**
   * Add a comment to a shared track
   * @param shareId ID of the share
   * @param trackId ID of the track
   * @param userId ID of the user adding the comment
   * @param text Comment text
   * @param isPrivate Whether the comment is private
   * @param parentId Optional parent comment ID for replies
   * @param mentions Optional user IDs mentioned in the comment
   * @param timestamp_position Optional position in the track where the comment was made
   * @returns The created SharedTrackComment object or null if the operation failed
   */
  async addComment(
    shareId: string,
    trackId: string,
    userId: string,
    text: string,
    isPrivate: boolean = false,
    parentId?: string,
    mentions?: string[],
    timestamp_position?: number
  ): Promise<SharedTrackComment | null> {
    try {
      // Verify the share exists and is active
      const share = await this.getShare(shareId);
      if (!share) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      // Verify the share is accepted
      if (share.status !== ShareStatus.ACCEPTED) {
        throw new Error(`Share ${shareId} is not accepted`);
      }
      
      // Verify the share has not expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        throw new Error(`Share ${shareId} has expired`);
      }
      
      // Verify the user is authorized
      if (share.recipientId !== userId && share.ownerId !== userId) {
        throw new Error(`User ${userId} is not authorized for share ${shareId}`);
      }
      
      // Create a comment
      const commentId = uuidv4();
      const now = new Date().toISOString();
      
      const comment: SharedTrackComment = {
        id: commentId,
        shareId,
        trackId,
        userId,
        text,
        timestamp: now,
        isPrivate,
        ...(parentId && { parentId }),
        ...(mentions && { mentions }),
        ...(timestamp_position !== undefined && { timestamp_position })
      };
      
      // Save the comment to Firestore
      const commentRef = doc(db, TrackSharingService.SHARE_COMMENTS_COLLECTION, commentId);
      await setDoc(commentRef, comment);
      
      // Record the activity
      await this.recordActivity(shareId, trackId, userId, 'comment', { commentId });
      
      // Create notifications for mentioned users and the other party
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          // Skip if the mentioned user is the commenter
          if (mentionedUserId === userId) continue;
          
          // Skip if the mentioned user is not the owner or recipient
          if (mentionedUserId !== share.ownerId && mentionedUserId !== share.recipientId) continue;
          
          await this.createNotification(
            mentionedUserId,
            TrackShareNotificationType.TRACK_COMMENTED,
            shareId,
            trackId,
            userId,
            `You were mentioned in a comment on ${trackId}`,
            { commentId }
          );
        }
      }
      
      // Notify the other party (owner or recipient)
      const otherPartyId = userId === share.ownerId ? share.recipientId : share.ownerId;
      
      // Skip if the other party is already mentioned
      if (!mentions || !mentions.includes(otherPartyId)) {
        await this.createNotification(
          otherPartyId,
          TrackShareNotificationType.TRACK_COMMENTED,
          shareId,
          trackId,
          userId,
          `New comment on ${trackId}`,
          { commentId }
        );
      }
      
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }
  
  /**
   * Get comments for a shared track
   * @param shareId ID of the share
   * @param trackId ID of the track
   * @param userId ID of the user requesting the comments
   * @returns Array of SharedTrackComment objects
   */
  async getComments(
    shareId: string,
    trackId: string,
    userId: string
  ): Promise<SharedTrackComment[]> {
    try {
      // Verify the share exists and is active
      const share = await this.getShare(shareId);
      if (!share) {
        throw new Error(`Share with ID ${shareId} not found`);
      }
      
      // Verify the user is authorized
      if (share.recipientId !== userId && share.ownerId !== userId) {
        throw new Error(`User ${userId} is not authorized for share ${shareId}`);
      }
      
      // Query for comments
      const commentsRef = collection(db, TrackSharingService.SHARE_COMMENTS_COLLECTION);
      let q = query(
        commentsRef,
        where('shareId', '==', shareId),
        where('trackId', '==', trackId),
        orderBy('timestamp', 'asc')
      );
      
      // If the user is not the owner, filter out private comments not made by the user
      if (userId !== share.ownerId) {
        q = query(
          commentsRef,
          where('shareId', '==', shareId),
          where('trackId', '==', trackId),
          where('isPrivate', '==', false),
          orderBy('timestamp', 'asc')
        );
      }
      
      const commentsSnapshot = await getDocs(q);
      return commentsSnapshot.docs.map(doc => doc.data() as SharedTrackComment);
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }
  
  /**
   * Create a notification for a track share
   * @param userId ID of the user to notify
   * @param type Type of notification
   * @param shareId ID of the share
   * @param trackId ID of the track
   * @param senderId ID of the user who triggered the notification
   * @param message Optional message
   * @param data Optional additional data
   * @returns The created TrackShareNotification object or null if the operation failed
   */
  private async createNotification(
    userId: string,
    type: TrackShareNotificationType,
    shareId: string,
    trackId: string,
    senderId: string,
    message?: string,
    data?: any
  ): Promise<TrackShareNotification | null> {
    try {
      const notificationId = uuidv4();
      const now = new Date().toISOString();
      
      const notification: TrackShareNotification = {
        id: notificationId,
        userId,
        type,
        shareId,
        trackId,
        senderId,
        message,
        isRead: false,
        timestamp: now,
        ...(data && { data })
      };
      
      // Save the notification to Firestore
      const notificationRef = doc(db, TrackSharingService.SHARE_NOTIFICATIONS_COLLECTION, notificationId);
      await setDoc(notificationRef, notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
  
  /**
   * Get notifications for a user
   * @param userId ID of the user
   * @param unreadOnly Whether to only return unread notifications
   * @param limitCount Maximum number of notifications to return
   * @returns Array of TrackShareNotification objects
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limitCount: number = 20
  ): Promise<TrackShareNotification[]> {
    try {
      const notificationsRef = collection(db, TrackSharingService.SHARE_NOTIFICATIONS_COLLECTION);
      let q;
      
      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }
      
      const notificationsSnapshot = await getDocs(q);
      return notificationsSnapshot.docs.map(doc => doc.data() as TrackShareNotification);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification
   * @param userId ID of the user (must be the recipient)
   * @returns True if the operation was successful, false otherwise
   */
  async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const notificationRef = doc(db, TrackSharingService.SHARE_NOTIFICATIONS_COLLECTION, notificationId);
      
      // Get the notification to verify recipient
      const notificationDoc = await getDoc(notificationRef);
      if (!notificationDoc.exists()) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }
      
      const notification = notificationDoc.data() as TrackShareNotification;
      
      // Verify recipient
      if (notification.userId !== userId) {
        throw new Error(`User ${userId} is not the recipient of notification ${notificationId}`);
      }
      
      // Update the notification
      await updateDoc(notificationRef, {
        isRead: true
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param userId ID of the user
   * @returns True if the operation was successful, false otherwise
   */
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const notificationsRef = collection(db, TrackSharingService.SHARE_NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const notificationsSnapshot = await getDocs(q);
      
      // Use a batch to update all notifications
      const batch = writeBatch(db);
      
      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      
      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
}

export default TrackSharingService; 