import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useAppTheme } from '../../components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessageService from '../../services/MessageService';
import UserService from '../../services/UserService';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type GroupType = 'athlete-only' | 'fan-group';
type SubscriptionPeriod = 'weekly' | 'monthly' | 'yearly';

const CreatePremiumGroupScreen = () => {
  const params = useLocalSearchParams<{ type: GroupType }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  // Determine group type from params or default to fan-group
  const groupType: GroupType = params.type === 'athlete-only' ? 'athlete-only' : 'fan-group';
  
  // Group details
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [groupRules, setGroupRules] = useState<string[]>([
    'Be respectful to all members',
    'No hate speech or harassment',
    'Content shared here is private'
  ]);
  
  // Athlete group specific options
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  
  // Fan group specific options
  const [isMonetized, setIsMonetized] = useState(true);
  const [price, setPrice] = useState('4.99');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<SubscriptionPeriod>('monthly');
  const [maxParticipants, setMaxParticipants] = useState('1000');
  
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is allowed to create this type of group
  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a group chat');
      router.back();
      return;
    }
    
    if (user.role !== 'athlete') {
      Alert.alert('Access Denied', 'Only verified athletes can create premium group chats');
      router.back();
    }
  }, [user]);
  
  // Create the group
  const createGroup = async () => {
    if (!user) return;
    
    // Validate fields
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    if (!groupDescription.trim()) {
      setError('Please enter a group description');
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      const messageService = new MessageService();
      
      // Upload group icon if selected
      let uploadedIconUrl: string | undefined;
      if (groupIcon) {
        uploadedIconUrl = await uploadGroupIcon(groupIcon);
      }
      
      // Create the group based on type
      if (groupType === 'athlete-only') {
        const result = await messageService.createAthleteOnlyGroupChat(
          user.uid,
          [], // No initial participants other than creator
          groupName,
          groupDescription,
          uploadedIconUrl
        );
        
        if (result) {
          Alert.alert('Success', 'Athlete-only group chat created successfully');
          router.push(`/chat/${result.id}`);
        } else {
          setError('Failed to create group chat');
        }
      } else {
        // Create fan group
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
          setError('Please enter a valid price');
          setCreating(false);
          return;
        }
        
        const maxMembers = parseInt(maxParticipants);
        if (isNaN(maxMembers) || maxMembers <= 0) {
          setError('Please enter a valid maximum number of participants');
          setCreating(false);
          return;
        }
        
        const result = await messageService.createMonetizedFanGroup(
          user.uid,
          groupName,
          groupDescription,
          numericPrice,
          subscriptionPeriod,
          uploadedIconUrl,
          groupRules,
          maxMembers
        );
        
        if (result) {
          Alert.alert('Success', 'Premium fan group created successfully');
          router.push(`/chat/${result.id}`);
        } else {
          setError('Failed to create fan group');
        }
      }
    } catch (err) {
      console.error('[CreatePremiumGroupScreen] Error creating group:', err);
      setError('An error occurred while creating the group');
    } finally {
      setCreating(false);
    }
  };
  
  // Upload group icon to storage
  const uploadGroupIcon = async (imageUri: string): Promise<string | undefined> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `group_icons/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('[CreatePremiumGroupScreen] Error uploading group icon:', error);
      return undefined;
    }
  };
  
  // Pick an image for the group icon
  const pickGroupIcon = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'We need access to your photos to select a group icon.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupIcon(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[CreatePremiumGroupScreen] Error picking image:', err);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Add a rule to the list
  const addRule = (rule: string) => {
    if (rule.trim() && !groupRules.includes(rule.trim())) {
      setGroupRules([...groupRules, rule.trim()]);
    }
  };
  
  // Remove a rule from the list
  const removeRule = (index: number) => {
    setGroupRules(groupRules.filter((_, i) => i !== index));
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            backgroundColor: theme.cardBackground, 
            paddingTop: insets.top 
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {groupType === 'athlete-only' ? 'New Athlete-Only Group' : 'New Premium Fan Group'}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              { opacity: creating ? 0.5 : 1 }
            ]}
            onPress={createGroup}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <Text style={[styles.createButtonText, { color: theme.tint }]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Group Icon */}
          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={pickGroupIcon}>
              {groupIcon ? (
                <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
              ) : (
                <View style={[styles.placeholderIcon, { backgroundColor: theme.tint + '20' }]}>
                  <Ionicons name="image-outline" size={40} color={theme.tint} />
                </View>
              )}
              
              <View style={[styles.iconOverlay, { backgroundColor: theme.tint }]}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Basic Group Info */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Details</Text>
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Group Name"
              placeholderTextColor={theme.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            
            <TextInput
              style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description"
              placeholderTextColor={theme.textSecondary}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
          
          {/* Athlete-Only Group Options */}
          {groupType === 'athlete-only' && (
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Security Options</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    End-to-End Encryption
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Enable secure, encrypted messaging for private communication
                  </Text>
                </View>
                
                <Switch
                  value={encryptionEnabled}
                  onValueChange={setEncryptionEnabled}
                  trackColor={{ false: '#767577', true: theme.tint + '80' }}
                  thumbColor={encryptionEnabled ? theme.tint : '#f4f3f4'}
                />
              </View>
            </View>
          )}
          
          {/* Fan Group Options */}
          {groupType === 'fan-group' && (
            <>
              <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Monetization</Text>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                      Premium Access
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      Charge subscription fee for fans to join this group
                    </Text>
                  </View>
                  
                  <Switch
                    value={isMonetized}
                    onValueChange={setIsMonetized}
                    trackColor={{ false: '#767577', true: theme.tint + '80' }}
                    thumbColor={isMonetized ? theme.tint : '#f4f3f4'}
                  />
                </View>
                
                {isMonetized && (
                  <>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceLabel, { color: theme.text }]}>
                        Subscription Price ($)
                      </Text>
                      
                      <TextInput
                        style={[styles.priceInput, { color: theme.text, borderColor: theme.border }]}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                        placeholder="4.99"
                        placeholderTextColor={theme.textSecondary}
                      />
                    </View>
                    
                    <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
                      Billing Period
                    </Text>
                    
                    <View style={styles.periodOptions}>
                      <TouchableOpacity
                        style={[
                          styles.periodOption,
                          subscriptionPeriod === 'weekly' && [
                            styles.activePeriod,
                            { borderColor: theme.tint }
                          ]
                        ]}
                        onPress={() => setSubscriptionPeriod('weekly')}
                      >
                        <Text style={[
                          styles.periodText,
                          { color: subscriptionPeriod === 'weekly' ? theme.tint : theme.text }
                        ]}>
                          Weekly
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.periodOption,
                          subscriptionPeriod === 'monthly' && [
                            styles.activePeriod,
                            { borderColor: theme.tint }
                          ]
                        ]}
                        onPress={() => setSubscriptionPeriod('monthly')}
                      >
                        <Text style={[
                          styles.periodText,
                          { color: subscriptionPeriod === 'monthly' ? theme.tint : theme.text }
                        ]}>
                          Monthly
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.periodOption,
                          subscriptionPeriod === 'yearly' && [
                            styles.activePeriod,
                            { borderColor: theme.tint }
                          ]
                        ]}
                        onPress={() => setSubscriptionPeriod('yearly')}
                      >
                        <Text style={[
                          styles.periodText,
                          { color: subscriptionPeriod === 'yearly' ? theme.tint : theme.text }
                        ]}>
                          Yearly
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
              
              <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Rules</Text>
                  <Text style={[styles.sectionInfo, { color: theme.textSecondary }]}>
                    These will be shown to members when they join
                  </Text>
                </View>
                
                {groupRules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <Text style={[styles.ruleText, { color: theme.text }]}>
                      {index + 1}. {rule}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.removeRuleButton}
                      onPress={() => removeRule(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.addRuleContainer}>
                  <TextInput
                    style={[styles.addRuleInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Add a new rule..."
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={(e) => {
                      addRule(e.nativeEvent.text);
                      e.currentTarget.clear();
                    }}
                  />
                </View>
              </View>
              
              <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Size</Text>
                
                <View style={styles.sliderContainer}>
                  <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                    Maximum participants
                  </Text>
                  
                  <TextInput
                    style={[styles.sizeInput, { color: theme.text, borderColor: theme.border }]}
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    keyboardType="number-pad"
                    placeholder="1000"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>
            </>
          )}
          
          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
          )}
          
          {/* Revenue Sharing Info for Fan Groups */}
          {groupType === 'fan-group' && isMonetized && (
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue Sharing</Text>
              
              <View style={styles.revenueSplit}>
                <View style={styles.revenueItem}>
                  <Text style={[styles.revenuePercent, { color: theme.success }]}>85%</Text>
                  <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                    You Receive
                  </Text>
                </View>
                
                <View style={styles.revenueDivider} />
                
                <View style={styles.revenueItem}>
                  <Text style={[styles.revenuePercent, { color: theme.textSecondary }]}>15%</Text>
                  <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                    Platform Fee
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.revenueNote, { color: theme.textSecondary }]}>
                You'll receive 85% of all subscription revenue, paid out monthly.
              </Text>
            </View>
          )}
          
          {/* Create Button For Bottom of Form */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.tint, opacity: creating ? 0.5 : 1 }
            ]}
            onPress={createGroup}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Create {groupType === 'athlete-only' ? 'Athlete Group' : 'Fan Group'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 8,
  },
  createButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconButton: {
    position: 'relative',
  },
  groupIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionInfo: {
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  priceContainer: {
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  periodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodOption: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activePeriod: {
    borderWidth: 2,
  },
  periodText: {
    fontWeight: '500',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
  },
  removeRuleButton: {
    padding: 4,
  },
  addRuleContainer: {
    marginTop: 12,
  },
  addRuleInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 15,
  },
  sizeInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  revenueSplit: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenuePercent: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  revenueLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  revenueNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 25,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CreatePremiumGroupScreen; 