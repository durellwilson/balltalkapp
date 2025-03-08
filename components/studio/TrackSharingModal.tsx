import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// DateTimePicker import removed
import { useAuth } from '../../hooks/useAuth';
import TrackSharingService from '../../services/TrackSharingService';
import UserService from '../../services/UserService';
import { SharePermission } from '../../models/TrackSharing';
import { Song } from '../../models/Song';
import { User } from '../../models/User';
import { 
  PRIMARY, 
  ACCENT_1, 
  NEUTRAL_100, 
  NEUTRAL_400, 
  NEUTRAL_600, 
  NEUTRAL_800 
} from '../../constants/Colors';

interface TrackSharingModalProps {
  visible: boolean;
  onClose: () => void;
  track: Song;
}

const TrackSharingModal: React.FC<TrackSharingModalProps> = ({
  visible,
  onClose,
  track
}) => {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<User[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<SharePermission[]>(['view']);
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days from now
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const trackSharingService = new TrackSharingService();
  const userService = new UserService();
  
  useEffect(() => {
    loadRecentRecipients();
  }, []);
  
  const loadRecentRecipients = async () => {
    try {
      if (!user) return;
      
      const recentShares = await trackSharingService.getRecentShares(user.uid, 5);
      const recipientIds = recentShares.map(share => share.recipientId);
      
      // Remove duplicates
      const uniqueIds = [...new Set(recipientIds)];
      
      // Load user details for each recipient
      const recipients: User[] = [];
      for (const id of uniqueIds) {
        const userDetail = await userService.getUserById(id);
        if (userDetail) {
          recipients.push(userDetail);
        }
      }
      
      setRecentRecipients(recipients);
    } catch (error) {
      console.error('Error loading recent recipients:', error);
    }
  };
  
  const searchUsers = async (query: string) => {
    try {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearchLoading(true);
      const results = await userService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleRecipientChange = (text: string) => {
    setRecipientEmail(text);
    searchUsers(text);
  };
  
  const selectRecipient = (recipient: User) => {
    setRecipientEmail(recipient.email);
    setSelectedRecipient(recipient);
    setSearchResults([]);
  };
  
  const togglePermission = (permission: SharePermission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };
  
  const shareTrack = async () => {
    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient to share with');
      return;
    }

    if (selectedPermissions.length === 0) {
      Alert.alert('Error', 'Please select at least one permission');
      return;
    }

    try {
      setIsSending(true);

      const result = await TrackSharingService.shareTrack(
        track.id,
        user?.uid || '',
        selectedRecipient.id,
        selectedPermissions,
        shareMessage,
        expirationEnabled && expirationDate ? expirationDate.toISOString() : undefined
      );

      setIsSending(false);

      if (result) {
        Alert.alert(
          'Track Shared',
          `Track "${track.title}" was successfully shared with ${selectedRecipient.displayName || selectedRecipient.email}`,
          [
            {
              text: 'OK',
              onPress: onClose
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to share the track. Please try again.');
      }
    } catch (error) {
      console.error('Share track error:', error);
      setIsSending(false);
      Alert.alert('Error', `Failed to share the track: ${error.message}`);
    }
  };
  
  const renderPermissionItem = (permission: SharePermission, label: string, description: string) => (
    <TouchableOpacity
      key={permission}
      style={styles.permissionItem}
      onPress={() => togglePermission(permission)}
    >
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionLabel}>{label}</Text>
        <Switch
          value={selectedPermissions.includes(permission)}
          onValueChange={() => togglePermission(permission)}
          trackColor={{ false: '#767577', true: PRIMARY }}
          thumbColor={selectedPermissions.includes(permission) ? ACCENT_1 : '#f4f3f4'}
        />
      </View>
      <Text style={styles.permissionDescription}>{description}</Text>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Track</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={NEUTRAL_800} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackArtist}>{track.artist}</Text>
            </View>
            
            <View style={styles.recipientSection}>
              <Text style={styles.sectionTitle}>Share with:</Text>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter email address"
                value={recipientEmail}
                onChangeText={handleRecipientChange}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              {searchLoading && (
                <ActivityIndicator size="small" color={PRIMARY} style={styles.loader} />
              )}
              
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map(user => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.searchResultItem}
                      onPress={() => selectRecipient(user)}
                    >
                      <Text style={styles.searchResultName}>{user.displayName || user.username}</Text>
                      <Text style={styles.searchResultEmail}>{user.email}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {recentRecipients.length > 0 && (
                <View style={styles.recentRecipients}>
                  <Text style={styles.subsectionTitle}>Recent:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {recentRecipients.map(recipient => (
                      <TouchableOpacity
                        key={recipient.id}
                        style={styles.recentRecipientItem}
                        onPress={() => selectRecipient(recipient)}
                      >
                        <View style={styles.recipientAvatar}>
                          {recipient.photoURL ? (
                            <Image source={{ uri: recipient.photoURL }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.avatarText}>
                              {(recipient.displayName || recipient.username || 'U')[0].toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.recipientName} numberOfLines={1}>
                          {recipient.displayName || recipient.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <View style={styles.permissionsSection}>
              <Text style={styles.sectionTitle}>Permissions:</Text>
              
              {renderPermissionItem(
                'view',
                'View',
                'Recipient can listen to the track'
              )}
              
              {renderPermissionItem(
                'download',
                'Download',
                'Recipient can download the track'
              )}
              
              {renderPermissionItem(
                'edit',
                'Edit',
                'Recipient can edit the track'
              )}
              
              {renderPermissionItem(
                'share',
                'Share',
                'Recipient can share the track with others'
              )}
            </View>
            
            <View style={styles.expirationSection}>
              <View style={styles.expirationHeader}>
                <Text style={styles.sectionTitle}>Expiration:</Text>
                <Switch
                  value={expirationEnabled}
                  onValueChange={(value) => {
                    setExpirationEnabled(value);
                    if (value && !expirationDate) {
                      setExpirationDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                    }
                  }}
                  trackColor={{ false: '#767577', true: PRIMARY }}
                  thumbColor={expirationEnabled ? ACCENT_1 : '#f4f3f4'}
                />
              </View>
              {expirationEnabled && (
                <Text style={styles.expirationNote}>
                  Expires on {expirationDate ? expirationDate.toLocaleDateString() : 'N/A'}
                </Text>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.shareButton, loading && styles.disabledButton]}
              onPress={shareTrack}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.shareButtonText}>Share</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: NEUTRAL_100,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_400,
  },
  trackInfo: {
    marginBottom: 16,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUTRAL_800,
  },
  trackArtist: {
    fontSize: 14,
    color: NEUTRAL_600,
  },
  recipientSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: NEUTRAL_800,
  },
  subsectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: NEUTRAL_600,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: NEUTRAL_400,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    color: NEUTRAL_800,
  },
  searchResults: {
    borderWidth: 1,
    borderColor: NEUTRAL_400,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_400,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: NEUTRAL_800,
  },
  searchResultEmail: {
    fontSize: 12,
    color: NEUTRAL_600,
  },
  recentRecipients: {
    marginBottom: 16,
  },
  recentRecipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: NEUTRAL_400,
    borderRadius: 20,
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  recipientName: {
    fontSize: 12,
    textAlign: 'center',
    color: NEUTRAL_800,
  },
  permissionsSection: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_400,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: NEUTRAL_800,
  },
  permissionDescription: {
    fontSize: 14,
    color: NEUTRAL_600,
    marginTop: 4,
  },
  expirationSection: {
    marginBottom: 16,
  },
  expirationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expirationNote: {
    fontSize: 14,
    color: NEUTRAL_600,
  },
  shareButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loader: {
    marginVertical: 8,
  },
});

export default TrackSharingModal; 