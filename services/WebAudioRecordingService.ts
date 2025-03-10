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
  sampleRate: 44100, // Standard quality (44.1kHz)
  numberOfChannels: 2,
  bitRate: 128000, // 128kbps for better compatibility
  applyEffects: false, // Disable effects by default for better compatibility
  compression: false,
  equalization: false,
  noiseSuppression: true,
  normalization: false,
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

  constructor() {
    console.log('WebAudioRecordingService constructor called');
    
    // Check browser support immediately
    const supported = this.isSupported();
    console.log(`Browser recording support check: ${supported ? 'Supported' : 'Not supported'}`);
    
    if (supported) {
      // Log available APIs
      console.log('Available APIs:');
      console.log('- navigator.mediaDevices:', !!navigator.mediaDevices);
      console.log('- getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
      console.log('- AudioContext:', !!(window.AudioContext || (window as any).webkitAudioContext));
      console.log('- MediaRecorder:', !!window.MediaRecorder);
      
      // Log supported MIME types
      this.logSupportedMimeTypes();
    }
  }
  
  /**
   * Log supported MIME types for debugging
   */
  private logSupportedMimeTypes(): void {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mp3',
      'audio/wav'
    ];
    
    console.log('Supported MIME types:');
    mimeTypes.forEach(mimeType => {
      let isSupported = false;
      try {
        isSupported = MediaRecorder.isTypeSupported(mimeType);
      } catch (e) {
        console.warn(`Error checking support for ${mimeType}:`, e);
      }
      console.log(`- ${mimeType}: ${isSupported ? 'Supported' : 'Not supported'}`);
    });
  }

  /**
   * Check if recording is supported in this browser
   * @returns {boolean} Whether recording is supported
   */
  isSupported(): boolean {
    try {
      // Check for required browser APIs
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
      const hasMediaRecorder = !!window.MediaRecorder;
      
      const isSupported = hasMediaDevices && hasAudioContext && hasMediaRecorder;
      
      console.log('Browser support check:');
      console.log('- Media Devices API:', hasMediaDevices);
      console.log('- Audio Context API:', hasAudioContext);
      console.log('- Media Recorder API:', hasMediaRecorder);
      console.log('Overall support:', isSupported);
      
      return isSupported;
    } catch (error) {
      console.error('Error checking browser support:', error);
      return false;
    }
  }

  /**
   * Request microphone permissions
   * @returns Promise<boolean> - Whether permissions were granted
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting microphone permissions...');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support getUserMedia API');
        return false;
      }
      
      // Request user media with audio - use detailed constraints for better quality
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
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
      // Check if we already have an audio context
      if (this.audioContext) {
        // If the context is suspended (e.g., after a user interaction requirement),
        // try to resume it
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(err => {
            console.error('Failed to resume AudioContext:', err);
          });
        }
        return;
      }

      // Create a new AudioContext with fallbacks for different browsers
      const AudioContextClass = window.AudioContext || 
                               (window as any).webkitAudioContext || 
                               (window as any).mozAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported in this browser');
      }
      
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: this.recordingOptions.sampleRate || 44100
      });
      
      // Some browsers (like Safari) start the context in suspended state
      // and require user interaction to start audio
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext is suspended, attempting to resume...');
        // We'll try to resume it, but this might fail if there hasn't been user interaction
        this.audioContext.resume().catch(err => {
          console.warn('Could not resume AudioContext automatically, will resume on user interaction:', err);
          // This is expected in some browsers and will be handled when the user interacts
        });
      }
      
      console.log('AudioContext initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      throw new Error(`Failed to initialize audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Start recording
   * @returns Promise<void>
   */
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.log('Already recording, ignoring startRecording call');
        return;
      }
      
      console.log('Starting recording...');
      
      // Check if recording is supported
      if (!this.isSupported()) {
        const error = new Error('Recording is not supported in this browser');
        console.error(error);
        throw error;
      }
      
      // Request permissions if not already granted
      console.log('Requesting microphone permissions...');
      const permissionGranted = await this.requestPermissions();
      console.log('Microphone permission granted:', permissionGranted);
      
      if (!permissionGranted) {
        const error = new Error('Microphone permission denied');
        console.error(error);
        throw error;
      }
      
      // Initialize audio context if not already done
      if (!this.audioContext) {
        console.log('Initializing AudioContext...');
        this.initializeAudioContext();
      }
      
      // If the audio context is suspended (common in Safari and mobile browsers),
      // try to resume it. This requires user interaction.
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          console.log('AudioContext is suspended, attempting to resume...');
          await this.audioContext.resume();
          console.log('AudioContext resumed successfully');
        } catch (error) {
          console.error('Failed to resume AudioContext:', error);
          throw new Error('Could not start audio processing. Please try again.');
        }
      }
      
      // Reset recording state
      this.audioChunks = [];
      this.startTime = Date.now();
      
      // Get media stream if not already available
      if (!this.stream) {
        try {
          console.log('Getting media stream...');
          const constraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: this.recordingOptions.noiseSuppression !== false,
              autoGainControl: true,
              sampleRate: this.recordingOptions.sampleRate || 44100,
              channelCount: this.recordingOptions.numberOfChannels || 1
            },
            video: false
          };
          
          console.log('Media constraints:', JSON.stringify(constraints));
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Media stream obtained successfully');
        } catch (error) {
          console.error('Error getting media stream:', error);
          throw new Error(`Could not access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Set up audio processing chain
      try {
        console.log('Setting up audio processing chain...');
        
        // Create source node from the input stream
        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
        console.log('Source node created');
        
        // Create analyzer node for visualization
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048;
        this.analyserNode.smoothingTimeConstant = 0.8;
        console.log('Analyzer node created');
        
        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
        console.log('Gain node created');
        
        // Create destination node for processed audio
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        console.log('Destination node created');
        
        // Connect the basic audio processing chain
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.destinationNode);
        console.log('Basic audio processing chain connected');
        
        // Apply additional audio processing if enabled
        if (this.recordingOptions.applyEffects) {
          console.log('Applying audio effects...');
          this.applyAudioEffects();
        }
        
        // Store the processed stream
        this.processedStream = this.destinationNode.stream;
        console.log('Processed stream created');
        
        console.log('Audio processing chain initialized');
      } catch (error) {
        console.error('Error setting up audio processing:', error);
        throw new Error(`Failed to set up audio processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Create and start MediaRecorder with the processed stream
      try {
        console.log('Creating MediaRecorder...');
        const mimeType = this.getSupportedMimeType();
        console.log('Using MIME type:', mimeType);
        
        const options = {
          mimeType,
          audioBitsPerSecond: this.recordingOptions.bitRate || 128000
        };
        
        console.log('MediaRecorder options:', JSON.stringify(options));
        
        const streamToUse = this.processedStream || this.stream;
        console.log('Stream for MediaRecorder:', streamToUse ? 'Available' : 'Not available');
        
        if (!streamToUse) {
          throw new Error('No audio stream available for recording');
        }
        
        try {
          this.mediaRecorder = new MediaRecorder(streamToUse, options);
          console.log('MediaRecorder created with options');
        } catch (optionsError) {
          console.warn('Failed to create MediaRecorder with options, trying without options:', optionsError);
          this.mediaRecorder = new MediaRecorder(streamToUse);
          console.log('MediaRecorder created without options');
        }
        
        // Set up event handlers
        this.mediaRecorder.ondataavailable = (event) => {
          console.log(`Data available event: ${event.data.size} bytes`);
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
            console.log(`Audio chunks: ${this.audioChunks.length}, total size: ${this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0)} bytes`);
          }
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
        };
        
        this.mediaRecorder.onstart = () => {
          console.log('MediaRecorder started');
        };
        
        this.mediaRecorder.onpause = () => {
          console.log('MediaRecorder paused');
        };
        
        this.mediaRecorder.onresume = () => {
          console.log('MediaRecorder resumed');
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
        };
        
        // Start recording
        console.log('Starting MediaRecorder...');
        this.mediaRecorder.start(1000); // Collect data every second
        this.isRecording = true;
        this.isPaused = false;
        
        console.log('Recording started successfully');
      } catch (error) {
        console.error('Error starting MediaRecorder:', error);
        throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      // Clean up resources on error
      this.cleanup();
      console.error('Error in startRecording:', error);
      throw error;
    }
  }
  
  /**
   * Apply audio effects based on recording options
   * This is called during the audio processing chain setup
   */
  private applyAudioEffects(): void {
    if (!this.audioContext || !this.sourceNode || !this.gainNode || !this.destinationNode) {
      console.warn('Cannot apply effects: Audio processing chain not initialized');
      return;
    }
    
    try {
      // Disconnect existing chain to rebuild it
      this.sourceNode.disconnect();
      
      // Start building the chain from the source
      let lastNode: AudioNode = this.sourceNode;
      
      // Add high-pass filter to remove rumble if enabled
      if (this.recordingOptions.highPassFilter) {
        this.highPassFilterNode = this.audioContext.createBiquadFilter();
        this.highPassFilterNode.type = 'highpass';
        this.highPassFilterNode.frequency.value = this.recordingOptions.highPassFrequency || 80;
        this.highPassFilterNode.Q.value = 0.7;
        
        lastNode.connect(this.highPassFilterNode);
        lastNode = this.highPassFilterNode;
      }
      
      // Add compressor for dynamic range control if enabled
      if (this.recordingOptions.compression) {
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNode.threshold.value = this.recordingOptions.compressorThreshold || -24;
        this.compressorNode.ratio.value = this.recordingOptions.compressorRatio || 4;
        this.compressorNode.knee.value = 5;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;
        
        lastNode.connect(this.compressorNode);
        lastNode = this.compressorNode;
      }
      
      // Connect to analyzer for visualization
      lastNode.connect(this.analyserNode);
      lastNode = this.analyserNode;
      
      // Add noise gate if enabled
      if (this.recordingOptions.noiseSuppression) {
        this.noiseGateNode = this.audioContext.createGain();
        this.noiseGateNode.gain.value = 1.0;
        
        lastNode.connect(this.noiseGateNode);
        lastNode = this.noiseGateNode;
        
        // Set up noise gate processing
        const threshold = this.recordingOptions.noiseGateThreshold || -50;
        this.processingInterval = window.setInterval(() => {
          if (!this.analyserNode) return;
          
          const dataArray = new Float32Array(this.analyserNode.fftSize);
          this.analyserNode.getFloatTimeDomainData(dataArray);
          
          // Calculate RMS (root mean square) value
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const db = 20 * Math.log10(rms);
          
          // Smooth the RMS value to avoid abrupt changes
          this.lastRMS = this.lastRMS * 0.8 + db * 0.2;
          
          // Apply noise gate
          if (this.noiseGateNode) {
            if (this.lastRMS < threshold) {
              // Gradually reduce gain to avoid clicks
              this.noiseGateNode.gain.linearRampToValueAtTime(
                0.001, 
                this.audioContext!.currentTime + 0.1
              );
            } else {
              // Gradually increase gain
              this.noiseGateNode.gain.linearRampToValueAtTime(
                1.0, 
                this.audioContext!.currentTime + 0.01
              );
            }
          }
        }, 50);
      }
      
      // Connect to gain node for volume control
      lastNode.connect(this.gainNode);
      lastNode = this.gainNode;
      
      // Finally connect to destination
      lastNode.connect(this.destinationNode);
      
      console.log('Audio effects applied successfully');
    } catch (error) {
      console.error('Error applying audio effects:', error);
      // Fall back to basic chain if effects fail
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.destinationNode);
    }
  }
  
  /**
   * Stop recording
   * @returns Promise<RecordingResult>
   */
  async stopRecording(): Promise<RecordingResult> {
    return new Promise<RecordingResult>((resolve, reject) => {
      try {
        if (!this.isRecording) {
          reject(new Error('Not currently recording'));
          return;
        }
        
        console.log('Stopping recording...');
        
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }
        
        // If paused, resume first
        if (this.isPaused && this.mediaRecorder.state === 'paused') {
          try {
            this.mediaRecorder.resume();
            this.isPaused = false;
            console.log('Resumed paused recording before stopping');
          } catch (error) {
            console.warn('Error resuming recording before stop:', error);
            // Continue with stopping even if resume fails
          }
        }
        
        // Calculate duration
        const duration = (Date.now() - this.startTime) / 1000;
        
        // Handle the case where there are no chunks yet
        if (this.audioChunks.length === 0) {
          console.warn('No audio chunks recorded, creating empty result');
          
          // Create an empty audio blob
          const emptyBlob = new Blob([], { type: this.getSupportedMimeType() });
          const emptyUrl = URL.createObjectURL(emptyBlob);
          
          // Reset recording state
          this.isRecording = false;
          this.isPaused = false;
          
          // Return empty result
          resolve({
            uri: emptyUrl,
            duration: 0,
            size: 0,
            audioBlob: emptyBlob,
            waveformData: []
          });
          return;
        }
        
        // Set up onstop handler to process the recording when it stops
        this.mediaRecorder.onstop = async () => {
          try {
            console.log('MediaRecorder stopped, processing audio...');
            
            // Create blob from chunks
            const mimeType = this.getSupportedMimeType();
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log(`Recording completed: ${this.audioChunks.length} chunks, size: ${audioBlob.size} bytes`);
            
            // Generate waveform data if analyzer is available
            let waveformData: number[] = [];
            if (this.analyserNode) {
              try {
                const bufferLength = this.analyserNode.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                this.analyserNode.getByteFrequencyData(dataArray);
                
                // Sample the frequency data to get a reasonable number of points
                const sampleSize = 100;
                const step = Math.floor(bufferLength / sampleSize);
                
                for (let i = 0; i < sampleSize; i++) {
                  const index = Math.min(i * step, bufferLength - 1);
                  // Normalize to 0-1 range
                  waveformData.push(dataArray[index] / 255);
                }
              } catch (error) {
                console.warn('Error generating waveform data:', error);
                // Create fallback waveform data
                waveformData = Array(100).fill(0).map(() => Math.random() * 0.8 + 0.1);
              }
            } else {
              // Create fallback waveform data
              waveformData = Array(100).fill(0).map(() => Math.random() * 0.8 + 0.1);
            }
            
            // Reset recording state
            this.isRecording = false;
            this.isPaused = false;
            
            // Return the recording result
            const result: RecordingResult = {
              uri: audioUrl,
              duration,
              size: audioBlob.size,
              audioBlob,
              waveformData
            };
            
            console.log('Recording processed successfully');
            resolve(result);
          } catch (error) {
            console.error('Error processing recording:', error);
            reject(error);
          }
        };
        
        // Handle errors during stop
        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error during stop:', event);
          reject(new Error('Error stopping recording'));
        };
        
        // Stop the media recorder
        this.mediaRecorder.stop();
        console.log('MediaRecorder stop command issued');
        
      } catch (error) {
        console.error('Error in stopRecording:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Get audio levels for visualization
   * @returns Uint8Array | null
   */
  getAudioLevels(): Uint8Array | null {
    if (!this.analyserNode) return null;
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('Cleaning up WebAudioRecordingService resources...');
    
    try {
      // Stop recording if active
      if (this.isRecording) {
        try {
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        } catch (err) {
          console.error('Error stopping mediaRecorder during cleanup:', err);
        }
      }
      
      // Close audio processing nodes
      if (this.analyserNode) {
        try {
          this.analyserNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting analyserNode:', err);
        }
        this.analyserNode = null;
      }
      
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting sourceNode:', err);
        }
        this.sourceNode = null;
      }
      
      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting gainNode:', err);
        }
        this.gainNode = null;
      }
      
      if (this.compressorNode) {
        try {
          this.compressorNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting compressorNode:', err);
        }
        this.compressorNode = null;
      }
      
      if (this.highPassFilterNode) {
        try {
          this.highPassFilterNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting highPassFilterNode:', err);
        }
        this.highPassFilterNode = null;
      }
      
      if (this.destinationNode) {
        try {
          this.destinationNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting destinationNode:', err);
        }
        this.destinationNode = null;
      }
      
      if (this.noiseGateNode) {
        try {
          this.noiseGateNode.disconnect();
        } catch (err) {
          console.error('Error disconnecting noiseGateNode:', err);
        }
        this.noiseGateNode = null;
      }
      
      // Stop and release media stream
      if (this.stream) {
        try {
          const tracks = this.stream.getTracks();
          tracks.forEach(track => {
            track.stop();
          });
        } catch (err) {
          console.error('Error stopping media stream tracks:', err);
        }
        this.stream = null;
      }
      
      if (this.processedStream) {
        try {
          const tracks = this.processedStream.getTracks();
          tracks.forEach(track => {
            track.stop();
          });
        } catch (err) {
          console.error('Error stopping processed stream tracks:', err);
        }
        this.processedStream = null;
      }
      
      // Close audio context
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(err => {
              console.error('Error closing AudioContext:', err);
            });
          }
        } catch (err) {
          console.error('Error closing AudioContext:', err);
        }
        this.audioContext = null;
      }
      
      // Clear processing interval
      if (this.processingInterval !== null) {
        window.clearInterval(this.processingInterval);
        this.processingInterval = null;
      }
      
      // Reset state
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
      this.isPaused = false;
      this.startTime = 0;
      this.lastRMS = -100;
      
      console.log('WebAudioRecordingService cleanup completed');
    } catch (error) {
      console.error('Error during WebAudioRecordingService cleanup:', error);
    }
  }
  
  /**
   * Get supported MIME type for recording
   * @returns string
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      ''  // Empty string is a fallback that lets the browser choose
    ];
    
    for (const type of types) {
      if (!type) return '';
      
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log('Using MIME type:', type);
          return type;
        }
      } catch (e) {
        console.warn('Error checking MIME type support:', e);
      }
    }
    
    return '';
  }

  /**
   * Pause recording
   * @returns Promise<void>
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording || this.isPaused) {
        console.warn('Not recording or already paused');
        return;
      }
      
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder not initialized');
      }
      
      // Check if the browser supports pause
      if (this.mediaRecorder.state === 'recording' && 'pause' in this.mediaRecorder) {
        this.mediaRecorder.pause();
        this.isPaused = true;
        console.log('Recording paused successfully');
      } else {
        throw new Error('Pause not supported in this browser');
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw error;
    }
  }

  /**
   * Resume recording
   * @returns Promise<void>
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.isPaused) {
        console.warn('Not recording or not paused');
        return;
      }
      
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder not initialized');
      }
      
      // Check if the browser supports resume
      if (this.mediaRecorder.state === 'paused' && 'resume' in this.mediaRecorder) {
        this.mediaRecorder.resume();
        this.isPaused = false;
        console.log('Recording resumed successfully');
      } else {
        throw new Error('Resume not supported in this browser');
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw error;
    }
  }
}

// Export both the class and an instance
export { WebAudioRecordingService };
const webAudioRecordingService = new WebAudioRecordingService();
export default webAudioRecordingService; 