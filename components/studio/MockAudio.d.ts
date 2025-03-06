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

export const RecordingOptionsPresets: {
  HIGH_QUALITY: {
    android: {
      extension: string;
      outputFormat: number;
      audioEncoder: number;
      sampleRate: number;
      numberOfChannels: number;
      bitRate: number;
    };
    ios: {
      extension: string;
      outputFormat: string;
      audioQuality: string;
      sampleRate: number;
      numberOfChannels: number;
      bitRate: number;
      linearPCMBitDepth: number;
      linearPCMIsBigEndian: boolean;
      linearPCMIsFloat: boolean;
    };
    web: {
      mimeType: string;
      bitsPerSecond: number;
    };
  };
};
