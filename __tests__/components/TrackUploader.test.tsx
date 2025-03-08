import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TrackUploader from '../../components/studio/TrackUploader';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';

// Mock the hooks and pickers
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn()
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn()
}));

describe('TrackUploader', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'test-user-id' }
    });
    
    // Mock the document picker
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      name: 'test-audio.mp3',
      uri: 'file://test-audio.mp3',
      size: 1000
    });
    
    // Mock the image picker
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }]
    });
  });
  
  it('renders correctly', () => {
    const { getByText } = render(
      <TrackUploader
        onUploadComplete={mockOnUploadComplete}
        onCancel={mockOnCancel}
      />
    );
    
    expect(getByText('Upload Track')).toBeTruthy();
    expect(getByText('Select Audio File')).toBeTruthy();
    expect(getByText('Add Cover Art')).toBeTruthy();
  });
  
  it('handles cancel button press', () => {
    const { getByText } = render(
      <TrackUploader
        onUploadComplete={mockOnUploadComplete}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  it('allows selecting an audio file', async () => {
    const { getByText } = render(
      <TrackUploader
        onUploadComplete={mockOnUploadComplete}
        onCancel={mockOnCancel}
      />
    );
    
    // Press the audio file picker button
    fireEvent.press(getByText('Select Audio File'));
    
    // Wait for the document picker to be called
    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
    });
    
    // Check that the file name is displayed
    await waitFor(() => {
      expect(getByText('test-audio.mp3')).toBeTruthy();
    });
  });
  
  it('allows selecting cover art', async () => {
    const { getByText } = render(
      <TrackUploader
        onUploadComplete={mockOnUploadComplete}
        onCancel={mockOnCancel}
      />
    );
    
    // Press the cover art picker button
    fireEvent.press(getByText('Add Cover Art'));
    
    // Wait for the image picker to be called
    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });
}); 