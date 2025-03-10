import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { Text, Card, ActionButton } from '@/components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import TestAccountsService, { TestAccount, DeviceSettings } from '../services/TestAccountsService';
import { useAuth } from '../contexts/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestingScreen() {
  const { user } = useAuth();
  
  const [accounts, setAccounts] = useState<TestAccount[]>([]);
  const [devices, setDevices] = useState<DeviceSettings[]>([]);
  const [activeAccount, setActiveAccount] = useState<TestAccount | null>(null);
  const [activeDevice, setActiveDevice] = useState<DeviceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [addingDevice, setAddingDevice] = useState(false);
  
  // New account form state
  const [newAccountEmail, setNewAccountEmail] = useState('test@example.com');
  const [newAccountPassword, setNewAccountPassword] = useState('password123');
  const [newAccountUsername, setNewAccountUsername] = useState('TestUser');
  const [newAccountRole, setNewAccountRole] = useState<'athlete' | 'fan'>('athlete');
  const [newAccountProvider, setNewAccountProvider] = useState<'email' | 'google' | 'apple'>('email');
  
  // New device form state
  const [newDeviceName, setNewDeviceName] = useState('Custom Device');
  const [newDevicePlatform, setNewDevicePlatform] = useState<'ios' | 'android' | 'web'>('ios');
  const [newDeviceScreenSize, setNewDeviceScreenSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [newDeviceNetwork, setNewDeviceNetwork] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialize the service first
      await TestAccountsService.initialize();
      
      // Load accounts, devices, and active selections
      const [accountsData, devicesData, activeAcct, activeDev] = await Promise.all([
        TestAccountsService.getTestAccounts(),
        TestAccountsService.getTestDevices(),
        TestAccountsService.getActiveAccount(),
        TestAccountsService.getActiveDevice()
      ]);
      
      setAccounts(accountsData);
      setDevices(devicesData);
      setActiveAccount(activeAcct);
      setActiveDevice(activeDev);
    } catch (error) {
      console.error('Error loading test data:', error);
      Alert.alert('Error', 'Failed to load test accounts and devices.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      setLoading(true);
      await TestAccountsService.switchToAccount(accountId);
      // Reload data after switching
      await loadData();
    } catch (error) {
      console.error('Error switching account:', error);
      Alert.alert('Error', 'Failed to switch to selected account.');
      setLoading(false);
    }
  };

  const handleSwitchDevice = async (deviceId: string) => {
    try {
      setLoading(true);
      await TestAccountsService.switchToDevice(deviceId);
      // Reload data after switching
      await loadData();
      
      // Show feedback that device has been switched
      Alert.alert(
        'Device Switched',
        'Device settings applied. App behavior will now simulate this device.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error switching device:', error);
      Alert.alert('Error', 'Failed to switch to selected device.');
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      
      const newAccount = await TestAccountsService.addTestAccount({
        email: newAccountEmail,
        password: newAccountPassword,
        username: newAccountUsername,
        role: newAccountRole,
        provider: newAccountProvider
      });
      
      setAddingAccount(false);
      await loadData();
      
      Alert.alert('Success', `Test account "${newAccountUsername}" created.`);
    } catch (error) {
      console.error('Error creating test account:', error);
      Alert.alert('Error', 'Failed to create test account.');
      setLoading(false);
    }
  };

  const handleCreateDevice = async () => {
    try {
      setLoading(true);
      
      const newDevice = await TestAccountsService.addTestDevice({
        name: newDeviceName,
        platform: newDevicePlatform,
        screenSize: newDeviceScreenSize,
        networkCondition: newDeviceNetwork
      });
      
      setAddingDevice(false);
      await loadData();
      
      Alert.alert('Success', `Test device "${newDeviceName}" created.`);
    } catch (error) {
      console.error('Error creating test device:', error);
      Alert.alert('Error', 'Failed to create test device.');
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      Alert.alert(
        'Reset to Defaults',
        'This will reset all test accounts and devices to default values. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reset', 
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await TestAccountsService.resetToDefaults();
              await loadData();
              Alert.alert('Success', 'Reset to default test accounts and devices.');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      Alert.alert('Error', 'Failed to reset to defaults.');
      setLoading(false);
    }
  };

  const renderAccountItem = (account: TestAccount) => {
    const isActive = activeAccount?.id === account.id;
    const isCurrentUser = user?.email === account.email;
    
    return (
      <Card 
        key={account.id} 
        style={[
          styles.accountCard,
          isActive && styles.activeCard
        ]}
      >
        <View style={styles.accountInfo}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountName}>
              {account.username || account.email}
            </Text>
            <View style={styles.accountBadges}>
              {account.role === 'athlete' && (
                <View style={[styles.badge, styles.athleteBadge]}>
                  <Text style={styles.badgeText}>Athlete</Text>
                </View>
              )}
              {account.role === 'fan' && (
                <View style={[styles.badge, styles.fanBadge]}>
                  <Text style={styles.badgeText}>Fan</Text>
                </View>
              )}
              {isCurrentUser && (
                <View style={[styles.badge, styles.currentBadge]}>
                  <Text style={styles.badgeText}>Current</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.accountEmail}>{account.email}</Text>
          
          <View style={styles.accountMeta}>
            <Text style={styles.accountProvider}>
              {account.provider === 'email' ? (
                <MaterialIcons name="email" size={14} color="#666" />
              ) : account.provider === 'google' ? (
                <MaterialIcons name="android" size={14} color="#666" />
              ) : (
                <MaterialIcons name="apple" size={14} color="#666" />
              )}
              {' '}{account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.accountActions}>
          <ActionButton 
            style={[styles.accountButton, isActive && styles.accountButtonDisabled]} 
            onPress={() => handleSwitchAccount(account.id)}
            disabled={isActive}
          >
            <Text style={styles.accountButtonText}>
              {isActive ? 'Current' : 'Switch To'}
            </Text>
          </ActionButton>
        </View>
      </Card>
    );
  };

  const renderDeviceItem = (device: DeviceSettings) => {
    const isActive = activeDevice?.id === device.id;
    
    return (
      <Card 
        key={device.id} 
        style={[
          styles.deviceCard,
          isActive && styles.activeCard
        ]}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <View style={styles.deviceBadges}>
              <View style={[styles.badge, getPlatformBadgeStyle(device.platform)]}>
                <Text style={styles.badgeText}>{device.platform}</Text>
              </View>
              
              <View style={[styles.badge, getScreenSizeBadgeStyle(device.screenSize)]}>
                <Text style={styles.badgeText}>{device.screenSize}</Text>
              </View>
              
              {device.networkCondition && (
                <View style={[styles.badge, getNetworkBadgeStyle(device.networkCondition)]}>
                  <Text style={styles.badgeText}>{device.networkCondition}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.deviceMeta}>
            <Text style={styles.devicePlatform}>
              {device.platform === 'ios' ? (
                <MaterialIcons name="phone-iphone" size={14} color="#666" />
              ) : device.platform === 'android' ? (
                <MaterialIcons name="phone-android" size={14} color="#666" />
              ) : (
                <MaterialIcons name="computer" size={14} color="#666" />
              )}
              {' '}{getPlatformLabel(device)}
            </Text>
            
            {device.networkCondition && (
              <Text style={styles.deviceNetwork}>
                <MaterialIcons 
                  name={getNetworkIcon(device.networkCondition) as any} 
                  size={14} 
                  color="#666" 
                />
                {' '}{getNetworkLabel(device.networkCondition)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.deviceActions}>
          <ActionButton 
            style={[styles.deviceButton, isActive && styles.deviceButtonDisabled]} 
            onPress={() => handleSwitchDevice(device.id)}
            disabled={isActive}
          >
            <Text style={styles.deviceButtonText}>
              {isActive ? 'Current' : 'Switch To'}
            </Text>
          </ActionButton>
        </View>
      </Card>
    );
  };

  // Helper functions for UI
  const getPlatformLabel = (device: DeviceSettings): string => {
    if (device.platform === 'ios') {
      return device.screenSize === 'large' ? 'iPad' : 'iPhone';
    } else if (device.platform === 'android') {
      return device.screenSize === 'large' ? 'Android Tablet' : 'Android Phone';
    } else {
      return 'Web Browser';
    }
  };

  const getNetworkLabel = (network: string): string => {
    switch (network) {
      case 'good': return 'Good Connection';
      case 'poor': return 'Poor Connection';
      case 'offline': return 'Offline';
      default: return network;
    }
  };

  const getNetworkIcon = (network: string): string => {
    switch (network) {
      case 'good': return 'signal-cellular-4-bar';
      case 'poor': return 'signal-cellular-2-bar';
      case 'offline': return 'signal-cellular-off';
      default: return 'signal-cellular-alt';
    }
  };

  const getPlatformBadgeStyle = (platform: string) => {
    switch (platform) {
      case 'ios': return styles.iosBadge;
      case 'android': return styles.androidBadge;
      case 'web': return styles.webBadge;
      default: return {};
    }
  };

  const getScreenSizeBadgeStyle = (size: string) => {
    switch (size) {
      case 'small': return styles.smallBadge;
      case 'medium': return styles.mediumBadge;
      case 'large': return styles.largeBadge;
      default: return {};
    }
  };

  const getNetworkBadgeStyle = (network: string) => {
    switch (network) {
      case 'good': return styles.goodNetworkBadge;
      case 'poor': return styles.poorNetworkBadge;
      case 'offline': return styles.offlineNetworkBadge;
      default: return {};
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading testing environment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Testing Environment</Text>
        <ActionButton style={styles.resetButton} onPress={handleResetDefaults}>
          <MaterialIcons name="refresh" size={22} color="#666" />
        </ActionButton>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Logged In As:</Text>
              <Text style={styles.statusValue}>
                {user ? (user.displayName || user.email || user.uid) : 'Not Logged In'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Test Account:</Text>
              <Text style={styles.statusValue}>
                {activeAccount ? (activeAccount.username || activeAccount.email) : 'None'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Test Device:</Text>
              <Text style={styles.statusValue}>
                {activeDevice ? activeDevice.name : 'Default Device'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Network Simulation:</Text>
              <Text style={styles.statusValue}>
                {activeDevice?.networkCondition ? 
                  getNetworkLabel(activeDevice.networkCondition) : 
                  'Normal'
                }
              </Text>
            </View>
          </Card>
        </View>

        {/* Test Accounts Section */}
        <View style={styles.accountsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Accounts</Text>
            <ActionButton 
              style={styles.addButton} 
              onPress={() => setAddingAccount(!addingAccount)}
            >
              <MaterialIcons 
                name={addingAccount ? "remove" : "add"} 
                size={22} 
                color="#007AFF" 
              />
            </ActionButton>
          </View>

          {/* New Account Form */}
          {addingAccount && (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Add Test Account</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email:</Text>
                <View style={styles.formInputContainer}>
                  <Text style={styles.formInput}>{newAccountEmail}</Text>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Username:</Text>
                <View style={styles.formInputContainer}>
                  <Text style={styles.formInput}>{newAccountUsername}</Text>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Role:</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newAccountRole === 'athlete' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewAccountRole('athlete')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newAccountRole === 'athlete' && styles.toggleButtonTextActive
                    ]}>Athlete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newAccountRole === 'fan' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewAccountRole('fan')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newAccountRole === 'fan' && styles.toggleButtonTextActive
                    ]}>Fan</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Provider:</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newAccountProvider === 'email' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewAccountProvider('email')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newAccountProvider === 'email' && styles.toggleButtonTextActive
                    ]}>Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newAccountProvider === 'google' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewAccountProvider('google')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newAccountProvider === 'google' && styles.toggleButtonTextActive
                    ]}>Google</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newAccountProvider === 'apple' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewAccountProvider('apple')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newAccountProvider === 'apple' && styles.toggleButtonTextActive
                    ]}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <ActionButton style={styles.submitButton} onPress={handleCreateAccount}>
                <Text style={styles.submitButtonText}>Create Account</Text>
              </ActionButton>
            </Card>
          )}
          
          {/* Account List */}
          {accounts.map(renderAccountItem)}
        </View>

        {/* Test Devices Section */}
        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Devices</Text>
            <ActionButton 
              style={styles.addButton} 
              onPress={() => setAddingDevice(!addingDevice)}
            >
              <MaterialIcons 
                name={addingDevice ? "remove" : "add"} 
                size={22} 
                color="#007AFF" 
              />
            </ActionButton>
          </View>

          {/* New Device Form */}
          {addingDevice && (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Add Test Device</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Device Name:</Text>
                <View style={styles.formInputContainer}>
                  <Text style={styles.formInput}>{newDeviceName}</Text>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Platform:</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDevicePlatform === 'ios' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDevicePlatform('ios')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDevicePlatform === 'ios' && styles.toggleButtonTextActive
                    ]}>iOS</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDevicePlatform === 'android' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDevicePlatform('android')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDevicePlatform === 'android' && styles.toggleButtonTextActive
                    ]}>Android</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDevicePlatform === 'web' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDevicePlatform('web')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDevicePlatform === 'web' && styles.toggleButtonTextActive
                    ]}>Web</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Screen Size:</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceScreenSize === 'small' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceScreenSize('small')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceScreenSize === 'small' && styles.toggleButtonTextActive
                    ]}>Small</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceScreenSize === 'medium' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceScreenSize('medium')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceScreenSize === 'medium' && styles.toggleButtonTextActive
                    ]}>Medium</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceScreenSize === 'large' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceScreenSize('large')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceScreenSize === 'large' && styles.toggleButtonTextActive
                    ]}>Large</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Network:</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceNetwork === 'good' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceNetwork('good')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceNetwork === 'good' && styles.toggleButtonTextActive
                    ]}>Good</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceNetwork === 'poor' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceNetwork('poor')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceNetwork === 'poor' && styles.toggleButtonTextActive
                    ]}>Poor</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newDeviceNetwork === 'offline' && styles.toggleButtonActive
                    ]}
                    onPress={() => setNewDeviceNetwork('offline')}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      newDeviceNetwork === 'offline' && styles.toggleButtonTextActive
                    ]}>Offline</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <ActionButton style={styles.submitButton} onPress={handleCreateDevice}>
                <Text style={styles.submitButtonText}>Create Device</Text>
              </ActionButton>
            </Card>
          )}
          
          {/* Device List */}
          {devices.map(renderDeviceItem)}
        </View>
        
        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // General styles
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: 'white'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  resetButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  content: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  
  // Section styles
  statusSection: {
    marginTop: 20,
    paddingHorizontal: 15
  },
  accountsSection: {
    marginTop: 30,
    paddingHorizontal: 15
  },
  devicesSection: {
    marginTop: 30,
    paddingHorizontal: 15,
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  
  // Status card styles
  statusCard: {
    padding: 15,
    borderRadius: 10
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  statusLabel: {
    fontSize: 15,
    color: '#666'
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  
  // Account card styles
  accountCard: {
    marginBottom: 12,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  accountInfo: {
    flex: 1
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  accountBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },
  accountEmail: {
    fontSize: 14,
    color: '#666'
  },
  accountMeta: {
    flexDirection: 'row',
    marginTop: 6
  },
  accountProvider: {
    fontSize: 13,
    color: '#666'
  },
  accountActions: {
    justifyContent: 'center'
  },
  accountButton: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF'
  },
  accountButtonDisabled: {
    backgroundColor: '#E0E0E0'
  },
  accountButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
    marginBottom: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white'
  },
  athleteBadge: {
    backgroundColor: '#FF9500'
  },
  fanBadge: {
    backgroundColor: '#5856D6'
  },
  currentBadge: {
    backgroundColor: '#34C759'
  },
  
  // Device card styles
  deviceCard: {
    marginBottom: 12,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  deviceInfo: {
    flex: 1
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  deviceBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },
  deviceMeta: {
    marginTop: 6
  },
  devicePlatform: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2
  },
  deviceNetwork: {
    fontSize: 13,
    color: '#666'
  },
  deviceActions: {
    justifyContent: 'center'
  },
  deviceButton: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF'
  },
  deviceButtonDisabled: {
    backgroundColor: '#E0E0E0'
  },
  deviceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  
  // Platform badge styles
  iosBadge: {
    backgroundColor: '#34C759'
  },
  androidBadge: {
    backgroundColor: '#A4C639'
  },
  webBadge: {
    backgroundColor: '#007AFF'
  },
  
  // Screen size badge styles
  smallBadge: {
    backgroundColor: '#FF2D55'
  },
  mediumBadge: {
    backgroundColor: '#FF9500'
  },
  largeBadge: {
    backgroundColor: '#5856D6'
  },
  
  // Network badge styles
  goodNetworkBadge: {
    backgroundColor: '#34C759'
  },
  poorNetworkBadge: {
    backgroundColor: '#FF9500'
  },
  offlineNetworkBadge: {
    backgroundColor: '#FF3B30'
  },
  
  // Form styles
  formCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  formTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15
  },
  formField: {
    marginBottom: 12
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6
  },
  formInputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9'
  },
  formInput: {
    fontSize: 15
  },
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0'
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF'
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#333'
  },
  toggleButtonTextActive: {
    color: 'white'
  },
  submitButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#007AFF'
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
