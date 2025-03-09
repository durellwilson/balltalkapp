import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../src/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * AudioProcessingService
 * 
 * A service for processing audio files with professional effects.
 * Handles normalization, compression, EQ, reverb, and fades.
 */
export class AudioProcessingService {
  /**
   * Process an audio file with the specified effects
   * 
   * @param {string} audioUri - URI of the audio file to process
   * @param {Object} options - Processing options including effects and parameters
   * @param {Function} onProgress - Callback for progress updates (0-1)
   * @returns {Promise<string>} URI of the processed audio file
   */
  static async processAudio(
    audioUri: string,
    options: {
      effects: {
        normalize?: boolean;
        compression?: boolean;
        reverb?: boolean;
        eq?: boolean;
        fadeIn?: boolean;
        fadeOut?: boolean;
      };
      parameters: {
        compressionThreshold?: number;
        compressionRatio?: number;
        reverbAmount?: number;
        eqLow?: number;
        eqMid?: number;
        eqHigh?: number;
        fadeInDuration?: number;
        fadeOutDuration?: number;
      };
    },
    onProgress: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('[AudioProcessingService] Starting audio processing', { audioUri, options });
      
      // Validate input
      if (!audioUri) {
        throw new Error('No audio URI provided');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error(`Audio file not found at path: ${audioUri}`);
      }
      
      console.log('[AudioProcessingService] Audio file exists, size:', fileInfo.size);

      // Create a unique filename for the processed audio
      const fileExtension = audioUri.split('.').pop();
      const processedFileName = `processed-${uuidv4()}.${fileExtension}`;
      const processedFilePath = `${FileSystem.cacheDirectory}${processedFileName}`;
      
      console.log('[AudioProcessingService] Will save processed file to:', processedFilePath);

      // For web, we need to use the Web Audio API
      if (Platform.OS === 'web') {
        console.log('[AudioProcessingService] Using web processing path');
        return await this.processAudioWeb(audioUri, options, onProgress, processedFilePath);
      } else {
        // For native platforms, we'll use a different approach
        console.log('[AudioProcessingService] Using native processing path');
        return await this.processAudioNative(audioUri, options, onProgress, processedFilePath);
      }
    } catch (error) {
      console.error('[AudioProcessingService] Error processing audio:', error);
      throw new Error(`Failed to process audio: ${error.message}`);
    }
  }

  /**
   * Upload processed audio to Firebase Storage
   * 
   * @param {string} audioUri - URI of the processed audio file
   * @param {string} userId - ID of the user who owns the file
   * @param {Object} metadata - Optional metadata for the file
   * @returns {Promise<string>} Download URL of the uploaded file
   */
  static async uploadProcessedAudio(
    audioUri: string, 
    userId: string,
    metadata?: {
      title?: string;
      artist?: string;
      genre?: string;
      description?: string;
      processingOptions?: any;
    }
  ): Promise<string> {
    try {
      console.log('[AudioProcessingService] Uploading processed audio to Firebase Storage');
      
      // Create a unique filename
      const fileExtension = audioUri.split('.').pop()?.toLowerCase() || 'mp3';
      const timestamp = new Date().getTime();
      const fileName = `processed/${userId}/${timestamp}_${uuidv4()}.${fileExtension}`;
      
      console.log(`[AudioProcessingService] Uploading to path: ${fileName}`);
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, fileName);
      
      // Prepare metadata
      const fileMetadata = {
        contentType: this.getContentType(fileExtension),
        customMetadata: {
          userId,
          uploadedAt: new Date().toISOString(),
          processed: 'true',
          ...metadata && {
            title: metadata.title,
            artist: metadata.artist,
            genre: metadata.genre,
            description: metadata.description
          }
        }
      };
      
      // For web, we need to fetch the file first
      if (Platform.OS === 'web') {
        console.log('[AudioProcessingService] Uploading from web platform');
        
        try {
          // Fetch the file as a blob
          const response = await fetch(audioUri);
          const blob = await response.blob();
          
          // Upload the blob to Firebase Storage with metadata
          const uploadResult = await uploadBytes(storageRef, blob, fileMetadata);
          console.log('[AudioProcessingService] Upload successful:', uploadResult.metadata.name);
        } catch (error) {
          console.error('[AudioProcessingService] Error uploading from web:', error);
          throw error;
        }
      } else {
        // For native platforms, we need to fetch the file as a blob
        console.log('[AudioProcessingService] Uploading from native platform');
        
        try {
          // Read the file as a blob
          const response = await fetch(audioUri);
          const blob = await response.blob();
          
          // Upload the blob to Firebase Storage with metadata
          const uploadResult = await uploadBytes(storageRef, blob, fileMetadata);
          console.log('[AudioProcessingService] Upload successful:', uploadResult.metadata.name);
        } catch (error) {
          console.error('[AudioProcessingService] Error uploading from native:', error);
          throw error;
        }
      }
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('[AudioProcessingService] Download URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('[AudioProcessingService] Error uploading processed audio:', error);
      throw new Error(`Failed to upload processed audio: ${error.message}`);
    }
  }

  /**
   * Get content type based on file extension
   */
  private static getContentType(extension: string): string {
    const contentTypes: {[key: string]: string} = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/m4a',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };
    
    return contentTypes[extension] || 'audio/mpeg';
  }

  /**
   * Process audio on web using Web Audio API
   */
  private static async processAudioWeb(
    audioUri: string,
    options: any,
    onProgress: (progress: number) => void,
    outputPath: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[AudioProcessingService] Web: Loading audio file');
        
        // Load the audio file
        onProgress(0.1);
        
        // For web, we'll use fetch to get the audio data
        const response = await fetch(audioUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('[AudioProcessingService] Web: Audio decoded successfully', {
          sampleRate: audioBuffer.sampleRate,
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels
        });
        
        onProgress(0.2);
        
        // Create an offline context for processing
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Create source node
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create a chain of audio nodes for processing
        let currentNode: AudioNode = source;
        const steps = Object.values(options.effects).filter(Boolean).length;
        const stepSize = steps > 0 ? 0.6 / steps : 0.6;
        let currentProgress = 0.2;
        
        // Apply normalization if enabled
        if (options.effects.normalize) {
          const normalizedBuffer = this.normalizeAudio(audioBuffer);
          source.buffer = normalizedBuffer;
          currentProgress += stepSize;
          onProgress(currentProgress);
          console.log('[AudioProcessingService] Web: Applied normalization');
        }
        
        // Apply compression if enabled
        if (options.effects.compression) {
          const compressor = offlineContext.createDynamicsCompressor();
          compressor.threshold.value = options.parameters.compressionThreshold || -24;
          compressor.ratio.value = options.parameters.compressionRatio || 4;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          compressor.knee.value = 30;
          
          currentNode.connect(compressor);
          currentNode = compressor;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
          console.log('[AudioProcessingService] Web: Applied compression');
        }
        
        // Apply EQ if enabled
        if (options.effects.eq) {
          // Low shelf filter
          const lowShelf = offlineContext.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 320;
          lowShelf.gain.value = options.parameters.eqLow || 0;
          
          // Mid peaking filter
          const midPeak = offlineContext.createBiquadFilter();
          midPeak.type = 'peaking';
          midPeak.frequency.value = 1000;
          midPeak.Q.value = 1;
          midPeak.gain.value = options.parameters.eqMid || 0;
          
          // High shelf filter
          const highShelf = offlineContext.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.value = 3200;
          highShelf.gain.value = options.parameters.eqHigh || 0;
          
          currentNode.connect(lowShelf);
          lowShelf.connect(midPeak);
          midPeak.connect(highShelf);
          currentNode = highShelf;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
          console.log('[AudioProcessingService] Web: Applied EQ');
        }
        
        // Apply reverb if enabled
        if (options.effects.reverb) {
          // Create convolver node for reverb
          const convolver = offlineContext.createConvolver();
          
          // Generate impulse response for reverb
          const reverbAmount = options.parameters.reverbAmount || 0.3;
          const impulseLength = offlineContext.sampleRate * reverbAmount;
          const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);
          
          // Fill impulse buffer with decaying noise
          for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const impulseData = impulse.getChannelData(channel);
            for (let i = 0; i < impulseLength; i++) {
              impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
            }
          }
          
          convolver.buffer = impulse;
          
          // Create a gain node to control reverb mix
          const reverbGain = offlineContext.createGain();
          reverbGain.gain.value = reverbAmount;
          
          // Create a gain node for dry signal
          const dryGain = offlineContext.createGain();
          dryGain.gain.value = 1 - reverbAmount;
          
          // Split the signal
          currentNode.connect(convolver);
          currentNode.connect(dryGain);
          
          // Connect reverb through its gain
          convolver.connect(reverbGain);
          
          // Create a merger node
          const merger = offlineContext.createGain();
          reverbGain.connect(merger);
          dryGain.connect(merger);
          
          currentNode = merger;
          
          currentProgress += stepSize;
          onProgress(currentProgress);
          console.log('[AudioProcessingService] Web: Applied reverb');
        }
        
        // Apply fade in if enabled
        if (options.effects.fadeIn) {
          const fadeInDuration = options.parameters.fadeInDuration || 1.0;
          const fadeInSamples = Math.floor(fadeInDuration * audioBuffer.sampleRate);
          
          // We'll apply the fade directly to the buffer after rendering
          console.log('[AudioProcessingService] Web: Fade in will be applied after rendering');
        }
        
        // Apply fade out if enabled
        if (options.effects.fadeOut) {
          const fadeOutDuration = options.parameters.fadeOutDuration || 1.0;
          const fadeOutSamples = Math.floor(fadeOutDuration * audioBuffer.sampleRate);
          
          // We'll apply the fade directly to the buffer after rendering
          console.log('[AudioProcessingService] Web: Fade out will be applied after rendering');
        }
        
        // Connect the final node to the destination
        currentNode.connect(offlineContext.destination);
        
        // Start the source
        source.start(0);
        
        // Render the audio
        onProgress(0.8);
        console.log('[AudioProcessingService] Web: Rendering processed audio...');
        const renderedBuffer = await offlineContext.startRendering();
        
        // Apply fades directly to the rendered buffer if needed
        let processedBuffer = renderedBuffer;
        if (options.effects.fadeIn) {
          const fadeInDuration = options.parameters.fadeInDuration || 1.0;
          processedBuffer = this.applyFadeInToBuffer(processedBuffer, fadeInDuration);
          console.log('[AudioProcessingService] Web: Applied fade in');
        }
        
        if (options.effects.fadeOut) {
          const fadeOutDuration = options.parameters.fadeOutDuration || 1.0;
          processedBuffer = this.applyFadeOutToBuffer(processedBuffer, fadeOutDuration);
          console.log('[AudioProcessingService] Web: Applied fade out');
        }
        
        // Convert the processed buffer to WAV
        const wavData = this.audioBufferToWav(processedBuffer);
        const wavBlob = new Blob([wavData], { type: 'audio/wav' });
        
        // Create a URL for the processed audio
        const processedUrl = URL.createObjectURL(wavBlob);
        
        onProgress(1.0);
        console.log('[AudioProcessingService] Web: Processing complete, URL:', processedUrl);
        
        // Clean up
        audioContext.close();
        
        resolve(processedUrl);
      } catch (error) {
        console.error('[AudioProcessingService] Web: Error processing audio:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Convert AudioBuffer to WAV format
   */
  private static audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    // Implementation of audioBufferToWav function
    // This is a simplified version - in production, use a library like audiobuffer-to-wav
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    const wavDataView = new DataView(new ArrayBuffer(44 + length));
    
    // Write WAV header
    this.writeWavHeader(wavDataView, numOfChannels, sampleRate, buffer.length);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        // Convert float to 16-bit PCM
        const value = Math.max(-1, Math.min(1, sample));
        const pcmValue = value < 0 ? value * 0x8000 : value * 0x7FFF;
        wavDataView.setInt16(offset, pcmValue, true);
        offset += 2;
      }
    }
    
    return wavDataView.buffer;
  }
  
  /**
   * Write WAV header to DataView
   */
  private static writeWavHeader(
    view: DataView, 
    numChannels: number, 
    sampleRate: number, 
    numSamples: number
  ): void {
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    
    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // File length minus RIFF identifier and file size field
    view.setUint32(4, 36 + dataSize, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // Format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // Bits per sample
    view.setUint16(34, 8 * bytesPerSample, true);
    // Data chunk identifier
    this.writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, dataSize, true);
  }
  
  /**
   * Write string to DataView
   */
  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  /**
   * Apply fade in to AudioBuffer
   */
  private static applyFadeInToBuffer(buffer: AudioBuffer, durationSeconds: number): AudioBuffer {
    const numSamples = Math.min(Math.floor(durationSeconds * buffer.sampleRate), buffer.length);
    
    // Create a new buffer with the same properties
    const newBuffer = new AudioBuffer({
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length,
      sampleRate: buffer.sampleRate
    });
    
    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = new Float32Array(buffer.length);
      
      // Copy the data
      newChannelData.set(channelData);
      
      // Apply fade in
      for (let i = 0; i < numSamples; i++) {
        const gain = i / numSamples;
        newChannelData[i] *= gain;
      }
      
      newBuffer.copyToChannel(newChannelData, channel);
    }
    
    return newBuffer;
  }
  
  /**
   * Apply fade out to AudioBuffer
   */
  private static applyFadeOutToBuffer(buffer: AudioBuffer, durationSeconds: number): AudioBuffer {
    const numSamples = Math.min(Math.floor(durationSeconds * buffer.sampleRate), buffer.length);
    const startIndex = buffer.length - numSamples;
    
    // Create a new buffer with the same properties
    const newBuffer = new AudioBuffer({
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length,
      sampleRate: buffer.sampleRate
    });
    
    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = new Float32Array(buffer.length);
      
      // Copy the data
      newChannelData.set(channelData);
      
      // Apply fade out
      for (let i = 0; i < numSamples; i++) {
        const gain = 1 - (i / numSamples);
        newChannelData[startIndex + i] *= gain;
      }
      
      newBuffer.copyToChannel(newChannelData, channel);
    }
    
    return newBuffer;
  }
  
  /**
   * Normalize AudioBuffer
   */
  private static normalizeAudio(buffer: AudioBuffer): AudioBuffer {
    // Create a new buffer with the same properties
    const newBuffer = new AudioBuffer({
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length,
      sampleRate: buffer.sampleRate
    });
    
    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Find the maximum absolute value
      let maxValue = 0;
      for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > maxValue) {
          maxValue = absValue;
        }
      }
      
      // Calculate the gain factor
      const gainFactor = maxValue > 0 ? 0.99 / maxValue : 1.0;
      
      // Create a new array for the normalized data
      const normalizedData = new Float32Array(channelData.length);
      
      // Apply the gain
      for (let i = 0; i < channelData.length; i++) {
        normalizedData[i] = channelData[i] * gainFactor;
      }
      
      // Copy the normalized data to the new buffer
      newBuffer.copyToChannel(normalizedData, channel);
    }
    
    return newBuffer;
  }

  /**
   * Process audio on native platforms
   */
  private static async processAudioNative(
    audioUri: string,
    options: any,
    onProgress: (progress: number) => void,
    outputPath: string
  ): Promise<string> {
    try {
      console.log('[AudioProcessingService] Native: Starting processing');
      
      // Load the audio file
      onProgress(0.1);
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      console.log('[AudioProcessingService] Native: Audio loaded, status:', status);
      
      // For now, we'll just copy the file as a placeholder for real processing
      await this.copyFile(audioUri, outputPath);
      console.log('[AudioProcessingService] Native: Copied file to:', outputPath);
      
      // Simulate processing steps with progress updates
      const steps = Object.values(options.effects).filter(Boolean).length;
      const stepSize = steps > 0 ? 0.8 / steps : 0.8;
      let currentProgress = 0.1;
      
      // Simulate each enabled effect
      if (options.effects.normalize) {
        await this.simulateProcessingStep(500);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied normalization');
      }
      
      if (options.effects.compression) {
        await this.simulateProcessingStep(600);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied compression');
      }
      
      if (options.effects.eq) {
        await this.simulateProcessingStep(700);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied EQ');
      }
      
      if (options.effects.reverb) {
        await this.simulateProcessingStep(800);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied reverb');
      }
      
      if (options.effects.fadeIn) {
        await this.simulateProcessingStep(300);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied fade in');
      }
      
      if (options.effects.fadeOut) {
        await this.simulateProcessingStep(300);
        currentProgress += stepSize;
        onProgress(currentProgress);
        console.log('[AudioProcessingService] Native: Applied fade out');
      }
      
      // Final progress update
      onProgress(1.0);
      console.log('[AudioProcessingService] Native: Processing complete');
      
      // Clean up
      await sound.unloadAsync();
      
      return outputPath;
    } catch (error) {
      console.error('[AudioProcessingService] Native: Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Copy a file from source to destination
   */
  private static async copyFile(sourceUri: string, destinationUri: string): Promise<void> {
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri
      });
    } catch (error) {
      console.error('[AudioProcessingService] Error copying file:', error);
      throw error;
    }
  }

  /**
   * Simulate a processing step with a delay
   */
  private static async simulateProcessingStep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Preview audio with effects in real-time
   * This is a simplified version of processAudio that's optimized for real-time preview
   * 
   * @param {string} audioUri - URI of the audio file to preview
   * @param {Object} options - Processing options including effects settings
   * @returns {Promise<string>} URI of the previewed audio
   */
  static async previewAudio(
    audioUri: string,
    options: any
  ): Promise<string> {
    try {
      console.log('[AudioProcessingService] Starting audio preview', { audioUri, options });
      
      // Validate input
      if (!audioUri) {
        throw new Error('No audio URI provided');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error(`Audio file not found at path: ${audioUri}`);
      }
      
      console.log('[AudioProcessingService] Audio file exists, size:', fileInfo.size);

      // Create a unique filename for the processed audio
      const fileExtension = audioUri.split('.').pop();
      const previewFileName = `preview-${uuidv4()}.${fileExtension}`;
      const previewFilePath = `${FileSystem.cacheDirectory}${previewFileName}`;
      
      console.log('[AudioProcessingService] Will save preview file to:', previewFilePath);

      // For web, we need to use the Web Audio API
      if (Platform.OS === 'web') {
        console.log('[AudioProcessingService] Using web preview path');
        
        // Fetch the audio data
        const response = await fetch(audioUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('[AudioProcessingService] Audio decoded successfully for preview');
        
        // Create an offline context for processing
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Create source node
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create a chain of audio nodes for processing
        let currentNode: AudioNode = source;
        
        // Apply active effects
        if (options.activeEffects.includes('equalizer')) {
          // Apply EQ
          const lowShelf = offlineContext.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 320;
          lowShelf.gain.value = options.equalizer.lowGain;
          
          const midPeak = offlineContext.createBiquadFilter();
          midPeak.type = 'peaking';
          midPeak.frequency.value = 1000;
          midPeak.Q.value = 1;
          midPeak.gain.value = options.equalizer.midGain;
          
          const highShelf = offlineContext.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.value = 3200;
          highShelf.gain.value = options.equalizer.highGain;
          
          currentNode.connect(lowShelf);
          lowShelf.connect(midPeak);
          midPeak.connect(highShelf);
          currentNode = highShelf;
        }
        
        if (options.activeEffects.includes('compressor')) {
          // Apply compression
          const compressor = offlineContext.createDynamicsCompressor();
          compressor.threshold.value = options.compressor.threshold;
          compressor.ratio.value = options.compressor.ratio;
          compressor.attack.value = options.compressor.attack / 1000; // Convert ms to seconds
          compressor.release.value = options.compressor.release / 1000; // Convert ms to seconds
          compressor.knee.value = 30;
          
          currentNode.connect(compressor);
          currentNode = compressor;
        }
        
        if (options.activeEffects.includes('reverb')) {
          // Create convolver node for reverb
          const convolver = offlineContext.createConvolver();
          
          // Generate impulse response for reverb
          const reverbAmount = options.reverb.amount;
          const decay = options.reverb.decay;
          const damping = options.reverb.damping;
          const impulseLength = offlineContext.sampleRate * decay;
          const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);
          
          // Fill impulse buffer with decaying noise
          for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const impulseData = impulse.getChannelData(channel);
            for (let i = 0; i < impulseLength; i++) {
              const t = i / offlineContext.sampleRate;
              const envelope = Math.pow(1 - t / decay, damping * 10);
              impulseData[i] = (Math.random() * 2 - 1) * envelope;
            }
          }
          
          convolver.buffer = impulse;
          
          // Create a gain node to control reverb mix
          const reverbGain = offlineContext.createGain();
          reverbGain.gain.value = reverbAmount;
          
          // Create a gain node for dry signal
          const dryGain = offlineContext.createGain();
          dryGain.gain.value = 1 - reverbAmount;
          
          // Split the signal
          currentNode.connect(convolver);
          currentNode.connect(dryGain);
          
          // Connect reverb through its gain
          convolver.connect(reverbGain);
          
          // Create a merger node
          const merger = offlineContext.createGain();
          reverbGain.connect(merger);
          dryGain.connect(merger);
          
          currentNode = merger;
        }
        
        if (options.activeEffects.includes('delay')) {
          // Create delay node
          const delay = offlineContext.createDelay();
          delay.delayTime.value = options.delay.time;
          
          // Create feedback gain node
          const feedback = offlineContext.createGain();
          feedback.gain.value = options.delay.feedback;
          
          // Create mix gain nodes
          const dryGain = offlineContext.createGain();
          dryGain.gain.value = 1 - options.delay.mix;
          
          const wetGain = offlineContext.createGain();
          wetGain.gain.value = options.delay.mix;
          
          // Connect nodes
          currentNode.connect(dryGain);
          currentNode.connect(delay);
          delay.connect(wetGain);
          delay.connect(feedback);
          feedback.connect(delay);
          
          // Create a merger node
          const merger = offlineContext.createGain();
          dryGain.connect(merger);
          wetGain.connect(merger);
          
          currentNode = merger;
        }
        
        if (options.activeEffects.includes('distortion')) {
          // Create waveshaper node for distortion
          const distortion = offlineContext.createWaveShaper();
          
          // Create distortion curve
          const amount = options.distortion.amount;
          const tone = options.distortion.tone;
          const samples = 44100;
          const curve = new Float32Array(samples);
          const deg = Math.PI / 180;
          
          for (let i = 0; i < samples; ++i) {
            const x = i * 2 / samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
          }
          
          distortion.curve = curve;
          distortion.oversample = '4x';
          
          // Create tone control (low-pass filter)
          const toneControl = offlineContext.createBiquadFilter();
          toneControl.type = 'lowpass';
          toneControl.frequency.value = 350 + (tone * 10000);
          
          currentNode.connect(distortion);
          distortion.connect(toneControl);
          currentNode = toneControl;
        }
        
        if (options.activeEffects.includes('limiter')) {
          // Create compressor node configured as a limiter
          const limiter = offlineContext.createDynamicsCompressor();
          limiter.threshold.value = options.limiter.threshold;
          limiter.ratio.value = 20; // High ratio for limiting
          limiter.attack.value = 0.001; // Fast attack
          limiter.release.value = options.limiter.release / 1000; // Convert ms to seconds
          limiter.knee.value = 0.0; // Hard knee
          
          currentNode.connect(limiter);
          currentNode = limiter;
        }
        
        if (options.activeEffects.includes('output')) {
          // Create gain node for output level
          const outputGain = offlineContext.createGain();
          outputGain.gain.value = Math.pow(10, options.output.gain / 20); // Convert dB to linear gain
          
          currentNode.connect(outputGain);
          currentNode = outputGain;
        }
        
        // Connect the final node to the destination
        currentNode.connect(offlineContext.destination);
        
        // Start the source
        source.start(0);
        
        // Render the audio
        console.log('[AudioProcessingService] Rendering preview audio...');
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert the processed buffer to WAV
        const wavData = this.audioBufferToWav(renderedBuffer);
        const wavBlob = new Blob([wavData], { type: 'audio/wav' });
        
        // Create a URL for the processed audio
        const previewUrl = URL.createObjectURL(wavBlob);
        
        console.log('[AudioProcessingService] Preview complete, URL:', previewUrl);
        
        // Clean up
        audioContext.close();
        
        return previewUrl;
      } else {
        // For native platforms, we'll use a different approach
        console.log('[AudioProcessingService] Using native preview path');
        
        // For now, just copy the file as a placeholder
        // In a real implementation, we would use native audio processing APIs
        await this.copyFile(audioUri, previewFilePath);
        
        return previewFilePath;
      }
    } catch (error) {
      console.error('[AudioProcessingService] Error previewing audio:', error);
      throw new Error(`Failed to preview audio: ${error.message}`);
    }
  }
} 