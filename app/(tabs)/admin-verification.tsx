import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Text, Badge, ActionButton, Card } from '../../components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { router } from 'expo-router';
import VerificationService from '../../services/VerificationService';
import { AthleteVerification } from '../../models/User';

export default function AdminVerificationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingVerifications, setPendingVerifications] = useState<
    (AthleteVerification & { id: string })[]
  >([]);
  const [selectedVerification, setSelectedVerification] = useState<
    (AthleteVerification & { id: string }) | null
  >(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  // Admin check - for demonstration, allow all users, but in production would check admin role
  useEffect(() => {
    // In a real app, you would check for admin role:
    // if (user && user.role !== 'admin') {
    //   Alert.alert(
    //     'Access Denied',
    //     'You need admin privileges to access this page.',
    //     [{ text: 'OK', onPress: () => router.back() }]
    //   );
    // }
  }, [user]);

  // Load pending verification requests
  useEffect(() => {
    const loadVerificationRequests = async () => {
      setLoading(true);
      try {
        const requests = await VerificationService.getPendingVerificationRequests();
        // Ensure all items have id property as non-optional
        const requestsWithIds = requests.map(req => ({
          ...req,
          id: req.id || 'unknown-id' // Fallback if id is undefined
        }));
        setPendingVerifications(requestsWithIds);
      } catch (error) {
        console.error('Error loading verification requests:', error);
        Alert.alert('Error', 'Failed to load verification requests');
      } finally {
        setLoading(false);
      }
    };

    loadVerificationRequests();
  }, []);

  // Handle approve request
  const handleApprove = async (verification: AthleteVerification & { id: string }) => {
    if (!user) return;
    
    setProcessingAction(true);
    try {
      const success = await VerificationService.approveVerificationRequest(
        verification.id,
        user.uid,
        'Approved by admin'
      );
      
      if (success) {
        Alert.alert('Success', 'Verification request approved successfully');
        // Remove from list
        setPendingVerifications(prev => 
          prev.filter(v => v.id !== verification.id)
        );
        setSelectedVerification(null);
      } else {
        Alert.alert('Error', 'Failed to approve verification request');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      Alert.alert('Error', 'Failed to approve verification request');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle reject request
  const handleReject = async (verification: AthleteVerification & { id: string }) => {
    if (!user) return;
    
    setProcessingAction(true);
    try {
      const success = await VerificationService.rejectVerificationRequest(
        verification.id,
        user.uid,
        rejectionNote || 'Rejected by admin'
      );
      
      if (success) {
        Alert.alert('Success', 'Verification request rejected');
        // Remove from list
        setPendingVerifications(prev => 
          prev.filter(v => v.id !== verification.id)
        );
        setSelectedVerification(null);
        setRejectionNote('');
      } else {
        Alert.alert('Error', 'Failed to reject verification request');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      Alert.alert('Error', 'Failed to reject verification request');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin - Verification Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading verification requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin - Verification Requests</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {pendingVerifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No pending verification requests</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Pending Requests ({pendingVerifications.length})
            </Text>
            
            {pendingVerifications.map((verification) => (
              <Card key={verification.id} style={styles.verificationCard}>
                <TouchableOpacity 
                  style={styles.verificationCardContent}
                  onPress={() => setSelectedVerification(verification)}
                >
                  <View style={styles.verificationHeader}>
                    <View>
                      <Text style={styles.verificationTitle}>
                        Athlete Verification Request
                      </Text>
                      <Text style={styles.verificationSubtitle}>
                        {verification.leagueAffiliation} - {verification.teamAffiliation}
                      </Text>
                    </View>
                    <Badge content="Pending" variant="warning" standalone />
                  </View>
                  
                  <View style={styles.verificationMeta}>
                    <Text style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Submitted: </Text>
                      {new Date(verification.submittedAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.metaItem}>
                      <Text style={styles.metaLabel}>User ID: </Text>
                      {verification.userId.substring(0, 8)}...
                    </Text>
                    <Text style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Documents: </Text>
                      {verification.documentUrls.length}
                    </Text>
                  </View>
                  
                  <View style={styles.verificationActions}>
                    <ActionButton
                      style={styles.viewButton}
                      onPress={() => setSelectedVerification(verification)}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </ActionButton>
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
      
      {/* Detailed view modal */}
      {selectedVerification && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Verification Request Details</Text>
              <ActionButton
                style={styles.closeButton}
                onPress={() => setSelectedVerification(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </ActionButton>
            </View>
            
            <ScrollView style={styles.detailContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Athlete Information</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>User ID:</Text>
                  <Text style={styles.detailValue}>{selectedVerification.userId}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>League:</Text>
                  <Text style={styles.detailValue}>{selectedVerification.leagueAffiliation}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Team:</Text>
                  <Text style={styles.detailValue}>{selectedVerification.teamAffiliation}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedVerification.submittedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Verification Documents</Text>
                {selectedVerification.documentUrls.map((url, index) => (
                  <View key={index} style={styles.documentContainer}>
                    <Text style={styles.documentTitle}>Document {index + 1}</Text>
                    <Image
                      source={{ uri: url }}
                      style={styles.documentImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </View>
              
              <View style={styles.detailActions}>
                <ActionButton
                  style={styles.rejectButton}
                  onPress={() => handleReject(selectedVerification)}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.actionButtonText}>Reject</Text>
                  )}
                </ActionButton>
                <ActionButton
                  style={styles.approveButton}
                  onPress={() => handleApprove(selectedVerification)}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.actionButtonText}>Approve</Text>
                  )}
                </ActionButton>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  verificationCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  verificationCardContent: {
    padding: 15,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  verificationMeta: {
    marginBottom: 15,
  },
  metaItem: {
    fontSize: 14,
    marginBottom: 3,
  },
  metaLabel: {
    fontWeight: '500',
    color: '#555',
  },
  verificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  viewButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  detailTitle: {
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
  detailContent: {
    padding: 15,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontWeight: '500',
    color: '#555',
  },
  detailValue: {
    flex: 1,
  },
  documentContainer: {
    marginBottom: 15,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  documentImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  rejectButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#FF3B30',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
