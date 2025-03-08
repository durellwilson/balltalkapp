import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Waveform from '../components/audio/Waveform';

export default function SaveProcessedAudioScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get params from route
  const audioUri = route.params?.audioUri;
  const settings = route.params?.settings;
  const presetId = route.params?.presetId;
  
  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your track.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save the processed audio to the server
      // along with metadata and processing settings
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Your processed audio has been saved successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving processed audio:', error);
      Alert.alert('Error', 'Failed to save processed audio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!audioUri) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#f44336" />
        <Text style={styles.errorText}>No audio file to save</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Save Processed Audio</Text>
      
      {/* Audio Preview */}
      <View style={styles.audioPreview}>
        <Waveform 
          audioUri={audioUri} 
          height={100}
        />
      </View>
      
      {/* Form */}
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title for your track"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Genre</Text>
          <TextInput
            style={styles.input}
            value={genre}
            onChangeText={setGenre}
            placeholder="Enter a genre (e.g., Hip Hop, R&B)"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter a description for your track"
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isPublic && styles.activeVisibilityOption
              ]}
              onPress={() => setIsPublic(true)}
            >
              <MaterialIcons 
                name="public" 
                size={24} 
                color={isPublic ? "#2196F3" : "#666666"} 
              />
              <Text style={[
                styles.visibilityText,
                isPublic && styles.activeVisibilityText
              ]}>
                Public
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                !isPublic && styles.activeVisibilityOption
              ]}
              onPress={() => setIsPublic(false)}
            >
              <MaterialIcons 
                name="lock" 
                size={24} 
                color={!isPublic ? "#2196F3" : "#666666"} 
              />
              <Text style={[
                styles.visibilityText,
                !isPublic && styles.activeVisibilityText
              ]}>
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <MaterialIcons name="cloud-upload" size={24} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save & Upload</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  audioPreview: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  visibilityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginRight: 8,
  },
  activeVisibilityOption: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  visibilityText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666666',
  },
  activeVisibilityText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    color: '#666666',
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 