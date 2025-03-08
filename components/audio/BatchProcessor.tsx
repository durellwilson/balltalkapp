import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import BatchProcessingService, { 
  BatchJobType, 
  BatchJobStatus,
  BatchProcessingJob,
  BatchJobItem
} from '../../services/audio/BatchProcessingService';
import DolbyMasteringService, { DolbyEnhancementOptions } from '../../services/audio/DolbyMasteringService';
import VocalIsolationService, { VocalIsolationMode, VocalIsolationOptions } from '../../services/audio/VocalIsolationService';

interface BatchProcessorProps {
  userId: string;
  projectId?: string;
  onJobComplete?: (job: BatchProcessingJob) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({
  userId,
  projectId,
  onJobComplete
}) => {
  // State for selected files
  const [selectedFiles, setSelectedFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  
  // State for job type
  const [jobType, setJobType] = useState<BatchJobType>(BatchJobType.ENHANCEMENT);
  
  // State for options
  const [enhancementOptions, setEnhancementOptions] = useState<DolbyEnhancementOptions>(
    DolbyMasteringService.getDefaultEnhancementOptions()
  );
  
  const [vocalIsolationOptions, setVocalIsolationOptions] = useState<VocalIsolationOptions>(
    VocalIsolationService.getDefaultVocalIsolationOptions()
  );
  
  // State for current job
  const [currentJob, setCurrentJob] = useState<BatchProcessingJob | null>(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  // State for jobs
  const [jobs, setJobs] = useState<BatchProcessingJob[]>([]);
  
  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);
  
  // Load jobs
  const loadJobs = async () => {
    try {
      const userJobs = await BatchProcessingService.getBatchJobs(userId);
      setJobs(userJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setMessage('Failed to load jobs');
    }
  };
  
  // Pick audio files
  const pickAudioFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: true
      });
      
      if (result.canceled) {
        return;
      }
      
      setSelectedFiles(result.assets);
      setMessage(`Selected ${result.assets.length} audio files`);
    } catch (error) {
      console.error('Error picking audio files:', error);
      setMessage('Failed to pick audio files');
    }
  };
  
  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setMessage('');
  };
  
  // Create and start batch job
  const createAndStartJob = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No Files Selected', 'Please select at least one audio file to process.');
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage('Creating batch job...');
      
      // Get audio URIs and names
      const audioUris = selectedFiles.map(file => file.uri);
      const audioNames = selectedFiles.map(file => file.name || 'Unknown');
      
      // Get options based on job type
      let options;
      switch (jobType) {
        case BatchJobType.ENHANCEMENT:
          options = enhancementOptions;
          break;
          
        case BatchJobType.VOCAL_ISOLATION:
          options = vocalIsolationOptions;
          break;
          
        case BatchJobType.MASTERING:
          options = DolbyMasteringService.getDefaultMasteringOptions();
          break;
          
        case BatchJobType.ANALYSIS:
          options = {};
          break;
          
        default:
          options = {};
      }
      
      // Create batch job
      const job = await BatchProcessingService.createBatchJob(
        userId,
        jobType,
        audioUris,
        audioNames,
        options,
        projectId
      );
      
      // Start batch job
      const startedJob = await BatchProcessingService.startBatchJob(job.id);
      
      // Update state
      setCurrentJob(startedJob);
      setSelectedFiles([]);
      setMessage(`Started batch job with ${startedJob.items.length} files`);
      
      // Reload jobs
      await loadJobs();
      
      // Call callback if provided
      if (onJobComplete) {
        onJobComplete(startedJob);
      }
    } catch (error) {
      console.error('Error creating batch job:', error);
      setMessage('Failed to create batch job');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel job
  const cancelJob = async (jobId: string) => {
    try {
      setIsLoading(true);
      
      // Cancel job
      await BatchProcessingService.cancelBatchJob(jobId);
      
      // Reload jobs
      await loadJobs();
      
      setMessage('Job cancelled');
    } catch (error) {
      console.error('Error cancelling job:', error);
      setMessage('Failed to cancel job');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Retry job item
  const retryJobItem = async (jobId: string, itemId: string) => {
    try {
      setIsLoading(true);
      
      // Retry job item
      await BatchProcessingService.retryBatchJobItem(jobId, itemId);
      
      // Reload jobs
      await loadJobs();
      
      setMessage('Job item retrying');
    } catch (error) {
      console.error('Error retrying job item:', error);
      setMessage('Failed to retry job item');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get job type label
  const getJobTypeLabel = (type: BatchJobType): string => {
    switch (type) {
      case BatchJobType.ENHANCEMENT:
        return 'Audio Enhancement';
      case BatchJobType.MASTERING:
        return 'Audio Mastering';
      case BatchJobType.VOCAL_ISOLATION:
        return 'Vocal Isolation';
      case BatchJobType.ANALYSIS:
        return 'Audio Analysis';
      default:
        return 'Unknown';
    }
  };
  
  // Get job status label and color
  const getJobStatusInfo = (status: BatchJobStatus): { label: string; color: string } => {
    switch (status) {
      case BatchJobStatus.PENDING:
        return { label: 'Pending', color: '#FFA500' };
      case BatchJobStatus.PROCESSING:
        return { label: 'Processing', color: '#007AFF' };
      case BatchJobStatus.COMPLETED:
        return { label: 'Completed', color: '#4CAF50' };
      case BatchJobStatus.FAILED:
        return { label: 'Failed', color: '#F44336' };
      case BatchJobStatus.CANCELLED:
        return { label: 'Cancelled', color: '#9E9E9E' };
      default:
        return { label: 'Unknown', color: '#9E9E9E' };
    }
  };
  
  // Render job item
  const renderJobItem = ({ item }: { item: BatchJobItem }) => {
    const statusInfo = getJobStatusInfo(item.status);
    
    return (
      <View style={styles.jobItemContainer}>
        <View style={styles.jobItemHeader}>
          <Text style={styles.jobItemName} numberOfLines={1} ellipsizeMode="middle">
            {item.audioName || 'Unknown'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
        
        {item.status === BatchJobStatus.FAILED && item.error && (
          <Text style={styles.errorText}>{item.error}</Text>
        )}
        
        {item.status === BatchJobStatus.FAILED && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => retryJobItem(currentJob?.id || '', item.id)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render job
  const renderJob = (job: BatchProcessingJob) => {
    const statusInfo = getJobStatusInfo(job.status);
    const completedItems = job.items.filter(
      item => item.status === BatchJobStatus.COMPLETED
    ).length;
    const failedItems = job.items.filter(
      item => item.status === BatchJobStatus.FAILED
    ).length;
    
    return (
      <View style={styles.jobContainer}>
        <View style={styles.jobHeader}>
          <View>
            <Text style={styles.jobTitle}>{getJobTypeLabel(job.jobType)}</Text>
            <Text style={styles.jobDate}>
              {new Date(job.createdAt).toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${job.progress}%` }]} />
          <Text style={styles.progressText}>{job.progress}%</Text>
        </View>
        
        <Text style={styles.jobStats}>
          {job.items.length} files • {completedItems} completed • {failedItems} failed
        </Text>
        
        <FlatList
          data={job.items}
          renderItem={renderJobItem}
          keyExtractor={item => item.id}
          style={styles.itemsList}
        />
        
        {job.status === BatchJobStatus.PROCESSING && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => cancelJob(job.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Job</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render enhancement options
  const renderEnhancementOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsTitle}>Enhancement Options</Text>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Noise Reduction:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={enhancementOptions.noiseReduction}
            onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, noiseReduction: value }))}
            style={styles.picker}
          >
            <Picker.Item label="None" value={0} />
            <Picker.Item label="Low" value={0.3} />
            <Picker.Item label="Medium" value={0.6} />
            <Picker.Item label="High" value={0.9} />
          </Picker>
        </View>
      </View>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Loudness:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={enhancementOptions.loudness}
            onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, loudness: value }))}
            style={styles.picker}
          >
            <Picker.Item label="Default" value={-14} />
            <Picker.Item label="Quieter" value={-18} />
            <Picker.Item label="Louder" value={-10} />
          </Picker>
        </View>
      </View>
    </View>
  );
  
  // Render vocal isolation options
  const renderVocalIsolationOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsTitle}>Vocal Isolation Options</Text>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Mode:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vocalIsolationOptions.mode}
            onValueChange={(value) => setVocalIsolationOptions(prev => ({ ...prev, mode: value }))}
            style={styles.picker}
          >
            <Picker.Item label="Vocals Only" value={VocalIsolationMode.VOCALS_ONLY} />
            <Picker.Item label="Instrumental Only" value={VocalIsolationMode.INSTRUMENTAL_ONLY} />
            <Picker.Item label="Separate Tracks" value={VocalIsolationMode.SEPARATE_TRACKS} />
          </Picker>
        </View>
      </View>
    </View>
  );
  
  // Render options based on job type
  const renderOptions = () => {
    switch (jobType) {
      case BatchJobType.ENHANCEMENT:
        return renderEnhancementOptions();
        
      case BatchJobType.VOCAL_ISOLATION:
        return renderVocalIsolationOptions();
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.jobTypeContainer}>
        <Text style={styles.sectionTitle}>Process Type</Text>
        
        <View style={styles.jobTypeButtons}>
          {Object.values(BatchJobType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.jobTypeButton,
                jobType === type && styles.jobTypeButtonActive
              ]}
              onPress={() => setJobType(type)}
            >
              <Text
                style={[
                  styles.jobTypeButtonText,
                  jobType === type && styles.jobTypeButtonTextActive
                ]}
              >
                {getJobTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {renderOptions()}
      
      <View style={styles.filesContainer}>
        <View style={styles.filesHeader}>
          <Text style={styles.sectionTitle}>Audio Files</Text>
          
          {selectedFiles.length > 0 && (
            <TouchableOpacity onPress={clearSelectedFiles}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {selectedFiles.length > 0 ? (
          <FlatList
            data={selectedFiles}
            renderItem={({ item }) => (
              <View style={styles.fileItem}>
                <Ionicons name="musical-note" size={24} color="#007AFF" />
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                  {item.name}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.uri}
            style={styles.filesList}
          />
        ) : (
          <TouchableOpacity style={styles.pickButton} onPress={pickAudioFiles}>
            <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
            <Text style={styles.pickButtonText}>Select Audio Files</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {message ? (
        <Text style={styles.messageText}>{message}</Text>
      ) : null}
      
      {selectedFiles.length > 0 && (
        <TouchableOpacity
          style={styles.processButton}
          onPress={createAndStartJob}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.processButtonText}>
                Start Processing {selectedFiles.length} Files
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {currentJob && renderJob(currentJob)}
      
      {jobs.length > 0 && !currentJob && (
        <View style={styles.recentJobsContainer}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          
          <FlatList
            data={jobs}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentJobItem}
                onPress={() => setCurrentJob(item)}
              >
                <View style={styles.recentJobHeader}>
                  <Text style={styles.recentJobTitle}>{getJobTypeLabel(item.jobType)}</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getJobStatusInfo(item.status).color }
                  ]}>
                    <Text style={styles.statusText}>{getJobStatusInfo(item.status).label}</Text>
                  </View>
                </View>
                
                <Text style={styles.recentJobDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                
                <Text style={styles.recentJobStats}>
                  {item.items.length} files • {item.progress}% complete
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={styles.recentJobsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  jobTypeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  jobTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  jobTypeButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  jobTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  jobTypeButtonText: {
    color: '#333333',
    fontWeight: '500',
  },
  jobTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  pickerContainer: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  filesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  pickButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  filesList: {
    maxHeight: 150,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  processButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  processButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  jobContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  jobDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    height: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  jobStats: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 200,
  },
  jobItemContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  jobItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  recentJobsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentJobsList: {
    maxHeight: 300,
  },
  recentJobItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recentJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentJobTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  recentJobDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  recentJobStats: {
    fontSize: 12,
    color: '#666666',
  },
});

export default BatchProcessor; 