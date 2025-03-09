import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import TrackSharingService from '../../services/TrackSharingService';
import SongService from '../../services/SongService';
import UserService from '../../services/UserService';
import { TrackShare, ShareStatus, SharePermission } from '../../models/TrackSharing';
import { Song } from '../../models/Song';
import { User } from '../../models/User';
import { ERROR } from '../../constants/Colors';
import Colors from '../../constants/Colors';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';

interface SharedTracksViewProps {
  mode: 'received' | 'sent';
  onTrackSelect?: (track: Song, share: TrackShare) => void;
}

const SharedTracksView: React.FC<SharedTracksViewProps> = ({
  mode,
  onTrackSelect
}) => {
  const { user } = useAuth();
  const [shares, setShares] = useState<TrackShare[]>([]);
  const [tracks, setTracks] = useState<Record<string, Song>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const { theme } = useTheme();

  const trackSharingService = new TrackSharingService();
  const songService = new SongService();
  const userService = new UserService();

  useEffect(() => {
    loadShares();
    return () => {
      // Clean up sound when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user, mode]);

  const loadShares = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let sharesData: TrackShare[] = [];
      
      if (mode === 'received') {
        sharesData = await trackSharingService.getSharesByRecipient(user.uid);
      } else {
        sharesData = await trackSharingService.getSharesByOwner(user.uid);
      }
      
      setShares(sharesData);
      
      // Load track and user details
      const trackDetails: Record<string, Song> = {};
      const userDetails: Record<string, User> = {};
      
      for (const share of sharesData) {
        // Load track if not already loaded
        if (!trackDetails[share.trackId]) {
          const track = await songService.getSong(share.trackId);
          if (track) {
            trackDetails[share.trackId] = track;
          }
        }
        
        // Load user details if not already loaded
        const userId = mode === 'received' ? share.ownerId : share.recipientId;
        if (!userDetails[userId]) {
          const userDetail = await userService.getUserById(userId);
          if (userDetail) {
            userDetails[userId] = userDetail;
          }
        }
      }
      
      setTracks(trackDetails);
      setUsers(userDetails);
    } catch (error) {
      console.error('Error loading shares:', error);
      setError('Failed to load shared tracks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShares();
  };

  const handlePlayPause = async (trackId: string, fileUrl: string) => {
    try {
      // If there's already a sound playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        
        // If the same track is being toggled, just stop it
        if (playingTrackId === trackId) {
          setPlayingTrackId(null);
          return;
        }
      }
      
      // Play the new track
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingTrackId(trackId);
      
      // When playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingTrackId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleAcceptShare = async (shareId: string) => {
    if (!user) return;
    
    try {
      const success = await trackSharingService.respondToShare(
        shareId,
        user.uid,
        ShareStatus.ACCEPTED
      );
      
      if (success) {
        // Update the local state
        setShares(prevShares => 
          prevShares.map(share => 
            share.id === shareId 
              ? { ...share, status: ShareStatus.ACCEPTED } 
              : share
          )
        );
      }
    } catch (error) {
      console.error('Error accepting share:', error);
    }
  };

  const handleDeclineShare = async (shareId: string) => {
    if (!user) return;
    
    try {
      const success = await trackSharingService.respondToShare(
        shareId,
        user.uid,
        ShareStatus.DECLINED
      );
      
      if (success) {
        // Update the local state
        setShares(prevShares => 
          prevShares.map(share => 
            share.id === shareId 
              ? { ...share, status: ShareStatus.DECLINED } 
              : share
          )
        );
      }
    } catch (error) {
      console.error('Error declining share:', error);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!user) return;
    
    try {
      const success = await trackSharingService.revokeShare(shareId, user.uid);
      
      if (success) {
        // Update the local state
        setShares(prevShares => 
          prevShares.map(share => 
            share.id === shareId 
              ? { ...share, status: ShareStatus.REVOKED } 
              : share
          )
        );
      }
    } catch (error) {
      console.error('Error revoking share:', error);
    }
  };

  const handleTrackSelect = (share: TrackShare) => {
    const track = tracks[share.trackId];
    if (track && onTrackSelect) {
      onTrackSelect(track, share);
    }
  };

  const renderShareItem = ({ item }: { item: TrackShare }) => {
    const track = tracks[item.trackId];
    const otherUser = users[mode === 'received' ? item.ownerId : item.recipientId];
    
    if (!track || !otherUser) {
      return null;
    }
    
    const isPlaying = playingTrackId === track.id;
    
    return (
      <TouchableOpacity
        style={styles.shareItem}
        onPress={() => handleTrackSelect(item)}
        disabled={mode === 'received' && item.status === ShareStatus.PENDING}
      >
        <View style={styles.trackImageContainer}>
          {track.coverArtUrl ? (
            <Image source={{ uri: track.coverArtUrl }} style={styles.trackImage} />
          ) : (
            <View style={[styles.trackImage, styles.placeholderImage]}>
              <Ionicons name="musical-notes" size={24} color={theme.textSecondary} />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayPause(track.id, track.fileUrl)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {track.artistName}
          </Text>
          
          <View style={styles.shareDetails}>
            <Text style={styles.shareStatus}>
              {mode === 'received' ? 'From: ' : 'To: '}
              <Text style={styles.userName}>
                {otherUser.displayName || otherUser.email || 'User'}
              </Text>
            </Text>
            
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText,
                item.status === ShareStatus.ACCEPTED && styles.statusAccepted,
                item.status === ShareStatus.DECLINED && styles.statusDeclined,
                item.status === ShareStatus.REVOKED && styles.statusRevoked,
                item.status === ShareStatus.PENDING && styles.statusPending
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
          
          {item.permissions && item.permissions.length > 0 && (
            <View style={styles.permissionsContainer}>
              {item.permissions.includes(SharePermission.VIEW) && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>View</Text>
                </View>
              )}
              {item.permissions.includes(SharePermission.DOWNLOAD) && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>Download</Text>
                </View>
              )}
              {item.permissions.includes(SharePermission.EDIT) && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>Edit</Text>
                </View>
              )}
              {item.permissions.includes(SharePermission.REMIX) && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>Remix</Text>
                </View>
              )}
              {item.permissions.includes(SharePermission.FULL) && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>Full</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {mode === 'received' && item.status === ShareStatus.PENDING && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptShare(item.id)}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDeclineShare(item.id)}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          
          {mode === 'sent' && item.status !== ShareStatus.REVOKED && (
            <TouchableOpacity
              style={[styles.actionButton, styles.revokeButton]}
              onPress={() => handleRevokeShare(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadShares}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shares.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="share-outline" size={48} color={theme.textSecondary} />
        <Text style={styles.emptyText}>
          {mode === 'received'
            ? 'No tracks have been shared with you yet'
            : 'You haven\'t shared any tracks yet'}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadShares}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={shares}
      renderItem={renderShareItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme => theme.border,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: ERROR,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: theme => theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  shareItem: {
    flexDirection: 'row',
    backgroundColor: theme => theme.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme => theme.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: theme => theme.textSecondary,
    marginBottom: 8,
  },
  shareDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userName: {
    fontWeight: '500',
    color: Colors.text,
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statusAccepted: {
    color: '#388e3c',
  },
  statusDeclined: {
    color: '#d32f2f',
  },
  statusRevoked: {
    color: '#f57c00',
  },
  statusPending: {
    color: '#1976d2',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#388e3c',
  },
  declineButton: {
    backgroundColor: '#d32f2f',
  },
  revokeButton: {
    backgroundColor: '#f57c00',
  },
  divider: {
    height: 1,
    backgroundColor: theme => theme.border,
    marginVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme => theme.text,
    marginBottom: 8,
  },
});

export default SharedTracksView; 