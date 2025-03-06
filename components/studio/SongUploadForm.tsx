import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
// Placeholder for file upload - replace with actual implementation later
// import * as DocumentPicker from 'expo-document-picker';

interface SongUploadFormProps {
  onUploadComplete: (songData: any) => void; // Replace 'any' with a proper Song type later
  onCancel: () => void;
}

const SongUploadForm: React.FC<SongUploadFormProps> = ({ onUploadComplete, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
    const [mood, setMood] = useState('');
    const [visibility, setVisibility] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
  // Placeholder for file URIs - replace with actual implementation later
  // const [audioFileUri, setAudioFileUri] = useState<string | null>(null);
  // const [coverArtUri, setCoverArtUri] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim() || !genre.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Title and Genre).');
      return;
    }

    setIsLoading(true);

    try {
      // Placeholder for file upload logic - replace with actual implementation later
      // const audioFileResult = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      // const coverArtResult = await DocumentPicker.getDocumentAsync({ type: 'image/*' });

      // if (audioFileResult.type === 'cancel' || coverArtResult.type === 'cancel') {
      //   Alert.alert('Error', 'You need to select both an audio file and cover art.');
      //   setIsLoading(false);
      //   return;
      // }

      // setAudioFileUri(audioFileResult.uri);
      // setCoverArtUri(coverArtResult.uri);

      // Prepare song data - replace with actual data from file upload and include new fields
        const songData = {
            title,
            description,
            genre,
            mood: mood.split(',').map(m => m.trim()), // Split comma-separated string into array
            visibility,
            artistId: user?.uid,
            // Replace with actual file URLs and duration
            fileUrl: 'placeholder-audio-url',
            coverArtUrl: 'placeholder-cover-art-url',
            duration: 180, // Placeholder duration
        };

      // Call the onUploadComplete callback with the song data
      onUploadComplete(songData);
    } catch (error) {
      console.error('Error uploading song:', error);
      Alert.alert('Upload Error', 'Failed to upload song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Upload New Song</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter song title"
            value={title}
            onChangeText={setTitle}
            editable={!isLoading}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter a description for your song"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />

          <Text style={styles.label}>Genre *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Hip Hop, R&B, Pop"
            value={genre}
            onChangeText={setGenre}
            editable={!isLoading}
          />

          {/* Placeholder for file upload UI - replace with actual implementation later */}
          {/* <Text style={styles.label}>Audio File *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => {}}>
            <Text style={styles.uploadButtonText}>
              {audioFileUri ? 'Audio File Selected' : 'Select Audio File'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Cover Art *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => {}}>
            <Text style={styles.uploadButtonText}>
              {coverArtUri ? 'Cover Art Selected' : 'Select Cover Art'}
            </Text>
          </TouchableOpacity> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Upload Song</Text>
              )}
            </TouchableOpacity>
                    <Text style={styles.label}>Mood (Optional, comma-separated)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Energetic, Chill, Romantic"
                        value={mood}
                        onChangeText={setMood}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Visibility *</Text>
                    <Picker
                        selectedValue={visibility}
                        style={styles.picker}
                        onValueChange={(itemValue) => setVisibility(itemValue)}
                    >
                        <Picker.Item label="Public" value="public" />
                        <Picker.Item label="Subscribers Only" value="subscribers" />
                        <Picker.Item label="Private" value="private" />
                    </Picker>
                </View>

          {/* Placeholder for file upload UI - replace with actual implementation later */}
          {/* <Text style={styles.label}>Audio File *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => {}}>
            <Text style={styles.uploadButtonText}>
              {audioFileUri ? 'Audio File Selected' : 'Select Audio File'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Cover Art *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => {}}>
            <Text style={styles.uploadButtonText}>
              {coverArtUri ? 'Cover Art Selected' : 'Select Cover Art'}
            </Text>
          </TouchableOpacity> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Upload Song</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 20,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 15,
        marginBottom: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    picker: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
      },
    uploadButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    uploadButtonText: {
        color: Colors.primary,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        flex: 2,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        flex: 1,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#a0c4ff',
    },
});

export default SongUploadForm;
