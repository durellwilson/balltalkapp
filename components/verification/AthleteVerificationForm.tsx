import React, { useState } from 'react';
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
  Platform,
  Modal
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import VerificationService from '../../services/VerificationService';
import Colors from '../../constants/Colors';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { shadows } from '../../utils/shadowStyles';

interface AthleteVerificationFormProps {
  onCancel: () => void;
  onComplete: () => void;
}

const AthleteVerificationForm: React.FC<AthleteVerificationFormProps> = ({
  onCancel,
  onComplete
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [sport, setSport] = useState('');
  const [league, setLeague] = useState('');
  const [team, setTeam] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSportModalVisible, setIsSportModalVisible] = useState(false);
  const [isLeagueModalVisible, setIsLeagueModalVisible] = useState(false);
    const [teamRosterUri, setTeamRosterUri] = useState<string | null>(null);
    const [teamRosterName, setTeamRosterName] = useState<string | null>(null);
    const [leagueAffiliationUri, setLeagueAffiliationUri] = useState<string | null>(null);
    const [leagueAffiliationName, setLeagueAffiliationName] = useState<string | null>(null);

  const sports = ['Basketball', 'Football', 'Baseball', 'Soccer', 'Tennis', 'Golf'];
  const leagues = ['NBA', 'NFL', 'MLB', 'MLS', 'ATP', 'PGA'];

  // Handle image picking for profile photo
  const pickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle image picking for ID photo
  const pickIdImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIdPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking ID image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle document picking
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setDocumentUri(result.assets[0].uri);
        setDocumentName(result.assets[0].name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

    const pickTeamRoster = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                setTeamRosterUri(result.assets[0].uri);
                setTeamRosterName(result.assets[0].name);
            }
        } catch (error) {
            console.error('Error picking team roster document:', error);
            Alert.alert('Error', 'Failed to select document. Please try again.');
        }
    };

    const pickLeagueAffiliation = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                setLeagueAffiliationUri(result.assets[0].uri);
                setLeagueAffiliationName(result.assets[0].name);
            }
        } catch (error) {
            console.error('Error picking league affiliation document:', error);
            Alert.alert('Error', 'Failed to select document. Please try again.');
        }
    };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to submit verification.');
      return;
    }

    // Validate required fields
    if (!fullName || !sport || !league || !team) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!profilePhotoUri) {
      Alert.alert('Missing Photo', 'Please upload a profile photo for verification.');
      return;
    }

    if (!idPhotoUri) {
      Alert.alert('Missing ID', 'Please upload a photo of your ID for verification.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare verification data
      const verificationData = {
        userId: user.uid,
        fullName,
        sport,
        league,
        team,
        profilePhotoUri,
        idPhotoUri,
        documentUri,
        documentName,
        additionalInfo,
            teamRosterUri,
            teamRosterName,
            leagueAffiliationUri,
            leagueAffiliationName,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };


      // Upload documents to storage and get URLs
      const documentBlobs: Blob[] = [];

      // Convert profile photo URI to blob
      if (profilePhotoUri) {
        const profilePhotoResponse = await fetch(profilePhotoUri);
        const profilePhotoBlob = await profilePhotoResponse.blob();
        documentBlobs.push(profilePhotoBlob);
      }

      // Convert ID photo URI to blob
      if (idPhotoUri) {
        const idPhotoResponse = await fetch(idPhotoUri);
        const idPhotoBlob = await idPhotoResponse.blob();
        documentBlobs.push(idPhotoBlob);
      }

      // Convert document URI to blob if exists
      // Convert document URI to blob if exists
      if (documentUri) {
        const documentResponse = await fetch(documentUri);
        const documentBlob = await documentResponse.blob();
        documentBlobs.push(documentBlob);
      }
        if (teamRosterUri) {
            const teamRosterResponse = await fetch(teamRosterUri);
            const teamRosterBlob = await teamRosterResponse.blob();
            documentBlobs.push(teamRosterBlob);
        }

        if (leagueAffiliationUri) {
            const leagueAffiliationResponse = await fetch(leagueAffiliationUri);
            const leagueAffiliationBlob = await leagueAffiliationResponse.blob();
            documentBlobs.push(leagueAffiliationBlob);
        }

      // Submit verification request using the service
      await VerificationService.submitVerificationRequest(
        user.uid,
        league, // League affiliation
        team,   // Team affiliation
        documentBlobs
      );
      
      // Update verification status
      await VerificationService.updateVerificationStatus(user.uid, 'pending');
      
      // Call the onComplete callback
      onComplete();
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Submission Error', 'Failed to submit verification. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Athlete Verification</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Complete this form to verify your athlete status. This information will be reviewed by our team.
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Full Legal Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full legal name"
            editable={!isLoading}
          />

          <Text style={styles.label}>Sport *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setIsSportModalVisible(true)}
            disabled={isLoading}
          >
            <Text style={sport ? styles.inputText : styles.placeholderText}>
              {sport || 'Select Sport'}
            </Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={isSportModalVisible}
            onRequestClose={() => setIsSportModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ScrollView>
                  {sports.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.modalItem}
                      onPress={() => {
                        setSport(s);
                        setIsSportModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsSportModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>League/Association *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setIsLeagueModalVisible(true)}
            disabled={isLoading}
          >
            <Text style={league ? styles.inputText : styles.placeholderText}>
              {league || 'Select League/Association'}
            </Text>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={isLeagueModalVisible}
            onRequestClose={() => setIsLeagueModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ScrollView>
                  {leagues.map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={styles.modalItem}
                      onPress={() => {
                        setLeague(l);
                        setIsLeagueModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsLeagueModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Team/Club *</Text>
          <TextInput
            style={styles.input}
            value={team}
            onChangeText={setTeam}
            placeholder="e.g. Lakers, Chiefs, etc."
            editable={!isLoading}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Verification Documents</Text>

          <Text style={styles.label}>Profile Photo *</Text>
          <Text style={styles.helperText}>
            Please upload a clear, recent photo of yourself that will be used for your verified profile.
          </Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickProfileImage}
            disabled={isLoading}
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.previewImage} />
            ) : (
              <>
                <AntDesign name="camerao" size={24} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Profile Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>ID Photo *</Text>
          <Text style={styles.helperText}>
            Please upload a photo of your official ID (driver's license, passport, etc.). This will not be publicly visible.
          </Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickIdImage}
            disabled={isLoading}
          >
            {idPhotoUri ? (
              <View style={styles.documentPreview}>
                <Image source={{ uri: idPhotoUri }} style={styles.previewImage} />
                <Text style={styles.documentPreviewText}>ID Photo Uploaded</Text>
              </View>
            ) : (
              <>
                <AntDesign name="idcard" size={24} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Upload ID Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Supporting Document (Optional)</Text>
          <Text style={styles.helperText}>
            Upload any additional document that proves your athlete status (contract, team roster, etc.).
          </Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickDocument}
            disabled={isLoading}
          >
            {documentUri ? (
              <View style={styles.documentPreview}>
                <AntDesign name="file1" size={24} color={Colors.primary} />
                <Text style={styles.documentPreviewText}>{documentName || 'Document Uploaded'}</Text>
              </View>
            ) : (
              <>
                <AntDesign name="file1" size={24} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Supporting Document</Text>
              </>
            )}
          </TouchableOpacity>

                    <Text style={styles.label}>Team Roster Document (Optional)</Text>
                    <Text style={styles.helperText}>
                        Upload a copy of your team's official roster.
                    </Text>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickTeamRoster}
                        disabled={isLoading}
                    >
                        {teamRosterUri ? (
                            <View style={styles.documentPreview}>
                                <AntDesign name="file1" size={24} color={Colors.primary} />
                                <Text style={styles.documentPreviewText}>{teamRosterName || 'Document Uploaded'}</Text>
                            </View>
                        ) : (
                            <>
                                <AntDesign name="file1" size={24} color={Colors.primary} />
                                <Text style={styles.uploadButtonText}>Upload Team Roster</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.label}>League Affiliation Proof (Optional)</Text>
                    <Text style={styles.helperText}>
                        Upload a document that proves your affiliation with the league (e.g., a letter from the league).
                    </Text>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickLeagueAffiliation}
                        disabled={isLoading}
                    >
                        {leagueAffiliationUri ? (
                            <View style={styles.documentPreview}>
                                <AntDesign name="file1" size={24} color={Colors.primary} />
                                <Text style={styles.documentPreviewText}>{leagueAffiliationName || 'Document Uploaded'}</Text>
                            </View>
                        ) : (
                            <>
                                <AntDesign name="file1" size={24} color={Colors.primary} />
                                <Text style={styles.uploadButtonText}>Upload League Affiliation Proof</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Additional Information (Optional)</Text>
          <Text style={styles.helperText}>
            Provide any additional information that might help us verify your athlete status.
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder="Enter any additional information here..."
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>

        <View style={styles.privacyNote}>
          <MaterialIcons name="privacy-tip" size={20} color="#666" style={styles.privacyIcon} />
          <Text style={styles.privacyText}>
            Your ID and verification documents will only be used for verification purposes and will not be publicly visible or shared with third parties.
          </Text>
        </View>

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
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 40,
    ...shadows.medium,
    maxHeight: '90%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
    inputText: {
        color: '#333', // Change to your desired text color
        fontSize: 16,
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
    },
    label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 120,
  },
  uploadButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  documentPreview: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentPreviewText: {
    marginTop: 8,
    color: '#333',
    fontWeight: '500',
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  privacyIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

export default AthleteVerificationForm;
