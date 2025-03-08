import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Platform, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import AudioRecorder from '../components/audio/recorder/AudioRecorder';
import AudioPlayer from '../components/audio/AudioPlayer';
import AudioUploadService, { UploadResult } from '../services/AudioUploadService';
import { useAuth } from '../contexts/auth';
import { useOfflineUpload } from '../hooks/useOfflineUpload';
import NetworkStatusIndicator from '../components/common/NetworkStatusIndicator';

// Define parameter types for the screen route
type AudioUploadScreenParams = {
  projectId?: string;
  trackId?: string;
  onUploadComplete?: (fileUrl: string, fileId: string, fileName: string, duration: number) => void;
};

export default function AudioUploadScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [pickedAudioUri, setPickedAudioUri] = useState<string | null>(null);
  const [pickedAudioName, setPickedAudioName] = useState<string | null>(null);
  const [pickedAudioSize, setPickedAudioSize] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, AudioUploadScreenParams>, string>>();
  const { user } = useAuth();
  
  // Extract parameters from route
  const projectId = route.params?.projectId;
  const trackId = route.params?.trackId;
  const onUploadComplete = route.params?.onUploadComplete;
  
  // Add offline upload hook
  const { 
    queueUpload, 
    pendingUploads, 
    isOnline, 
    isSyncing, 
    syncNow 
  } = useOfflineUpload();
  
  useEffect(() => {
    // Set screen title based on context
    if (projectId && trackId) {
      navigation.setOptions({ 
        title: 'Upload to Track' 
      });
    } else if (projectId) {
      navigation.setOptions({ 
        title: 'Add Audio to Project' 
      });
    } else {
      navigation.setOptions({ 
        title: 'Upload Audio' 
      });
    }
  }, [navigation, projectId, trackId]);
  
  // Handle file picking
  const pickAudioFile = async () => {
    try {
      setError(null);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 
          'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/flac'
        ],
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        console.log('[AudioUploadScreen] Document picking cancelled');
        return;
      }
      
      const file = result.assets[0];
      console.log('[AudioUploadScreen] Picked audio file:', file);
      
      // Check file size (max 50MB)
      const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
      if (file.size && file.size > FILE_SIZE_LIMIT) {
        setError(`File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
        return;
      }
      
      // Store file information
      setPickedAudioUri(file.uri);
      setPickedAudioName(file.name);
      setPickedAudioSize(file.size || 0);
      setRecordedUri(null); // Clear recorded audio if any
      setRecordedDuration(0);
      
      // Try to estimate duration (we might update this later from the player)
      // For now, use a placeholder duration based on file size
      const estimatedDuration = Math.floor((file.size || 0) / 16000); // Very rough estimate
      setAudioDuration(estimatedDuration);
      
    } catch (err) {
      console.error('[AudioUploadScreen] Error picking document:', err);
      setError('Failed to pick audio file. Please try again.');
    }
  };
  
  // Handle recording complete
  const handleRecordingComplete = (uri: string, duration: number) => {
    console.log('[AudioUploadScreen] Recording completed:', uri, 'Duration:', duration);
    setRecordedUri(uri);
    setRecordedDuration(duration);
    setPickedAudioUri(null); // Clear picked audio if any
    setPickedAudioName(null);
    setPickedAudioSize(0);
    setIsRecording(false);
  };
  
  // Handle recording cancel
  const handleRecordingCancel = () => {
    setIsRecording(false);
  };
  
  // Handle player duration update
  const handlePlayerError = (error: any) => {
    console.error('[AudioUploadScreen] Player error:', error);
    setError('Error playing audio file. The file may be corrupt or unsupported.');
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Handle upload
  const uploadAudio = async () => {
    if (!user) {
      setError('You must be logged in to upload audio');
      return;
    }
    
    const audioUri = recordedUri || pickedAudioUri;
    if (!audioUri) {
      setError('No audio file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Generate a filename if we don't have one (for recorded audio)
      const fileName = pickedAudioName || `recording_${Date.now()}.m4a`;
      const fileSize = pickedAudioSize || 0; // Size will be 0 for recorded audio
      const duration = recordedUri ? recordedDuration : audioDuration;
      
      // Determine MIME type from file extension
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'mp3';
      const mimeType = AudioUploadService.getMimeTypeFromExtension(fileExtension);
      
      console.log('[AudioUploadScreen] Starting upload with details:', {
        fileName,
        fileSize,
        duration,
        mimeType,
        projectId,
        trackId
      });
      
      // Queue for upload (will upload immediately if online)
      await queueUpload(
        audioUri,
        fileName,
        fileSize,
        user.uid,
        duration,
        mimeType,
        projectId,
        trackId,
        false, // Not public by default
        [] // No tags by default
      );
      
      // Show success message
      if (isOnline) {
        setUploadProgress(100);
        Alert.alert(
          'Upload Queued', 
          'Your audio is being uploaded in the background'
        );
      } else {
        Alert.alert(
          'Offline Mode', 
          'Your audio will be uploaded automatically when you reconnect to the internet'
        );
      }
      
      // Reset states
      resetStates();
      
    } catch (err: any) {
      console.error('[AudioUploadScreen] Error queueing upload:', err);
      setError(`Failed to queue audio for upload: ${err.message || 'Unknown error'}`);
      setIsUploading(false);
    }
  };
  
  // Reset all states
  const resetStates = () => {
    setRecordedUri(null);
    setRecordedDuration(0);
    setPickedAudioUri(null);
    setPickedAudioName(null);
    setPickedAudioSize(0);
    setAudioDuration(0);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadResult(null);
    setError(null);
  };
  
  // Handle start new
  const handleStartNew = () => {
    // Confirm if there's an existing audio or upload result
    if (recordedUri || pickedAudioUri || uploadResult) {
      Alert.alert(
        'Start New',
        'This will discard your current audio. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: resetStates }
        ]
      );
    } else {
      resetStates();
    }
  };
  
  // Navigate back or to details
  const handleNavigateBack = () => {
    if (uploadResult?.success && onUploadComplete) {
      // If there was a successful upload and we have a callback, 
      // the parent screen will handle navigation
      navigation.goBack();
    } else if (uploadResult?.success) {
      // Navigate to file details if we have a successful upload
      navigation.navigate('AudioFileDetails', { 
        fileId: uploadResult.fileId 
      });
    } else {
      // Just go back
      navigation.goBack();
    }
  };
  
  // Add this function after the handleNavigateBack function
  const navigateToMastering = () => {
    const audioUri = recordedUri || pickedAudioUri;
    if (audioUri) {
      navigation.navigate('AudioMastering', { audioUri });
    } else {
      setError('No audio file to process');
    }
  };
  
  // Render the main content
  const renderContent = () => {
    // Show recording interface
    if (isRecording) {
      return (
        <AudioRecorder 
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleRecordingCancel}
          maxDuration={300} // 5 minutes max
        />
      );
    }
    
    // Show upload completed view
    if (uploadResult?.success) {
      return (
        <View style={styles.uploadSuccessContainer}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
            <Text style={styles.successTitle}>Upload Complete</Text>
          </View>
          
          <Text style={styles.successMessage}>
            Your audio file has been successfully uploaded.
          </Text>
          
          <AudioPlayer
            uri={uploadResult.downloadUrl}
            title={pickedAudioName || "Recorded Audio"}
            duration={recordedUri ? recordedDuration : audioDuration}
            onError={handlePlayerError}
          />
          
          <View style={styles.successButtonsContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleStartNew}
            >
              <Text style={styles.secondaryButtonText}>Upload Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleNavigateBack}
            >
              <Text style={styles.primaryButtonText}>
                {onUploadComplete ? 'Done' : 'View Details'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Show uploading view
    if (isUploading) {
      return (
        <View style={styles.uploadingContainer}>
          <Text style={styles.sectionTitle}>Uploading...</Text>
          
          <View style={styles.progressContainer}>
            <View 
              style={styles.progressBarContainer}
              testID="upload-progress-container"
            >
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${uploadProgress}%` }
                ]} 
                testID="upload-progress-fill"
              />
            </View>
            <Text style={styles.progressText}>{Math.floor(uploadProgress)}%</Text>
          </View>
          
          <Text style={styles.uploadingText}>
            {pickedAudioName || 'Your recording'} is being uploaded. Please wait...
          </Text>
        </View>
      );
    }
    
    // Show audio preview if we have one
    if (recordedUri || pickedAudioUri) {
      const audioUri = recordedUri || pickedAudioUri;
      const isRecorded = !!recordedUri;
      
      return (
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>
            {isRecorded ? 'Preview Recording' : `Selected: ${pickedAudioName}`}
          </Text>
          
          {isRecorded && (
            <Text style={styles.recordingInfo}>
              Duration: {Math.floor(recordedDuration / 60)}:{(recordedDuration % 60).toString().padStart(2, '0')}
            </Text>
          )}
          
          {!isRecorded && pickedAudioSize > 0 && (
            <Text style={styles.fileInfo}>
              Size: {formatFileSize(pickedAudioSize)}
            </Text>
          )}
          
          {audioUri && (
            <AudioPlayer 
              uri={audioUri}
              title={pickedAudioName || "Recorded Audio"}
              duration={isRecorded ? recordedDuration : audioDuration}
              onError={handlePlayerError}
            />
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={uploadAudio}
            >
              <Text style={styles.primaryButtonText}>Upload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleStartNew}
            >
              <Text style={styles.secondaryButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.masteringButton} 
            onPress={navigateToMastering}
            disabled={!recordedUri && !pickedAudioUri}
          >
            <MaterialIcons name="auto-fix-high" size={20} color="#FFFFFF" />
            <Text style={styles.masteringButtonText}>Master Audio</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Show source selection
    return (
      <View style={styles.sourceSelection}>
        <Text style={styles.sectionTitle}>Select Audio Source</Text>
        
        <TouchableOpacity 
          style={styles.sourceButton} 
          onPress={() => setIsRecording(true)}
          testID="record-audio-button"
        >
          <MaterialIcons name="mic" size={36} color="#ff4757" />
          <Text style={styles.sourceButtonText}>Record Audio</Text>
          <Text style={styles.sourceButtonSubtext}>Create a new recording now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sourceButton} 
          onPress={pickAudioFile}
          testID="pick-audio-button"
        >
          <MaterialIcons name="folder-open" size={36} color="#1e90ff" />
          <Text style={styles.sourceButtonText}>Select Audio File</Text>
          <Text style={styles.sourceButtonSubtext}>Choose from your device</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <NetworkStatusIndicator 
            pendingUploads={pendingUploads}
            isSyncing={isSyncing}
            onSyncPress={syncNow}
          />
          
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer} testID="error-container">
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                onPress={() => setError(null)}
                style={styles.dismissButton}
                testID="dismiss-error-button"
              >
                <MaterialIcons name="close" size={16} color="#c62828" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Main Content */}
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  errorText: {
    color: '#c62828',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  sourceSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2f3542',
    textAlign: 'center',
  },
  sourceButton: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  sourceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2f3542',
  },
  sourceButtonSubtext: {
    fontSize: 14,
    color: '#747d8c',
    marginTop: 5,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  recordingInfo: {
    fontSize: 16,
    color: '#57606f',
    marginBottom: 16,
  },
  fileInfo: {
    fontSize: 16,
    color: '#57606f',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f1f2f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  secondaryButtonText: {
    color: '#57606f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  uploadingText: {
    fontSize: 16,
    color: '#57606f',
    textAlign: 'center',
    marginTop: 20,
  },
  uploadSuccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f3542',
    marginTop: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#57606f',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  offlineIndicator: {
    backgroundColor: '#ffcc00',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  offlineText: {
    color: '#333',
    fontWeight: 'bold',
  },
  pendingUploadsIndicator: {
    backgroundColor: '#2196f3',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingUploadsText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  syncNowText: {
    color: '#ffffff',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  masteringButton: {
    backgroundColor: '#8E44AD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  masteringButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 