import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import AudioUploadService from '../../services/AudioUploadService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Mock all the firebase modules
jest.mock('firebase/storage', () => ({
  ref: jest.fn().mockReturnValue({ fullPath: 'users/testuser/audio/test.mp3' }),
  uploadBytesResumable: jest.fn().mockImplementation(() => ({
    on: jest.fn((event, progressCb, errorCb, completeCb) => {
      // Simulate progress
      progressCb({ bytesTransferred: 50, totalBytes: 100 });
      // Simulate completion
      completeCb();
      return { catch: jest.fn().mockResolvedValue(undefined) };
    }),
    then: jest.fn(cb => {
      cb();
      return { catch: jest.fn().mockResolvedValue(undefined) };
    }),
    catch: jest.fn().mockResolvedValue(undefined)
  })),
  getDownloadURL: jest.fn().mockResolvedValue('https://firebasestorage.example.com/file.mp3')
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn().mockReturnValue({ path: 'audioFiles' }),
  addDoc: jest.fn().mockResolvedValue({ id: 'testAudioFileId' }),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn().mockReturnValue({ _seconds: 1626000000, _nanoseconds: 0 }),
  doc: jest.fn().mockReturnValue({ path: 'projects/testProject/tracks/testTrack' })
}));

// Mock the FileSystem
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  readAsStringAsync: jest.fn().mockResolvedValue('base64data')
}));

// Mock react-native-firebase/storage
jest.mock('@react-native-firebase/storage', () => ({
  default: jest.fn().mockReturnValue({
    ref: jest.fn().mockReturnValue({
      putFile: jest.fn().mockReturnValue({
        on: jest.fn((event, callback) => {
          callback({ bytesTransferred: 50, totalBytes: 100 });
          return { then: jest.fn() };
        }),
        then: jest.fn(cb => {
          cb();
          return { catch: jest.fn() };
        })
      }),
      getDownloadURL: jest.fn().mockResolvedValue('https://firebasestorage.example.com/file.mp3')
    })
  })
}));

// Mock Platform to test both web and native platforms
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web' // Change to 'ios' or 'android' to test native implementation
  }
}));

describe('AudioUploadService', () => {
  const userId = 'testuser';
  const fileUri = 'file:///test/file.mp3';
  const fileName = 'test.mp3';
  const fileSize = 1024;
  const duration = 120;
  const mimeType = 'audio/mpeg';
  const projectId = 'testProject';
  const trackId = 'testTrack';
  const mockProgressCallback = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset platform for each test
    (Platform.OS as any) = 'web';
    
    // Mock fetch for web implementation
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'audio/mpeg' }))
    });
  });
  
  test('uploads audio file successfully on web platform', async () => {
    const result = await AudioUploadService.uploadAudioFile(
      userId,
      fileUri,
      fileName,
      fileSize,
      duration,
      mimeType,
      projectId,
      trackId,
      false,
      [],
      mockProgressCallback
    );
    
    // Verify success result
    expect(result.success).toBe(true);
    expect(result.fileId).toBe('testAudioFileId');
    expect(result.downloadUrl).toBe('https://firebasestorage.example.com/file.mp3');
    
    // Verify Firebase calls
    expect(ref).toHaveBeenCalled();
    expect(uploadBytesResumable).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
    expect(collection).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
    expect(mockProgressCallback).toHaveBeenCalled();
    
    // Verify updateProjectTrackAudio was called
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        audioFileId: 'testAudioFileId',
        audioFileUrl: 'https://firebasestorage.example.com/file.mp3'
      })
    );
  });
  
  test('uploads audio file successfully on native platform', async () => {
    // Set platform to native
    (Platform.OS as any) = 'ios';
    
    const result = await AudioUploadService.uploadAudioFile(
      userId,
      fileUri,
      fileName,
      fileSize,
      duration,
      mimeType,
      projectId,
      trackId,
      false,
      [],
      mockProgressCallback
    );
    
    // Verify success result
    expect(result.success).toBe(true);
    expect(result.fileId).toBe('testAudioFileId');
    expect(result.downloadUrl).toBe('https://firebasestorage.example.com/file.mp3');
    
    // Verify FileSystem.getInfoAsync was called to check file existence
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(fileUri);
  });
  
  test('handles validation errors correctly', async () => {
    // Test missing user ID
    const resultNoUser = await AudioUploadService.uploadAudioFile(
      '',
      fileUri,
      fileName,
      fileSize,
      duration
    );
    
    expect(resultNoUser.success).toBe(false);
    expect(resultNoUser.error.code).toBe('invalid-params');
    expect(resultNoUser.error.message).toContain('User ID is required');
    
    // Test missing file URI
    const resultNoUri = await AudioUploadService.uploadAudioFile(
      userId,
      '',
      fileName,
      fileSize,
      duration
    );
    
    expect(resultNoUri.success).toBe(false);
    expect(resultNoUri.error.code).toBe('invalid-params');
    expect(resultNoUri.error.message).toContain('File URI is required');
  });
  
  test('handles non-existent file on native platform', async () => {
    // Set platform to native
    (Platform.OS as any) = 'ios';
    
    // Mock file not existing
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    
    const result = await AudioUploadService.uploadAudioFile(
      userId,
      fileUri,
      fileName,
      fileSize,
      duration
    );
    
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('file-not-found');
  });
  
  test('handles network errors during upload', async () => {
    // Mock uploadBytesResumable to throw a network error
    (uploadBytesResumable as jest.Mock).mockImplementationOnce(() => {
      throw {
        code: 'storage/retry-limit-exceeded',
        message: 'Network error occurred'
      };
    });
    
    const result = await AudioUploadService.uploadAudioFile(
      userId,
      fileUri,
      fileName,
      fileSize,
      duration
    );
    
    expect(result.success).toBe(false);
    expect(result.error.isNetworkError).toBe(true);
    expect(result.error.message).toContain('Network error occurred');
  });
  
  test('handles fetch errors on web platform', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });
    
    const result = await AudioUploadService.uploadAudioFile(
      userId,
      fileUri,
      fileName,
      fileSize,
      duration
    );
    
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Failed to fetch file: Not Found');
  });
  
  test('diagnoseNetworkError identifies network errors correctly', () => {
    const errors = [
      { code: 'storage/retry-limit-exceeded', message: 'Network error', expected: true },
      { code: 'storage/canceled', message: 'Upload canceled', expected: true },
      { code: 'auth/invalid-credential', message: 'Invalid credentials', expected: false },
      { message: 'Network connection lost', expected: true },
      { message: 'Cannot connect to server', expected: true },
      { message: 'Invalid file format', expected: false }
    ];
    
    errors.forEach(error => {
      expect(AudioUploadService.diagnoseNetworkError(error)).toBe(error.expected);
    });
  });
  
  test('gets correct MIME type from file extension', () => {
    const extensions = [
      { ext: 'mp3', expected: 'audio/mpeg' },
      { ext: 'wav', expected: 'audio/wav' },
      { ext: 'm4a', expected: 'audio/m4a' },
      { ext: 'ogg', expected: 'audio/ogg' },
      { ext: 'flac', expected: 'audio/flac' },
      { ext: 'unknown', expected: 'audio/mpeg' } // Default for unknown extension
    ];
    
    extensions.forEach(({ ext, expected }) => {
      expect(AudioUploadService.getMimeTypeFromExtension(ext)).toBe(expected);
    });
  });
}); 