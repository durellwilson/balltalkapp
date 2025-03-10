import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import AudioStorageService, { AudioFileMetadata, StreamingTrack } from '../../services/AudioStorageService';
import Colors from '@/constants/Colors';

interface AudioLibraryProps {
  isVisible: boolean;
  onClose: () => void;
  projectId?: string;
  onSelectAudio?: (audioFile: AudioFileMetadata) => void;
}

const AudioLibrary: React.FC<AudioLibraryProps> = ({
  isVisible,
  onClose,
  projectId,
  onSelectAudio
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFileMetadata[]>([]);
  const [streamingTracks, setStreamingTracks] = useState<StreamingTrack[]>([]);
  const [activeTab, setActiveTab] = useState<'myFiles' | 'projectFiles' | 'streaming'>('myFiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AudioFileMetadata | null>(null);
  const [publishForm, setPublishForm] = useState({
    title: '',
    artist: '',
    genre: '',
    description: '',
    isPublic: true
  });

  // Load audio files based on active tab
  const loadAudioFiles = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      if (activeTab === 'myFiles') {
        const files = await AudioStorageService.getUserAudioFiles(user.uid);
        setAudioFiles(files);
      } else if (activeTab === 'projectFiles' && projectId) {
        const files = await AudioStorageService.getProjectAudioFiles(projectId);
        setAudioFiles(files);
      } else if (activeTab === 'streaming') {
        const tracks = await AudioStorageService.getPublicStreamingTracks();
        setStreamingTracks(tracks);
      }
    } catch (error) {
      console.error('Error loading audio files:', error);
      Alert.alert('Error', 'Failed to load audio files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, projectId]);

  // Load files when component mounts or tab changes
  useEffect(() => {
    if (isVisible) {
      loadAudioFiles();
    }
  }, [isVisible, loadAudioFiles, activeTab]);

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Play audio file
  const playAudio = async (audioUrl: string, fileId: string) => {
    try {
      // Stop current playback if any
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setCurrentlyPlaying(fileId);
      
      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setCurrentlyPlaying(null);
          }
        }
      });
      
      // Increment play count if it's a streaming track
      if (activeTab === 'streaming') {
        const track = streamingTracks.find(t => t.id === fileId);
        if (track) {
          AudioStorageService.incrementPlayCount(fileId);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio file.');
    }
  };

  // Stop audio playback
  const stopAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setCurrentlyPlaying(null);
    }
  };

  // Delete audio file
  const deleteAudioFile = async (fileId: string) => {
    try {
      // Confirm deletion
      Alert.alert(
        'Delete Audio File',
        'Are you sure you want to delete this audio file? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              
              try {
                await AudioStorageService.deleteAudioFile(fileId);
                
                // Refresh the list
                loadAudioFiles();
                
                Alert.alert('Success', 'Audio file deleted successfully.');
              } catch (error) {
                console.error('Error deleting audio file:', error);
                Alert.alert('Error', 'Failed to delete audio file. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting audio file:', error);
      Alert.alert('Error', 'Failed to delete audio file. Please try again.');
    }
  };

  // Publish audio file as streaming track
  const publishAudioFile = async (file: AudioFileMetadata) => {
    setSelectedFile(file);
    setPublishForm({
      title: file.originalFileName.split('.')[0],
      artist: user?.displayName || 'Unknown Artist',
      genre: '',
      description: '',
      isPublic: true
    });
    setShowPublishModal(true);
  };

  // Handle publish form submission
  const handlePublish = async () => {
    if (!selectedFile || !user) return;
    
    if (!publishForm.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the track.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await AudioStorageService.createStreamingTrack(
        selectedFile.id,
        publishForm.title,
        publishForm.artist,
        user.uid,
        undefined, // No cover art for now
        publishForm.isPublic,
        publishForm.genre || undefined,
        [], // No tags for now
        publishForm.description || undefined
      );
      
      if (result) {
        Alert.alert('Success', 'Your track has been published successfully!');
        setShowPublishModal(false);
        
        // Switch to streaming tab and refresh
        setActiveTab('streaming');
      }
    } catch (error) {
      console.error('Error publishing track:', error);
      Alert.alert('Error', 'Failed to publish track. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      // Unknown format
      return 'Unknown';
    }
    
    return date.toLocaleDateString();
  };

  // Render audio file item
  const renderAudioFileItem = ({ item }: { item: AudioFileMetadata }) => {
    const isPlaying = currentlyPlaying === item.id;
    
    return (
      <View style={styles.fileItem}>
        <View style={styles.fileInfo}>
          <View style={styles.fileIconContainer}>
            <Ionicons name="musical-note" size={24} color={Colors.primary} />
          </View>
          
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.originalFileName}
            </Text>
            <Text style={styles.fileMetadata}>
              {formatDuration(item.duration)} • {formatFileSize(item.fileSize)} • {formatDate(item.uploadedAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.fileActions}>
          {isPlaying ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.stopButton]}
              onPress={stopAudio}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.playButton]}
              onPress={() => playAudio(item.streamingUrl, item.id)}
            >
              <Ionicons name="play" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          
          {onSelectAudio && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.selectButton]}
              onPress={() => onSelectAudio(item)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => publishAudioFile(item)}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteAudioFile(item.id)}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render streaming track item
  const renderStreamingTrackItem = ({ item }: { item: StreamingTrack }) => {
    const isPlaying = currentlyPlaying === item.id;
    
    return (
      <View style={styles.trackItem}>
        <View style={styles.trackImageContainer}>
          {item.coverArt ? (
            <Image source={{ uri: item.coverArt }} style={styles.trackImage} />
          ) : (
            <View style={styles.trackImagePlaceholder}>
              <Ionicons name="musical-notes" size={30} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist}
          </Text>
          <View style={styles.trackStats}>
            <Text style={styles.trackDuration}>
              {formatDuration(item.duration)}
            </Text>
            <View style={styles.trackStatItem}>
              <Ionicons name="play" size={14} color="#888" />
              <Text style={styles.trackStatText}>{item.playCount}</Text>
            </View>
            <View style={styles.trackStatItem}>
              <Ionicons name="heart" size={14} color="#888" />
              <Text style={styles.trackStatText}>{item.likeCount}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.trackActions}>
          {isPlaying ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.stopButton]}
              onPress={stopAudio}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.playButton]}
              onPress={() => playAudio(item.streamingUrl, item.id)}
            >
              <Ionicons name="play" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Filter audio files based on search query
  const filteredAudioFiles = audioFiles.filter(file => 
    file.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter streaming tracks based on search query
  const filteredStreamingTracks = streamingTracks.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Audio Library</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audio files..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myFiles' && styles.activeTab]}
            onPress={() => setActiveTab('myFiles')}
          >
            <Text style={[styles.tabText, activeTab === 'myFiles' && styles.activeTabText]}>
              My Files
            </Text>
          </TouchableOpacity>
          
          {projectId && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'projectFiles' && styles.activeTab]}
              onPress={() => setActiveTab('projectFiles')}
            >
              <Text style={[styles.tabText, activeTab === 'projectFiles' && styles.activeTabText]}>
                Project Files
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'streaming' && styles.activeTab]}
            onPress={() => setActiveTab('streaming')}
          >
            <Text style={[styles.tabText, activeTab === 'streaming' && styles.activeTabText]}>
              Streaming
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading audio files...</Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {activeTab !== 'streaming' ? (
              <>
                {filteredAudioFiles.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="musical-notes" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchQuery 
                        ? 'No audio files match your search' 
                        : activeTab === 'myFiles' 
                          ? 'You have no audio files yet' 
                          : 'This project has no audio files yet'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredAudioFiles}
                    renderItem={renderAudioFileItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                  />
                )}
              </>
            ) : (
              <>
                {filteredStreamingTracks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="radio" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchQuery 
                        ? 'No streaming tracks match your search' 
                        : 'No streaming tracks available'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredStreamingTracks}
                    renderItem={renderStreamingTrackItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                  />
                )}
              </>
            )}
          </View>
        )}
      </View>
      
      {/* Publish Modal */}
      <Modal
        visible={showPublishModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPublishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.publishModalContainer}>
            <Text style={styles.publishModalTitle}>Publish Track</Text>
            
            <ScrollView style={styles.publishForm}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={publishForm.title}
                onChangeText={(text) => setPublishForm({...publishForm, title: text})}
                placeholder="Enter track title"
              />
              
              <Text style={styles.formLabel}>Artist</Text>
              <TextInput
                style={styles.formInput}
                value={publishForm.artist}
                onChangeText={(text) => setPublishForm({...publishForm, artist: text})}
                placeholder="Enter artist name"
              />
              
              <Text style={styles.formLabel}>Genre</Text>
              <TextInput
                style={styles.formInput}
                value={publishForm.genre}
                onChangeText={(text) => setPublishForm({...publishForm, genre: text})}
                placeholder="Enter genre (optional)"
              />
              
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={publishForm.description}
                onChangeText={(text) => setPublishForm({...publishForm, description: text})}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.formCheckbox}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setPublishForm({...publishForm, isPublic: !publishForm.isPublic})}
                >
                  {publishForm.isPublic && (
                    <Ionicons name="checkmark" size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Make this track public</Text>
              </View>
            </ScrollView>
            
            <View style={styles.publishModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPublishModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.publishButton}
                onPress={handlePublish}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.publishButtonText}>Publish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 15,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  fileItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  fileMetadata: {
    fontSize: 12,
    color: '#888',
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: Colors.primary,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  selectButton: {
    backgroundColor: '#4CAF50',
  },
  publishButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
  },
  trackItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  trackImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  trackImage: {
    width: '100%',
    height: '100%',
  },
  trackImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trackStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackDuration: {
    fontSize: 12,
    color: '#888',
    marginRight: 10,
  },
  trackStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  trackStatText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  trackActions: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishModalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  publishModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  publishForm: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#666',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  publishModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  publishButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AudioLibrary; 