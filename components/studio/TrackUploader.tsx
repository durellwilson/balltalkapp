import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import SongService from '../../services/SongService';

interface TrackUploaderProps {
  onUploadComplete: (data: {
    audioUri: string;
    coverArtUri?: string;
    title: string;
    genre: string;
    description?: string;
  }) => void;
  onCancel: () => void;
}

// Define a type for our audio file
interface AudioFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

const TrackUploader: React.FC<TrackUploaderProps> = ({
  onUploadComplete,
  onCancel
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Audio preview state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [sound]);
  
  // Update audio file title when a new file is selected
  useEffect(() => {
    if (audioFile && audioFile.name && !title) {
      // Extract filename without extension and use as title
      const fileName = audioFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
    }
  }, [audioFile]);
  
  const pickAudioFile = async () => {
    try {
      console.log('Picking audio file...');
      setErrorMessage(null);
      
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setDuration(0);
        setPosition(0);
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Audio file selected:', file.name, file.uri, 'Size:', file.size);
        
        // Validate file size (max 50MB)
        if (!file.size) {
          setErrorMessage('Unable to determine file size. Please try another file.');
          return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
          setErrorMessage('File is too large. Maximum size is 50MB.');
          return;
        }
        
        if (file.size < 10 * 1024) {
          setErrorMessage('File is too small. It may be corrupted or empty.');
          return;
        }
        
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/x-m4a'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['mp3', 'wav', 'm4a', 'ogg'];
        
        if (file.mimeType && !validTypes.includes(file.mimeType) && 
            fileExtension && !validExtensions.includes(fileExtension)) {
          setErrorMessage(`Unsupported file type: ${file.mimeType || fileExtension}. Please use MP3, WAV, M4A, or OGG files.`);
          console.warn('Unsupported file type:', file.mimeType);
          return;
        }
        
        // Validate file name
        if (!file.name) {
          setErrorMessage('File must have a name. Please rename the file and try again.');
          return;
        }
        
        const newAudioFile = {
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType
        };
        
        setAudioFile(newAudioFile);
        
        // Load the audio for preview
        loadAudioPreview(file.uri);
      } else {
        console.log('Document picker cancelled or failed');
      }
    } catch (error: any) {
      console.error('Error picking audio file:', error);
      setErrorMessage(`Failed to pick audio file: ${error.message || 'Unknown error'}`);
    }
  };
  
  const loadAudioPreview = async (uri: string) => {
    try {
      setIsLoading(true);
      console.log('Loading audio preview...');
      
      // Create a new sound object
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      console.log('Audio preview loaded successfully');
    } catch (error: any) {
      console.error('Error loading audio preview:', error);
      setErrorMessage(`Failed to load audio preview: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // Update position periodically when playing
      if (status.isPlaying && !positionUpdateInterval.current) {
        positionUpdateInterval.current = setInterval(async () => {
          if (sound) {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              setPosition(status.positionMillis || 0);
            }
          }
        }, 500);
      } else if (!status.isPlaying && positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
    }
  };
  
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
  
  const seekAudio = async (value: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(value);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };
  
  const adjustVolume = async (value: number) => {
    if (!sound) return;
    
    try {
      await sound.setVolumeAsync(value);
      setVolume(value);
    } catch (error) {
      console.error('Error adjusting volume:', error);
    }
  };
  
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const pickCoverArt = async () => {
    try {
      console.log('Picking cover art...');
      setErrorMessage(null);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMessage('Camera roll permission is required to select cover art.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        console.log('Cover art selected:', result.assets[0].uri);
        setCoverArt(result.assets[0].uri);
      } else {
        console.log('Image picker cancelled');
      }
    } catch (error) {
      console.error('Error picking cover art:', error);
      setErrorMessage('Failed to pick cover art. Please try again.');
    }
  };
  
  const handleUpload = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to upload tracks.');
      return;
    }
    
    if (!audioFile) {
      setErrorMessage('Please select an audio file.');
      return;
    }
    
    if (!title.trim()) {
      setErrorMessage('Please enter a title for your track.');
      return;
    }
    
    if (!genre.trim()) {
      setErrorMessage('Please select a genre for your track.');
      return;
    }
    
    // Additional validation
    if (title.trim().length < 3) {
      setErrorMessage('Track title must be at least 3 characters long.');
      return;
    }
    
    if (title.trim().length > 100) {
      setErrorMessage('Track title must be less than 100 characters.');
      return;
    }
    
    if (genre.trim().length < 2) {
      setErrorMessage('Genre must be at least 2 characters long.');
      return;
    }
    
    if (description && description.length > 500) {
      setErrorMessage('Description must be less than 500 characters.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    
    try {
      console.log('Starting upload process...');
      
      // Update progress
      setUploadProgress(5);
      
      // Verify file is accessible
      try {
        if (Platform.OS !== 'web') {
          const fileInfo = await FileSystem.getInfoAsync(audioFile.uri);
          if (!fileInfo.exists) {
            throw new Error('File no longer exists or is inaccessible.');
          }
          console.log('File verified as accessible:', fileInfo);
        }
      } catch (fileError: any) {
        console.error('File verification error:', fileError);
        throw new Error(`File verification failed: ${fileError.message}`);
      }
      
      // Update progress
      setUploadProgress(10);
      
      // For web, we need to fetch the file and convert it to a blob
      let audioBlob;
      try {
        if (Platform.OS === 'web') {
          console.log('Web platform detected, fetching audio file...');
          const response = await fetch(audioFile.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
          }
          audioBlob = await response.blob();
          console.log('Audio blob created, size:', audioBlob.size);
          
          // Verify blob size
          if (audioBlob.size === 0) {
            throw new Error('Audio file appears to be empty.');
          }
        } else {
          // For native platforms, we need to read the file and convert it to a blob
          console.log('Native platform detected, reading audio file...');
          const fileContent = await FileSystem.readAsStringAsync(audioFile.uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          console.log('File content read, length:', fileContent.length);
          
          if (!fileContent || fileContent.length === 0) {
            throw new Error('Audio file appears to be empty.');
          }
          
          audioBlob = new Blob(
            [Buffer.from(fileContent, 'base64')], 
            { type: audioFile.mimeType || 'audio/mpeg' }
          );
          console.log('Audio blob created, size:', audioBlob.size);
          
          if (audioBlob.size === 0) {
            throw new Error('Failed to create audio blob from file.');
          }
        }
      } catch (blobError: any) {
        console.error('Error creating audio blob:', blobError);
        throw new Error(`Failed to process audio file: ${blobError.message}`);
      }
      
      // Update progress
      setUploadProgress(30);
      
      // For cover art
      let coverArtBlob;
      if (coverArt) {
        try {
          console.log('Processing cover art...');
          if (Platform.OS === 'web') {
            const response = await fetch(coverArt);
            if (!response.ok) {
              throw new Error(`Failed to fetch cover art: ${response.status} ${response.statusText}`);
            }
            coverArtBlob = await response.blob();
          } else {
            const fileContent = await FileSystem.readAsStringAsync(coverArt, {
              encoding: FileSystem.EncodingType.Base64
            });
            coverArtBlob = new Blob(
              [Buffer.from(fileContent, 'base64')], 
              { type: 'image/jpeg' }
            );
          }
          console.log('Cover art blob created, size:', coverArtBlob.size);
          
          if (coverArtBlob.size === 0) {
            console.warn('Cover art blob is empty, continuing without cover art');
            coverArtBlob = undefined;
          }
        } catch (coverError: any) {
          console.error('Error processing cover art:', coverError);
          // Continue without cover art
          console.log('Continuing upload without cover art');
        }
      }
      
      // Update progress
      setUploadProgress(50);
      
      // Use SongService to upload the song
      console.log('Preparing to upload to Firebase...');
      const songData = {
        description: description ? description.trim() : "",
        visibility: 'public' as 'public' | 'subscribers' | 'private',
      };
      
      console.log('Uploading song to Firebase with user ID:', user.uid);
      try {
        const uploadedSong = await SongService.uploadSong(
          user.uid,
          title.trim(),
          genre.trim(),
          audioBlob,
          coverArtBlob || undefined,
          songData
        );
        
        // Update progress
        setUploadProgress(90);
        
        if (!uploadedSong) {
          throw new Error('Failed to upload song. The server did not return song data.');
        }
        
        console.log('Song uploaded successfully:', uploadedSong);
        
        // Update progress
        setUploadProgress(95);
        
        // Pre-load the audio for immediate playback
        if (uploadedSong.fileUrl) {
          try {
            // Create a new Audio object and start loading it
            console.log('Pre-loading audio for immediate playback...');
            await Audio.Sound.createAsync(
              { uri: uploadedSong.fileUrl },
              { shouldPlay: false }
            );
            console.log('Audio pre-loaded successfully');
          } catch (preloadError) {
            console.warn('Failed to pre-load audio, will still continue:', preloadError);
            // Continue with the upload completion even if preloading fails
          }
        }
        
        // Update progress
        setUploadProgress(100);
        
        // Call the onUploadComplete callback
        onUploadComplete({
          audioUri: uploadedSong.fileUrl,
          coverArtUri: uploadedSong.coverArtUrl,
          title: uploadedSong.title,
          genre: uploadedSong.genre,
          description: uploadedSong.description
        });
        
        Alert.alert('Success', 'Your track has been uploaded successfully!');
      } catch (uploadError: any) {
        console.error('Error in SongService.uploadSong:', uploadError);
        throw new Error(`Upload to Firebase failed: ${uploadError.message}`);
      }
    } catch (error: any) {
      console.error('Error uploading track:', error);
      let errorMsg = 'Upload failed: ';
      
      if (error.message) {
        errorMsg += error.message;
      } else if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMsg += 'You do not have permission to upload files.';
            break;
          case 'storage/canceled':
            errorMsg += 'Upload was canceled.';
            break;
          case 'storage/unknown':
          default:
            errorMsg += 'An unknown error occurred.';
            break;
        }
      } else {
        errorMsg += 'Unknown error';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Upload Track</Text>
      
      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={[styles.filePickerButton, { backgroundColor: theme.tint }]}
          onPress={pickAudioFile}
          disabled={isUploading}
        >
          <Ionicons name="musical-note" size={24} color="#FFFFFF" />
          <Text style={styles.filePickerText}>
            {audioFile ? audioFile.name : 'Select Audio File'}
          </Text>
        </TouchableOpacity>
        
        {audioFile && sound && (
          <View style={[styles.audioPreviewContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.audioControlsRow}>
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: theme.tint }]} 
                onPress={togglePlayback}
                disabled={isLoading}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(position)}</Text>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}> / {formatTime(duration)}</Text>
              </View>
            </View>
            
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onSlidingComplete={seekAudio}
                minimumTrackTintColor={theme.tint}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.tint}
                disabled={isLoading || duration === 0}
              />
            </View>
            
            <View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={adjustVolume}
                minimumTrackTintColor={theme.tint}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.tint}
              />
              <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.coverArtPicker, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={pickCoverArt}
          disabled={isUploading}
        >
          {coverArt ? (
            <Image source={{ uri: coverArt }} style={styles.coverArtImage} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
              <Text style={[styles.coverArtText, { color: theme.textSecondary }]}>Add Cover Art</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Track Title"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          editable={!isUploading}
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Genre (e.g., Hip Hop, R&B)"
          placeholderTextColor={theme.textSecondary}
          value={genre}
          onChangeText={setGenre}
          editable={!isUploading}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Description (optional)"
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!isUploading}
        />
      </View>
      
      {errorMessage && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
        </View>
      )}
      
      {isUploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color={theme.tint} />
          <Text style={[styles.progressText, { color: theme.text }]}>Uploading... {Math.round(uploadProgress)}%</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { backgroundColor: theme.cardBackground }]}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button, 
            styles.uploadButton, 
            { backgroundColor: theme.tint },
            isUploading && styles.disabledButton
          ]}
          onPress={handleUpload}
          disabled={isUploading || !audioFile}
        >
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  filePickerText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  audioPreviewContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  coverArtPicker: {
    width: 120,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverArtImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverArtText: {
    marginTop: 8,
    fontSize: 12,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
  },
  uploadButton: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TrackUploader; 