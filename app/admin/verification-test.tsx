import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { Text, Badge, ActionButton } from '@/components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AthleteVerificationForm from '../../components/verification/AthleteVerificationForm';
import VerificationService from '../../services/VerificationService';
import { useAuth } from '../../contexts/auth';
import { router } from 'expo-router';

export default function VerificationTestScreen() {
  const { user } = useAuth();
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'in_review' | 'needs_more_info'>('none');
  const [isVerified, setIsVerified] = useState(false);
  
  // Get user verification status
  useEffect(() => {
    if (user) {
      const fetchVerificationStatus = async () => {
        try {
          const status = await VerificationService.getUserVerificationStatus(user.uid);
          setVerificationStatus(status.status);
          setIsVerified(status.isVerified);
          console.log('Verification status:', status);
        } catch (error) {
          console.error('Error fetching verification status:', error);
          Alert.alert('Error', 'Failed to fetch verification status');
        }
      };
      
      fetchVerificationStatus();
    }
  }, [user]);
  
  const openVerificationModal = () => {
    setVerificationModalVisible(true);
  };
  
  const closeVerificationModal = () => {
    setVerificationModalVisible(false);
  };
  
  const handleVerificationComplete = () => {
    closeVerificationModal();
    setVerificationStatus('pending');
    Alert.alert('Success', 'Verification request submitted successfully');
  };
  
  const getStatusColor = () => {
    switch(verificationStatus) {
      case 'approved': return '#34C759'; // Green
      case 'pending': return '#FF9500';  // Orange
      case 'rejected': return '#FF3B30'; // Red
      default: return '#777777';         // Gray
    }
  };
  
  const getStatusText = () => {
    switch(verificationStatus) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Not Verified';
    }
  };
  
  const renderRoleInfo = () => {
    if (!user) {
      return <Text style={styles.infoText}>User not logged in</Text>;
    }
    
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{user.role || 'Not set'}</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification Test</Text>
        <ActionButton
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/admin-verification')}
        >
          <Ionicons name="shield" size={22} color="#666" />
        </ActionButton>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>User Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{user?.uid || 'Not logged in'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.displayName || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'Not set'}</Text>
          </View>
          
          {renderRoleInfo()}
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Verification Status</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
          
          {isVerified && (
            <View style={styles.verifiedBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.verifiedText}>Account Verified</Text>
            </View>
          )}
          
          <View style={styles.actionContainer}>
            <ActionButton 
              style={styles.actionButton}
              onPress={openVerificationModal}
              disabled={verificationStatus === 'pending'}
            >
              <Text style={styles.actionButtonText}>
                {verificationStatus === 'none' && 'Start Verification Process'}
                {verificationStatus === 'pending' && 'Verification In Progress'}
                {verificationStatus === 'rejected' && 'Try Again'}
                {verificationStatus === 'approved' && 'View Verification Details'}
              </Text>
            </ActionButton>
            
            {verificationStatus !== 'none' && (
              <ActionButton 
                style={[styles.resetButton]}
                onPress={async () => {
                  if (user) {
                    try {
                      // Update user's verification status in Firestore
                      await VerificationService.resetVerificationStatus(user.uid, 'none');
                      setVerificationStatus('none');
                      setIsVerified(false);
                      Alert.alert('Reset', 'Verification status has been reset for testing purposes');
                    } catch (error) {
                      console.error('Error resetting verification status:', error);
                      Alert.alert('Error', 'Failed to reset verification status');
                    }
                  }
                }}
              >
                <Text style={styles.resetButtonText}>Reset Status (Testing)</Text>
              </ActionButton>
            )}
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Testing Instructions</Text>
          <Text style={styles.instructionText}>
            1. Click "Start Verification Process" to open the form{"\n"}
            2. Complete the multi-step verification process{"\n"}
            3. Submit the form to test the verification flow{"\n"}
            4. Use the "Reset Status" button to test different states
          </Text>
        </View>
      </ScrollView>
      
      {/* Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeVerificationModal}
      >
        <View style={styles.modalContainer}>
          {verificationStatus === 'pending' ? (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verification Status</Text>
                <ActionButton style={styles.closeButton} onPress={closeVerificationModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </ActionButton>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.verificationIconContainer}>
                  <Ionicons name="time-outline" size={60} color="#FF9500" />
                </View>
                
                <Text style={styles.verificationTitle}>Verification In Progress</Text>
                <Text style={styles.verificationDescription}>
                  Your verification request is currently being reviewed by our team. This process typically
                  takes 1-3 business days. You'll be notified when the review is complete.
                </Text>
              </View>
            </View>
          ) : verificationStatus === 'rejected' ? (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verification Status</Text>
                <ActionButton style={styles.closeButton} onPress={closeVerificationModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </ActionButton>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.verificationIconContainer}>
                  <Ionicons name="alert-circle" size={60} color="#FF3B30" />
                </View>
                
                <Text style={styles.verificationTitle}>Verification Rejected</Text>
                <Text style={styles.verificationDescription}>
                  Unfortunately, your verification request was not approved. This could be due to insufficient
                  documentation or information. You can submit a new request with additional information.
                </Text>
                
                <ActionButton 
                  style={styles.startVerificationButton}
                  onPress={async () => {
                    if (user) {
                      try {
                        // Update user's verification status in Firestore
                        await VerificationService.resetVerificationStatus(user.uid, 'none');
                        setVerificationStatus('none');
                        setIsVerified(false);
                        closeVerificationModal();
                        setTimeout(() => {
                          openVerificationModal();
                        }, 500);
                      } catch (error) {
                        console.error('Error resetting verification status:', error);
                        Alert.alert('Error', 'Failed to reset verification status');
                      }
                    }
                  }}
                >
                  <Text style={styles.startVerificationText}>Try Again</Text>
                </ActionButton>
              </View>
            </View>
          ) : verificationStatus === 'approved' ? (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verification Status</Text>
                <ActionButton style={styles.closeButton} onPress={closeVerificationModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </ActionButton>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.verificationIconContainer}>
                  <Ionicons name="checkmark-circle" size={60} color="#34C759" />
                </View>
                
                <Text style={styles.verificationTitle}>Verification Approved</Text>
                <Text style={styles.verificationDescription}>
                  Your account has been verified. Your profile now displays a verification badge,
                  helping fans recognize your official account.
                </Text>
              </View>
            </View>
          ) : (
            <AthleteVerificationForm
              onCancel={closeVerificationModal}
              onComplete={handleVerificationComplete}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    width: 80,
    color: '#555',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  infoText: {
    color: '#666',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4f7df',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  verifiedText: {
    color: '#34C759',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionContainer: {
    marginTop: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionText: {
    lineHeight: 24,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  modalBody: {
    padding: 20,
  },
  verificationIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  verificationDescription: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  startVerificationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  startVerificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
