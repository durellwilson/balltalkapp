import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook for managing persistent storage with AsyncStorage
 * Provides methods for saving, loading, and listing data
 */
export const useStorage = () => {
  const [isReady, setIsReady] = useState<boolean>(false);
  
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Initialize storage if needed
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };
    
    initStorage();
  }, []);
  
  /**
   * Save data to storage
   * @param key - Storage key
   * @param data - Data to save
   */
  const saveData = async (key: string, data: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving data:', error);
      return Promise.reject(error);
    }
  };
  
  /**
   * Load data from storage
   * @param key - Storage key
   * @returns The loaded data or null if not found
   */
  const loadData = async (key: string): Promise<any> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      return Promise.reject(error);
    }
  };
  
  /**
   * Remove data from storage
   * @param key - Storage key
   */
  const removeData = async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing data:', error);
      return Promise.reject(error);
    }
  };
  
  /**
   * List all keys with a specific prefix
   * @param prefix - Key prefix to filter by
   * @returns Array of keys
   */
  const listKeys = async (prefix: string): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(prefix));
    } catch (error) {
      console.error('Error listing keys:', error);
      return Promise.reject(error);
    }
  };
  
  /**
   * List all sessions with data
   * @param prefix - Key prefix to filter by
   * @returns Array of session data
   */
  const listSessions = async (prefix: string): Promise<any[]> => {
    try {
      const keys = await listKeys(prefix);
      const sessions = await Promise.all(
        keys.map(async (key) => {
          const data = await loadData(key);
          return data;
        })
      );
      
      // Sort by updated date (newest first)
      return sessions
        .filter(session => session !== null)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
      console.error('Error listing sessions:', error);
      return Promise.reject(error);
    }
  };
  
  /**
   * Clear all data with a specific prefix
   * @param prefix - Key prefix to filter by
   */
  const clearData = async (prefix: string): Promise<void> => {
    try {
      const keys = await listKeys(prefix);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      return Promise.resolve();
    } catch (error) {
      console.error('Error clearing data:', error);
      return Promise.reject(error);
    }
  };
  
  return {
    isReady,
    saveData,
    loadData,
    removeData,
    listKeys,
    listSessions,
    clearData,
  };
};

export default useStorage; 