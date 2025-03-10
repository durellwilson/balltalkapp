import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import AuthService from '../../services/AuthService';
import VerificationService from '../../services/VerificationService';
import Colors from '@/constants/Colors';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AthleteVerificationForm from '../verification/AthleteVerificationForm';
import { db } from '../../src/lib/firebase';
import { doc, setDoc, Firestore } from 'firebase/firestore';

// Cast db to proper type
const firebaseDb = db as unknown as Firestore;

interface AthleteProfileData {
  sport?: string;
  league?: string;
  team?: string;
  bio?: string;
  isVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

interface AthleteProfileViewProps {
  onRequestVerification?: () => void;
}

const AthleteProfileView = ({ onRequestVerification }: AthleteProfileViewProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<AthleteProfileData>({
    sport: '',
    league: '',
    team: '',
    bio: '',
    isVerified: false,
    verificationStatus: 'none'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // Form state for editing
  const [sport, setSport] = useState('');
  const [league, setLeague] = useState('');
  const [team, setTeam] = useState('');
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
      
      // Get verification status
      const verificationStatus = await VerificationService.getUserVerificationStatus(currentUser.uid);
      
      if (userDoc) {
        const data: AthleteProfileData = {
          sport: userDoc.sport || '',
          league: userDoc.league || '',
          team: userDoc.team || '',
          bio: userDoc.bio || '',
          isVerified: verificationStatus.isVerified || false,
          verificationStatus: verificationStatus.status || 'none'
        };
        
        setProfileData(data);
        
        // Initialize form fields
        setSport(data.sport || '');
        setLeague(data.league || '');
        setTeam(data.team || '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading athlete profile data:', error);
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
        sport?: string;
        league?: string;
        team?: string;
        bio?: string;
      } = {};

      if (sport) updatedData.sport = sport;
      if (league) updatedData.league = league;
      if (team) updatedData.team = team;
      if (bio) updatedData.bio = bio;

      // Update profile in Firestore
      await setDoc(doc(firebaseDb, 'profiles', user.uid), {
        ...updatedData,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setProfileData({
        ...profileData,
        ...updatedData
      });

      // Exit edit mode
      setIsEditing(false);

      Alert.alert('Success', 'Your athlete profile has been updated.');
    } catch (error) {
      console.error('Error saving athlete profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerificationForm(false);
    loadProfileData(); // Refresh profile data to show updated verification status
    Alert.alert(
      'Verification Submitted',
      'Your verification request has been submitted and is pending review. We will notify you once it has been processed.'
    );
  };

  const renderVerificationStatus = () => {
    if (!profileData.verificationStatus || profileData.verificationStatus === 'none') {
      return (
        <TouchableOpacity 
          style={styles.verificationButton}
          onPress={() => {
            if (onRequestVerification) {
              onRequestVerification();
            } else {
              setShowVerificationForm(true);
            }
          }}
        >
          <MaterialIcons name="verified" size={20} color="white" />
          <Text style={styles.verificationButtonText}>Verify Athlete Status</Text>
        </TouchableOpacity>
      );
    } else if (profileData.verificationStatus === 'pending') {
      return (
        <View style={styles.verificationStatusContainer}>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusBadgeText}>Verification Pending</Text>
          </View>
          <Text style={styles.verificationStatusText}>
            Your verification request is being reviewed. This process typically takes 1-3 business days.
          </Text>
        </View>
      );
    } else if (profileData.verificationStatus === 'approved') {
      return (
        <View style={styles.verificationStatusContainer}>
          <View style={[styles.statusBadge, styles.approvedBadge]}>
            <MaterialIcons name="verified" size={16} color="white" style={{marginRight: 4}} />
            <Text style={styles.statusBadgeText}>Verified Athlete</Text>
          </View>
          <Text style={styles.verificationStatusText}>
            Your athlete status has been verified. You now have access to all athlete features.
          </Text>
        </View>
      );
    } else if (profileData.verificationStatus === 'rejected') {
      return (
        <View style={styles.verificationStatusContainer}>
          <View style={[styles.statusBadge, styles.rejectedBadge]}>
            <Text style={styles.statusBadgeText}>Verification Rejected</Text>
          </View>
          <Text style={styles.verificationStatusText}>
            Your verification request was not approved. Please contact support for more information.
          </Text>
          <TouchableOpacity 
            style={[styles.verificationButton, {marginTop: 12}]}
            onPress={() => {
              if (onRequestVerification) {
                onRequestVerification();
              } else {
                setShowVerificationForm(true);
              }
            }}
          >
            <Text style={styles.verificationButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };

  const renderEditMode = () => {
    return (
      <View style={styles.editContainer}>
        <Text style={styles.label}>About Me</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell fans about yourself, your career, and your interests..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <Text style={styles.label}>Sport</Text>
        <TextInput
          style={styles.input}
          value={sport}
          onChangeText={setSport}
          placeholder="e.g. Basketball, Football, Tennis"
        />

        <Text style={styles.label}>League</Text>
        <TextInput
          style={styles.input}
          value={league}
          onChangeText={setLeague}
          placeholder="e.g. NBA, NFL, WTA"
        />

        <Text style={styles.label}>Team</Text>
        <TextInput
          style={styles.input}
          value={team}
          onChangeText={setTeam}
          placeholder="e.g. Lakers, Chiefs, etc."
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              // Reset form fields to current data
              setSport(profileData.sport || '');
              setLeague(profileData.league || '');
              setTeam(profileData.team || '');
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
          <Text style={styles.sectionTitle}>Athletic Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sport:</Text>
            <Text style={styles.infoValue}>{profileData.sport || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>League:</Text>
            <Text style={styles.infoValue}>{profileData.league || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Team:</Text>
            <Text style={styles.infoValue}>{profileData.team || 'Not specified'}</Text>
          </View>
        </View>

        {renderVerificationStatus()}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <AntDesign name="edit" size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Athlete Profile</Text>
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
        <Text style={styles.title}>Athlete Profile</Text>
        <Text style={styles.subtitle}>Manage your professional athletic profile</Text>
      </View>

      {isEditing ? renderEditMode() : renderViewMode()}

      <Modal
        visible={showVerificationForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVerificationForm(false)}
      >
        <View style={styles.modalContainer}>
          <AthleteVerificationForm 
            onCancel={() => setShowVerificationForm(false)}
            onComplete={handleVerificationComplete}
          />
        </View>
      </Modal>
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
    paddingBottom: 40,
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontWeight: '500',
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  verificationButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  verificationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  verificationStatusContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
  },
  approvedBadge: {
    backgroundColor: '#2ecc71',
  },
  rejectedBadge: {
    backgroundColor: '#e74c3c',
  },
  statusBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verificationStatusText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
});

export default AthleteProfileView;
