import ErrorHandlingService from './ErrorHandlingService';
import { LogLevel, PerformanceMetric } from '../models/monitoring/MonitoringModels';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { RecordingFormat, RecordingQuality } from '../contexts/RecordingContext';
import NetInfo from '@react-native-community/netinfo';

// Constants
const STORAGE_KEYS = {
  METRICS: 'audio_performance_metrics',
  LOGS: 'audio_monitoring_logs',
  SETTINGS: 'audio_monitoring_settings'
};

const MAX_LOG_ENTRIES = 500;
const MAX_METRICS_ENTRIES = 100;

/**
 * Audio monitoring service for tracking performance and diagnosing issues
 */
class AudioMonitoringService {
  private static instance: AudioMonitoringService;
  private errorHandlingService: ErrorHandlingService;
  
  private performanceMetrics: PerformanceMetric[] = [];
  private logs: {
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
  }[] = [];
  
  private isEnabled = true;
  private isVerboseLogging = false;
  private isAutoFlush = true;
  private flushIntervalId: NodeJS.Timeout | null = null;
  private sessionStartTime = Date.now();
  private sessionId = `session_${this.sessionStartTime}`;
  
  // Private constructor for singleton pattern
  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.initializeService();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioMonitoringService {
    if (!AudioMonitoringService.instance) {
      AudioMonitoringService.instance = new AudioMonitoringService();
    }
    return AudioMonitoringService.instance;
  }
  
  /**
   * Initialize the monitoring service
   */
  private async initializeService() {
    // Load settings from storage
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        this.isEnabled = parsedSettings.isEnabled ?? true;
        this.isVerboseLogging = parsedSettings.isVerboseLogging ?? false;
        this.isAutoFlush = parsedSettings.isAutoFlush ?? true;
      }
      
      // Load cached metrics and logs
      if (this.isEnabled) {
        const cachedMetrics = await AsyncStorage.getItem(STORAGE_KEYS.METRICS);
        if (cachedMetrics) {
          this.performanceMetrics = JSON.parse(cachedMetrics);
          
          // Trim if needed
          if (this.performanceMetrics.length > MAX_METRICS_ENTRIES) {
            this.performanceMetrics = this.performanceMetrics.slice(-MAX_METRICS_ENTRIES);
          }
        }
        
        const cachedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
        if (cachedLogs) {
          this.logs = JSON.parse(cachedLogs);
          
          // Trim if needed
          if (this.logs.length > MAX_LOG_ENTRIES) {
            this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
          }
        }
        
        // Set up auto-flush
        if (this.isAutoFlush) {
          this.flushIntervalId = setInterval(() => {
            this.flushToStorage();
          }, 60000); // Flush every minute
        }
        
        this.log(LogLevel.INFO, 'Audio monitoring service initialized', { sessionId: this.sessionId });
      }
    } catch (error) {
      console.error('Failed to initialize audio monitoring service:', error);
    }
  }
  
  /**
   * Start tracking a performance metric
   * @param metricName - Name of the metric
   * @param context - Additional context
   * @returns Tracking ID
   */
  public startMetric(metricName: string, context?: Record<string, any>): string {
    if (!this.isEnabled) return '';
    
    const trackingId = `${metricName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceMetrics.push({
      id: trackingId,
      name: metricName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      context: context || {},
      sessionId: this.sessionId
    });
    
    if (this.isVerboseLogging) {
      this.log(LogLevel.DEBUG, `Started metric tracking: ${metricName}`, { trackingId, context });
    }
    
    return trackingId;
  }
  
  /**
   * End tracking a performance metric
   * @param trackingId - Tracking ID from startMetric
   * @param additionalContext - Additional context to add
   * @returns The completed metric or null if not found
   */
  public endMetric(trackingId: string, additionalContext?: Record<string, any>): PerformanceMetric | null {
    if (!this.isEnabled || !trackingId) return null;
    
    const metricIndex = this.performanceMetrics.findIndex(m => m.id === trackingId);
    if (metricIndex === -1) return null;
    
    const now = Date.now();
    const metric = this.performanceMetrics[metricIndex];
    
    // Update the metric
    metric.endTime = now;
    metric.duration = now - metric.startTime;
    
    if (additionalContext) {
      metric.context = {
        ...metric.context,
        ...additionalContext
      };
    }
    
    // Update in the array
    this.performanceMetrics[metricIndex] = metric;
    
    if (this.isVerboseLogging) {
      this.log(LogLevel.DEBUG, `Ended metric tracking: ${metric.name}`, { 
        trackingId, 
        duration: metric.duration,
        context: metric.context
      });
    }
    
    return metric;
  }
  
  /**
   * Record a complete metric without separate start/end calls
   * @param metricName - Name of the metric
   * @param durationMs - Duration in milliseconds
   * @param context - Additional context
   */
  public recordMetric(metricName: string, durationMs: number, context?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    const trackingId = `${metricName}_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceMetrics.push({
      id: trackingId,
      name: metricName,
      startTime: now - durationMs,
      endTime: now,
      duration: durationMs,
      context: context || {},
      sessionId: this.sessionId
    });
    
    if (this.isVerboseLogging) {
      this.log(LogLevel.DEBUG, `Recorded metric: ${metricName}`, { durationMs, context });
    }
  }
  
  /**
   * Log a message with a specific level
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data
   */
  public log(level: LogLevel, message: string, data?: any): void {
    if (!this.isEnabled) return;
    
    // For non-debug logs, or if verbose logging is enabled
    if (level !== LogLevel.DEBUG || this.isVerboseLogging) {
      this.logs.push({
        timestamp: Date.now(),
        level,
        message,
        data
      });
      
      // Trim logs if necessary
      if (this.logs.length > MAX_LOG_ENTRIES) {
        this.logs.shift(); // Remove oldest log
      }
      
      // Console output (for development)
      switch (level) {
        case LogLevel.ERROR:
          console.error(`[AudioMonitoring] ${message}`, data);
          break;
        case LogLevel.WARN:
          console.warn(`[AudioMonitoring] ${message}`, data);
          break;
        case LogLevel.INFO:
          console.info(`[AudioMonitoring] ${message}`, data);
          break;
        case LogLevel.DEBUG:
          console.debug(`[AudioMonitoring] ${message}`, data);
          break;
      }
    }
  }
  
  /**
   * Log details about the recording session start
   * @param quality - Recording quality setting
   * @param format - Recording format setting
   * @param settings - Additional settings
   */
  public logRecordingStart(
    quality: RecordingQuality,
    format: RecordingFormat,
    settings?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';
    
    const trackingId = this.startMetric('recording_session', {
      quality,
      format,
      settings,
      platform: Platform.OS,
      platformVersion: Platform.Version,
    });
    
    this.log(LogLevel.INFO, 'Recording session started', {
      trackingId,
      quality,
      format,
      settings
    });
    
    return trackingId;
  }
  
  /**
   * Log details about the recording session end
   * @param trackingId - Tracking ID from logRecordingStart
   * @param success - Whether recording was successful
   * @param fileSize - Size of the recording in bytes
   * @param durationMs - Duration of the recording in milliseconds
   * @param additionalInfo - Additional information
   */
  public logRecordingEnd(
    trackingId: string,
    success: boolean,
    fileSize?: number,
    durationMs?: number,
    additionalInfo?: Record<string, any>
  ): void {
    if (!this.isEnabled || !trackingId) return;
    
    const context = {
      success,
      ...(fileSize !== undefined ? { fileSize } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...additionalInfo
    };
    
    this.endMetric(trackingId, context);
    
    this.log(LogLevel.INFO, 'Recording session ended', {
      trackingId,
      success,
      fileSize,
      durationMs,
      ...additionalInfo
    });
  }
  
  /**
   * Log details about audio processing
   * @param processingType - Type of processing
   * @param inputFileSize - Size of the input file in bytes
   * @param settings - Processing settings
   */
  public logProcessingStart(
    processingType: string,
    inputFileSize?: number,
    settings?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';
    
    const trackingId = this.startMetric(`audio_processing_${processingType}`, {
      processingType,
      inputFileSize,
      settings,
      platform: Platform.OS,
    });
    
    this.log(LogLevel.INFO, `Audio processing started: ${processingType}`, {
      trackingId,
      inputFileSize,
      settings
    });
    
    return trackingId;
  }
  
  /**
   * Log details about audio processing completion
   * @param trackingId - Tracking ID from logProcessingStart
   * @param success - Whether processing was successful
   * @param outputFileSize - Size of the output file in bytes
   * @param additionalInfo - Additional information
   */
  public logProcessingEnd(
    trackingId: string,
    success: boolean,
    outputFileSize?: number,
    additionalInfo?: Record<string, any>
  ): void {
    if (!this.isEnabled || !trackingId) return;
    
    const context = {
      success,
      ...(outputFileSize !== undefined ? { outputFileSize } : {}),
      ...additionalInfo
    };
    
    this.endMetric(trackingId, context);
    
    this.log(LogLevel.INFO, 'Audio processing ended', {
      trackingId,
      success,
      outputFileSize,
      ...additionalInfo
    });
  }
  
  /**
   * Log an error that occurred during audio operations
   * @param error - The error object
   * @param operation - Operation during which the error occurred
   * @param context - Additional context
   */
  public logError(error: Error, operation: string, context?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    this.log(LogLevel.ERROR, `Error during ${operation}: ${error.message}`, {
      errorStack: error.stack,
      operation,
      ...context
    });
    
    // Also log to error handling service
    this.errorHandlingService.logError(
      error,
      // @ts-ignore - assuming MEDIA exists in ErrorType
      this.errorHandlingService.ErrorType?.MEDIA || 'media',
      // @ts-ignore - assuming ERROR exists in ErrorLevel
      this.errorHandlingService.ErrorLevel?.ERROR || 'error',
      {
        operation,
        ...context,
        feature: 'audio_recording'
      }
    );
  }
  
  /**
   * Get performance metrics for a specific operation
   * @param metricName - Name of the metric to filter by
   * @param limit - Maximum number of metrics to return
   * @returns Array of metrics
   */
  public getMetrics(metricName?: string, limit = 20): PerformanceMetric[] {
    if (!this.isEnabled) return [];
    
    let filtered = this.performanceMetrics;
    
    if (metricName) {
      filtered = filtered.filter(m => m.name === metricName);
    }
    
    // Sort newest first
    filtered.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    
    return filtered.slice(0, limit);
  }
  
  /**
   * Get logs filtered by level
   * @param level - Minimum log level to include
   * @param limit - Maximum number of logs to return
   * @returns Array of logs
   */
  public getLogs(level = LogLevel.INFO, limit = 50): any[] {
    if (!this.isEnabled) return [];
    
    const levelPriority = {
      [LogLevel.ERROR]: 3,
      [LogLevel.WARN]: 2,
      [LogLevel.INFO]: 1,
      [LogLevel.DEBUG]: 0
    };
    
    const minPriority = levelPriority[level];
    
    // Filter by level priority
    const filtered = this.logs.filter(log => 
      levelPriority[log.level] >= minPriority
    );
    
    // Sort newest first
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    return filtered.slice(0, limit);
  }
  
  /**
   * Flush monitoring data to storage
   */
  public async flushToStorage(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      // Check if we have storage access
      const storageCheck = await this.checkStorageAccess();
      if (!storageCheck.available) {
        if (this.isVerboseLogging) {
          console.warn('AudioMonitoringService: Storage not available', storageCheck.reason);
        }
        return;
      }
      
      // Trim data before storage to avoid oversized data
      this.trimDataBeforeStorage();
      
      // Save metrics with retry logic
      await this.safeStorageOperation(async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.performanceMetrics));
      }, 'metrics');
      
      // Save logs with retry logic
      await this.safeStorageOperation(async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
      }, 'logs');
      
      if (this.isVerboseLogging) {
        console.debug('AudioMonitoringService: Flushed data to storage');
      }
    } catch (error) {
      console.error('Failed to flush audio monitoring data:', error);
      // If we hit an error here, try to reduce the data size and retry once
      try {
        this.trimDataForEmergency();
        
        // Try one more time with reduced data
        await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.performanceMetrics.slice(-20)));
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs.slice(-50)));
        
        console.info('AudioMonitoringService: Flushed reduced data after error');
      } catch (innerError) {
        console.error('Failed to flush even reduced monitoring data:', innerError);
      }
    }
  }
  
  /**
   * Helper to check storage access
   * @private
   */
  private async checkStorageAccess(): Promise<{available: boolean; reason?: string}> {
    try {
      // Try a small test write
      const testKey = `${STORAGE_KEYS.SETTINGS}_test`;
      await AsyncStorage.setItem(testKey, 'test');
      await AsyncStorage.removeItem(testKey);
      
      // Check for remaining storage space
      if (Platform.OS !== 'web') {
        try {
          const cacheDir = FileSystem.cacheDirectory;
          if (cacheDir) {
            const info = await FileSystem.getInfoAsync(cacheDir);
            if (info.exists && info.isDirectory && info.totalSpace && info.freeSpace) {
              // If we have less than 5MB free, warn but continue
              if (info.freeSpace < 5 * 1024 * 1024) {
                return { available: true, reason: 'low_storage_space' };
              }
            }
          }
        } catch (err) {
          // Non-critical, continue
          console.warn('Could not check free storage space:', err);
        }
      }
      
      return { available: true };
    } catch (error) {
      return { available: false, reason: error instanceof Error ? error.message : 'unknown_error' };
    }
  }
  
  /**
   * Safely perform a storage operation with retry
   * @private
   */
  private async safeStorageOperation(operation: () => Promise<void>, label: string): Promise<boolean> {
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return true;
      } catch (error) {
        console.warn(`AudioMonitoringService: Error in operation "${label}" (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw error;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Trim data to reasonable size before storage
   * @private
   */
  private trimDataBeforeStorage(): void {
    // Keep metrics under limit
    if (this.performanceMetrics.length > MAX_METRICS_ENTRIES) {
      this.performanceMetrics = this.performanceMetrics.slice(-MAX_METRICS_ENTRIES);
    }
    
    // Keep logs under limit
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
    }
  }
  
  /**
   * Aggressively trim data in case of storage issues
   * @private
   */
  private trimDataForEmergency(): void {
    // Severely reduce data size
    this.performanceMetrics = this.performanceMetrics.slice(-20);
    this.logs = this.logs.slice(-50);
  }
  
  /**
   * Export diagnostic data to a file
   * @returns URI of the exported file
   */
  public async exportDiagnosticData(): Promise<string | null> {
    if (!this.isEnabled) return null;
    
    try {
      // Get network state
      const networkState = await NetInfo.fetch();
      
      // Gather system info
      const systemInfo = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        sessionDuration: Date.now() - this.sessionStartTime,
        isConnected: networkState.isConnected,
        connectionType: networkState.type,
        isInternetReachable: networkState.isInternetReachable
      };
      
      // Check and create diagnostics directory with error handling
      const exportDir = `${FileSystem.cacheDirectory}diagnostics/`;
      
      try {
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(exportDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
        }
      } catch (dirError) {
        // If we can't create the directory, use the root cache directory
        console.warn('Failed to create diagnostics directory, using root cache:', dirError);
        const exportDir = FileSystem.cacheDirectory as string;
      }
      
      // Create diagnostic data object
      const diagnosticData = {
        systemInfo,
        performanceMetrics: this.performanceMetrics,
        logs: this.logs,
        settings: {
          isEnabled: this.isEnabled,
          isVerboseLogging: this.isVerboseLogging,
          isAutoFlush: this.isAutoFlush
        },
        detectedIssues: this.identifyPerformanceIssues()
      };
      
      // Create JSON string
      const jsonData = JSON.stringify(diagnosticData, null, 2);
      
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `audio_diagnostics_${timestamp}.json`;
      const fileUri = `${exportDir}${fileName}`;
      
      // Write file with explicit permissions and encoding
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      // Verify the file was written
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to verify written diagnostic file');
      }
      
      this.log(LogLevel.INFO, 'Exported diagnostic data', { fileUri, size: fileInfo.size });
      
      return fileUri;
    } catch (error) {
      console.error('Failed to export diagnostic data:', error);
      this.log(LogLevel.ERROR, 'Failed to export diagnostic data', { error });
      
      // Try a fallback approach
      try {
        // Fallback to a simpler approach - just write to the root cache
        const fallbackFileUri = `${FileSystem.cacheDirectory}audio_diag_${Date.now()}.json`;
        
        // Simplify the data to reduce chances of errors
        const simplifiedData = {
          timestamp: new Date().toISOString(),
          logs: this.logs.slice(-50),
          metrics: this.performanceMetrics.slice(-20)
        };
        
        await FileSystem.writeAsStringAsync(fallbackFileUri, JSON.stringify(simplifiedData));
        this.log(LogLevel.INFO, 'Exported simplified diagnostic data', { fallbackFileUri });
        
        return fallbackFileUri;
      } catch (fallbackError) {
        console.error('Failed even simplified diagnostic export:', fallbackError);
        return null;
      }
    }
  }
  
  /**
   * Clear all collected data
   */
  public clearData(): void {
    this.performanceMetrics = [];
    this.logs = [];
    
    // Clear from storage
    AsyncStorage.removeItem(STORAGE_KEYS.METRICS).catch(console.error);
    AsyncStorage.removeItem(STORAGE_KEYS.LOGS).catch(console.error);
    
    this.log(LogLevel.INFO, 'Monitoring data cleared');
  }
  
  /**
   * Enable or disable monitoring
   * @param isEnabled - Whether monitoring should be enabled
   */
  public setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
    this.saveSettings();
    
    if (isEnabled) {
      this.log(LogLevel.INFO, 'Audio monitoring enabled');
    }
  }
  
  /**
   * Enable or disable verbose logging
   * @param isVerboseLogging - Whether verbose logging should be enabled
   */
  public setVerboseLogging(isVerboseLogging: boolean): void {
    this.isVerboseLogging = isVerboseLogging;
    this.saveSettings();
    
    this.log(LogLevel.INFO, `Verbose logging ${isVerboseLogging ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Enable or disable auto-flushing to storage
   * @param isAutoFlush - Whether auto-flushing should be enabled
   */
  public setAutoFlush(isAutoFlush: boolean): void {
    this.isAutoFlush = isAutoFlush;
    this.saveSettings();
    
    if (isAutoFlush && !this.flushIntervalId) {
      this.flushIntervalId = setInterval(() => {
        this.flushToStorage();
      }, 60000); // Flush every minute
    } else if (!isAutoFlush && this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
    
    this.log(LogLevel.INFO, `Auto-flush ${isAutoFlush ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      const settings = {
        isEnabled: this.isEnabled,
        isVerboseLogging: this.isVerboseLogging,
        isAutoFlush: this.isAutoFlush
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save audio monitoring settings:', error);
    }
  }
  
  /**
   * Generate a performance report
   * @returns Performance report as text
   */
  public generatePerformanceReport(): string {
    if (!this.isEnabled) return 'Monitoring is disabled';
    
    const now = new Date().toISOString();
    
    let report = `AUDIO PERFORMANCE REPORT\n`;
    report += `Generated: ${now}\n`;
    report += `Session ID: ${this.sessionId}\n`;
    report += `Session Duration: ${(Date.now() - this.sessionStartTime) / 1000} seconds\n\n`;
    
    report += `PERFORMANCE METRICS:\n`;
    
    // Group metrics by name
    const metricsByName: Record<string, PerformanceMetric[]> = {};
    
    for (const metric of this.performanceMetrics) {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric);
    }
    
    // Generate statistics for each metric type
    for (const [name, metrics] of Object.entries(metricsByName)) {
      const durations = metrics
        .filter(m => m.duration !== null)
        .map(m => m.duration!) as number[];
      
      if (durations.length === 0) continue;
      
      const avg = durations.reduce((sum, val) => sum + val, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      report += `\n${name}:\n`;
      report += `  Count: ${metrics.length}\n`;
      report += `  Avg: ${avg.toFixed(2)} ms\n`;
      report += `  Min: ${min} ms\n`;
      report += `  Max: ${max} ms\n`;
    }
    
    report += `\nRECENT ERRORS:\n`;
    const errors = this.logs.filter(log => log.level === LogLevel.ERROR);
    
    if (errors.length === 0) {
      report += `  No errors recorded\n`;
    } else {
      for (let i = 0; i < Math.min(5, errors.length); i++) {
        const error = errors[i];
        const date = new Date(error.timestamp).toISOString();
        report += `  [${date}] ${error.message}\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Check for performance issues
   * @returns Array of identified issues
   */
  public identifyPerformanceIssues(): { issue: string; severity: 'low' | 'medium' | 'high'; context?: any }[] {
    if (!this.isEnabled) return [];
    
    const issues: { issue: string; severity: 'low' | 'medium' | 'high'; context?: any }[] = [];
    
    // Check recording duration vs filesize ratio
    const recordingMetrics = this.performanceMetrics.filter(m => 
      m.name === 'recording_session' && m.duration !== null
    );
    
    for (const metric of recordingMetrics) {
      if (metric.context?.fileSize && metric.context?.durationMs) {
        const fileSizeKB = metric.context.fileSize / 1024;
        const durationSec = metric.context.durationMs / 1000;
        
        // KB per second of audio - extremely low suggests potential issues
        const kbPerSecond = fileSizeKB / durationSec;
        
        if (kbPerSecond < 5) {
          issues.push({
            issue: 'Very low recording bitrate detected',
            severity: 'high',
            context: {
              kbPerSecond,
              fileSize: fileSizeKB,
              duration: durationSec,
              metricId: metric.id
            }
          });
        } else if (kbPerSecond < 15) {
          issues.push({
            issue: 'Low recording bitrate detected',
            severity: 'medium',
            context: {
              kbPerSecond,
              fileSize: fileSizeKB,
              duration: durationSec,
              metricId: metric.id
            }
          });
        }
      }
    }
    
    // Check processing times
    const processingMetrics = this.performanceMetrics.filter(m => 
      m.name.startsWith('audio_processing_') && m.duration !== null
    );
    
    for (const metric of processingMetrics) {
      if (metric.duration && metric.duration > 10000) {
        issues.push({
          issue: `Long processing time for ${metric.name}`,
          severity: metric.duration > 30000 ? 'high' : 'medium',
          context: {
            duration: metric.duration,
            processingType: metric.name,
            metricId: metric.id
          }
        });
      }
    }
    
    // Check error frequency
    const errors = this.logs.filter(log => log.level === LogLevel.ERROR);
    const last30MinThreshold = Date.now() - (30 * 60 * 1000);
    const recentErrors = errors.filter(log => log.timestamp > last30MinThreshold);
    
    if (recentErrors.length >= 5) {
      issues.push({
        issue: 'High error frequency detected',
        severity: recentErrors.length >= 10 ? 'high' : 'medium',
        context: {
          errorCount: recentErrors.length,
          timeWindow: '30 minutes'
        }
      });
    }
    
    // Check for system interruptions
    const interruptions = this.performanceMetrics.filter(m => m.name === 'system_interruption');
    if (interruptions.length >= 3) {
      issues.push({
        issue: 'Frequent system interruptions',
        severity: 'medium',
        context: {
          count: interruptions.length,
          reasons: interruptions.map(i => i.context?.reason || 'unknown')
        }
      });
    }
    
    return issues;
  }
  
  /**
   * Clean up resources when service is no longer needed
   */
  public dispose(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
    
    // Flush data before disposing
    if (this.isEnabled) {
      this.flushToStorage().catch(console.error);
    }
  }
}

export default AudioMonitoringService;