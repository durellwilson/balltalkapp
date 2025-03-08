import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../src/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface Recording {
  id: string;
  uri: string;
  duration: number;
  title?: string;
  createdAt: Date;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  audioUrl: string;
  duration: number;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: Date;
  plays: number;
  likes: number;
}

class StudioService {
  private recording: Audio.Recording | null = null;
  private recordings: Recording[] = [];

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      console.log('[StudioService] Requesting permissions...');
      
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        throw new Error('Permission to access microphone was denied');
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('[StudioService] Starting recording...');
      
      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      console.log('[StudioService] Recording started');
    } catch (error) {
      console.error('[StudioService] Failed to start recording:', error);
      throw error;
    }
  }
  
  /**
   * Stop recording audio
   */
  async stopRecording(): Promise<Recording> {
    try {
      console.log('[StudioService] Stopping recording...');
      
      if (!this.recording) {
        throw new Error('No active recording to stop');
      }
      
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      
      // Get recording URI
      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Recording URI is null');
      }
      
      // Get recording status
      const status = await this.recording.getStatusAsync();
      
      // Create recording object
      const newRecording: Recording = {
        id: uuidv4(),
        uri,
        duration: status.durationMillis || 0,
        createdAt: new Date(),
      };
      
      // Add to recordings list
      this.recordings.push(newRecording);
      
      // Reset recording
      this.recording = null;
      
      console.log('[StudioService] Recording stopped:', newRecording);
      return newRecording;
    } catch (error) {
      console.error('[StudioService] Failed to stop recording:', error);
      throw error;
    }
  }
  
  /**
   * Get all recordings
   */
  getRecordings(): Recording[] {
    return this.recordings;
  }
  
  /**
   * Delete a recording
   */
  deleteRecording(id: string): void {
    this.recordings = this.recordings.filter(recording => recording.id !== id);
  }
  
  /**
   * Upload a track to Firebase
   */
  async uploadTrack(
    userId: string,
    artistName: string,
    recording: Recording,
    title: string,
    genre?: string,
    description?: string,
    coverImageUri?: string
  ): Promise<Track> {
    try {
      console.log('[StudioService] Uploading track:', title);
      
      // Generate unique ID for the track
      const trackId = uuidv4();
      
      // Upload audio file
      const audioStorageRef = ref(storage, `tracks/${userId}/${trackId}/audio.m4a`);
      
      // For web, we need to fetch the file first
      let audioBlob;
      if (Platform.OS === 'web') {
        const response = await fetch(recording.uri);
        audioBlob = await response.blob();
      } else {
        // For native, we can use the URI directly with a fetch
        const response = await fetch(recording.uri);
        audioBlob = await response.blob();
      }
      
      // Upload audio
      await uploadBytes(audioStorageRef, audioBlob);
      const audioUrl = await getDownloadURL(audioStorageRef);
      
      // Upload cover image if provided
      let coverImageUrl = '';
      if (coverImageUri) {
        const coverStorageRef = ref(storage, `tracks/${userId}/${trackId}/cover.jpg`);
        const coverResponse = await fetch(coverImageUri);
        const coverBlob = await coverResponse.blob();
        await uploadBytes(coverStorageRef, coverBlob);
        coverImageUrl = await getDownloadURL(coverStorageRef);
      }
      
      // Create track object
      const track: Track = {
        id: trackId,
        title,
        artistId: userId,
        artistName,
        audioUrl,
        duration: recording.duration,
        genre,
        description,
        coverImageUrl,
        createdAt: new Date(),
        plays: 0,
        likes: 0
      };
      
      // Save track to Firestore
      await addDoc(collection(db, 'tracks'), {
        ...track,
        createdAt: serverTimestamp()
      });
      
      console.log('[StudioService] Track uploaded successfully:', track);
      return track;
    } catch (error) {
      console.error('[StudioService] Failed to upload track:', error);
      throw error;
    }
  }
  
  /**
   * Get tracks by user ID
   */
  async getTracksByUser(userId: string): Promise<Track[]> {
    try {
      // This is a placeholder - in a real implementation, you would query Firestore
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('[StudioService] Failed to get tracks by user:', error);
      throw error;
    }
  }
}

export default new StudioService(); 