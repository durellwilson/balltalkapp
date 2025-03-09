import ErrorHandlingService from './ErrorHandlingService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Recovery strategies for different types of recording errors
 */
enum RecoveryStrategy {
  RETRY = 'retry',
  RESTART = 'restart',
  FALLBACK = 'fallback',
  LOCAL_PROCESSING = 'local_processing',
  USE_CACHE = 'use_cache',
  CLEAR_CACHE = 'clear_cache',
  RESET_AUDIO = 'reset_audio',
  NONE = 'none'
}

/**
 * RecoveryService provides methods to recover from common recording and audio processing errors.
 */
class RecoveryService {
  private static instance: RecoveryService;
  private errorHandlingService: ErrorHandlingService;
  private recoveryAttemptCounts: Record<string, number> = {};
  private lastRecoveryTimestamp: Record<string, number> = {};
  private maxAttemptsPerError = 3;
  
  // Private constructor for singleton pattern
  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }
  
  /**
   * Recover from a recording error
   * @param error - The error object
   * @param context - Additional context about the error
   * @returns Object with success status and recovery info
   */
  public async recoverFromRecordingError(error: Error, context?: any): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    // Log the error first
    const errorEntry = this.errorHandlingService.handleRecordingError(error, context);
    
    // Check if we've tried to recover from this error too many times
    const errorKey = `${error.name}-${error.message}`;
    this.recoveryAttemptCounts[errorKey] = (this.recoveryAttemptCounts[errorKey] || 0) + 1;
    
    if (this.recoveryAttemptCounts[errorKey] > this.maxAttemptsPerError) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: `Maximum recovery attempts reached for this error. Please restart the app.`
      };
    }
    
    // Check for specific error types and apply appropriate recovery strategies
    if (this.isPermissionError(error)) {
      return await this.recoverFromPermissionError();
    } else if (this.isInterruptionError(error)) {
      return await this.recoverFromInterruptionError();
    } else if (this.isStorageError(error)) {
      return await this.recoverFromStorageError();
    } else if (this.isAudioFormatError(error)) {
      return await this.recoverFromAudioFormatError();
    } else if (this.isFileCorruptionError(error)) {
      return await this.recoverFromFileCorruptionError();
    } else {
      // For unknown errors, try to reset the audio session
      return await this.resetAudioSession();
    }
  }
  
  /**
   * Recover from an audio processing error
   * @param error - The error object
   * @param context - Additional context about the error
   * @returns Object with success status and recovery info
   */
  public async recoverFromProcessingError(error: Error, context?: any): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    // Log the error first
    const errorEntry = this.errorHandlingService.handleAudioProcessingError(error, context);
    
    // Check if we've tried to recover from this error too many times
    const errorKey = `${error.name}-${error.message}`;
    this.recoveryAttemptCounts[errorKey] = (this.recoveryAttemptCounts[errorKey] || 0) + 1;
    
    if (this.recoveryAttemptCounts[errorKey] > this.maxAttemptsPerError) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: `Maximum recovery attempts reached for this error. Please restart the app.`
      };
    }
    
    // Check for specific error types and apply appropriate recovery strategies
    if (this.isNetworkError(error)) {
      return await this.recoverFromNetworkError(context);
    } else if (this.isFileCorruptionError(error)) {
      return await this.recoverFromFileCorruptionError();
    } else if (this.isTimeoutError(error)) {
      return await this.recoverFromTimeoutError(context);
    } else if (this.isMemoryError(error)) {
      return await this.recoverFromMemoryError();
    } else {
      // For unknown processing errors, try local processing
      return await this.fallbackToLocalProcessing();
    }
  }
  
  /**
   * Check if an error is related to permissions
   */
  private isPermissionError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('permission') ||
      errorMsg.includes('denied') ||
      errorMsg.includes('not granted') ||
      errorMsg.includes('not authorized')
    );
  }
  
  /**
   * Check if an error is related to audio interruptions
   */
  private isInterruptionError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('interrupt') ||
      errorMsg.includes('session') ||
      errorMsg.includes('active') ||
      errorMsg.includes('background')
    );
  }
  
  /**
   * Check if an error is related to storage space
   */
  private isStorageError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('storage') ||
      errorMsg.includes('space') ||
      errorMsg.includes('disk full') ||
      errorMsg.includes('cannot write')
    );
  }
  
  /**
   * Check if an error is related to audio format
   */
  private isAudioFormatError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('format') ||
      errorMsg.includes('codec') ||
      errorMsg.includes('encoding') ||
      errorMsg.includes('bit rate')
    );
  }
  
  /**
   * Check if an error is related to file corruption
   */
  private isFileCorruptionError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('corrupt') ||
      errorMsg.includes('decode') ||
      errorMsg.includes('malformed') ||
      errorMsg.includes('invalid file')
    );
  }
  
  /**
   * Check if an error is related to network connectivity
   */
  private isNetworkError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('network') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('failed to fetch') ||
      errorMsg.includes('socket')
    );
  }
  
  /**
   * Check if an error is related to timeouts
   */
  private isTimeoutError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('timeout') ||
      errorMsg.includes('time out') ||
      errorMsg.includes('timed out') ||
      errorMsg.includes('deadline exceeded')
    );
  }
  
  /**
   * Check if an error is related to memory limitations
   */
  private isMemoryError(error: Error): boolean {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('memory') ||
      errorMsg.includes('allocation') ||
      errorMsg.includes('out of memory') ||
      errorMsg.includes('heap')
    );
  }
  
  /**
   * Recovery strategy for permission errors
   */
  private async recoverFromPermissionError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Try to request permissions again
      const { granted } = await Audio.requestPermissionsAsync();
      
      if (granted) {
        return {
          success: true,
          strategy: RecoveryStrategy.RETRY,
          message: 'Microphone permission granted. You can now start recording.'
        };
      } else {
        return {
          success: false,
          strategy: RecoveryStrategy.NONE,
          message: 'Microphone permission is required. Please enable it in your device settings.'
        };
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Failed to request microphone permission. Please try restarting the app.'
      };
    }
  }
  
  /**
   * Recovery strategy for interruption errors
   */
  private async recoverFromInterruptionError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Reset audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });
      
      // Short delay to ensure audio session is fully reset
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        strategy: RecoveryStrategy.RESET_AUDIO,
        message: 'Audio session reset. You can now try recording again.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RESTART,
        message: 'Could not reset audio session. Please try restarting the app.'
      };
    }
  }
  
  /**
   * Recovery strategy for storage errors
   */
  private async recoverFromStorageError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Clean up temporary files to free space
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheDirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (cacheDirInfo.exists && cacheDirInfo.isDirectory) {
          // Find and delete old audio files
          const dirContent = await FileSystem.readDirectoryAsync(cacheDir);
          const audioFiles = dirContent.filter(file => 
            file.endsWith('.m4a') || 
            file.endsWith('.wav') || 
            file.endsWith('.mp3') ||
            file.endsWith('.webm')
          );
          
          if (audioFiles.length > 0) {
            // Delete oldest files first (up to 5)
            const filesToDelete = audioFiles.slice(0, 5);
            for (const file of filesToDelete) {
              await FileSystem.deleteAsync(`${cacheDir}${file}`);
            }
            
            return {
              success: true,
              strategy: RecoveryStrategy.CLEAR_CACHE,
              message: `Cleared ${filesToDelete.length} temporary audio files. Try recording again.`
            };
          }
        }
      }
      
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Low storage space. Please free up space on your device.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Could not free up storage space. Please manually delete files.'
      };
    }
  }
  
  /**
   * Recovery strategy for audio format errors
   */
  private async recoverFromAudioFormatError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Fall back to a more compatible format
      const currentFormat = await AsyncStorage.getItem('recording_settings');
      const settings = currentFormat ? JSON.parse(currentFormat) : {};
      
      // Update to use a more compatible format
      const compatibleSettings = {
        ...settings,
        format: Platform.OS === 'web' ? 'webm' : 'm4a',
        quality: 'standard', // Step down quality for better compatibility
      };
      
      await AsyncStorage.setItem('recording_settings', JSON.stringify(compatibleSettings));
      
      return {
        success: true,
        strategy: RecoveryStrategy.FALLBACK,
        message: 'Switched to a more compatible audio format. Try recording again.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RESTART,
        message: 'Could not switch audio format. Please restart the app.'
      };
    }
  }
  
  /**
   * Recovery strategy for file corruption errors
   */
  private async recoverFromFileCorruptionError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    // For corrupt files, we need to start over
    return {
      success: false,
      strategy: RecoveryStrategy.RESTART,
      message: 'The audio file is corrupted. Please try recording again.'
    };
  }
  
  /**
   * Recovery strategy for network errors
   */
  private async recoverFromNetworkError(context?: any): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Check current network state
      const networkState = await NetInfo.fetch();
      
      if (networkState.isConnected) {
        // Connected but maybe transient issue, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          strategy: RecoveryStrategy.RETRY,
          message: 'Network connection restored. Retrying operation.'
        };
      } else {
        // Fall back to local processing if we have the audio file
        if (context?.audioUri) {
          return {
            success: true,
            strategy: RecoveryStrategy.LOCAL_PROCESSING,
            message: 'Network unavailable. Using local processing instead.'
          };
        } else {
          return {
            success: false,
            strategy: RecoveryStrategy.NONE,
            message: 'Network connection required. Please check your internet connection.'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.LOCAL_PROCESSING,
        message: 'Network status check failed. Using local processing as fallback.'
      };
    }
  }
  
  /**
   * Recovery strategy for timeout errors
   */
  private async recoverFromTimeoutError(context?: any): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    // For timeout errors, we can either retry with a longer timeout or fall back to local processing
    if (context?.audioUri) {
      return {
        success: true,
        strategy: RecoveryStrategy.LOCAL_PROCESSING,
        message: 'Processing timed out. Using local processing instead.'
      };
    } else {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Operation timed out. Please try again with a shorter recording.'
      };
    }
  }
  
  /**
   * Recovery strategy for memory errors
   */
  private async recoverFromMemoryError(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Clear cache to free up memory
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheDirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (cacheDirInfo.exists && cacheDirInfo.isDirectory) {
          // Find temporary files
          const dirContent = await FileSystem.readDirectoryAsync(cacheDir);
          const tempFiles = dirContent.filter(file => file.includes('temp') || file.includes('tmp'));
          
          // Delete temporary files
          for (const file of tempFiles) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`);
          }
        }
      }
      
      return {
        success: true,
        strategy: RecoveryStrategy.CLEAR_CACHE,
        message: 'Cleared memory cache. Try processing again.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RESTART,
        message: 'Out of memory. Please restart the app and try again.'
      };
    }
  }
  
  /**
   * Reset audio session to recover from various errors
   */
  private async resetAudioSession(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      if (Platform.OS !== 'web') {
        // Reset native audio session
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
        
        // Short delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Re-enable recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        });
      }
      
      return {
        success: true,
        strategy: RecoveryStrategy.RESET_AUDIO,
        message: 'Audio system reset. Try recording again.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.RESTART,
        message: 'Could not reset audio system. Please restart the app.'
      };
    }
  }
  
  /**
   * Fallback to local processing instead of cloud processing
   */
  private async fallbackToLocalProcessing(): Promise<{
    success: boolean;
    strategy: RecoveryStrategy;
    message: string;
  }> {
    try {
      // Update processing mode to local in settings
      const settings = await AsyncStorage.getItem('audio_processing_settings');
      const processingSettings = settings ? JSON.parse(settings) : {};
      
      processingSettings.processingMode = 'local';
      
      await AsyncStorage.setItem('audio_processing_settings', JSON.stringify(processingSettings));
      
      return {
        success: true,
        strategy: RecoveryStrategy.LOCAL_PROCESSING,
        message: 'Switched to local audio processing. Quality may be reduced.'
      };
    } catch (error) {
      return {
        success: false,
        strategy: RecoveryStrategy.NONE,
        message: 'Could not switch to local processing. Please try again.'
      };
    }
  }
  
  /**
   * Check if we can try to recover automatically from an error
   * @param errorKey - Key identifying the error
   * @returns Whether auto-recovery should be attempted
   */
  public canAttemptAutoRecovery(errorKey: string): boolean {
    // Don't attempt auto-recovery too frequently for the same error
    const now = Date.now();
    const lastAttempt = this.lastRecoveryTimestamp[errorKey] || 0;
    const timeSinceLastAttempt = now - lastAttempt;
    
    // Allow recovery if it's been at least 30 seconds since last attempt
    const canRecover = timeSinceLastAttempt > 30000;
    
    if (canRecover) {
      this.lastRecoveryTimestamp[errorKey] = now;
    }
    
    return canRecover && this.recoveryAttemptCounts[errorKey] < this.maxAttemptsPerError;
  }
  
  /**
   * Reset recovery attempt counters for a fresh start
   */
  public resetRecoveryAttempts(): void {
    this.recoveryAttemptCounts = {};
    this.lastRecoveryTimestamp = {};
  }
}

export default RecoveryService; 