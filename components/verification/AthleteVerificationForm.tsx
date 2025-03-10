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
import Colors from '@/constants/Colors';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { shadows } from '../../utils/shadowStyles';
import { Input, Button } from '../themed';

interface AthleteVerificationFormProps {
  onCancel: () => void;
  onComplete: () => void;
}

const AthleteVerificationForm: React.FC<AthleteVerificationFormProps> = ({
  onCancel,
  onComplete
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    sport: '',
    team: '',
    position: '',
    email: '',
    phone: '',
    socialMediaLinks: '',
    idImage: null as string | null,
    proofImage: null as string | null,
    additionalDocuments: [] as string[],
  });

  // Handle form input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Pick image from gallery
  const pickImage = async (field: 'idImage' | 'proofImage') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData(prev => ({ ...prev, [field]: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setFormData(prev => ({
          ...prev,
          additionalDocuments: [...prev.additionalDocuments, result.assets[0].uri],
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Remove document
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalDocuments: prev.additionalDocuments.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to submit verification.');
      return;
    }

    // Validate required fields
    if (!formData.fullName || !formData.sport || !formData.team) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!formData.idImage) {
      Alert.alert('Missing ID', 'Please upload a photo of your ID for verification.');
      return;
    }

    setLoading(true);
    try {
      // Prepare verification data
      const verificationData = {
        userId: user.uid,
        fullName: formData.fullName,
        sport: formData.sport,
        team: formData.team,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        socialMediaLinks: formData.socialMediaLinks,
        idImage: formData.idImage,
        proofImage: formData.proofImage,
        additionalDocuments: formData.additionalDocuments,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Upload documents to storage and get URLs
      const documentBlobs: Blob[] = [];

      // Convert ID photo URI to blob
      if (formData.idImage) {
        const idPhotoResponse = await fetch(formData.idImage);
        const idPhotoBlob = await idPhotoResponse.blob();
        documentBlobs.push(idPhotoBlob);
      }

      // Convert proof image URI to blob
      if (formData.proofImage) {
        const proofImageResponse = await fetch(formData.proofImage);
        const proofImageBlob = await proofImageResponse.blob();
        documentBlobs.push(proofImageBlob);
      }

      // Convert additional documents to blobs
      for (const docUri of formData.additionalDocuments) {
        const docResponse = await fetch(docUri);
        const docBlob = await docResponse.blob();
        documentBlobs.push(docBlob);
      }

      // Submit verification request using the service
      await VerificationService.submitVerificationRequest(
        user.uid,
        verificationData.sport,
        verificationData.team,
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
      setLoading(false);
    }
  };

  // Validate current step
  const validateStep = () => {
    if (step === 1) {
      return formData.fullName && formData.sport && formData.team;
    } else if (step === 2) {
      return formData.email;
    } else if (step === 3) {
      return formData.idImage && formData.proofImage;
    }
    return true;
  };

  // Go to next step
  const nextStep = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    } else {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
    }
  };

  // Go to previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  // Render step 1: Basic Information
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your basic information to begin the verification process.
      </Text>

      <Input
        label="Full Name *"
        value={formData.fullName}
        onChangeText={(text) => handleChange('fullName', text)}
        placeholder="Enter your full name"
        autoCapitalize="words"
      />

      <Input
        label="Sport *"
        value={formData.sport}
        onChangeText={(text) => handleChange('sport', text)}
        placeholder="e.g. Basketball, Football, etc."
      />

      <Input
        label="Team (if applicable)"
        value={formData.team}
        onChangeText={(text) => handleChange('team', text)}
        placeholder="Enter your team name"
      />

      <Input
        label="Position (if applicable)"
        value={formData.position}
        onChangeText={(text) => handleChange('position', text)}
        placeholder="e.g. Point Guard, Quarterback, etc."
      />
    </View>
  );

  // Render step 2: Contact Information
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your contact information for verification purposes.
      </Text>

      <Input
        label="Email Address *"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        placeholder="Enter your email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Phone Number"
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />

      <Input
        label="Social Media Links"
        value={formData.socialMediaLinks}
        onChangeText={(text) => handleChange('socialMediaLinks', text)}
        placeholder="Instagram, Twitter, etc. (one per line)"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  // Render step 3: Verification Documents
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Verification Documents</Text>
      <Text style={styles.stepDescription}>
        Please upload documents to verify your identity and athlete status.
      </Text>

      <Text style={styles.sectionTitle}>ID Verification *</Text>
      <TouchableOpacity
        style={[styles.uploadContainer, formData.idImage && styles.uploadContainerWithImage]}
        onPress={() => pickImage('idImage')}
      >
        {formData.idImage ? (
          <Image source={{ uri: formData.idImage }} style={styles.uploadedImage} />
        ) : (
          <>
            <Ionicons name="id-card-outline" size={40} color={Colors.primary} />
            <Text style={styles.uploadText}>Upload ID (Driver's License, Passport, etc.)</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Proof of Athlete Status *</Text>
      <TouchableOpacity
        style={[styles.uploadContainer, formData.proofImage && styles.uploadContainerWithImage]}
        onPress={() => pickImage('proofImage')}
      >
        {formData.proofImage ? (
          <Image source={{ uri: formData.proofImage }} style={styles.uploadedImage} />
        ) : (
          <>
            <Ionicons name="document-text-outline" size={40} color={Colors.primary} />
            <Text style={styles.uploadText}>Upload proof (Team roster, Sports ID, etc.)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render step 4: Additional Documents
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Documents</Text>
      <Text style={styles.stepDescription}>
        You can upload additional documents to support your verification (optional).
      </Text>

      <TouchableOpacity style={styles.addDocumentButton} onPress={pickDocument}>
        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        <Text style={styles.addDocumentText}>Add Document</Text>
      </TouchableOpacity>

      {formData.additionalDocuments.length > 0 && (
        <View style={styles.documentsList}>
          {formData.additionalDocuments.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <Ionicons name="document-outline" size={24} color={Colors.primary} />
              <Text style={styles.documentName} numberOfLines={1}>
                Document {index + 1}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeDocument(index)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By submitting this form, you confirm that all information provided is accurate and you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );

  // Render the current step
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Athlete Verification</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.neutral600} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              s <= step ? styles.progressStepActive : styles.progressStepInactive,
            ]}
          >
            {s < step ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text style={s === step ? styles.progressTextActive : styles.progressTextInactive}>
                {s}
              </Text>
            )}
          </View>
        ))}
        <View style={styles.progressLine} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step < 4 ? 'Next' : 'Submit'}
          onPress={nextStep}
          loading={loading}
          disabled={loading || !validateStep()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    position: 'relative',
  },
  progressLine: {
    position: 'absolute',
    top: '50%',
    left: 50,
    right: 50,
    height: 2,
    backgroundColor: Colors.light.border,
    zIndex: -1,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressStepInactive: {
    backgroundColor: Colors.light.cardBackgroundLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  progressTextInactive: {
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.light.text,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: Colors.light.text,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: Colors.light.cardBackgroundLight,
    height: 160,
  },
  uploadContainerWithImage: {
    borderStyle: 'solid',
    padding: 0,
    overflow: 'hidden',
  },
  uploadText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.light.cardBackgroundLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  addDocumentText: {
    marginLeft: 8,
    color: Colors.primary,
    fontWeight: '500',
  },
  documentsList: {
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentName: {
    flex: 1,
    marginLeft: 12,
    color: Colors.light.text,
  },
  removeButton: {
    padding: 4,
  },
  termsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.light.cardBackgroundLight,
    borderRadius: 8,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default AthleteVerificationForm;
