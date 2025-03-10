import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import AudioStorageService from '../../services/AudioStorageService';
import Colors from '@/constants/Colors';
import UploadedFileDetails from './UploadedFileDetails';

// Supported audio file types
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', // MP3
  'audio/mp4', // M4A
  'audio/wav', // WAV
  'audio/x-wav', // WAV (alternative MIME type)
  'audio/ogg', // OGG
  'audio/aac', // AAC
  'audio/flac', // FLAC
  'audio/x-flac', // FLAC (alternative MIME type)
];

// File size limit in bytes (50MB)
const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

interface AudioFileUploaderProps {
  projectId: string;
  trackId?: string;
  onUploadComplete: (fileUrl: string, fileName: string, duration: number) => void;
  onCancel: () => void;
}

const AudioFileUploader: React.FC<AudioFileUploaderProps> = ({
  projectId,
  trackId,
  onUploadComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
    uri: string;
    duration?: number;
  } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFileDetails, setUploadedFileDetails] = useState<{
    fileUrl: string;
    fileName: string;
    duration: number;
  } | null>(null);

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Pick an audio file
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_AUDIO_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picking was canceled');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      // Check file size
      if (file.size > FILE_SIZE_LIMIT) {
        Alert.alert(
          'File Too Large',
          `The selected file exceeds the 50MB limit. Please choose a smaller file.`
        );
        return;
      }

      setSelectedFile(result);
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.mimeType || 'unknown',
        uri: file.uri,
      });

      // Load the audio to get its duration
      await loadAudio(file.uri);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select audio file. Please try again.');
    }
  };

  // Load audio to get duration and enable preview
  const loadAudio = async (uri: string) => {
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Load the new sound
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      setSound(newSound);

      // Get duration if available
      if (status.isLoaded && status.durationMillis) {
        const durationSeconds = status.durationMillis / 1000;
        setFileInfo(prev => prev ? { ...prev, duration: durationSeconds } : null);
      }

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio file. The file may be corrupted or unsupported.');
    }
  };

  // Toggle play/pause for audio preview
  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Upload the file
  const uploadFile = async () => {
    if (!fileInfo || !user) {
      Alert.alert('Error', 'No file selected or user not authenticated');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      console.log('Starting upload with details:', {
        userId: user.uid,
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        projectId,
        trackId
      });

      // Upload the file using AudioStorageService
      const audioFileMetadata = await AudioStorageService.uploadAudioFile(
        user.uid,
        fileInfo.uri,
        fileInfo.name,
        fileInfo.size,
        fileInfo.duration || 0,
        fileInfo.type,
        projectId,
        trackId,
        false, // Not public by default
        [], // No tags by default
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
          setUploadProgress(Math.round(progress));
        }
      );

      if (audioFileMetadata) {
        console.log('File uploaded successfully:', audioFileMetadata);
        
        // Save the uploaded file details for display
        setUploadedFileDetails({
          fileUrl: audioFileMetadata.downloadUrl,
          fileName: fileInfo.name,
          duration: fileInfo.duration || 0
        });
        
        // Call the onUploadComplete callback with the file URL and duration
        onUploadComplete(
          audioFileMetadata.downloadUrl, 
          fileInfo.name, 
          fileInfo.duration || 0
        );
      } else {
        throw new Error('Upload failed: No metadata returned');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert(
        'Upload Failed', 
        `Failed to upload the audio file: ${error.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function for immediate playback
  const playUploadedFile = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      // Set up playback status handler
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error playing uploaded file:', error);
      Alert.alert('Playback Error', 'Failed to play the uploaded file.');
      return false;
    }
  };

  // Reset the component state
  const resetState = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setUploadedFileDetails(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
  };
  
  // Close the uploader
  const handleClose = () => {
    resetState();
    onCancel();
  };

  return (
    <View style={styles.container}>
      {uploadedFileDetails ? (
        // Show uploaded file details
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Upload Successful!</Text>
          
          <UploadedFileDetails
            fileName={uploadedFileDetails.fileName}
            fileUrl={uploadedFileDetails.fileUrl}
            duration={uploadedFileDetails.duration}
            trackName={trackId ? `Track ${trackId}` : undefined}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={resetState}
            >
              <Text style={styles.secondaryButtonText}>Upload Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleClose}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Show the file picker or file info
        <>
          <Text style={styles.title}>Upload Audio File</Text>
          <Text style={styles.subtitle}>
            Supported formats: MP3, M4A, WAV, OGG, AAC, FLAC (Max 50MB)
          </Text>

          {!fileInfo ? (
            <TouchableOpacity 
              style={styles.uploadArea} 
              onPress={pickAudioFile}
              disabled={isLoading}
            >
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
              <Text style={styles.uploadText}>Tap to select an audio file</Text>
              <Text style={styles.uploadSubtext}>
                or drag and drop a file here
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileInfoContainer}>
              <View style={styles.fileHeader}>
                <Ionicons 
                  name="musical-note" 
                  size={24} 
                  color={Colors.primary} 
                  style={styles.fileIcon} 
                />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                    {fileInfo.name}
                  </Text>
                  <Text style={styles.fileMetadata}>
                    {formatFileSize(fileInfo.size)} • {formatDuration(fileInfo.duration)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${uploadProgress * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(uploadProgress * 100)}%
                  </Text>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => {
                      setSelectedFile(null);
                      setFileInfo(null);
                      if (sound) {
                        sound.unloadAsync();
                        setSound(null);
                      }
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Change File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.uploadButton]} 
                    onPress={uploadFile}
                  >
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            {fileInfo && (
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]} 
                onPress={uploadFile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />
                    <Text style={styles.primaryButtonText}>
                      Uploading... {uploadProgress}%
                    </Text>
                  </>
                ) : (
                  <Text style={styles.primaryButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    color: '#333',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  fileInfoContainer: {
    marginBottom: 20,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileMetadata: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: Colors.primary,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  cancelLink: {
    padding: 8,
  },
  cancelLinkText: {
    color: '#666',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  successContainer: {
    padding: 16,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonLoader: {
    marginRight: 8,
  },
});

export default AudioFileUploader; 