/**
 * SimpleRecordingService
 * A simplified audio recording service for web browsers
 */
export interface RecordingResult {
  uri: string;
  duration: number;
  size?: number;
  audioBlob?: Blob;
}

export default class SimpleRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  
  constructor() {
    console.log('SimpleRecordingService initialized');
  }
  
  /**
   * Check if recording is supported in this browser
   */
  isSupported(): boolean {
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasMediaRecorder = !!window.MediaRecorder;
    
    console.log('Browser support check:');
    console.log('- Media Devices API:', hasMediaDevices);
    console.log('- Media Recorder API:', hasMediaRecorder);
    
    return hasMediaDevices && hasMediaRecorder;
  }
  
  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting microphone permissions...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        return false;
      }
      
      // Try to get user media to trigger permission request
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Microphone permission granted');
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
  
  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.log('Already recording');
        return;
      }
      
      console.log('Starting recording...');
      
      // Check if recording is supported
      if (!this.isSupported()) {
        throw new Error('Recording is not supported in this browser');
      }
      
      // Request permissions if needed
      if (!this.stream) {
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted) {
          throw new Error('Microphone permission denied');
        }
      }
      
      // Reset recording state
      this.audioChunks = [];
      this.startTime = Date.now();
      
      // Create MediaRecorder
      try {
        const mimeType = this.getSupportedMimeType();
        console.log('Using MIME type:', mimeType);
        
        this.mediaRecorder = new MediaRecorder(this.stream!, { 
          mimeType: mimeType || undefined 
        });
        console.log('MediaRecorder created');
      } catch (error) {
        console.warn('Failed to create MediaRecorder with options, trying without options:', error);
        this.mediaRecorder = new MediaRecorder(this.stream!);
        console.log('MediaRecorder created without options');
      }
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        console.log(`Data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`Audio chunks: ${this.audioChunks.length}`);
        }
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.isPaused = false;
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }
  
  /**
   * Stop recording and return the result
   */
  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
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
        
        // Calculate duration
        const duration = (Date.now() - this.startTime) / 1000;
        
        // Set up onstop handler
        this.mediaRecorder.onstop = () => {
          try {
            console.log('MediaRecorder stopped, processing audio...');
            
            // Create blob from chunks
            const mimeType = this.getSupportedMimeType() || 'audio/webm';
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log(`Recording completed: ${this.audioChunks.length} chunks, size: ${audioBlob.size} bytes`);
            
            // Reset recording state
            this.isRecording = false;
            this.isPaused = false;
            
            // Return the recording result
            resolve({
              uri: audioUrl,
              duration,
              size: audioBlob.size,
              audioBlob
            });
          } catch (error) {
            console.error('Error processing recording:', error);
            reject(error);
          }
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
   * Pause recording (if supported)
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording || this.isPaused) {
        console.log('Cannot pause: not recording or already paused');
        return;
      }
      
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder not initialized');
      }
      
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        this.isPaused = true;
        console.log('Recording paused');
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw error;
    }
  }
  
  /**
   * Resume recording (if paused)
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.isPaused) {
        console.log('Cannot resume: not recording or not paused');
        return;
      }
      
      if (!this.mediaRecorder) {
        throw new Error('MediaRecorder not initialized');
      }
      
      if (this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        this.isPaused = false;
        console.log('Recording resumed');
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw error;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    try {
      console.log('Cleaning up resources...');
      
      // Stop media recorder if active
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          console.warn('Error stopping media recorder:', error);
        }
      }
      
      // Stop and release media stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      // Reset state
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
      this.isPaused = false;
      
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
  
  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mp3',
      'audio/wav'
    ];
    
    for (const mimeType of mimeTypes) {
      try {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          return mimeType;
        }
      } catch (e) {
        console.warn(`Error checking support for ${mimeType}:`, e);
      }
    }
    
    return '';
  }
} 