/**
 * Mock implementation of Dolby.io Media Processing API
 * 
 * This is used when the actual Dolby.io package is not available
 */

export interface DolbyProcessingOptions {
  profile?: string;
  outputFormat?: string;
  targetLoudness?: number;
  stereoEnhancement?: string;
  dynamicEQ?: boolean;
  limitingMode?: string;
}

export interface DolbyProcessingResult {
  url: string;
  metadata?: {
    loudness: number;
    peakLevel: number;
    dynamicRange: number;
    processingTime: number;
  };
}

export interface DolbyAnalysisResult {
  loudness: number;
  peakLevel: number;
  dynamicRange: number;
  spectralContent: number[];
}

class MockDolbyClient {
  async analyze(audioUrl: string): Promise<DolbyAnalysisResult> {
    console.log('MOCK: Analyzing audio file:', audioUrl);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock analysis data
    return {
      loudness: -14,
      peakLevel: -1.2,
      dynamicRange: 12,
      spectralContent: Array(100).fill(0).map(() => Math.random() * 100)
    };
  }
  
  async process(audioUrl: string, options: DolbyProcessingOptions): Promise<DolbyProcessingResult> {
    console.log('MOCK: Processing audio file:', audioUrl);
    console.log('MOCK: Processing options:', options);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock processing result
    return {
      url: `${audioUrl.split('.')[0]}_processed.wav`,
      metadata: {
        loudness: options.targetLoudness || -14,
        peakLevel: -0.1,
        dynamicRange: 8,
        processingTime: 2.1
      }
    };
  }
}

export function createClient(apiKey?: string, apiSecret?: string) {
  console.warn('Using mock Dolby.io client implementation');
  return new MockDolbyClient();
}
