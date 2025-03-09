// Mock for expo-file-system module
const FileSystem = {
  documentDirectory: 'file:///mock-document-directory/',
  cacheDirectory: 'file:///mock-cache-directory/',
  bundleDirectory: 'file:///mock-bundle-directory/',
  
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    isDirectory: false,
    size: 1024,
    modificationTime: Date.now(),
    uri: 'file:///mock-file.mp3'
  }),
  
  readAsStringAsync: jest.fn().mockResolvedValue('mock file content'),
  
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  
  moveAsync: jest.fn().mockResolvedValue(undefined),
  
  copyAsync: jest.fn().mockImplementation(({ from, to }) => {
    console.log(`Mock copying file from ${from} to ${to}`);
    return Promise.resolve();
  }),
  
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  
  readDirectoryAsync: jest.fn().mockResolvedValue(['file1.mp3', 'file2.mp3']),
  
  downloadAsync: jest.fn().mockImplementation((uri, fileUri) => {
    return Promise.resolve({
      uri: fileUri,
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    });
  }),
  
  createDownloadResumable: jest.fn().mockImplementation((uri, fileUri, options) => {
    return {
      downloadAsync: jest.fn().mockResolvedValue({
        uri: fileUri,
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      }),
      pauseAsync: jest.fn().mockResolvedValue({
        resumeData: 'mock-resume-data'
      }),
      resumeAsync: jest.fn().mockResolvedValue({
        uri: fileUri,
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      }),
      savable: jest.fn().mockReturnValue({
        url: uri,
        fileUri: fileUri,
        options: options
      })
    };
  })
};

export default FileSystem; 