export interface MasteringOptions {
  targetLoudness: number;
  enhanceStereoImage: boolean;
  profileName: string;
  
  dynamicProcessing: {
    compression: number;
    limitingThreshold: number;
    noiseReduction: number;
  };
  
  equalization: {
    lowBoost: number;
    midBoost: number;
    highBoost: number;
    lowCutFrequency: number;
    highCutFrequency: number;
  };
  
  outputFormat: {
    fileFormat: 'mp3' | 'wav' | 'aac' | 'flac';
    sampleRate: number;
    bitDepth: number;
    bitRate: number;
  };
}

export interface MasteringResult {
  id: string;
  originalFileUrl: string;
  processedFileUrl: string;
  waveformDataBefore: number[];
  waveformDataAfter: number[];
  
  processingMetadata: {
    peakLoudness: number;
    averageLoudness: number;
    dynamicRange: number;
    stereoWidth: number;
    processedAt: string;
    processingTime: number;
    apiProvider: string;
  };
  
  options: MasteringOptions;
  
  projectId?: string;
  trackId?: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
