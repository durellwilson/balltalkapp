import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  FirestoreError, 
  updateDoc,
  Firestore,
  getFirestore,
  addDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  getDownloadURL, 
  uploadBytes,
  FirebaseStorage,
  getStorage,
  deleteObject
} from 'firebase/storage';
import type { Track, Collaborator } from '../components/studio/StudioTypes';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getDevicePlatform, getActiveDeviceSettings, simulateNetworkRequest } from '../utils/deviceSimulation';
import { db, storage } from '../src/lib/firebase';
import storage_lib from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';

// Properly type the Firebase services
const firebaseDb: Firestore = db as Firestore;
const firebaseStorage: FirebaseStorage = storage as FirebaseStorage;

interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    tracks: Track[];
    tempo?: number;
    isPublic?: boolean;
    description?: string;
    tags?: string[];
    collaborators?: Collaborator[];
    isCollaborative?: boolean;
    collaborationSessionId?: string;
    coverArtUrl?: string;
}

interface Recording {
    id: string;
    url: string;
    duration: number;
    createdAt: string;
    trackNumber: number;
    projectId: string;
    userId: string;
}

// Helper function to diagnose network errors
function diagnoseNetworkError(error: any): boolean {
  if (error && error.code) {
    if (error.code === "unavailable" || error.code === "deadline-exceeded")
      return true;
    else if (error.code.startsWith('storage/'))
      return true;
    else 
      return false;
  } else return false;
}


const PROJECTS_COLLECTION = 'projects';
const RECORDINGS_COLLECTION = 'recordings';

class DawService {
  private activeRecording: Audio.Recording | null = null;
    audioContext: AudioContext | null = null;
    microphoneStream: MediaStream | null = null;
    isRecording: boolean = false;
    selectedTrackNumber: number | null = null;
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];
    currentUserId: string | null = null;
    currentProjectId: string | null = null;
    audioElements: Map<string, HTMLAudioElement> = new Map();
    masterGainNode: GainNode | null = null;
    audioNodes: Map<string, MediaElementAudioSourceNode> = new Map();
    gainNodes: Map<string, GainNode> = new Map();
    panNodes: Map<string, StereoPannerNode> = new Map();

  // Function to check and request microphone permissions
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator?.mediaDevices) {
        console.log('Requesting microphone permission...');

        // First check if permissions were already denied
        // Note: This is not fully reliable as browsers handle permission state differently
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (permissionStatus.state === 'denied') {
              console.error('Microphone permission previously denied');
              throw new Error('Microphone access was previously denied. Please reset permissions in your browser settings and try again. You may need to click on the padlock icon in your address bar and enable microphone access.');
            }
          } catch (permQueryError) {
            // Some browsers might not support this API, so we'll continue anyway
            console.warn('Could not query permission state:', permQueryError);
          }
        }

        try {
          // Try to get user media to trigger the permission prompt
          // Make sure audio context is resumed first (needed for some browsers)
          if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          
           // Request with more explicit constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          // If we get here, permission was granted
          console.log('Microphone permission granted');

          // Store the stream for later use
          this.microphoneStream = stream;

          return true;
        } catch (permissionError) {
          console.error('Error requesting microphone permission:', permissionError);

           // Handle specific permission errors with more detailed messages
          if (permissionError instanceof DOMException) {
            if (permissionError.name === 'NotAllowedError') {
              console.error('User denied microphone permission');
              throw new Error(
                'Microphone access was denied. To enable recording:\n\n' +
                '1. Look for the microphone icon or padlock in your browser\'s address bar\n' +
                '2. Click it and select "Allow" for microphone access\n' +
                '3. Refresh the page and try again'
              );
            } else if (permissionError.name === 'NotFoundError') {
              console.error('No microphone found on this device');
              throw new Error('No microphone was detected on your device. Please connect a microphone and try again.');
            } else if (permissionError.name === 'NotReadableError') {
              console.error('Microphone is already in use by another application');
              throw new Error('Your microphone is already in use by another application. Please close other applications that might be using your microphone and try again.');
            } else if (permissionError.name === 'AbortError') {
              console.error('Hardware or permission error occurred');
              throw new Error('A hardware or permission error occurred. Please check your microphone connection and browser permissions.');
            } else if (permissionError.name === 'SecurityError') {
              console.error('Security error when accessing microphone');
              throw new Error('Your browser blocked microphone access due to security settings. Try using HTTPS or check your browser settings.');
            }
          }

          throw permissionError;
        }
      } else {
        // For React Native, we would use the Permissions API
        // For now, just simulate success
        console.log('Simulating permission request on React Native...');
        return true;
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      throw error; // Re-throw to handle in the UI
    }
  }


  // Function to record audio on a specific track
  async recordAudio(trackNumber?: number): Promise<string> {
    try {
      // Use simulated platform instead of actual platform
      const simulatedPlatform = getDevicePlatform();

      if ((simulatedPlatform === 'web' || Platform.OS === 'web') && typeof window !== 'undefined' && navigator?.mediaDevices) {
        if (this.isRecording) {
          return 'Already recording';
        }

        // Set the selected track number if provided
        if (trackNumber !== undefined) {
          this.selectedTrackNumber = trackNumber;
        }

        // Resume audio context if it's suspended (needed for Chrome)
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        // Use the existing stream if we have one, otherwise request a new one
        if (!this.microphoneStream) {
          // Request microphone permission
          await this.requestMicrophonePermission();
        }

        // Check if we have a stream after requesting permission
        if (!this.microphoneStream) {
          throw new Error('Failed to get microphone access');
        }

        // Create a new MediaRecorder instance
        this.mediaRecorder = new MediaRecorder(this.microphoneStream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        // Set up error handling
        this.mediaRecorder.onerror = (event: any) => {
          console.error('MediaRecorder error:', event);
          this.isRecording = false;
          throw new Error('Recording error occurred');
        };

        // Start recording
        this.mediaRecorder.start(100); // Collect data every 100ms
        this.isRecording = true;

        return `Recording started on track ${this.selectedTrackNumber !== null ? this.selectedTrackNumber : 'default'}`;
      } else {
        // For React Native, simulate recording for testing
        console.log('Simulating recording on React Native...');
        this.isRecording = true;
        if (trackNumber !== undefined) {
          this.selectedTrackNumber = trackNumber;
        }
        return `Recording started on track ${this.selectedTrackNumber !== null ? this.selectedTrackNumber : 'default'} (simulated)`;
      }
    } catch (error) {
      console.error('Error recording audio:', error);

      // Return a user-friendly error message
      if (error instanceof Error) {
        return 'Error: ' + error.message;
      }

      // Check if it's a network error
      if (diagnoseNetworkError(error)) {
        return 'Network error: Please check your internet connection';
      }
      return 'Error: An unknown error occurred while trying to record audio';
    }
  }

  // Function to stop recording
async stopRecording(): Promise<Recording | null> {
  try {
    // Outer try-catch block to catch network errors
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && this.mediaRecorder && this.isRecording) {
        return new Promise((resolve) => {
          this.mediaRecorder!.onstop = async () => {
            try {
                console.log('Recording stopped, processing audio...');

                // Create a blob from the recorded audio chunks
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                console.log(`Created audio blob of size: ${audioBlob.size} bytes`);

                // Generate a unique ID for the recording
                const recordingId = uuidv4();

                // Make sure we have a user ID
                if (!this.currentUserId) {
                  console.error('No user ID set, using anonymous');
                  this.currentUserId = 'anonymous';
                }

                // Determine the storage path based on project and track
                let storagePath = `recordings/${this.currentUserId}/${recordingId}.wav`;
                if (this.currentProjectId) {
                  storagePath = `projects/${this.currentProjectId}/tracks/${this.selectedTrackNumber || 0}/${recordingId}.wav`;
                }

                console.log(`Uploading to Firebase Storage path: ${storagePath}`);

              // Create a storage reference
              const storageRef = ref(firebaseStorage, storagePath);
              
              // Upload to Firebase Storage with explicit content type
              console.log('Starting upload to Firebase Storage...');
              let uploadTask;
              try {
                uploadTask = await uploadBytes(storageRef, audioBlob, {
                  contentType: 'audio/wav'
                });
                console.log('Upload completed successfully:', uploadTask);
              } catch (error) {
                console.error("Error while uploading to storage", error);
                resolve(null);
                return;
              }

              // Get the download URL
              let downloadUrl;
              try {
                downloadUrl = await getDownloadURL(storageRef);
                console.log('Download URL obtained:', downloadUrl);
              } catch (error) {
                console.error("Error while getting download URL", error);
                resolve(null);
                return;
              }

              // Calculate duration if possible
              let duration = 0;
              if (this.audioContext) {
                try {
                  const audioBuffer = await this.audioContext.decodeAudioData(await audioBlob.arrayBuffer());
                  duration = audioBuffer.duration;
                  console.log(`Audio duration: ${duration} seconds`);
                } catch (e) {
                  console.error('Error calculating audio duration:', e);
                }
              }

              // Create the recording object
              const recording: Recording = {
                id: recordingId,
                url: downloadUrl,
                duration: duration,
                createdAt: new Date().toISOString(),
                trackNumber: this.selectedTrackNumber !== null ? this.selectedTrackNumber : 0,
                projectId: this.currentProjectId || '',
                userId: this.currentUserId
              };

              console.log('Recording object created:', recording);

              // Save the recording to Firestore
              try {
                console.log('Saving recording to Firestore...');
                const recordingRef = doc(firebaseDb, RECORDINGS_COLLECTION, recordingId);
                await setDoc(recordingRef, recording);
                console.log('Recording saved to Firestore successfully');

                // If we have a current project, update the project document
                if (this.currentProjectId && this.selectedTrackNumber !== null) {
                  console.log(`Updating project ${this.currentProjectId} with recording ${recordingId}`);

                  // Get the current project
                  const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, this.currentProjectId);
                  const projectDoc = await getDoc(projectRef);

                  if (projectDoc) {
                    const projectData = projectDoc.data() as Project;
                    
                    // Find the track
                    const trackIndex = projectData.tracks.findIndex(
                      track => track.trackNumber === this.selectedTrackNumber
                    );
                    
                    if (trackIndex !== -1) {
                      // Update the track with the new audio URL
                      const updatedTracks = [...projectData.tracks];
                      const track = updatedTracks[trackIndex];
                      
                      // Note: recordingIds is typed as never[], so we can't add to it
                      // Instead, we'll store the recording URL in the audioUri property
                      updatedTracks[trackIndex] = {
                        ...track,
                        audioUri: downloadUrl // Store the latest recording URL
                      };
                      
                      // Update the project
                      await setDoc(projectRef, {
                        ...projectData,
                        tracks: updatedTracks,
                        updatedAt: new Date().toISOString()
                      });

                      console.log(`Project ${this.currentProjectId} updated successfully with recording ${recordingId}`);
                    } else {
                      console.error(`Track with number ${this.selectedTrackNumber} not found in project`);
                    }
                  } else {
                    console.error(`Project ${this.currentProjectId} not found in Firestore`);
                  }
                }
                
                // Return the recording object
                resolve(recording);
              } catch (firestoreError) {
                console.error('Error saving recording to Firestore:', firestoreError);
                // Even if Firestore save fails, return the recording with the Firebase Storage URL
                resolve(recording);
              }
            } catch (error) {
              console.error('Error processing and uploading recording:', error);
              
              // Check if it's a network error
              if (error && diagnoseNetworkError(error)) {
                console.error('Network error when uploading recording');
              }

              resolve(null);
            }
          };
          
          // Stop the media recorder with error handling
          console.log('Stopping MediaRecorder...');
          try {
            this.mediaRecorder!.stop();
          } catch (stopError) {
            console.error('Error stopping MediaRecorder:', stopError);
            // Even if stop fails, we should still clean up
          }
          
          this.isRecording = false;
          
          // Stop all tracks on the stream
          if (this.mediaRecorder!.stream) {
            console.log('Stopping all media tracks...');
            this.mediaRecorder!.stream.getTracks().forEach(track => {
              console.log(`Stopping track: ${track.kind}`);
              track.stop();
            });
          }
        });
      } else {
        // For React Native, return a sample recording for testing
        console.log('Simulating recording stop on React Native...');
        this.isRecording = false;
        
        // Create a sample recording with Firebase Storage URL format
        const recordingId = uuidv4();
        const userId = this.currentUserId || 'anonymous';
        const sampleRecording: Recording = {
          id: recordingId,
          url: `https://firebasestorage.googleapis.com/v0/b/balltalkapp.appspot.com/o/recordings%2F${userId}%2F${recordingId}.wav?alt=media`,
          duration: Math.floor(Math.random() * 60) + 30,
          createdAt: new Date().toISOString(),
          trackNumber: this.selectedTrackNumber !== null ? this.selectedTrackNumber : 0,
          projectId: this.currentProjectId || '',
          userId: userId
        };
        
        return sampleRecording;
      }
    } catch (error) {
      // Check if it's a network error
      if (error && diagnoseNetworkError(error)) {
        console.error('Network error when stopping recording');
      }
      return null;
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    
    // Check if it's a network error
    if (error && diagnoseNetworkError(error)) {
      console.error('Network error when stopping recording');
    }
    
    return null;
  }
}

  // Function to play a single audio track
  async playAudio(audioUrl: string, trackId?: string): Promise<string> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && this.audioContext) {
        // Validate the URL - only accept Firebase Storage URLs
        if (!audioUrl || !audioUrl.includes('firebasestorage.googleapis.com')) {
          console.error('Invalid audio URL:', audioUrl);
          return 'Error: Invalid audio URL. Only Firebase Storage URLs are supported.';
        }

        // Create a unique ID for this audio if not provided
        const id = trackId || uuidv4();

        // Create a new audio element if one doesn't exist for this ID
        if (!this.audioElements.has(id)) {
          const audioElement = document.createElement('audio');
          
          // Add event listeners for error handling
          audioElement.onerror = (e: any) => {
            console.error('Audio element error:', e);
            console.error('Error code:', audioElement.error?.code);
            console.error('Error message:', audioElement.error?.message);
          };

          // Set source and other properties
          audioElement.src = audioUrl;
          audioElement.crossOrigin = 'anonymous'; // Needed for processing audio from different origins
          this.audioElements.set(id, audioElement);
          
          try {
            // Create audio nodes for this track
            const sourceNode = this.audioContext.createMediaElementSource(audioElement);
            const gainNode = this.audioContext.createGain();
            const panNode = this.audioContext.createStereoPanner();

            // Connect the nodes
            sourceNode.connect(gainNode);
            gainNode.connect(panNode);
            panNode.connect(this.masterGainNode || this.audioContext.destination);
            
            // Store the nodes
            this.audioNodes.set(id, sourceNode);
            this.gainNodes.set(id, gainNode);
            this.panNodes.set(id, panNode);

            // Set default values
            gainNode.gain.value = 1.0; // Default volume
           panNode.pan.value = 0.0; // Center pan
            gainNode.gain.value = 1.0; // Default volume
           panNode.pan.value = 0.0; // Center pan
          } catch (nodeError) {
            console.error('Error creating audio nodes:', nodeError);
            // If we can't create audio nodes, we'll still try to play the audio directly
            // This is a fallback in case there are issues with the Web Audio API
          }
        }
        
         // Play the audio with better error handling
        try {
          await this.audioElements.get(id)!.play();
          return `Playing audio on track ${id}`;
       } catch (playError) {
          console.error('Error during audio playback:', playError);
          
          // Handle specific error types
          if (playError instanceof DOMException) {
            if (playError.name === 'NotSupportedError') {
              return 'Error: Audio format not supported or URL is invalid';
            } else if (playError.name === 'NotAllowedError') {
              return 'Error: Audio playback was not allowed. User interaction may be required first.';
            }
          }
         throw playError; // Re-throw to be caught by the outer catch
        }
      } else {
        // For React Native, simulate audio playback
        console.log('Simulating audio playback on React Native:', audioUrl);
        return 'Playing audio (simulated)';
      }
  } catch (error) {
      console.error('Error playing audio:', error);
      
      // Check if it's a network error
      if (diagnoseNetworkError(error)) {
        return 'Network error: Unable to stream audio';
      }
      
      return 'Error: ' + (error instanceof Error ? error.message : String(error));
    }
  }

  // Function to play all tracks in a project simultaneously
  async playProject(): Promise<string> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && this.audioContext && this.currentProjectId) {
        // Get all audio elements for this project
        const projectAudioElements = Array.from(this.audioElements.entries())
          .filter(([id, _]) => id.startsWith(this.currentProjectId!));

        if (projectAudioElements.length === 0) {
          return 'No tracks to play in this project';
        }

        // Play all tracks
        await Promise.all(projectAudioElements.map(async ([_, audioElement]) => {
          audioElement.currentTime = 0; // Reset to beginning
          await audioElement.play();
        }));

         return 'Playing all project tracks';
      } else {
        // For React Native, simulate project playback
        console.log('Simulating project playback on React Native');
        return 'Playing all project tracks (simulated)';
      }
    } catch (error) {
      console.error('Error playing project:', error);
      return 'Error: ' + (error instanceof Error ? error.message : String(error));
    }
  }

  // Function to stop audio for a specific track or all tracks
  async stopAudio(trackId?: string): Promise<string> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (trackId && this.audioElements.has(trackId)) {
          // Stop a specific track
          const audioElement = this.audioElements.get(trackId)!;
          audioElement.pause();
          audioElement.currentTime = 0;
          return `Audio stopped for track ${trackId}`;
        } else {
          // Stop all tracks
          this.audioElements.forEach((audioElement) => {
            audioElement.pause();
            audioElement.currentTime = 0;
          });
          return 'All audio stopped';
        }
      } else {
        // For React Native, simulate stopping audio
        console.log('Simulating audio stop on React Native...');
        return trackId ? `Audio stopped for track ${trackId} (simulated)` : 'All audio stopped (simulated)';
      }

    } catch (error) {
      console.error('Error stopping audio:', error);
      return 'Error: ' + (error instanceof Error ? error.message : String(error));
    }
  }

    // Function to set the current project
    setCurrentProject(projectId: string | null): void {
      this.currentProjectId = projectId;
    }

    // Function to set the selected track
    setSelectedTrack(trackNumber: number | null): void {
      this.selectedTrackNumber = trackNumber;
    }

    // Function to set the current user ID
    setCurrentUser(userId: string | null): void {
        this.currentUserId = userId;
    }

    // Function to create a new project
    async createProject(userId: string, name: string, tempo: number = 120): Promise<Project | null> {
        try {
            const projectId = uuidv4();
            const now = new Date().toISOString();

            // Create default tracks with proper track numbers
            const defaultTracks: Track[] = [
                {
                    id: uuidv4(),
                    name: 'Beat',
                    isPlaying: false,
                    isRecording: false,
                    volume: 1.0,
                    pan: 0,
                    mute: false,
                    solo: false,
                    trackNumber: 1,
                    recordingIds: [],
                    createdAt: now
                },
                {
                    id: uuidv4(),
                    name: 'Vocals',
                    isPlaying: false,
                    isRecording: false,
                    volume: 1.0,
                    pan: 0,
                    mute: false,
                    solo: false,
                    trackNumber: 2,
                    recordingIds: [],
                    createdAt: now
                }
            ];

            // Create a new project with proper initialization
            const newProject: Project = {
                id: projectId,
                name,
                createdAt: now,
                updatedAt: now,
                userId,
                tracks: defaultTracks,
                tempo,
                isPublic: false,
                description: '',
                tags: []
            };

            // Save to Firestore
            try {
                const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
                await setDoc(projectRef, newProject);
                console.log('[DawService] Project created successfully:', projectId);
                
                // Set this as the current project
                this.currentProjectId = projectId;
                
                return newProject;
            } catch (error) {
                console.error('[DawService] Error saving project to Firestore:', error);
                return null;
            }
        } catch (error) {
            console.error('[DawService] Error creating project:', error);
            return null;
        }
    }

    // Static method for creating projects (uses instance method internally)
    static async createProject(
        userId: string,
        name: string,
        options: {
            tempo?: number;
            description?: string;
            isPublic?: boolean;
            tags?: string[];
        } = {}
    ): Promise<Project> {
        try {
            const dawService = new DawService();
            const project = await dawService.createProject(
                userId,
                name,
                options.tempo || 120
            );

            if (!project) {
                throw new Error('Failed to create project');
            }

            // Update additional options if provided
            if (options.description || options.isPublic !== undefined || options.tags) {
                const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, project.id);
                await updateDoc(projectRef, {
                    description: options.description || '',
                    isPublic: options.isPublic || false,
                    tags: options.tags || [],
                    updatedAt: new Date().toISOString()
                });
            }

            return project;
        } catch (error) {
            console.error('[DawService] Error in static createProject:', error);
            throw new Error(`Failed to create project: ${(error as Error).message}`);
        }
    }

    // Function to get projects for a user
    async getProjects(userId: string): Promise<Project[]> { // Changed AudioProject to Project
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                // Query Firestore for the user's projects
                const projectsRef = collection(firebaseDb, PROJECTS_COLLECTION);
                const projectsQuery = query(
                    projectsRef,
                    where('ownerId', '==', userId),
                    orderBy('createdAt', 'desc')
                );

                // Also get projects where the user is a collaborator
                const collaboratorProjectsQuery = query(
                    projectsRef,
                    where('collaborators', 'array-contains', userId)
                );

                // Execute both queries
                const [ownedProjectsSnapshot, collaboratorProjectsSnapshot] = await Promise.all([
                    getDocs(projectsQuery),
                    getDocs(collaboratorProjectsQuery)
                ]);

                // Combine the results
                const projects: Project[] = []; // Changed AudioProject to Project

                // Add owned projects
                ownedProjectsSnapshot.forEach((doc) => {
                    projects.push({
                        id: doc.id,
                        ...doc.data()
                    } as Project); // Changed AudioProject to Project
                });

                // Add collaborator projects (avoiding duplicates)
                collaboratorProjectsSnapshot.forEach((doc) => {
                    if (!projects.some(p => p.id === doc.id)) {
                        projects.push({
                            id: doc.id,
                            ...doc.data()
                        } as Project); // Changed AudioProject to Project
                    }
                });

                // Sort by creation date (newest first)
                projects.sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                return projects;
            } else {
                // For React Native, create sample data
                console.log('Creating sample projects for React Native');

                // Create a sample project with default tracks
                const projectId = uuidv4();
                const now = new Date().toISOString();

                const sampleProjects: Project[] = [ // Changed AudioProject to Project
                    {
                        id: projectId,
                        name: 'My First Song',
                        createdAt: now,
                        updatedAt: now,
                        userId: userId,
                        tracks: [
                            {
                              id: uuidv4(), name: 'Beat', isPlaying: false, isRecording: false, volume: 1.0,
                              trackNumber: 1,
                              recordingIds: []
                            },
                            {
                              id: uuidv4(), name: 'Vocals', isPlaying: false, isRecording: false, volume: 1.0,
                              trackNumber: 2,
                              recordingIds: []
                            }
                        ],
                        tempo: 120,
                        isPublic: false,
                        description: 'My first project',
                        tags: ['hip-hop', 'demo']
                    }
                ];

                return sampleProjects;
            }
        } catch (error) {
            console.error('Error getting projects:', error);
            return [];
        }
    }

    async saveRecording(
        userId: string,
        uri: string,
        duration: number,
        projectId: string,        
        trackNumber: number
    ): Promise<{ url: string } | null> {
        try {
            const recordingId = uuidv4();
            const storagePath = `projects/${projectId}/tracks/${trackNumber}/${recordingId}.wav`;
            const storageRef = ref(firebaseStorage, storagePath);
            
            // Fetch the audio blob from the URI
            const response = await fetch(uri);
            const audioBlob = await response.blob();

            // Upload to Firebase Storage with explicit content type
            await uploadBytes(storageRef, audioBlob, {
                contentType: 'audio/wav'
            });

            // Get the download URL
            const downloadUrl = await getDownloadURL(storageRef);

            // Create the recording object (simplified)
            const recording: Recording = {
                id: recordingId,
                url: downloadUrl,
                duration: duration,
                createdAt: new Date().toISOString(),
                trackNumber: trackNumber,
                projectId: projectId,
                userId: userId
            };

            // Save the recording to Firestore
            const recordingRef = doc(firebaseDb, RECORDINGS_COLLECTION, recordingId);
            await setDoc(recordingRef, recording);

            // Get the current project
            const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
            const projectDoc = await getDoc(projectRef);

            if (projectDoc) {
                const projectData = projectDoc.data() as Project;

                // Find the track
                const trackIndex = projectData.tracks.findIndex(
                    track => track.trackNumber === trackNumber
                );

                if (trackIndex !== -1) {
                    // Update the track's audioUri
                    const updatedTracks = [...projectData.tracks];
                    const currentTrack = updatedTracks[trackIndex];
                    // Create updated track with recordingIds
                    const recordingIds = currentTrack.recordingIds || [];
                    updatedTracks[trackIndex] = {
                        ...currentTrack,
                        audioUri: downloadUrl, // Update with the URL
                    };

                    // Update the project
                    await setDoc(projectRef, {
                        ...projectData,
                        tracks: updatedTracks,
                        updatedAt: new Date().toISOString()
                    });

                    console.log(`Project ${projectId} updated successfully with recording ${recordingId}`);
                } else {
                    console.error(`Track with id ${trackNumber} not found in project`);
                }
            } else {
                console.error(`Project ${projectId} not found in Firestore`);
            }

            return { url: downloadUrl }; // Ensure 'url' is defined
        } catch (error) {
            console.error('Error saving recording:', error);
            return null;
        }
    }

    /**
     * Enable collaboration on a project
     * @param projectId The ID of the project to enable collaboration on
     * @param userId The ID of the user enabling collaboration
     * @returns The updated project
     */
    async enableCollaboration(projectId: string, userId: string): Promise<Project | null> {
      try {
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          console.error('Project not found');
          return null;
        }
        
        const projectData = projectDoc.data() as Project;
        
        // Check if user is the owner
        if (projectData.userId !== userId) {
          console.error('Only the project owner can enable collaboration');
          return null;
        }
        
        // Update the project
        await updateDoc(projectRef, {
          isCollaborative: true,
          updatedAt: new Date().toISOString()
        });
        
        // Get the updated project
        const updatedProjectDoc = await getDoc(projectRef);
        return updatedProjectDoc.data() as Project;
      } catch (error) {
        console.error('Error enabling collaboration:', error);
        return null;
      }
    }
    
    /**
     * Add a collaborator to a project
     * @param projectId The ID of the project to add a collaborator to
     * @param userId The ID of the user adding the collaborator
     * @param collaboratorEmail The email of the collaborator to add
     * @param role The role of the collaborator
     * @returns The updated project
     */
    async addCollaborator(
      projectId: string, 
      userId: string, 
      collaboratorEmail: string, 
      role: 'editor' | 'viewer' = 'editor'
    ): Promise<Project | null> {
      try {
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          console.error('Project not found');
          return null;
        }
        
        const projectData = projectDoc.data() as Project;
        
        // Check if user is the owner
        if (projectData.userId !== userId) {
          console.error('Only the project owner can add collaborators');
          return null;
        }
        
        // Find the user by email
        const usersQuery = query(
          collection(firebaseDb, 'users'),
          where('email', '==', collaboratorEmail)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
          console.error('User not found with that email');
          return null;
        }
        
        const collaboratorDoc = usersSnapshot.docs[0];
        const collaboratorData = collaboratorDoc.data();
        
        // Create the collaborator object
        const newCollaborator: Collaborator = {
          id: collaboratorDoc.id,
          displayName: collaboratorData.displayName || collaboratorData.email,
          email: collaboratorData.email,
          role: role,
          joinedAt: new Date().toISOString()
        };
        
        // Add the collaborator to the project
        const collaborators = projectData.collaborators || [];
        
        // Check if collaborator already exists
        const existingIndex = collaborators.findIndex(c => c.id === newCollaborator.id);
        
        if (existingIndex >= 0) {
          // Update existing collaborator
          collaborators[existingIndex] = {
            ...collaborators[existingIndex],
            role: newCollaborator.role
          };
        } else {
          // Add new collaborator
          collaborators.push(newCollaborator);
        }
        
        // Update the project
        await updateDoc(projectRef, {
          collaborators: collaborators,
          updatedAt: new Date().toISOString()
        });
        
        // Get the updated project
        const updatedProjectDoc = await getDoc(projectRef);
        return updatedProjectDoc.data() as Project;
      } catch (error) {
        console.error('Error adding collaborator:', error);
        return null;
      }
    }
    
    /**
     * Remove a collaborator from a project
     * @param projectId The ID of the project to remove a collaborator from
     * @param userId The ID of the user removing the collaborator
     * @param collaboratorId The ID of the collaborator to remove
     * @returns The updated project
     */
    async removeCollaborator(
      projectId: string,
      userId: string,
      collaboratorId: string
    ): Promise<Project | null> {
      try {
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          console.error('Project not found');
          return null;
        }
        
        const projectData = projectDoc.data() as Project;
        
        // Check if user is the owner
        if (projectData.userId !== userId) {
          console.error('Only the project owner can remove collaborators');
          return null;
        }
        
        // Remove the collaborator from the project
        const collaborators = projectData.collaborators || [];
        const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
        
        // Update the project
        await updateDoc(projectRef, {
          collaborators: updatedCollaborators,
          updatedAt: new Date().toISOString()
        });
        
        // Get the updated project
        const updatedProjectDoc = await getDoc(projectRef);
        return updatedProjectDoc.data() as Project;
      } catch (error) {
        console.error('Error removing collaborator:', error);
        return null;
      }
    }
    
    /**
     * Get all projects a user can collaborate on
     * @param userId The ID of the user
     * @returns An array of projects the user can collaborate on
     */
    async getCollaborativeProjects(userId: string): Promise<Project[]> {
      try {
        // Get projects where user is a collaborator
        const collaboratorQuery = query(
          collection(firebaseDb, PROJECTS_COLLECTION),
          where('collaborators', 'array-contains', { id: userId }),
          orderBy('updatedAt', 'desc')
        );
        
        const collaboratorSnapshot = await getDocs(collaboratorQuery);
        
        // Get projects where user is the owner and collaboration is enabled
        const ownerQuery = query(
          collection(firebaseDb, PROJECTS_COLLECTION),
          where('userId', '==', userId),
          where('isCollaborative', '==', true),
          orderBy('updatedAt', 'desc')
        );
        
        const ownerSnapshot = await getDocs(ownerQuery);
        
        // Combine the results
        const projects: Project[] = [];
        
        collaboratorSnapshot.forEach(doc => {
          projects.push({ id: doc.id, ...doc.data() } as Project);
        });
        
        ownerSnapshot.forEach(doc => {
          // Avoid duplicates
          if (!projects.some(p => p.id === doc.id)) {
            projects.push({ id: doc.id, ...doc.data() } as Project);
          }
        });
        
        // Sort by updatedAt
        projects.sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        
        return projects;
      } catch (error) {
        console.error('Error getting collaborative projects:', error);
        return [];
      }
    }
    
    /**
     * Update the collaboration session ID for a project
     * @param projectId The ID of the project
     * @param sessionId The ID of the collaboration session
     * @returns Whether the update was successful
     */
    async updateCollaborationSession(projectId: string, sessionId: string | null): Promise<boolean> {
      try {
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
        
        await updateDoc(projectRef, {
          collaborationSessionId: sessionId,
          updatedAt: new Date().toISOString()
        });
        
        return true;
      } catch (error) {
        console.error('Error updating collaboration session:', error);
        return false;
      }
    }

    /**
     * Upload an audio file to Firebase Storage
     * @param userId The ID of the user uploading the file
     * @param fileUri The local URI of the file to upload
     * @param fileName The name to give the file in storage
     * @param projectId The ID of the project the file belongs to
     * @param trackId Optional ID of the track the file belongs to
     * @param onProgress Optional callback for upload progress
     * @returns The URL of the uploaded file
     */
    async uploadAudioFile(
      userId: string,
      fileUri: string,
      fileName: string,
      projectId: string,
      trackId?: string,
      onProgress?: (progress: number) => void
    ): Promise<{ url: string } | null> {
      try {
        console.log(`[DawService] Uploading audio file: ${fileName}`);
        
        // Create a reference to the file in Firebase Storage
        const storagePath = `audio/${userId}/${projectId}/${fileName}`;
        const storageRef = ref(firebaseStorage, storagePath);
        
        // For native platforms
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          // Use React Native Firebase for native platforms
          const reference = storage_lib().ref(storagePath);
          const task = reference.putFile(fileUri);
          
          // Handle progress if callback provided
          if (onProgress) {
            task.on('state_changed', snapshot => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            });
          }
          
          // Wait for upload to complete
          await task;
        } else {
          // For web, use the web SDK
          const storageRef = ref(storage, storagePath);
          // Web doesn't have putFile, use uploadBytes instead
          const fileBlob = await fetch(fileUri).then(r => r.blob());
          const uploadTask = uploadBytes(storageRef, fileBlob);
          
          // Handle progress if callback provided
          if (onProgress) {
            // Web doesn't support progress directly, simulate it
            onProgress(0);
            setTimeout(() => onProgress(50), 500);
          }
          
          // Wait for upload to complete
          await uploadTask;
          if (onProgress) {
            onProgress(100);
          }
        }
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log(`[DawService] File uploaded successfully: ${downloadURL}`);
        
        // If a track ID was provided, update the track with the new audio URI
        if (trackId && projectId) {
          await this.updateTrackAudio(projectId, trackId, downloadURL);
        }
        
        return { url: downloadURL };
      } catch (error) {
        console.error('[DawService] Error uploading audio file:', error);
        
        // Check if it's a network error
        if (diagnoseNetworkError(error)) {
          throw new Error('Network error: Please check your internet connection');
        }
        
        throw error;
      }
    }
    
    /**
     * Update a track with a new audio URI
     * @param projectId The ID of the project
     * @param trackId The ID of the track to update
     * @param audioUri The new audio URI
     */
    async updateTrackAudio(projectId: string, trackId: string, audioUri: string): Promise<void> {
      try {
        console.log(`[DawService] Updating track ${trackId} with audio URI: ${audioUri}`);
        
        // Get the project document reference
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, projectId);
        
        // Get the current project data
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          throw new Error(`Project ${projectId} not found`);
        }
        
        const projectData = projectDoc.data() as Project;
        
        // Find the track and update its audio URI
        const updatedTracks = projectData.tracks.map(track => {
          if (track.id === trackId) {
            return {
              ...track,
              audioUri: audioUri,
              updatedAt: new Date().toISOString()
            };
          }
          return track;
        });
        
        // Update the project with the modified tracks
        await updateDoc(projectRef, {
          tracks: updatedTracks,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`[DawService] Track ${trackId} updated successfully`);
      } catch (error) {
        console.error('[DawService] Error updating track audio:', error);
        throw error;
      }
    }

    /**
     * Update an existing project with new data
     * @param project The updated project data
     * @returns Promise resolving to the updated project or null on failure
     */
    async updateProject(project: Project): Promise<Project | null> {
      try {
        console.log(`[DawService] Updating project: ${project.id}`);
        
        if (!project.id) {
          console.error('[DawService] Cannot update project without ID');
          return null;
        }
        
        // Update the updatedAt timestamp
        const updatedProject = {
          ...project,
          updatedAt: new Date().toISOString()
        };
        
        // Reference to the project document
        const projectRef = doc(firebaseDb, PROJECTS_COLLECTION, project.id);
        
        // Update the document in Firestore
        await updateDoc(projectRef, updatedProject);
        
        console.log(`[DawService] Project ${project.id} updated successfully`);
        
        return updatedProject;
      } catch (error) {
        console.error('[DawService] Error updating project:', error);
        
        if (diagnoseNetworkError(error)) {
          console.log('[DawService] Network error detected, trying offline update');
          
          // Implement offline handling if needed
          // For now, just return the project as if it was updated
          return project;
        }
        
        throw error;
      }
    }

    /**
     * Get projects for a user
     * 
     * @param {string} userId - ID of the user
     * @param {number} limitCount - Maximum number of projects to return
     * @returns {Promise<Project[]>} Array of user projects
     */
    static async getUserProjects(userId: string, limitCount: number = 10): Promise<Project[]> {
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const db = getFirestore();
        // Simplify the query to match the existing index in firestore.indexes.json
        const projectsQuery = query(
          collection(db, PROJECTS_COLLECTION),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(projectsQuery);
        const projects: Project[] = [];
        
        querySnapshot.forEach((doc) => {
          const projectData = doc.data();
          projects.push({
            ...projectData,
            id: doc.id,
            tempo: projectData.tempo || 120, // Ensure tempo is always defined
            tracks: projectData.tracks || [],
          } as Project);
        });
        
        // Handle limit in memory to avoid index issues
        return projects.slice(0, limitCount);
      } catch (error) {
        console.error('Error getting user projects:', error);
        throw new Error(`Failed to get user projects: ${(error as Error).message}`);
      }
    }
    
    /**
     * Get a project by ID
     * 
     * @param {string} projectId - ID of the project
     * @returns {Promise<Project>} The project
     */
    static async getProject(projectId: string): Promise<Project> {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        const db = getFirestore();
        const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
        
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = projectDoc.data();
        
        return {
          ...projectData,
          id: projectDoc.id,
          tempo: projectData.tempo || 120, // Ensure tempo is always defined
          tracks: projectData.tracks || [],
        } as Project;
      } catch (error) {
        console.error('Error getting project:', error);
        throw new Error(`Failed to get project: ${(error as Error).message}`);
      }
    }
    
    /**
     * Delete a project
     * 
     * @param {string} projectId - ID of the project to delete
     * @returns {Promise<void>}
     */
    static async deleteProject(projectId: string): Promise<void> {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        const db = getFirestore();
        
        // Get the project to check for recordings to delete
        const project = await this.getProject(projectId);
        
        // Delete all recordings associated with the project
        for (const track of project.tracks) {
          if (track.audioUri) {
            try {
              // Delete the recording file from storage
              const storage = getStorage();
              const storageRef = ref(storage, track.audioUri);
              await deleteObject(storageRef);
            } catch (storageError) {
              console.warn('Error deleting recording file:', storageError);
              // Continue with deletion even if storage deletion fails
            }
          }
        }
        
        // Delete the project document
        await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error(`Failed to delete project: ${(error as Error).message}`);
      }
    }
    
    /**
     * Add a track to a project
     * 
     * @param {string} projectId - ID of the project
     * @param {string} trackName - Name of the track
     * @returns {Promise<Project>} The updated project
     */
    static async addTrack(projectId: string, trackName: string): Promise<Project> {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        if (!trackName) {
          throw new Error('Track name is required');
        }
        
        // Get the current project
        const project = await this.getProject(projectId);
        
        // Create a new track
        const newTrack: Track = {
          id: uuidv4(),
          name: trackName,
          isRecording: false,
          isPlaying: false,
          volume: 1.0,
          pan: 0,
          mute: false,
          solo: false,
          trackNumber: project.tracks.length + 1,
          recordingIds: [],
          createdAt: new Date().toISOString(),
        };
        
        // Add the track to the project
        const updatedProject: Project = {
          ...project,
          tracks: [...project.tracks, newTrack],
          updatedAt: new Date().toISOString(),
        };
        
        // Update the project in Firestore
        return await this.updateProject(updatedProject);
      } catch (error) {
        console.error('Error adding track:', error);
        throw new Error(`Failed to add track: ${(error as Error).message}`);
      }
    }
    
    /**
     * Update a track in a project
     * 
     * @param {string} projectId - ID of the project
     * @param {Track} track - The updated track
     * @returns {Promise<Project>} The updated project
     */
    static async updateTrack(projectId: string, track: Track): Promise<Project> {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        if (!track.id) {
          throw new Error('Track ID is required');
        }
        
        // Get the current project
        const project = await this.getProject(projectId);
        
        // Find the track index
        const trackIndex = project.tracks.findIndex((t) => t.id === track.id);
        
        if (trackIndex === -1) {
          throw new Error('Track not found in project');
        }
        
        // Update the track
        const updatedTracks = [...project.tracks];
        updatedTracks[trackIndex] = {
          ...track,
          lastModified: new Date().toISOString(),
        };
        
        // Update the project
        const updatedProject: Project = {
          ...project,
          tracks: updatedTracks,
          updatedAt: new Date().toISOString(),
        };
        
        // Update the project in Firestore
        return await this.updateProject(updatedProject);
      } catch (error) {
        console.error('Error updating track:', error);
        throw new Error(`Failed to update track: ${(error as Error).message}`);
      }
    }
    
    /**
     * Delete a track from a project
     * 
     * @param {string} projectId - ID of the project
     * @param {string} trackId - ID of the track to delete
     * @returns {Promise<Project>} The updated project
     */
    static async deleteTrack(projectId: string, trackId: string): Promise<Project> {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        if (!trackId) {
          throw new Error('Track ID is required');
        }
        
        // Get the current project
        const project = await this.getProject(projectId);
        
        // Find the track
        const track = project.tracks.find((t) => t.id === trackId);
        
        if (!track) {
          throw new Error('Track not found in project');
        }
        
        // Delete the track's audio file if it exists
        if (track.audioUri) {
          try {
            const storage = getStorage();
            const storageRef = ref(storage, track.audioUri);
            await deleteObject(storageRef);
          } catch (storageError) {
            console.warn('Error deleting track audio file:', storageError);
            // Continue with deletion even if storage deletion fails
          }
        }
        
        // Remove the track from the project
        const updatedProject: Project = {
          ...project,
          tracks: project.tracks.filter((t) => t.id !== trackId),
          updatedAt: new Date().toISOString(),
        };
        
        // Update the project in Firestore
        return await this.updateProject(updatedProject);
      } catch (error) {
        console.error('Error deleting track:', error);
        throw new Error(`Failed to delete track: ${(error as Error).message}`);
      }
    }
}

// Export the class directly (not as default)
export { DawService, Project, Recording };

// Also export as default for backward compatibility
export default DawService;
