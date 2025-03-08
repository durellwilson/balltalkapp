import { Platform } from 'react-native';
import { DeviceSettings } from '../services/TestAccountsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default network timers (in ms)
const NETWORK_TIMERS = {
  good: 0, // no delay
  poor: 1500, // 1.5 second delay
  offline: -1, // fail requests
};

// Track current device settings
let currentDeviceSettings: DeviceSettings | null = null;

// Initialize device simulation
export const initDeviceSimulation = async (): Promise<void> => {
  try {
    // Check if we have active device settings stored
    const deviceJson = await AsyncStorage.getItem('balltalk_active_test_device');
    if (deviceJson) {
      const device = JSON.parse(deviceJson);
      if (device) {
        await setActiveDeviceSettings(device);
      }
    }
    
    console.log('Device simulation initialized');
  } catch (error) {
    console.error('Error initializing device simulation:', error);
  }
};

// Set active device settings
export const setActiveDeviceSettings = async (device: DeviceSettings): Promise<void> => {
  try {
    currentDeviceSettings = device;
    
    // Apply network conditions
    applyNetworkConditions(device.networkCondition);
    
    // Apply platform-specific settings
    applyPlatformSettings(device.platform);
    
    // Apply screen size settings
    applyScreenSizeSettings(device.screenSize);
    
    console.log('Applied device settings:', device);
  } catch (error) {
    console.error('Error setting device settings:', error);
  }
};

// Get current device settings
export const getActiveDeviceSettings = (): DeviceSettings | null => {
  return currentDeviceSettings;
};

// Get the current simulated device platform 
export const getDevicePlatform = (): 'ios' | 'android' | 'web' => {
  if (currentDeviceSettings) {
    return currentDeviceSettings.platform;
  }
  
  // Default to the actual platform if no simulation is active
  return Platform.OS as 'ios' | 'android' | 'web';
};

// Simulate network request with the current network condition
export const simulateNetworkRequest = async <T>(
  requestFn: () => Promise<T>
): Promise<T> => {
  if (!currentDeviceSettings || !currentDeviceSettings.networkCondition) {
    // No simulation, just execute the request normally
    return requestFn();
  }
  
  const condition = currentDeviceSettings.networkCondition;
  const delay = NETWORK_TIMERS[condition];
  
  if (delay === -1) {
    // Simulate offline by rejecting
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before error
    throw new Error('Network request failed: Device is simulating offline mode');
  }
  
  // Add artificial delay for poor connection
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Execute the actual request
  return requestFn();
};

// Apply network conditions simulation
const applyNetworkConditions = (condition?: 'good' | 'poor' | 'offline'): void => {
  if (!condition) return;
  
  // This could be implemented with different strategies:
  
  // 1. Override fetch/XMLHttpRequest
  // We could monkey-patch the global fetch function to add delays or simulate failures
  if (condition !== 'good') {
    console.log(`Simulating ${condition} network conditions`);
    
    // Store the original fetch
    const originalFetch = global.fetch;
    
    // Override fetch with our own implementation
    global.fetch = async (...args) => {
      const delay = NETWORK_TIMERS[condition];
      
      if (delay === -1) {
        // Simulate offline by rejecting all requests
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before error
        throw new Error('Network request failed: Device is simulating offline mode');
      }
      
      // Add artificial delay for poor connection
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Call original fetch
      return originalFetch.apply(null, args);
    };
  }
};

// Apply platform-specific settings
const applyPlatformSettings = (platform: 'ios' | 'android' | 'web'): void => {
  // In a real implementation, this would customize behavior based on platform
  // For now, we'll just log the platform being simulated
  console.log(`Simulating ${platform} platform`);
  
  // We could potentially:
  // - Override Platform.OS for platform-specific code paths
  // - Adjust styling to match platform conventions
  // - Simulate platform-specific behaviors
};

// Apply screen size settings
const applyScreenSizeSettings = (screenSize: 'small' | 'medium' | 'large'): void => {
  // In a real implementation, this would customize behavior based on screen size
  console.log(`Simulating ${screenSize} screen size`);
  
  // We could potentially:
  // - Adjust layout based on screen size
  // - Enable/disable certain UI elements
  // - Change font sizes
};

// Utility function to reset all simulations back to normal
export const resetDeviceSimulation = (): void => {
  // Restore original fetch if it was overridden
  if (global.fetch && global.fetch !== originalFetch) {
    global.fetch = originalFetch;
  }
  
  currentDeviceSettings = null;
  console.log('Device simulation reset to defaults');
};

// Keep reference to original fetch
const originalFetch = global.fetch;
