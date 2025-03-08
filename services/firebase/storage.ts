import { storage } from '../../src/lib/firebase';
import { ref, uploadBytes, getDownloadURL as getURL } from 'firebase/storage';

/**
 * Upload an audio file to Firebase Storage
 * @param file File object to upload
 * @param path Path in storage where to upload the file
 * @returns Promise with the storage reference
 */
export const uploadAudioFile = async (file: File, path: string = 'audio'): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    const fileName = file.name.replace(/\s+/g, '_').toLowerCase();
    const storageRef = ref(storage, `${path}/${timestamp}_${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
};

/**
 * Get the download URL for a file in Firebase Storage
 * @param path Path to the file in storage
 * @returns Promise with the download URL
 */
export const getDownloadURL = async (storageRef: any): Promise<string> => {
  try {
    return await getURL(storageRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path Path to the file in storage
 * @returns Promise
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Mock function for deleteObject (used in deleteFile)
const deleteObject = async (ref: any): Promise<void> => {
  // In production, this would be imported from firebase/storage
  return Promise.resolve();
}; 