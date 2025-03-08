import React, { useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
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

const TrackUploader: React.FC<TrackUploaderProps> = ({
  onUploadComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        console.log('Audio file selected:', result.name, result.uri);
        setAudioFile(result);
      }
    } catch (error) {
      console.error('Error picking audio file:', error);
      Alert.alert('Error', 'Failed to pick audio file. Please try again.');
    }
  };
  
  const pickCoverArt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to select cover art.');
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
      }
    } catch (error) {
      console.error('Error picking cover art:', error);
      Alert.alert('Error', 'Failed to pick cover art. Please try again.');
    }
  };
  
  const handleUpload = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload tracks.');
      return;
    }
    
    if (!audioFile) {
      Alert.alert('Error', 'Please select an audio file.');
      return;
    }
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your track.');
      return;
    }
    
    if (!genre.trim()) {
      Alert.alert('Error', 'Please select a genre for your track.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // For web, we need to fetch the file and convert it to a blob
      let audioBlob;
      if (Platform.OS === 'web') {
        const response = await fetch(audioFile.uri);
        audioBlob = await response.blob();
      } else {
        // For native platforms, we need to read the file and convert it to a blob
        const fileContent = await FileSystem.readAsStringAsync(audioFile.uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        audioBlob = new Blob(
          [Buffer.from(fileContent, 'base64')], 
          { type: 'audio/mpeg' }
        );
      }
      
      // For cover art
      let coverArtBlob;
      if (coverArt) {
        if (Platform.OS === 'web') {
          const response = await fetch(coverArt);
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
      }
      
      // Use SongService to upload the song
      const songData = {
        description: description.trim() || undefined,
        visibility: 'public',
      };
      
      const uploadedSong = await SongService.uploadSong(
        user.uid,
        title.trim(),
        genre.trim(),
        audioBlob,
        coverArtBlob || undefined,
        songData
      );
      
      if (!uploadedSong) {
        throw new Error('Failed to upload song');
      }
      
      // Call the onUploadComplete callback
      onUploadComplete({
        audioUri: uploadedSong.fileUrl,
        coverArtUri: uploadedSong.coverArtUrl,
        title: uploadedSong.title,
        genre: uploadedSong.genre,
        description: uploadedSong.description
      });
      
      Alert.alert('Success', 'Your track has been uploaded successfully!');
    } catch (error) {
      console.error('Error uploading track:', error);
      Alert.alert('Error', 'Failed to upload track. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Track</Text>
      
      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={styles.filePickerButton}
          onPress={pickAudioFile}
          disabled={isUploading}
        >
          <Ionicons name="musical-note" size={24} color="#FFFFFF" />
          <Text style={styles.filePickerText}>
            {audioFile ? audioFile.name : 'Select Audio File'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.coverArtPicker}
          onPress={pickCoverArt}
          disabled={isUploading}
        >
          {coverArt ? (
            <Image source={{ uri: coverArt }} style={styles.coverArtImage} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color="#BBBBBB" />
              <Text style={styles.coverArtText}>Add Cover Art</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Track Title"
          placeholderTextColor="#888888"
          value={title}
          onChangeText={setTitle}
          editable={!isUploading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Genre (e.g., Hip Hop, R&B)"
          placeholderTextColor="#888888"
          value={genre}
          onChangeText={setGenre}
          editable={!isUploading}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Description (optional)"
          placeholderTextColor="#888888"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!isUploading}
        />
      </View>
      
      {isUploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#8E44AD" />
          <Text style={styles.progressText}>Uploading... {Math.round(uploadProgress)}%</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!audioFile || !title.trim() || !genre.trim() || isUploading) && styles.disabledButton
          ]}
          onPress={handleUpload}
          disabled={!audioFile || !title.trim() || !genre.trim() || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Track</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  filePickerButton: {
    backgroundColor: '#8E44AD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  filePickerText: {
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  coverArtPicker: {
    width: 120,
    height: 120,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  coverArtImage: {
    width: '100%',
    height: '100%',
  },
  coverArtText: {
    color: '#BBBBBB',
    marginTop: 8,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressText: {
    color: '#BBBBBB',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#BBBBBB',
  },
  uploadButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#666666',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TrackUploader; 