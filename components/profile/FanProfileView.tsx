import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import AuthService from '../../services/AuthService';
import Colors from '../../constants/Colors';
import { AntDesign } from '@expo/vector-icons';

interface FanProfileData {
  favoriteTeams: string[];
  favoriteAthletes: string[];
  bio?: string;
}

const FanProfileView = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<FanProfileData>({
    favoriteTeams: [],
    favoriteAthletes: [],
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Form state for editing
  const [favoriteTeams, setFavoriteTeams] = useState('');
  const [favoriteAthletes, setFavoriteAthletes] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    loadProfileData();
  }, [user?.uid]);

  const loadProfileData = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      // Fetch the user document from Firestore
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User data not found');
      }

      // Get the complete user document from Firestore
      const userDoc = await AuthService.getUserDocument(currentUser.uid);
      
      if (userDoc) {
        const data: FanProfileData = {
          favoriteTeams: userDoc.favoriteTeams || [],
          favoriteAthletes: userDoc.favoriteAthletes || [],
          bio: userDoc.bio || ''
        };
        
        setProfileData(data);
        
        // Initialize form fields
        setFavoriteTeams(data.favoriteTeams.join(', '));
        setFavoriteAthletes(data.favoriteAthletes.join(', '));
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading fan profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const updatedData: {
        favoriteTeams?: string[];
        favoriteAthletes?: string[];
        bio?: string;
      } = {};

      // Process teams
      if (favoriteTeams) {
        updatedData.favoriteTeams = favoriteTeams
          .split(',')
          .map(team => team.trim())
          .filter(team => team.length > 0);
      } else {
        updatedData.favoriteTeams = [];
      }

      // Process athletes
      if (favoriteAthletes) {
        updatedData.favoriteAthletes = favoriteAthletes
          .split(',')
          .map(athlete => athlete.trim())
          .filter(athlete => athlete.length > 0);
      } else {
        updatedData.favoriteAthletes = [];
      }

      // Add bio if provided
      if (bio) {
        updatedData.bio = bio;
      }

      // Update profile in Firestore
      await AuthService.updateFanProfile(user.uid, updatedData);

      // Update local state
      setProfileData({
        favoriteTeams: updatedData.favoriteTeams || [],
        favoriteAthletes: updatedData.favoriteAthletes || [],
        bio: updatedData.bio || ''
      });

      // Exit edit mode
      setIsEditing(false);

      Alert.alert('Success', 'Your fan profile has been updated.');
    } catch (error) {
      console.error('Error saving fan profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditMode = () => {
    return (
      <View style={styles.editContainer}>
        <Text style={styles.label}>About Me</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          multiline
          numberOfLines={4}
          maxLength={200}
        />

        <Text style={styles.label}>Favorite Teams (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={favoriteTeams}
          onChangeText={setFavoriteTeams}
          placeholder="e.g. Lakers, Warriors, Heat"
        />

        <Text style={styles.label}>Favorite Athletes (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={favoriteAthletes}
          onChangeText={setFavoriteAthletes}
          placeholder="e.g. LeBron James, Stephen Curry"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              // Reset form fields to current data
              setFavoriteTeams(profileData.favoriteTeams.join(', '));
              setFavoriteAthletes(profileData.favoriteAthletes.join(', '));
              setBio(profileData.bio || '');
              setIsEditing(false);
            }}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderViewMode = () => {
    return (
      <View style={styles.profileContainer}>
        {profileData.bio ? (
          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bioText}>{profileData.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Teams</Text>
          {profileData.favoriteTeams && profileData.favoriteTeams.length > 0 ? (
            <View style={styles.tagsContainer}>
              {profileData.favoriteTeams.map((team, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{team}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No favorite teams added yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Athletes</Text>
          {profileData.favoriteAthletes && profileData.favoriteAthletes.length > 0 ? (
            <View style={styles.tagsContainer}>
              {profileData.favoriteAthletes.map((athlete, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{athlete}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No favorite athletes added yet</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <AntDesign name="edit" size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Fan Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Fan Profile</Text>
        <Text style={styles.subtitle}>Manage your favorite teams and athletes</Text>
      </View>

      {isEditing ? renderEditMode() : renderViewMode()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bioSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e6f2ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  editContainer: {
    backgroundColor: 'white',
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bioInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButtonText: {
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

export default FanProfileView;
