/**
 * Log levels for monitoring and diagnostics
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Performance metric for tracking operation durations and characteristics
 */
export interface PerformanceMetric {
  /** Unique identifier for the metric */
  id: string;
  
  /** Name of the metric/operation being tracked */
  name: string;
  
  /** Start timestamp in milliseconds */
  startTime: number;
  
  /** End timestamp in milliseconds (null if operation is ongoing) */
  endTime: number | null;
  
  /** Duration in milliseconds (null if operation is ongoing) */
  duration: number | null;
  
  /** Additional context for the operation */
  context: Record<string, any>;
  
  /** Session identifier for grouping metrics */
  sessionId: string;
}

/**
 * Device characteristics that might impact audio recording quality
 */
export interface DeviceCharacteristics {
  /** Operating system */
  platform: string;
  
  /** OS version */
  platformVersion: string | number;
  
  /** Device model if available */
  deviceModel?: string;
  
  /** Memory status if available */
  memoryInfo?: {
    totalMemory?: number;
    freeMemory?: number;
  };
  
  /** Storage status if available */
  storageInfo?: {
    totalStorage?: number;
    freeStorage?: number;
  };
  
  /** Battery level if available */
  batteryInfo?: {
    level?: number;
    charging?: boolean;
  };
}

/**
 * Key performance indicators for audio recording
 */
export interface AudioPerformanceKPIs {
  /** Average audio bitrate in kbps */
  averageBitrate?: number;
  
  /** Mean recording initialization time in ms */
  avgRecordingInitTime?: number;
  
  /** Average processing time in ms */
  avgProcessingTime?: number;
  
  /** Error rate (errors per recording hour) */
  errorRate?: number;
  
  /** Success rate of recordings (0-100%) */
  successRate?: number;
  
  /** Number of recordings with poor quality characteristics */
  poorQualityCount?: number;
  
  /** Average file size per minute of audio */
  avgFileSizePerMinute?: number;
}

/**
 * Audio processing benchmark result
 */
export interface ProcessingBenchmark {
  /** Name of the processing operation */
  name: string;
  
  /** Duration in milliseconds */
  durationMs: number;
  
  /** Input file characteristics */
  input: {
    durationMs?: number;
    sizeBytes?: number;
    format?: string;
    sampleRate?: number;
    channels?: number;
  };
  
  /** Output file characteristics */
  output: {
    sizeBytes?: number;
    format?: string;
    sampleRate?: number;
    channels?: number;
  };
  
  /** CPU usage during processing */
  cpuUsage?: number;
  
  /** Memory usage during processing */
  memoryUsage?: number;
  
  /** Timestamp when benchmark was conducted */
  timestamp: number;
}

/**
 * Monitoring settings
 */
export interface MonitoringSettings {
  /** Whether monitoring is enabled */
  isEnabled: boolean;
  
  /** Whether to log debug/verbose messages */
  isVerboseLogging: boolean;
  
  /** Whether to automatically flush data to storage */
  isAutoFlush: boolean;
  
  /** Max log entries to keep */
  maxLogEntries?: number;
  
  /** Max metric entries to keep */
  maxMetricEntries?: number;
}

/**
 * Audio processing error classification
 */
export enum AudioErrorType {
  /** Permission not granted */
  PERMISSION_DENIED = 'permission_denied',
  
  /** Interruption by call, other app, etc. */
  INTERRUPTION = 'interruption',
  
  /** Out of storage space */
  STORAGE_FULL = 'storage_full',
  
  /** Format compatibility issues */
  FORMAT_ERROR = 'format_error',
  
  /** Corrupted audio file */
  FILE_CORRUPTION = 'file_corruption',
  
  /** Network connectivity issues */
  NETWORK_ERROR = 'network_error',
  
  /** Operation timeout */
  TIMEOUT = 'timeout',
  
  /** Out of memory */
  MEMORY_ERROR = 'memory_error',
  
  /** Device hardware limitation */
  HARDWARE_LIMITATION = 'hardware_limitation',
  
  /** Unknown/uncategorized error */
  UNKNOWN = 'unknown'
}

/**
 * Diagnostic report format
 */
export interface DiagnosticReport {
  /** System info */
  systemInfo: {
    /** Platform */
    platform: string;
    
    /** OS version */
    platformVersion: string | number;
    
    /** Report generation timestamp */
    timestamp: string;
    
    /** Session identifier */
    sessionId: string;
    
    /** Session duration in ms */
    sessionDuration: number;
    
    /** Network connectivity state */
    network: {
      isConnected: boolean;
      connectionType?: string;
      isInternetReachable?: boolean;
    };
  };
  
  /** Collected performance metrics */
  performanceMetrics: PerformanceMetric[];
  
  /** Activity logs */
  logs: Array<{
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
  }>;
  
  /** Monitoring settings */
  settings: MonitoringSettings;
  
  /** Detected issues */
  detectedIssues?: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    context?: any;
  }>;
} 