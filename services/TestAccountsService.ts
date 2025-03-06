import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseUser } from './AuthService';
import AuthService from './AuthService';
import { auth as firebaseAuth } from '../src/lib/firebase';
import { Platform } from 'react-native';
import { setActiveDeviceSettings, initDeviceSimulation } from '../utils/deviceSimulation';

// Define test account structure
export interface TestAccount {
  id: string;
  email: string;
  password: string;
  username?: string;
  role?: 'athlete' | 'fan';
  provider: 'email' | 'google' | 'apple';
}

// Define device simulation settings
export interface DeviceSettings {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web';
  screenSize: 'small' | 'medium' | 'large';
  networkCondition?: 'good' | 'poor' | 'offline';
}

// Storage keys
const STORAGE_KEYS = {
  TEST_ACCOUNTS: 'balltalk_test_accounts',
  TEST_DEVICES: 'balltalk_test_devices',
  ACTIVE_ACCOUNT: 'balltalk_active_test_account',
  ACTIVE_DEVICE: 'balltalk_active_test_device',
};

class TestAccountsService {
  private testAccounts: TestAccount[] = [];
  private testDevices: DeviceSettings[] = [];
  private activeAccountId: string | null = null;
  private activeDeviceId: string | null = null;
  private isInitialized = false;

  // Default test accounts
  private defaultAccounts: TestAccount[] = [
    {
      id: '1',
      email: 'athlete1@test.com',
      password: 'password123',
      username: 'TestAthlete1',
      role: 'athlete',
      provider: 'email',
    },
    {
      id: '2',
      email: 'fan1@test.com',
      password: 'password123',
      username: 'TestFan1',
      role: 'fan',
      provider: 'email',
    },
    {
      id: '3',
      email: 'athlete2@test.com',
      password: 'password123',
      username: 'TestAthlete2',
      role: 'athlete',
      provider: 'email',
    },
  ];

  // Default test devices
  private defaultDevices: DeviceSettings[] = [
    {
      id: '1',
      name: 'iPhone 13',
      platform: 'ios',
      screenSize: 'medium',
      networkCondition: 'good',
    },
    {
      id: '2',
      name: 'Pixel 6',
      platform: 'android',
      screenSize: 'large',
      networkCondition: 'good',
    },
    {
      id: '3',
      name: 'iPad',
      platform: 'ios',
      screenSize: 'large',
      networkCondition: 'good',
    },
    {
      id: '4',
      name: 'Desktop Browser',
      platform: 'web',
      screenSize: 'large',
      networkCondition: 'good',
    },
    {
      id: '5',
      name: 'Slow Network',
      platform: 'web',
      screenSize: 'large',
      networkCondition: 'poor',
    },
    {
      id: '6',
      name: 'Offline Mode',
      platform: 'web',
      screenSize: 'large',
      networkCondition: 'offline',
    },
  ];

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved test accounts
      const savedAccounts = await AsyncStorage.getItem(STORAGE_KEYS.TEST_ACCOUNTS);
      this.testAccounts = savedAccounts ? JSON.parse(savedAccounts) : this.defaultAccounts;

      // Load saved test devices
      const savedDevices = await AsyncStorage.getItem(STORAGE_KEYS.TEST_DEVICES);
      this.testDevices = savedDevices ? JSON.parse(savedDevices) : this.defaultDevices;

      // Load active account and device
      const activeAccountId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
      this.activeAccountId = activeAccountId;

      const activeDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DEVICE);
      this.activeDeviceId = activeDeviceId || this.defaultDevices[0].id;

      // If no accounts exist yet, save defaults
      if (!savedAccounts) {
        await this.saveAccounts();
      }

      // If no devices exist yet, save defaults
      if (!savedDevices) {
        await this.saveDevices();
      }

      // Initialize device simulation
      await initDeviceSimulation();

      // If we have an active device, apply its settings
      if (this.activeDeviceId) {
        const activeDevice = this.testDevices.find(device => device.id === this.activeDeviceId);
        if (activeDevice) {
          await setActiveDeviceSettings(activeDevice);
        }
      }

      this.isInitialized = true;
      console.log('TestAccountsService initialized with:', {
        accounts: this.testAccounts.length,
        devices: this.testDevices.length,
        activeAccount: this.activeAccountId,
        activeDevice: this.activeDeviceId,
      });
    } catch (error) {
      console.error('Error initializing TestAccountsService:', error);
    }
  }

  // Get all test accounts
  async getTestAccounts(): Promise<TestAccount[]> {
    await this.ensureInitialized();
    return this.testAccounts;
  }

  // Get all test devices
  async getTestDevices(): Promise<DeviceSettings[]> {
    await this.ensureInitialized();
    return this.testDevices;
  }

  // Add a new test account
  async addTestAccount(account: Omit<TestAccount, 'id'>): Promise<TestAccount> {
    await this.ensureInitialized();
    
    const newAccount: TestAccount = {
      ...account,
      id: Date.now().toString(),
    };
    
    this.testAccounts.push(newAccount);
    await this.saveAccounts();
    
    return newAccount;
  }

  // Add a new test device
  async addTestDevice(device: Omit<DeviceSettings, 'id'>): Promise<DeviceSettings> {
    await this.ensureInitialized();
    
    const newDevice: DeviceSettings = {
      ...device,
      id: Date.now().toString(),
    };
    
    this.testDevices.push(newDevice);
    await this.saveDevices();
    
    return newDevice;
  }

  // Remove a test account
  async removeTestAccount(accountId: string): Promise<void> {
    await this.ensureInitialized();
    
    this.testAccounts = this.testAccounts.filter(account => account.id !== accountId);
    
    // If active account is removed, clear it
    if (this.activeAccountId === accountId) {
      this.activeAccountId = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    }
    
    await this.saveAccounts();
  }

  // Remove a test device
  async removeTestDevice(deviceId: string): Promise<void> {
    await this.ensureInitialized();
    
    this.testDevices = this.testDevices.filter(device => device.id !== deviceId);
    
    // If active device is removed, set to first available device
    if (this.activeDeviceId === deviceId) {
      this.activeDeviceId = this.testDevices.length > 0 ? this.testDevices[0].id : null;
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DEVICE, this.activeDeviceId || '');
      
      // Update device simulation with the new active device
      if (this.activeDeviceId) {
        const newActiveDevice = this.testDevices.find(device => device.id === this.activeDeviceId);
        if (newActiveDevice) {
          await setActiveDeviceSettings(newActiveDevice);
        }
      }
    }
    
    await this.saveDevices();
  }

  // Switch to a test account
  async switchToAccount(accountId: string): Promise<FirebaseUser | null> {
    await this.ensureInitialized();
    
    const account = this.testAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error(`Test account with ID ${accountId} not found`);
    }
    
    // Sign out current user if needed
    if (firebaseAuth.currentUser) {
      await AuthService.signOut();
    }
    
    try {
      // Sign in with the new account
      let user: FirebaseUser | null = null;
      
      if (account.provider === 'email') {
        user = await AuthService.signInWithEmail(account.email, account.password);
      } else if (account.provider === 'google' && Platform.OS === 'web') {
        user = await AuthService.signInWithGoogle(account.username, account.role as 'athlete' | 'fan');
      } else if (account.provider === 'apple' && Platform.OS === 'web') {
        user = await AuthService.signInWithApple(account.username, account.role as 'athlete' | 'fan');
      } else {
        throw new Error(`Provider ${account.provider} not supported on this platform`);
      }
      
      // Save active account ID
      this.activeAccountId = accountId;
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, accountId);
      
      return user;
    } catch (error) {
      console.error(`Error switching to account ${accountId}:`, error);
      throw error;
    }
  }

  // Switch to a test device
  async switchToDevice(deviceId: string): Promise<DeviceSettings> {
    await this.ensureInitialized();
    
    const device = this.testDevices.find(dev => dev.id === deviceId);
    if (!device) {
      throw new Error(`Test device with ID ${deviceId} not found`);
    }
    
    // Save active device ID
    this.activeDeviceId = deviceId;
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DEVICE, deviceId);
    
    // Apply device settings to the device simulation system
    await setActiveDeviceSettings(device);
    
    console.log(`Switched to device: ${device.name} (${device.platform})`);
    
    return device;
  }

  // Get active account
  async getActiveAccount(): Promise<TestAccount | null> {
    await this.ensureInitialized();
    
    if (!this.activeAccountId) return null;
    
    return this.testAccounts.find(account => account.id === this.activeAccountId) || null;
  }

  // Get active device
  async getActiveDevice(): Promise<DeviceSettings | null> {
    await this.ensureInitialized();
    
    if (!this.activeDeviceId) return null;
    
    return this.testDevices.find(device => device.id === this.activeDeviceId) || null;
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    this.testAccounts = [...this.defaultAccounts];
    this.testDevices = [...this.defaultDevices];
    this.activeAccountId = null;
    this.activeDeviceId = this.defaultDevices[0].id;
    
    await this.saveAccounts();
    await this.saveDevices();
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DEVICE, this.activeDeviceId);
    
    // Reset device simulation to default device
    const defaultDevice = this.defaultDevices[0];
    await setActiveDeviceSettings(defaultDevice);
  }

  // Private methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async saveAccounts(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TEST_ACCOUNTS, JSON.stringify(this.testAccounts));
  }

  private async saveDevices(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TEST_DEVICES, JSON.stringify(this.testDevices));
  }
}

export default new TestAccountsService();
