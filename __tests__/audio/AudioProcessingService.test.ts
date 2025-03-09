import { AudioProcessingService } from '../../services/audio/AudioProcessingService';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Set Platform to web for tests before any imports
Platform.OS = 'web';

// Mock dependencies
jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' }
}));

// Mock fetch for web processing
global.fetch = jest.fn();

// Ensure global objects exist before tests run
if (typeof window === 'undefined') {
  global.window = {} as any;
}

// Mock Web Audio API for web tests
class MockAudioContext {
  sampleRate = 48000;
  currentTime = 0;
  destination = { maxChannelCount: 2 };
  
  constructor(options = {}) {
    if (options.sampleRate) this.sampleRate = options.sampleRate;
  }
  
  createBuffer(numChannels, length, sampleRate) {
    return {
      numberOfChannels: numChannels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(length)),
      copyToChannel: jest.fn(),
      copyFromChannel: jest.fn(),
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: jest.fn(), setTargetAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: jest.fn(),
      getFloatTimeDomainData: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 350 },
      Q: { value: 1 },
      gain: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createDynamicsCompressor() {
    return {
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 12 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createConvolver() {
    return {
      buffer: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createDelay() {
    return {
      delayTime: { value: 0.5 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createWaveShaper() {
    return {
      curve: null,
      oversample: '4x',
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createMediaStreamDestination() {
    return {
      stream: { id: 'mock-stream-id' },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  decodeAudioData(arrayBuffer) {
    return Promise.resolve({
      numberOfChannels: 2,
      length: 48000 * 5, // 5 seconds of audio
      sampleRate: 48000,
      duration: 5,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(48000 * 5)),
    });
  }
  
  async startRendering() {
    return this.createBuffer(2, 48000 * 5, 48000);
  }
  
  close() {
    return Promise.resolve();
  }
}

// Mock OfflineAudioContext
class MockOfflineAudioContext extends MockAudioContext {
  constructor(numberOfChannels, length, sampleRate) {
    super({ sampleRate });
    this.length = length;
    this.numberOfChannels = numberOfChannels;
  }
}

// Setup global mocks for web audio context
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
global.OfflineAudioContext = MockOfflineAudioContext;

// Mock URL object methods
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock Blob constructor
global.Blob = function Blob(parts, options) {
  return {
    size: parts.reduce((acc, part) => acc + (part.length || 0), 0),
    type: options?.type || '',
  };
};

// Mock ArrayBuffer
global.ArrayBuffer = function ArrayBuffer(length) {
  return { byteLength: length };
};

// Mock Float32Array if needed
if (typeof Float32Array === 'undefined') {
  global.Float32Array = function Float32Array(length) {
    const arr = new Array(length).fill(0);
    arr.set = jest.fn();
    return arr;
  };
}

// Mock DataView
global.DataView = function DataView(buffer, byteOffset, byteLength) {
  return {
    buffer,
    byteOffset: byteOffset || 0,
    byteLength: byteLength || buffer.byteLength,
    getInt16: jest.fn(),
    setInt16: jest.fn(),
    getUint8: jest.fn(),
    setUint8: jest.fn(),
    getUint32: jest.fn(),
    setUint32: jest.fn(),
    getUint16: jest.fn(),
    setUint16: jest.fn(),
  };
};

describe('AudioProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file exists
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024000,
      uri: 'file:///test/audio.mp3',
      isDirectory: false,
    });
    
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      blob: jest.fn().mockResolvedValue({
        size: 1024000,
        type: 'audio/mp3',
      }),
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024000)),
    });
  });
  
  describe('processAudio', () => {
    it('should process audio with all effects disabled', async () => {
      const mockOnProgress = jest.fn();
      
      const options = {
        effects: {
          normalize: false,
          compression: false,
          reverb: false,
          eq: false,
          fadeIn: false,
          fadeOut: false,
        },
        parameters: {},
      };
      
      const result = await AudioProcessingService.processAudio(
        'file:///test/audio.mp3',
        options,
        mockOnProgress
      );
      
      // Verify progress was called
      expect(mockOnProgress).toHaveBeenCalled();
      
      // Verify file info was checked
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify result is a URL
      expect(result).toContain('blob:');
    });
    
    it('should process audio with all effects enabled', async () => {
      const mockOnProgress = jest.fn();
      
      const options = {
        effects: {
          normalize: true,
          compression: true,
          reverb: true,
          eq: true,
          fadeIn: true,
          fadeOut: true,
        },
        parameters: {
          compressionThreshold: -24,
          compressionRatio: 4,
          reverbAmount: 0.3,
          eqLow: 3,
          eqMid: 0,
          eqHigh: 2,
          fadeInDuration: 1,
          fadeOutDuration: 1,
        },
      };
      
      const result = await AudioProcessingService.processAudio(
        'file:///test/audio.mp3',
        options,
        mockOnProgress
      );
      
      // Verify progress was called
      expect(mockOnProgress).toHaveBeenCalled();
      
      // Verify file info was checked
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify result is a URL
      expect(result).toContain('blob:');
    });
    
    it('should throw an error if audio file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      
      const mockOnProgress = jest.fn();
      
      await expect(
        AudioProcessingService.processAudio(
          'file:///test/nonexistent.mp3',
          { effects: {}, parameters: {} },
          mockOnProgress
        )
      ).rejects.toThrow('Audio file not found');
    });
    
    it('should handle empty audio URI', async () => {
      const mockOnProgress = jest.fn();
      
      await expect(
        AudioProcessingService.processAudio(
          '',
          { effects: {}, parameters: {} },
          mockOnProgress
        )
      ).rejects.toThrow('No audio URI provided');
    });
  });
  
  describe('previewAudio', () => {
    it('should generate a preview of the audio with effects', async () => {
      const options = {
        activeEffects: ['equalizer', 'compressor'],
        equalizer: { lowGain: 3, midGain: 0, highGain: 2 },
        compressor: { threshold: -24, ratio: 4, attack: 10, release: 100 },
      };
      
      const result = await AudioProcessingService.previewAudio(
        'file:///test/audio.mp3',
        options
      );
      
      // Verify file info was checked
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('file:///test/audio.mp3');
      
      // Verify result is a URL
      expect(result).toContain('blob:');
    });
    
    it('should throw an error if audio file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      
      await expect(
        AudioProcessingService.previewAudio(
          'file:///test/nonexistent.mp3',
          { activeEffects: [] }
        )
      ).rejects.toThrow('Audio file not found');
    });
  });
  
  describe('helper methods', () => {
    it('should normalize audio data correctly', () => {
      // Create a method to access the private normalizeAudio method
      const normalizeAudio = (AudioProcessingService as any).normalizeAudio;
      
      // Create a mock audio buffer
      const mockBuffer = {
        numberOfChannels: 2,
        length: 10,
        sampleRate: 48000,
        getChannelData: jest.fn().mockImplementation((channel) => {
          if (channel === 0) return new Float32Array([0.1, -0.2, 0.3, -0.4, 0.5, -0.6, 0.7, -0.8, 0.9, -1.0]);
          return new Float32Array([0.2, -0.3, 0.4, -0.5, 0.6, -0.7, 0.8, -0.9, 1.0, -0.1]);
        }),
        copyToChannel: jest.fn(),
      };
      
      // Run the normalization
      const result = normalizeAudio(mockBuffer);
      
      // Verify result is a new buffer
      expect(result).not.toBe(mockBuffer);
      
      // Verify copyToChannel was called for each channel
      expect(mockBuffer.copyToChannel).toHaveBeenCalledTimes(2);
    });
    
    it('should apply fade in correctly', () => {
      // Create a method to access the private applyFadeInToBuffer method
      const applyFadeInToBuffer = (AudioProcessingService as any).applyFadeInToBuffer;
      
      // Create a mock audio buffer
      const mockBuffer = {
        numberOfChannels: 2,
        length: 10,
        sampleRate: 48000,
        getChannelData: jest.fn().mockImplementation(() => new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])),
        copyToChannel: jest.fn(),
      };
      
      // Run the fade in
      const result = applyFadeInToBuffer(mockBuffer, 0.5);
      
      // Verify result is a new buffer
      expect(result).not.toBe(mockBuffer);
      
      // Verify copyToChannel was called for each channel
      expect(mockBuffer.copyToChannel).toHaveBeenCalledTimes(2);
    });
    
    it('should apply fade out correctly', () => {
      // Create a method to access the private applyFadeOutToBuffer method
      const applyFadeOutToBuffer = (AudioProcessingService as any).applyFadeOutToBuffer;
      
      // Create a mock audio buffer
      const mockBuffer = {
        numberOfChannels: 2,
        length: 10,
        sampleRate: 48000,
        getChannelData: jest.fn().mockImplementation(() => new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])),
        copyToChannel: jest.fn(),
      };
      
      // Run the fade out
      const result = applyFadeOutToBuffer(mockBuffer, 0.5);
      
      // Verify result is a new buffer
      expect(result).not.toBe(mockBuffer);
      
      // Verify copyToChannel was called for each channel
      expect(mockBuffer.copyToChannel).toHaveBeenCalledTimes(2);
    });
  });
}); 