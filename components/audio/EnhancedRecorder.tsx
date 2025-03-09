import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  RecordingProvider, 
  useRecording, 
  RecordingState,
  RecordingQuality,
  RecordingFormat 
} from '../../contexts/RecordingContext';
import RecordingFeedback from './feedback/RecordingFeedback';
import ErrorHandlingService from '../../services/ErrorHandlingService';
import RecoveryService from '../../services/RecoveryService';
import AudioMonitoringService from '../../services/AudioMonitoringService';
import { LogLevel } from '../../models/monitoring/MonitoringModels';

// Quality options for the UI
const QUALITY_OPTIONS = [
  { label: 'Low', value: RecordingQuality.LOW },
  { label: 'Standard', value: RecordingQuality.STANDARD },
  { label: 'High', value: RecordingQuality.HIGH },
  { label: 'Studio', value: RecordingQuality.STUDIO }
];

// Format options for the UI
const FORMAT_OPTIONS = [
  { label: 'M4A', value: RecordingFormat.M4A },
  { label: 'WAV', value: RecordingFormat.WAV },
  ...(Platform.OS === 'web' ? [{ label: 'WEBM', value: RecordingFormat.WEBM }] : []),
  // MP3 format requires additional processing, so we're not including it for now
];

// RecorderContent component that uses the RecordingContext
const RecorderContent = ({ onComplete }: { onComplete: (uri: string) => void }) => {
  const {
    recordingState,
    recordingUri,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    playRecording,
    pausePlayback,
    stopPlayback,
    settings,
    updateSettings,
    resetRecordingState,
    retryLastOperation,
    metadata
  } = useRecording();
  
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  
  // Services for error handling, recovery, and monitoring
  const errorHandler = ErrorHandlingService.getInstance();
  const recoveryService = RecoveryService.getInstance();
  const monitoringService = AudioMonitoringService.getInstance();
  
  // Track recording session
  const [recordingTrackingId, setRecordingTrackingId] = useState<string>('');
  
  // Track app state changes (foreground/background)
  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup function
    return () => {
      appStateListener.remove();
    };
  }, [recordingState]);
  
  // Handle app state changes (e.g., app goes to background)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Log app state changes
    monitoringService.log(LogLevel.INFO, `App state changed to: ${nextAppState}`, { 
      previousState: recordingState 
    });
    
    // Auto-pause recording when app goes to background
    if (nextAppState === 'background' && recordingState === RecordingState.RECORDING) {
      monitoringService.log(LogLevel.WARN, 'Recording auto-paused: app moved to background');
      
      // Set a flag for system interruption
      const interruptionMetricId = monitoringService.startMetric('system_interruption', {
        reason: 'app_to_background'
      });
      
      pauseRecording().catch(error => {
        monitoringService.logError(
          error instanceof Error ? error : new Error(String(error)),
          'auto_pause_on_background'
        );
      });
    }
    
    // Show alert when returning from background while recording was in progress
    if (nextAppState === 'active' && recordingState === RecordingState.PAUSED) {
      Alert.alert(
        'Recording Paused',
        'Your recording was paused while the app was in the background. Would you like to resume?',
        [
          {
            text: 'Resume',
            onPress: () => {
              resumeRecording().catch(error => {
                monitoringService.logError(
                  error instanceof Error ? error : new Error(String(error)),
                  'resume_after_background'
                );
              });
            },
          },
          {
            text: 'Stop Recording',
            style: 'destructive',
            onPress: () => {
              handleStopRecording();
            },
          },
          {
            text: 'Cancel Recording',
            style: 'cancel',
            onPress: () => {
              cancelRecording().catch(console.error);
            },
          },
        ]
      );
    }
  };
  
  // Monitor recording state changes
  useEffect(() => {
    monitoringService.log(LogLevel.INFO, `Recording state changed: ${recordingState}`, { 
      previousTrackingId: recordingTrackingId
    });
    
    // When a new recording starts, begin tracking it
    if (recordingState === RecordingState.RECORDING && !recordingTrackingId) {
      const trackingId = monitoringService.logRecordingStart(
        settings.quality,
        settings.format,
        {
          noiseReduction: settings.noiseReductionEnabled,
          autoSave: settings.autoSaveEnabled,
          autoStop: settings.autoStopAfterSeconds > 0,
          autoStopSeconds: settings.autoStopAfterSeconds,
        }
      );
      setRecordingTrackingId(trackingId);
    }
    
    // When recording completes or fails, end tracking
    if ((recordingState === RecordingState.COMPLETED || recordingState === RecordingState.ERROR) && recordingTrackingId) {
      const success = recordingState === RecordingState.COMPLETED;
      
      // Get file size if we have metadata
      let fileSize;
      let durationMs;
      
      if (metadata) {
        fileSize = metadata.sizeBytes;
        durationMs = metadata.durationMs;
      }
      
      monitoringService.logRecordingEnd(
        recordingTrackingId, 
        success,
        fileSize, 
        durationMs,
        { finalState: recordingState }
      );
      
      // Reset tracking ID for next recording
      setRecordingTrackingId('');
    }
  }, [recordingState, recordingTrackingId, settings, metadata]);
  
  // Handle auto-recovery for errors
  useEffect(() => {
    if (recordingState === RecordingState.ERROR) {
      const attemptAutoRecovery = async () => {
        // Only attempt auto-recovery for certain errors
        const lastError = errorHandler.getLastError();
        if (lastError && recoveryService.canAttemptAutoRecovery(`${lastError.type}-${lastError.message}`)) {
          try {
            // Log the recovery attempt
            monitoringService.log(LogLevel.INFO, 'Attempting auto-recovery', { 
              errorType: lastError.type,
              errorMessage: lastError.message
            });
            
            // Wait a bit before attempting recovery
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to recover
            await retryLastOperation();
            
            // Log successful recovery
            monitoringService.log(LogLevel.INFO, 'Auto-recovery successful');
          } catch (err) {
            monitoringService.logError(
              err instanceof Error ? err : new Error(String(err)),
              'auto_recovery_attempt',
              { originalError: lastError }
            );
          }
        }
      };
      
      attemptAutoRecovery();
    }
  }, [recordingState]);
  
  // Start recording with error handling and monitoring
  const handleStartRecording = async () => {
    try {
      monitoringService.log(LogLevel.INFO, 'Starting recording', {
        quality: settings.quality,
        format: settings.format
      });
      
      const initMetricId = monitoringService.startMetric('recording_initialization');
      
      await startRecording();
      
      monitoringService.endMetric(initMetricId, { successful: true });
    } catch (error) {
      // Log the error
      monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'start_recording',
        { settings }
      );
      
      // This should be handled by the context, but just in case
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };
  
  // Stop recording and process the result with monitoring
  const handleStopRecording = async () => {
    try {
      monitoringService.log(LogLevel.INFO, 'Stopping recording');
      
      const stopMetricId = monitoringService.startMetric('recording_finalization');
      
      const uri = await stopRecording();
      
      if (uri) {
        monitoringService.endMetric(stopMetricId, { successful: true, uri });
        console.log('Recording completed successfully:', uri);
      } else {
        monitoringService.endMetric(stopMetricId, { successful: false, error: 'No URI returned' });
      }
    } catch (error) {
      monitoringService.logError(
        error instanceof Error ? error : new Error(String(error)),
        'stop_recording'
      );
      
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };
  
  // Reset the recorder state with monitoring
  const handleReset = () => {
    monitoringService.log(LogLevel.INFO, 'Reset requested', { currentState: recordingState });
    
    if (recordingState === RecordingState.COMPLETED || recordingState === RecordingState.ERROR) {
      resetRecordingState();
    } else if (recordingState === RecordingState.RECORDING || recordingState === RecordingState.PAUSED) {
      Alert.alert(
        'Cancel Recording',
        'Are you sure you want to cancel this recording?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              monitoringService.log(LogLevel.INFO, 'Recording cancelled by user');
              await cancelRecording();
            },
          },
        ]
      );
    }
  };
  
  // Handle completed recording
  const handleComplete = () => {
    if (recordingUri) {
      monitoringService.log(LogLevel.INFO, 'Recording complete', { 
        uri: recordingUri,
        metadata: metadata
      });
      
      onComplete(recordingUri);
    }
  };
  
  // Update quality setting with monitoring
  const handleQualityChange = (quality: RecordingQuality) => {
    monitoringService.log(LogLevel.INFO, 'Quality setting changed', { 
      from: settings.quality,
      to: quality
    });
    
    updateSettings({ quality });
    setQualityMenuOpen(false);
  };
  
  // Update format setting with monitoring
  const handleFormatChange = (format: RecordingFormat) => {
    monitoringService.log(LogLevel.INFO, 'Format setting changed', { 
      from: settings.format,
      to: format
    });
    
    updateSettings({ format });
    setFormatMenuOpen(false);
  };
  
  // Toggle noise reduction with monitoring
  const toggleNoiseReduction = () => {
    const newValue = !settings.noiseReductionEnabled;
    
    monitoringService.log(LogLevel.INFO, 'Noise reduction setting changed', { 
      enabled: newValue
    });
    
    updateSettings({ noiseReductionEnabled: newValue });
  };
  
  // Export diagnostic data for troubleshooting
  const handleExportDiagnostics = async () => {
    try {
      const diagFileUri = await monitoringService.exportDiagnosticData();
      
      if (diagFileUri) {
        Alert.alert(
          'Diagnostics Exported',
          `Diagnostic data has been exported to:\n${diagFileUri}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to export diagnostic data');
      }
    } catch (error) {
      console.error('Failed to export diagnostics:', error);
      Alert.alert('Error', 'Failed to export diagnostic data');
    }
  };
  
  // Check for performance issues
  const handleAnalyzePerformance = () => {
    const issues = monitoringService.identifyPerformanceIssues();
    
    if (issues.length === 0) {
      Alert.alert('Performance Analysis', 'No issues detected with recording performance.');
      return;
    }
    
    // Format issues for display
    const issuesText = issues.map(issue => 
      `[${issue.severity.toUpperCase()}] ${issue.issue}`
    ).join('\n');
    
    Alert.alert(
      'Performance Issues Detected',
      `The following issues were detected:\n\n${issuesText}`
    );
  };
  
  // Render primary action button based on state
  const renderActionButton = () => {
    switch (recordingState) {
      case RecordingState.IDLE:
      case RecordingState.READY:
        return (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartRecording}
            testID="start-recording-button"
          >
            <Ionicons name="mic" size={32} color="#FFF" />
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        );
        
      case RecordingState.RECORDING:
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pauseRecording}
              testID="pause-recording-button"
            >
              <Ionicons name="pause" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleStopRecording}
              testID="stop-recording-button"
            >
              <Ionicons name="stop" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
        
      case RecordingState.PAUSED:
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={resumeRecording}
              testID="resume-recording-button"
            >
              <Ionicons name="play" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleStopRecording}
              testID="stop-recording-button"
            >
              <Ionicons name="stop" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
        
      case RecordingState.PROCESSING:
        return (
          <View style={[styles.button, styles.disabledButton]}>
            <ActivityIndicator color="#FFF" size="small" />
            <Text style={styles.buttonText}>Processing...</Text>
          </View>
        );
        
      case RecordingState.COMPLETED:
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={recordingState === RecordingState.PLAYBACK ? pausePlayback : playRecording}
              testID="playback-button"
            >
              <Ionicons 
                name={recordingState === RecordingState.PLAYBACK ? "pause" : "play"} 
                size={32} 
                color="#FFF" 
              />
              <Text style={styles.buttonText}>
                {recordingState === RecordingState.PLAYBACK ? "Pause" : "Play"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleComplete}
              testID="complete-button"
            >
              <Ionicons name="checkmark" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Use Recording</Text>
            </TouchableOpacity>
          </View>
        );
        
      case RecordingState.PLAYBACK:
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pausePlayback}
              testID="pause-playback-button"
            >
              <Ionicons name="pause" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleComplete}
              testID="complete-button"
            >
              <Ionicons name="checkmark" size={32} color="#FFF" />
              <Text style={styles.buttonText}>Use Recording</Text>
            </TouchableOpacity>
          </View>
        );
        
      case RecordingState.ERROR:
        return (
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={retryLastOperation}
            testID="retry-button"
          >
            <Ionicons name="refresh" size={32} color="#FFF" />
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        );
        
      default:
        return (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartRecording}
            testID="start-recording-button"
          >
            <Ionicons name="mic" size={32} color="#FFF" />
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        );
    }
  };
  
  // Render settings menu
  const renderSettings = () => {
    if (recordingState === RecordingState.IDLE || 
        recordingState === RecordingState.READY || 
        recordingState === RecordingState.ERROR) {
      return (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Recording Settings</Text>
          
          {/* Quality Selector */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Quality:</Text>
            <TouchableOpacity 
              style={styles.settingSelector}
              onPress={() => setQualityMenuOpen(!qualityMenuOpen)}
            >
              <Text style={styles.settingValue}>
                {QUALITY_OPTIONS.find(opt => opt.value === settings.quality)?.label || 'Standard'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            
            {qualityMenuOpen && (
              <View style={styles.dropdownMenu}>
                {QUALITY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownItem,
                      settings.quality === option.value && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleQualityChange(option.value)}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                    {settings.quality === option.value && (
                      <Ionicons name="checkmark" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Format Selector */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Format:</Text>
            <TouchableOpacity 
              style={styles.settingSelector}
              onPress={() => setFormatMenuOpen(!formatMenuOpen)}
            >
              <Text style={styles.settingValue}>
                {FORMAT_OPTIONS.find(opt => opt.value === settings.format)?.label || 'M4A'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            
            {formatMenuOpen && (
              <View style={styles.dropdownMenu}>
                {FORMAT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownItem,
                      settings.format === option.value && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleFormatChange(option.value)}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                    {settings.format === option.value && (
                      <Ionicons name="checkmark" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Noise Reduction Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Noise Reduction:</Text>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={toggleNoiseReduction}
            >
              <View style={[
                styles.toggleTrack,
                settings.noiseReductionEnabled && styles.toggleTrackActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  settings.noiseReductionEnabled && styles.toggleThumbActive
                ]} />
              </View>
              <Text style={styles.toggleText}>
                {settings.noiseReductionEnabled ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return null;
  };
  
  // Render cancel/reset button
  const renderResetButton = () => {
    if (recordingState !== RecordingState.IDLE && recordingState !== RecordingState.REQUESTING_PERMISSION) {
      return (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          testID="reset-button"
        >
          <Ionicons name="refresh-outline" size={24} color="#666" />
          <Text style={styles.resetButtonText}>
            {recordingState === RecordingState.RECORDING || recordingState === RecordingState.PAUSED
              ? 'Cancel'
              : 'Reset'}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return null;
  };
  
  // Add diagnostic tools to settings menu
  const renderDiagnosticTools = () => {
    if (recordingState === RecordingState.COMPLETED || recordingState === RecordingState.ERROR) {
      return (
        <View style={styles.diagnosticContainer}>
          <Text style={styles.diagnosticTitle}>Diagnostic Tools</Text>
          
          <TouchableOpacity 
            style={styles.diagnosticButton}
            onPress={handleExportDiagnostics}
          >
            <Ionicons name="document-text-outline" size={20} color="#007AFF" />
            <Text style={styles.diagnosticButtonText}>Export Diagnostics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.diagnosticButton}
            onPress={handleAnalyzePerformance}
          >
            <Ionicons name="analytics-outline" size={20} color="#007AFF" />
            <Text style={styles.diagnosticButtonText}>Analyze Performance</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Audio Recorder</Text>
        
        {/* Recording Feedback Component */}
        <RecordingFeedback 
          showMetrics={true}
          showWaveform={true}
          style={styles.feedback}
        />
        
        {/* Settings */}
        {renderSettings()}
        
        {/* Diagnostic Tools */}
        {renderDiagnosticTools()}
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {renderActionButton()}
          {renderResetButton()}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Main component that wraps the content with the RecordingProvider
const EnhancedRecorder = ({ onComplete }: { onComplete: (uri: string) => void }) => {
  return (
    <RecordingProvider>
      <RecorderContent onComplete={onComplete} />
    </RecordingProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  feedback: {
    marginBottom: 20,
  },
  actionContainer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 150,
    margin: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5AC8FA',
  },
  warningButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  resetButton: {
    marginTop: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#666',
    marginLeft: 5,
  },
  settingsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  settingLabel: {
    fontSize: 14,
    color: '#444',
  },
  settingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingValue: {
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTrack: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#4CD964',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 26 }],
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  diagnosticContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  diagnosticTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  diagnosticButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
    marginVertical: 5,
  },
  diagnosticButtonText: {
    marginLeft: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default EnhancedRecorder; 