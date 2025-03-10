import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SharedTracksView from '@/components/studio/SharedTracksView';
import TrackSharingModal from '../../components/studio/TrackSharingModal';
import { TrackShare, SharePermission } from '../../models/TrackSharing';
import { Song } from '../../models/Song';
import Colors from '../../constants/Colors';

type TabType = 'received' | 'sent';

const SharedTracksScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [selectedTrack, setSelectedTrack] = useState<Song | null>(null);
  const [selectedShare, setSelectedShare] = useState<TrackShare | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const handleTrackSelect = (track: Song, share: TrackShare) => {
    setSelectedTrack(track);
    setSelectedShare(share);
    setDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
  };

  const renderPermissionsList = (permissions: SharePermission[]) => {
    return (
      <View style={styles.permissionsList}>
        {permissions.map((permission, index) => (
          <View key={index} style={styles.permissionItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Colors.primary}
              style={styles.permissionIcon}
            />
            <Text style={styles.permissionText}>
              {permission === SharePermission.VIEW && 'View and play the track'}
              {permission === SharePermission.DOWNLOAD && 'Download the track'}
              {permission === SharePermission.EDIT && 'Suggest edits to the track'}
              {permission === SharePermission.REMIX && 'Create remixes of the track'}
              {permission === SharePermission.FULL && 'Full access to the track'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shared Tracks</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'received' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('received')}
          testID="received-tab-button"
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'received' && styles.activeTabButtonText
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'sent' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('sent')}
          testID="sent-tab-button"
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'sent' && styles.activeTabButtonText
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <SharedTracksView
          mode={activeTab}
          onTrackSelect={handleTrackSelect}
        />
      </View>

      {/* Track Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} testID="details-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Details</Text>
              <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton} testID="close-modal-button">
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedTrack && selectedShare && (
                <>
                  <View style={styles.trackInfoContainer}>
                    {selectedTrack.coverArtUrl ? (
                      <View style={styles.coverArtContainer}>
                        <View style={styles.coverArtWrapper}>
                          <View style={styles.coverArtShadow} />
                          <View style={styles.coverArt}>
                            <img
                              src={selectedTrack.coverArtUrl}
                              style={styles.coverArtImage}
                              alt={selectedTrack.title}
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.placeholderCoverArt}>
                        <Ionicons name="musical-notes" size={48} color={Colors.textSecondary} />
                      </View>
                    )}

                    <View style={styles.trackTextInfo}>
                      <Text style={styles.trackTitle}>{selectedTrack.title}</Text>
                      <Text style={styles.trackArtist}>{selectedTrack.artistName}</Text>
                      
                      {selectedTrack.genre && (
                        <View style={styles.genreContainer}>
                          <Text style={styles.genreLabel}>Genre:</Text>
                          <Text style={styles.genreValue}>{selectedTrack.genre}</Text>
                        </View>
                      )}
                      
                      {selectedTrack.description && (
                        <View style={styles.descriptionContainer}>
                          <Text style={styles.descriptionLabel}>Description:</Text>
                          <Text style={styles.descriptionValue}>{selectedTrack.description}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.shareInfoContainer}>
                    <Text style={styles.sectionTitle}>Share Information</Text>
                    
                    <View style={styles.shareInfoItem}>
                      <Text style={styles.shareInfoLabel}>Status:</Text>
                      <View style={[
                        styles.statusBadge,
                        selectedShare.status === 'ACCEPTED' && styles.statusAccepted,
                        selectedShare.status === 'DECLINED' && styles.statusDeclined,
                        selectedShare.status === 'REVOKED' && styles.statusRevoked,
                        selectedShare.status === 'PENDING' && styles.statusPending
                      ]}>
                        <Text style={styles.statusText}>{selectedShare.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.shareInfoItem}>
                      <Text style={styles.shareInfoLabel}>Shared on:</Text>
                      <Text style={styles.shareInfoValue}>
                        {new Date(selectedShare.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {selectedShare.expiresAt && (
                      <View style={styles.shareInfoItem}>
                        <Text style={styles.shareInfoLabel}>Expires on:</Text>
                        <Text style={styles.shareInfoValue}>
                          {new Date(selectedShare.expiresAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    
                    {selectedShare.message && (
                      <View style={styles.messageContainer}>
                        <Text style={styles.messageLabel}>Message:</Text>
                        <Text style={styles.messageValue}>{selectedShare.message}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.permissionsContainer}>
                    <Text style={styles.sectionTitle}>Permissions</Text>
                    {selectedShare.permissions && selectedShare.permissions.length > 0 ? (
                      renderPermissionsList(selectedShare.permissions)
                    ) : (
                      <Text style={styles.noPermissionsText}>No specific permissions granted</Text>
                    )}
                  </View>

                  <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Play</Text>
                    </TouchableOpacity>
                    
                    {selectedShare.permissions?.includes(SharePermission.DOWNLOAD) && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="download" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Download</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedShare.permissions?.includes(SharePermission.EDIT) && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="create" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedShare.permissions?.includes(SharePermission.REMIX) && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="git-branch" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Remix</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  trackInfoContainer: {
    marginBottom: 24,
  },
  coverArtContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  coverArtWrapper: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  coverArtShadow: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  coverArt: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverArtImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderCoverArt: {
    width: 200,
    height: 200,
    backgroundColor: Colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  trackTextInfo: {
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  genreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  genreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  genreValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    width: '100%',
  },
  descriptionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  shareInfoContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  shareInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 100,
  },
  shareInfoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    color: Colors.text,
  },
  statusAccepted: {
    backgroundColor: '#e8f5e9',
  },
  statusDeclined: {
    backgroundColor: '#ffebee',
  },
  statusRevoked: {
    backgroundColor: '#fff3e0',
  },
  statusPending: {
    backgroundColor: '#e3f2fd',
  },
  messageContainer: {
    marginTop: 8,
  },
  messageLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageValue: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permissionsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  permissionsList: {
    marginTop: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionIcon: {
    marginRight: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.text,
  },
  noPermissionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default SharedTracksScreen; 