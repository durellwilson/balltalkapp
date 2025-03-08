// Type declarations for MockAudio module

export class Recording {
  prepareToRecordAsync(options: any): Promise<void>;
  startAsync(): Promise<void>;
  stopAndUnloadAsync(): Promise<void>;
  getURI(): string | null;
}

export class Sound {
  static createAsync(source: any, options: any): Promise<{ sound: Sound }>;
  playAsync(): Promise<void>;
  stopAsync(): Promise<void>;
  unloadAsync(): Promise<void>;
  setOnPlaybackStatusUpdate(callback: (status: any) => void): void;
}

export function requestPermissionsAsync(): Promise<{ granted: boolean }>;
export function setAudioModeAsync(options: any): Promise<void>;

export const RecordingOptionsPresets = {
  HIGH_QUALITY: {
    android: {
      extension: '.m4a',
      outputFormat: 2,
      audioEncoder: 3,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000
    },
    ios: {
      extension: '.m4a',
      outputFormat: 'aac',
      audioQuality: 'high',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000
    }
  }
}
