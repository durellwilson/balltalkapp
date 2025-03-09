/**
 * WebAudioRecordingService
 * 
 * A specialized service for handling audio recording on web platforms.
 * This service provides a more robust implementation for web browsers
 * where the Expo Audio API has limitations.
 */

import AudioProcessingService from './AudioProcessingService';

interface RecordingResult {
  uri: string;
  duration: number;
  size?: number;
  waveformData?: number[];
  audioBlob?: Blob;
}

interface RecordingOptions {
  // Audio quality settings
  sampleRate?: number;
  numberOfChannels?: number;
  bitRate?: number;
  
  // Effects settings
  applyEffects?: boolean;
  compression?: boolean;
  equalization?: boolean;
  noiseSuppression?: boolean;
  normalization?: boolean;
  reverb?: boolean;
  
  // Advanced settings
  noiseGateThreshold?: number; // Threshold for noise gate in dB (-100 to 0)
  compressorThreshold?: number; // Threshold for compressor in dB (-100 to 0)
  compressorRatio?: number; // Ratio for compressor (1 to 20)
  highPassFilter?: boolean; // Whether to apply high-pass filter to remove rumble
  highPassFrequency?: number; // Frequency for high-pass filter in Hz
}

// Default recording options for studio quality
const DEFAULT_RECORDING_OPTIONS: RecordingOptions = {
  sampleRate: 48000, // Professional quality (48kHz)
  numberOfChannels: 2,
  bitRate: 256000, // 256kbps for better quality
  applyEffects: true,
  compression: true,
  equalization: true,
  noiseSuppression: true,
  normalization: true,
  reverb: false,
  noiseGateThreshold: -50, // -50dB threshold for noise gate
  compressorThreshold: -24, // -24dB threshold for compressor
  compressorRatio: 4, // 4:1 compression ratio
  highPassFilter: true, // Apply high-pass filter
  highPassFrequency: 80 // 80Hz high-pass to remove rumble
};

class WebAudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private recordingOptions: RecordingOptions = DEFAULT_RECORDING_OPTIONS;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private highPassFilterNode: BiquadFilterNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private noiseGateNode: GainNode | null = null;
  private lastRMS: number = -100;
  private processingInterval: number | null = null;

  /**
   * Request microphone permissions
   * @returns Promise<boolean> - Whether permissions were granted
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting microphone permissions...');
      
      // Request user media with audio - use detailed constraints for better quality
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: this.recordingOptions.numberOfChannels || 2 },
          sampleRate: { ideal: this.recordingOptions.sampleRate || 48000 },
          sampleSize: { ideal: 24 } // 24-bit audio for better dynamic range
        } 
      });
      
      // Initialize audio context and analyzer
      this.initializeAudioContext();
      
      console.log('Microphone permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting microphone permissions:', error);
      return false;
    }
  }
  
  /**
   * Initialize the audio context and analyzer
   */
  private initializeAudioContext(): void {
    try {
      // Create audio context with high sample rate
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext({
        sampleRate: this.recordingOptions.sampleRate || 48000,
        latencyHint: 'interactive'
      });
      
      if (!this.stream) {
        console.error('No media stream available');
        return;
      }
      
      // Create source node from the input stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create analyzer node for visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
      
      // Create high-pass filter to remove rumble if enabled
      if (this.recordingOptions.highPassFilter) {
        this.highPassFilterNode = this.audioContext.createBiquadFilter();
        this.highPassFilterNode.type = 'highpass';
        this.highPassFilterNode.frequency.value = this.recordingOptions.highPassFrequency || 80;
        this.highPassFilterNode.Q.value = 0.7; // Moderate Q for natural sound
      }
      
      // Create compressor for more consistent levels if enabled
      if (this.recordingOptions.compression) {
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNode.threshold.value = this.recordingOptions.compressorThreshold || -24;
        this.compressorNode.ratio.value = this.recordingOptions.compressorRatio || 4;
        this.compressorNode.attack.value = 0.003; // Fast attack
        this.compressorNode.release.value = 0.25; // Moderate release
        this.compressorNode.knee.value = 10; // Soft knee for natural compression
      }
      
      // Create gain node for volume control and noise gate
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0; // Default gain
      
      // Create noise gate node
      this.noiseGateNode = this.audioContext.createGain();
      this.noiseGateNode.gain.value = 1.0; // Start with gate open
      
      // Create destination node for processed audio
      this.destinationNode = this.audioContext.createMediaStreamDestination();
      
      // Connect the audio processing chain
      this.sourceNode.connect(this.analyserNode);
      
      let lastNode: AudioNode = this.analyserNode;
      
      // Add high-pass filter to chain if enabled
      if (this.highPassFilterNode) {
        lastNode.connect(this.highPassFilterNode);
        lastNode = this.highPassFilterNode;
      }
      
      // Add compressor to chain if enabled
      if (this.compressorNode) {
        lastNode.connect(this.compressorNode);
        lastNode = this.compressorNode;
      }
      
      // Add noise gate to chain
      lastNode.connect(this.noiseGateNode);
      lastNode = this.noiseGateNode;
      
      // Add gain node to chain
      lastNode.connect(this.gainNode);
      
      // Connect to destination
      this.gainNode.connect(this.destinationNode);
      
      // Store the processed stream
      this.processedStream = this.destinationNode.stream;
      
      console.log('Audio context and processing chain initialized');
      
      // Start noise gate processing if enabled
      if (this.recordingOptions.noiseSuppression) {
        this.startNoiseGateProcessing();
      }
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }
  
  /**
   * Start noise gate processing
   */
  private startNoiseGateProcessing(): void {
    if (!this.analyserNode || !this.noiseGateNode) return;
    
    // Clear any existing interval
    if (this.processingInterval) {
      window.clearInterval(this.processingInterval);
    }
    
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const threshold = this.recordingOptions.noiseGateThreshold || -50;
    
    // Process audio every 50ms to update noise gate
    this.processingInterval = window.setInterval(() => {
      if (!this.analyserNode || !this.noiseGateNode) return;
      
      // Get time domain data
      this.analyserNode.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS (root mean square) value
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      
      // Convert to dB
      const rmsDb = 20 * Math.log10(rms);
      
      // Smooth the RMS value
      this.lastRMS = this.lastRMS * 0.8 + rmsDb * 0.2;
      
      // Apply noise gate
      if (this.lastRMS < threshold) {
        // Gradually close the gate for natural sound
        this.noiseGateNode.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.1);
      } else {
        // Quickly open the gate
        this.noiseGateNode.gain.setTargetAtTime(1, this.audioContext!.currentTime, 0.01);
      }
    }, 50);
  }
  
  /**
   * Set recording options
   * @param options - Partial recording options to update
   */
  setRecordingOptions(options: Partial<RecordingOptions>): void {
    this.recordingOptions = { ...this.recordingOptions, ...options };
    console.log('Recording options updated:', this.recordingOptions);
    
    // Reinitialize audio context if already created
    if (this.audioContext && this.stream) {
      this.cleanup();
      this.initializeAudioContext();
    }
  }
  
  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      console.log('Starting web audio recording...');
      
      // Request permissions if not already granted
      if (!this.stream) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permissions not granted');
        }
      }

      // Initialize the MediaRecorder with optimal settings
      this.audioChunks = [];
      
      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: this.recordingOptions.bitRate
      };
      
      // Create a new MediaRecorder instance using the processed stream
      try {
        // Use the processed stream if available, otherwise use the raw stream
        const streamToRecord = this.processedStream || this.stream;
        this.mediaRecorder = new MediaRecorder(streamToRecord!, options);
        console.log('MediaRecorder created with options:', options);
      } catch (err) {
        console.error('Failed to create MediaRecorder with options, trying without options:', err);
        // Fallback to default options
        const streamToRecord = this.processedStream || this.stream;
        this.mediaRecorder = new MediaRecorder(streamToRecord!);
      }
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`Received audio chunk: ${event.data.size} bytes`);
        } else {
          console.warn('Received empty audio chunk');
        }
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };

      // Start recording with small timeslice for more frequent ondataavailable events
      // This helps with more accurate visualization
      this.mediaRecorder.start(500); // Larger timeslice for more stable chunks
      this.startTime = Date.now();
      this.isRecording = true;
      this.isPaused = false;
      
      console.log('Web audio recording started with options:', options);
    } catch (error) {
      console.error('Error starting web audio recording:', error);
      this.cleanup();
      throw error;
    }
  }
  
  /**
   * Get supported MIME type for recording
   * @returns string - The supported MIME type
   */
  private getSupportedMimeType(): string {
    // Check for browser-specific high-quality codecs first
    const highQualityTypes = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/wave'
    ];
    
    // Fallback types
    const fallbackTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ];
    
    // Try high-quality types first
    for (const type of highQualityTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using high-quality MIME type:', type);
        return type;
      }
    }
    
    // Fall back to other types
    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using fallback MIME type:', type);
        return type;
      }
    }
    
    console.warn('No preferred MIME types supported, using default');
    return '';
  }
  
  /**
   * Get audio levels for visualization
   * @returns Uint8Array - Audio frequency data
   */
  getAudioLevels(): Uint8Array | null {
    if (!this.analyserNode) return null;
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Pause the current recording
   * @returns Promise<void>
   */
  async pauseRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('Not recording or recorder not initialized');
      return;
    }

    if (this.isPaused) {
      console.warn('Recording already paused');
      return;
    }

    try {
      // Check if the browser supports pause/resume
      if (this.mediaRecorder.state === 'recording' && 'pause' in this.mediaRecorder) {
        this.mediaRecorder.pause();
        this.isPaused = true;
        console.log('Web audio recording paused');
      } else {
        console.warn('Pause not supported in this browser');
      }
    } catch (error) {
      console.error('Error pausing web audio recording:', error);
      throw error;
    }
  }

  /**
   * Resume a paused recording
   * @returns Promise<void>
   */
  async resumeRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('Not recording or recorder not initialized');
      return;
    }

    if (!this.isPaused) {
      console.warn('Recording not paused');
      return;
    }

    try {
      // Check if the browser supports pause/resume
      if (this.mediaRecorder.state === 'paused' && 'resume' in this.mediaRecorder) {
        this.mediaRecorder.resume();
        this.isPaused = false;
        console.log('Web audio recording resumed');
      } else {
        console.warn('Resume not supported in this browser');
      }
    } catch (error) {
      console.error('Error resuming web audio recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get the result
   * @returns Promise<RecordingResult> - The recording result with URI and duration
   */
  async stopRecording(): Promise<RecordingResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('Not recording or recorder not initialized');
      throw new Error('Not recording');
    }

    return new Promise((resolve, reject) => {
      try {
        // Request a final chunk of data
        if (this.mediaRecorder!.state === 'recording') {
          this.mediaRecorder!.requestData();
        }
        
        // Set up the onstop handler to process the recording
        this.mediaRecorder!.onstop = async () => {
          try {
            // Check if we have any audio chunks
            if (this.audioChunks.length === 0) {
              console.error('No audio chunks recorded');
              reject(new Error('No audio data received from recording'));
              return;
            }
            
            // Log the chunks we have
            console.log(`Processing ${this.audioChunks.length} audio chunks`);
            this.audioChunks.forEach((chunk, index) => {
              console.log(`Chunk ${index}: ${chunk.size} bytes, type: ${chunk.type}`);
            });
            
            // Create a blob from the audio chunks
            const mimeType = this.mediaRecorder!.mimeType || 'audio/webm';
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            
            // Check if the blob has data
            if (audioBlob.size === 0) {
              console.error('Audio blob is empty');
              reject(new Error('No audio data received from recording'));
              return;
            }
            
            // Calculate duration
            const duration = (Date.now() - this.startTime) / 1000;
            
            // Clean up recording state
            this.isRecording = false;
            this.isPaused = false;
            
            console.log('Raw web audio recording stopped, duration:', duration, 'size:', audioBlob.size);
            
            // Create a URL for the blob
            const uri = URL.createObjectURL(audioBlob);
            
            // Create an audio element to test the recording
            const audioElement = new Audio(uri);
            audioElement.onloadedmetadata = () => {
              console.log('Audio metadata loaded, duration:', audioElement.duration);
            };
            
            // Return the result with the raw URL
            resolve({
              uri,
              duration,
              size: audioBlob.size,
              audioBlob
            });
          } catch (error) {
            console.error('Error processing web audio recording:', error);
            reject(error);
          }
        };

        // Stop the recording
        this.mediaRecorder!.stop();
        console.log('MediaRecorder stop called');
      } catch (error) {
        console.error('Error stopping web audio recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Get the current recording status
   * @returns Object with recording status
   */
  getStatus(): { isRecording: boolean; isPaused: boolean } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('Cleaning up web audio recording resources...');
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('Error stopping media recorder during cleanup:', err);
      }
    }
    
    if (this.stream) {
      // Stop all tracks in the stream
      this.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping track during cleanup:', err);
        }
      });
      this.stream = null;
    }
    
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (err) {
        console.warn('Error disconnecting source node during cleanup:', err);
      }
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (err) {
        console.warn('Error disconnecting gain node during cleanup:', err);
      }
      this.gainNode = null;
    }
    
    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch (err) {
        console.warn('Error disconnecting analyser node during cleanup:', err);
      }
      this.analyserNode = null;
    }
    
    if (this.audioContext) {
      try {
        this.audioContext.close().catch(err => console.warn('Error closing audio context:', err));
      } catch (err) {
        console.warn('Error closing audio context during cleanup:', err);
      }
      this.audioContext = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    
    console.log('Web audio recording resources cleaned up');
  }
}

// Export both the class and an instance
export { WebAudioRecordingService };
const webAudioRecordingService = new WebAudioRecordingService();
export default webAudioRecordingService; 