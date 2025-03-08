import { expect, jest, describe, it, beforeEach } from '@jest/globals';
import { AudioEngine } from './AudioEngine';
import { AudioProcessingSettings } from '../../models/audio/MasteringModels';
import { DEFAULT_VOCAL_PRESETS } from '../../models/audio/NectarModels';
import { DEFAULT_MASTERING_PRESETS } from '../../models/audio/OzoneModels';

// Mock the Dolby.io API
jest.mock('@dolbyio/media-processing', () => ({
  createClient: jest.fn().mockReturnValue({
    analyze: jest.fn().mockResolvedValue({
      loudness: -14,
      peakLevel: -1.2,
      dynamicRange: 12,
      spectralContent: [/* mock spectral data */],
    }),
    process: jest.fn().mockResolvedValue({
      url: 'https://processed-audio-url.com/file.wav',
    }),
  }),
}));

// Mock the Firebase storage
jest.mock('../../services/firebase/storage', () => ({
  uploadAudioFile: jest.fn().mockResolvedValue('https://uploaded-audio-url.com/file.wav'),
  getDownloadURL: jest.fn().mockResolvedValue('https://download-audio-url.com/file.wav'),
}));

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockSettings: AudioProcessingSettings;
  
  beforeEach(() => {
    audioEngine = new AudioEngine();
    
    // Create mock settings using default presets
    mockSettings = {
      id: 'test-settings',
      name: 'Test Settings',
      description: 'Settings for testing',
      masteringPreset: DEFAULT_MASTERING_PRESETS[0],
      vocalPreset: DEFAULT_VOCAL_PRESETS[0],
      targetLoudness: -14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user',
      isDefault: false,
    };
  });
  
  describe('analyzeAudio', () => {
    it('should analyze audio file and return analysis data', async () => {
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Call the method
      const result = await audioEngine.analyzeAudio(mockFile);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.loudness).toBe(-14);
      expect(result.peakLevel).toBe(-1.2);
      expect(result.dynamicRange).toBe(12);
      expect(result.spectralContent).toBeDefined();
    });
    
    it('should throw an error if analysis fails', async () => {
      // Override the mock to simulate failure
      const mockDolbyClient = require('@dolbyio/media-processing').createClient();
      mockDolbyClient.analyze.mockRejectedValueOnce(new Error('Analysis failed'));
      
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Call the method and expect it to throw
      await expect(audioEngine.analyzeAudio(mockFile)).rejects.toThrow('Analysis failed');
    });
  });
  
  describe('processAudio', () => {
    it('should process audio file with given settings and return result', async () => {
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Mock the analyzeAudio method
      audioEngine.analyzeAudio = jest.fn().mockResolvedValue({
        loudness: -14,
        peakLevel: -1.2,
        dynamicRange: 12,
        spectralContent: [/* mock spectral data */],
      });
      
      // Call the method
      const result = await audioEngine.processAudio(mockFile, mockSettings);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.originalFileUrl).toBeDefined();
      expect(result.processedFileUrl).toBeDefined();
      expect(result.settings).toEqual(mockSettings);
      expect(result.loudnessOriginal).toBeDefined();
      expect(result.loudnessProcessed).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });
    
    it('should throw an error if processing fails', async () => {
      // Override the mock to simulate failure
      const mockDolbyClient = require('@dolbyio/media-processing').createClient();
      mockDolbyClient.process.mockRejectedValueOnce(new Error('Processing failed'));
      
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Mock the analyzeAudio method
      audioEngine.analyzeAudio = jest.fn().mockResolvedValue({
        loudness: -14,
        peakLevel: -1.2,
        dynamicRange: 12,
        spectralContent: [/* mock spectral data */],
      });
      
      // Call the method and expect it to throw
      await expect(audioEngine.processAudio(mockFile, mockSettings)).rejects.toThrow('Processing failed');
    });
  });
  
  describe('applyPreset', () => {
    it('should apply a preset to audio file', async () => {
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Call the method
      const result = await audioEngine.applyPreset(mockFile, mockSettings.masteringPreset);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.url).toBe('https://processed-audio-url.com/file.wav');
    });
  });
  
  describe('generateWaveformData', () => {
    it('should generate waveform data from audio file', async () => {
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Call the method
      const result = await audioEngine.generateWaveformData(mockFile);
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('generateSpectrogramData', () => {
    it('should generate spectrogram data from audio file', async () => {
      // Create a mock File object
      const mockFile = new File(['mock audio data'], 'test-audio.wav', { type: 'audio/wav' });
      
      // Call the method
      const result = await audioEngine.generateSpectrogramData(mockFile);
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
}); 