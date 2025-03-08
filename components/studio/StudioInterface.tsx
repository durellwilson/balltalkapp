import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import DawService from '../../services/DawService';

import Colors from '../../constants/Colors';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
// Import Audio from Expo AV - commented out since we're using a mock implementation
import { Audio } from 'expo-av';
import BeatLibrary from './BeatLibrary';
import { Picker } from '@react-native-picker/picker';
import SongUploadForm from './SongUploadForm';
import SongService from '../../services/SongService';
import { Project, Track } from './StudioTypes';
import CollaborationPanel from './CollaborationPanel';
import AudioFileUploader from './AudioFileUploader';
import AudioLibrary from './AudioLibrary';
import AudioStorageService, { AudioFileMetadata } from '../../services/AudioStorageService';

const { width } = Dimensions.get('window');

const StudioInterface: React.FC = () => {
  const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<"loading" | "idle" | "error">("idle");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [projectDuration, setProjectDuration] = useState(0);
  const [showBeatLibrary, setShowBeatLibrary] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
    const [showAudioFileUploader, setShowAudioFileUploader] = useState(false);
    const [uploadTargetTrackId, setUploadTargetTrackId] = useState<string | null>(null);
    const [showAudioLibrary, setShowAudioLibrary] = useState(false);

    // References
    const recordingRef = useRef<Audio.Recording | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load current project or create a new one
  useEffect(() => {
    if (user) {
      loadCurrentProject();
    }

    return () => {
      // Clean up recording and playback
      stopRecording();
      stopPlayback();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user]);

    useEffect(() => {
        if (currentProject && currentProject.tracks.length > 0) {
            setSelectedTrackId(currentProject.tracks[0].id);
        }
    }, [currentProject]);

  const loadCurrentProject = async () => {
    setIsLoading(true);
    try {
      // Get the user's current project
      const projects = await DawService.getProjects(user?.uid || '');

      if (projects && projects.length > 0) {
        // Use the most recent project
        const latestProject = projects[0];
        setCurrentProject(latestProject);

        // Calculate project duration
        calculateProjectDuration(latestProject);
      } else {
        // No projects found, show the new project modal
        setShowNewProjectModal(true);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert(
        'Error',
        'Failed to load your studio project. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProjectDuration = (project: Project) => {
    // Find the longest track
    let maxDuration = 0;

    project.tracks.forEach((track) => {
      // Prioritize beat duration if available, otherwise use recording duration
      if (track.beatId) {
        // In a real app, we would get the actual duration of the beat
        // For now, use a placeholder
        const beatDuration = 30; // Placeholder
        maxDuration = Math.max(maxDuration, beatDuration);
      } else if (track.audioUri) {
        // In a real app, we would get the actual duration of the audio file
        // For now, we'll use a placeholder value
        const trackDuration = 60; // 60 seconds placeholder
        maxDuration = Math.max(maxDuration, trackDuration);
      }
    });

    setProjectDuration(maxDuration);
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setIsLoading(true);
    try {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: newProjectName,
        tracks: [],
        tempo: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the new project
      // await DawService.saveProject(user?.uid || '', newProject);

      setCurrentProject(newProject);
      setShowNewProjectModal(false);
      setNewProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create a new project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

    const handleSelectBeat = async (beat: { id: string; name: string; url: string }) => {
        if (!currentProject) return;

        if (!selectedTrackId) {
            Alert.alert('Error', 'Please select a track to add the beat to.');
            return;
        }

        try {
            // await DawService.addBeatToTrack(currentProject.id, selectedTrackId, beat.id, beat.url);
            const updatedProject = await DawService.getProjects(user?.uid || '');
            setCurrentProject(updatedProject[0]);
            setShowBeatLibrary(false);
            calculateProjectDuration(updatedProject[0]);

        } catch (error) {
            console.error('Error adding track from beat:', error);
            Alert.alert('Error', 'Failed to add track with selected beat. Please try again.');
        }
    }

    const addNewTrack = async (): Promise<void> => {
        if (!currentProject) return;
        if (!newTrackName.trim()) {
            Alert.alert('Error', 'Please enter a track name');
            return;
        }

        try {
            const newTrack: Track = {
                id: `track-${Date.now()}`,
                name: newTrackName,
                isRecording: false,
                isPlaying: false,
                volume: 1.0, // Add initial volume
            };

            const updatedProject = {
                ...currentProject,
                tracks: [...currentProject.tracks, newTrack],
                updatedAt: new Date().toISOString()
            };

            // Save the updated project
            // await DawService.saveProject(user?.uid || '', updatedProject);

            setCurrentProject(updatedProject);
            setShowAddTrackModal(false);
            setNewTrackName('');
        } catch (error) {
            console.error('Error adding track:', error);
            Alert.alert('Error', 'Failed to add a new track. Please try again.');
        }
    };

  const startRecording = async (trackId: string) => {
    if (!currentProject) return;

    try {
            // Configure audio session
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTrackId(trackId);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Update track state
      const updatedTracks = currentProject.tracks.map((track) => {
        if (track.id === trackId) {
          return { ...track, isRecording: true };
        }
        return track;
      });

      setCurrentProject({
        ...currentProject,
        tracks: updatedTracks,
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      if (error.message === "Mock preparation failed") {
        Alert.alert(
          'Recording Error',
          'Failed to prepare for recording. Please check your device settings and try again.'
        );
      } else if (error.message === "Mock start failed") {
        Alert.alert(
          'Recording Error',
          'Failed to start recording. Please try again shortly.'
        );
      } else {
        Alert.alert(
          'Recording Error',
          'Failed to start recording. Please try again.'
        );
      }
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (
      !recordingRef.current ||
      !isRecording ||
      !currentProject ||
      !recordingTrackId
    )
      return;

    try {
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();

      // Get the recording URI
      const uri = recordingRef.current.getURI();

      if (uri) {
        // Save the recording
        const recordingInfo = await DawService.saveRecording(
          user?.uid || '',
          uri,
          recordingTime,
          currentProject.id,
          recordingTrackId
        );

                // Update track with the mock Firebase Storage URL
                const updatedTracks = currentProject.tracks.map((track) => {
                    if (track.id === recordingTrackId) {
                        return { ...track, isRecording: false, audioUri: recordingInfo.url }; // Use recordingInfo.url
                    }
                    return track;
                });

        const updatedProject = {
          ...currentProject,
          tracks: updatedTracks,
          updatedAt: new Date().toISOString(),
        };

        // Save the updated project
        // await DawService.saveProject(user?.uid || '', updatedProject);

        setCurrentProject(updatedProject);
        calculateProjectDuration(updatedProject);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to save recording. Please try again.'
      );
    } finally {
      // Clean up
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingTrackId(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }
  };

  const playTrack = async (trackId: string): Promise<void> => {
    if (!currentProject) return;

    try {
      const track = currentProject.tracks.find((t) => t.id === trackId);
            if (!track || !track.audioUri) return;

            // Load and play the sound
            const { sound } = await Audio.Sound.createAsync(
                { uri: track.audioUri },
                { shouldPlay: true, volume: track.volume } // Use track volume
            );

      playbackRef.current = sound;

      // Update track state
      const updatedTracks = currentProject.tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, isPlaying: true };
        }
        return t;
      });

      setCurrentProject({
        ...currentProject,
        tracks: updatedTracks,
      });

      // Listen for playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            // Playback finished
            stopTrack(trackId);
          }
        }
      });
    } catch (error) {
      console.error('Error playing track:', error);
      Alert.alert('Playback Error', 'Failed to play track. Please try again.');
    }
  };

  const stopTrack = async (trackId: string): Promise<void> => {
    if (!currentProject || !playbackRef.current) return;

    try {
      // Stop playback
      await playbackRef.current.stopAsync();
      await playbackRef.current.unloadAsync();
      playbackRef.current = null;

      // Update track state
      const updatedTracks = currentProject.tracks.map((track) => {
        if (track.id === trackId) {
          return { ...track, isPlaying: false };
        }
        return track;
      });

      setCurrentProject({
        ...currentProject,
        tracks: updatedTracks,
      });
    } catch (error) {
      console.error('Error stopping track:', error);
    }
  };

  const playAllTracks = async (): Promise<void> => {
    if (!currentProject || currentProject.tracks.length === 0) {
      console.log('No tracks to play');
      return;
    }

    setIsPlaying(true);
    
    try {
      console.log('Starting playback of all tracks...');
      
      // Initialize playback position
      setPlaybackPosition(0);
      
      // Start timer to update playback position
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setPlaybackPosition((prev) => {
          if (prev >= projectDuration) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
      
      // Play each track
      for (const track of currentProject.tracks) {
        if (track.audioUrl || track.audioUri) {
          try {
            console.log(`Playing track: ${track.name}`);
            
            // Create a new sound object
            const { sound } = await Audio.Sound.createAsync(
              { uri: track.audioUrl || track.audioUri },
              { shouldPlay: true }
            );
            
            // Store sound reference for later cleanup
            track.sound = sound;
          } catch (trackError) {
            console.error(`Error playing track ${track.name}:`, trackError);
          }
        }
      }
    } catch (error) {
      console.error('Error starting playback:', error);
      setIsPlaying(false);
      Alert.alert('Playback Error', 'Could not play tracks. Please try again.');
    }
  };

  const stopPlayback = async (): Promise<void> => {
    if (!currentProject) return;

    try {
      // Stop all playing tracks
      const playingTracks = currentProject.tracks.filter((track) => track.isPlaying);

      for (const track of playingTracks) {
        await stopTrack(track.id);
      }

      setIsPlaying(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const deleteTrack = async (trackId: string): Promise<void> => {
    if (!currentProject) return;

    Alert.alert(
      'Delete Track',
      'Are you sure you want to delete this track? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop the track if it's playing
              const track = currentProject.tracks.find((t) => t.id === trackId);
              if (track?.isPlaying) {
                await stopTrack(trackId);
              }

              // Remove the track
              const updatedTracks = currentProject.tracks.filter(
                (track) => track.id !== trackId
              );

              const updatedProject = {
                ...currentProject,
                tracks: updatedTracks,
                updatedAt: new Date().toISOString(),
              };

              // Save the updated project
              // await DawService.saveProject(user?.uid || '', updatedProject);

              setCurrentProject(updatedProject);
              calculateProjectDuration(updatedProject);
            } catch (error) {
              console.error('Error deleting track:', error);
              Alert.alert('Error', 'Failed to delete track. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderTrackControls = (track: Track) => {
    const hasAudio = !!track.audioUri;

    return (
      <View style={styles.trackControls}>
        {track.isRecording ? (
          <TouchableOpacity
            style={[styles.trackButton, styles.stopRecordingButton]}
            onPress={stopRecording}
          >
            <Ionicons name="stop" size={18} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.trackButton,
              styles.recordButton,
              isRecording && styles.disabledButton,
            ]}
            onPress={() => startRecording(track.id)}
            disabled={isRecording}
          >
            <Ionicons name="mic" size={18} color="white" />
          </TouchableOpacity>
        )}

        {hasAudio && (
          <>
            {track.isPlaying ? (
              <TouchableOpacity
                style={[styles.trackButton, styles.stopButton]}
                onPress={() => stopTrack(track.id)}
              >
                <Ionicons name="stop" size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.trackButton, styles.playButton]}
                onPress={() => playTrack(track.id)}
                disabled={isRecording}
              >
                <Ionicons name="play" size={18} color="white" />
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.trackButton, styles.uploadButton]}
          onPress={() => showAudioFileUploaderForTrack(track.id)}
          disabled={isRecording || track.isPlaying}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trackButton, styles.deleteButton]}
          onPress={() => deleteTrack(track.id)}
          disabled={isRecording || track.isPlaying}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.volumeInput}
          keyboardType="numeric"
          placeholder="Vol"
          value={String(track.volume)}
          onChangeText={(value) => {
            const newVolume = parseFloat(value);
            if (!isNaN(newVolume)) {
              // Update track volume
              const updatedTracks = currentProject!.tracks.map((t) => {
                if (t.id === track.id) {
                  return { ...t, volume: Math.max(0, Math.min(1, newVolume)) }; // Clamp between 0 and 1
                }
                return t;
              });
              setCurrentProject({ ...currentProject!, tracks: updatedTracks });
            }
          }}
        />
      </View>
    );
  };

  // Handle audio file upload completion
  const handleAudioFileUploaded = (fileUrl: string, fileName: string, duration: number) => {
    if (!currentProject) return;
    
    console.log(`Audio file uploaded: ${fileName}, URL: ${fileUrl}, Duration: ${duration}s`);
    
    // If we have a target track, update it with the new audio
    if (uploadTargetTrackId) {
      // Find the track
      const trackIndex = currentProject.tracks.findIndex(t => t.id === uploadTargetTrackId);
      
      if (trackIndex >= 0) {
        // Create updated tracks array
        const updatedTracks = [...currentProject.tracks];
        updatedTracks[trackIndex] = {
          ...updatedTracks[trackIndex],
          audioUri: fileUrl,
          name: updatedTracks[trackIndex].name || fileName.split('.')[0], // Use filename as track name if none exists
          duration: duration,
          lastModified: new Date().toISOString(),
        };
        
        // Update the project
        const updatedProject = {
          ...currentProject,
          tracks: updatedTracks,
          updatedAt: new Date().toISOString()
        };
        
        // Save the project update to Firebase
        DawService.updateProject(updatedProject)
          .then(() => {
            console.log('Project updated with new audio file');
            
            // Update local state
            setCurrentProject(updatedProject);
            
            // Calculate new project duration
            calculateProjectDuration(updatedProject);
            
            // Close the uploader modal
            setShowAudioFileUploader(false);
            
            // Play the uploaded track after a short delay
            setTimeout(() => {
              playTrack(uploadTargetTrackId);
            }, 500);
          })
          .catch(error => {
            console.error('Failed to update project:', error);
            Alert.alert('Error', 'Failed to update project with new audio');
          });
      }
    } else {
      // If no target track, create a new track with the audio
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: fileName.split('.')[0], // Use filename as track name
        audioUri: fileUrl,
        isRecording: false,
        isPlaying: false,
        volume: 1.0,
        trackNumber: currentProject.tracks.length + 1,
        recordingIds: [],
        duration: duration,
        lastModified: new Date().toISOString(),
      };
      
      // Add the new track to the project
      const updatedProject = {
        ...currentProject,
        tracks: [...currentProject.tracks, newTrack],
        updatedAt: new Date().toISOString()
      };
      
      // Save the project update to Firebase
      DawService.updateProject(updatedProject)
        .then(() => {
          console.log('Project updated with new track');
          
          // Update the project state
          setCurrentProject(updatedProject);
          
          // Calculate new project duration
          calculateProjectDuration(updatedProject);
          
          // Close the uploader modal
          setShowAudioFileUploader(false);
          
          // Select the new track
          setSelectedTrackId(newTrack.id);
          
          // Play the new track after a short delay
          setTimeout(() => {
            playTrack(newTrack.id);
          }, 500);
        })
        .catch(error => {
          console.error('Failed to update project with new track:', error);
          Alert.alert('Error', 'Failed to add new track to project');
        });
    }
  };

  // Show audio file uploader for a specific track
  const showAudioFileUploaderForTrack = (trackId: string) => {
    setUploadTargetTrackId(trackId);
    setShowAudioFileUploader(true);
  };

  // Handle selecting an audio file from the library
  const handleSelectAudioFromLibrary = (audioFile: AudioFileMetadata) => {
    if (!currentProject) return;
    
    // Create a new track with the selected audio
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: audioFile.originalFileName.split('.')[0], // Use filename as track name
      audioUri: audioFile.downloadUrl,
      audioFileId: audioFile.id,
      isRecording: false,
      isPlaying: false,
      volume: 1.0,
      trackNumber: currentProject.tracks.length + 1,
      recordingIds: []
    };
    
    // Add the new track to the project
    const updatedProject = {
      ...currentProject,
      tracks: [...currentProject.tracks, newTrack],
      updatedAt: new Date().toISOString()
    };
    
    // Update the project state
    setCurrentProject(updatedProject);
    
    // Calculate new project duration
    calculateProjectDuration(updatedProject);
    
    // Close the library
    setShowAudioLibrary(false);
    
    Alert.alert('Success', `Audio file "${audioFile.originalFileName}" added as new track.`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading studio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Studio Header */}
      <View style={styles.header}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>
            {currentProject?.name || 'New Project'}
          </Text>
          <Text style={styles.projectMeta}>
            Tempo: {currentProject?.tempo || 120} BPM
          </Text>
        </View>

        <View style={styles.transportControls}>
          {isPlaying ? (
            <TouchableOpacity
              style={[styles.transportButton, styles.stopButton]}
              onPress={stopPlayback}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.transportButton,
                styles.playButton,
                isRecording && styles.disabledButton,
              ]}
              onPress={playAllTracks}
              disabled={isRecording}
            >
              <Ionicons name="play" size={24} color="white" />
            </TouchableOpacity>
          )}

          <Text style={styles.timeDisplay}>
            {formatTime(isRecording ? recordingTime : playbackPosition)}
          </Text>
        </View>
      </View>

      {/* Tracks Area */}
      <ScrollView style={styles.tracksContainer}>
        {currentProject?.tracks.map((track) => (
          <View key={track.id} style={styles.trackRow}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{track.name}</Text>
              {track.isRecording && (
                <View style={styles.recordingIndicator}>
                  <Text style={styles.recordingText}>Recording</Text>
                </View>
              )}
            </View>

            <View style={styles.trackContent}>
              {track.audioUri ? (
                <View style={styles.waveformContainer}>
                  {/* Placeholder for waveform visualization */}
                  <View style={styles.waveformPlaceholder} />
                </View>
              ) : (
                <View style={styles.emptyTrackPlaceholder}>
                  <Text style={styles.emptyTrackText}>No audio recorded</Text>
                </View>
              )}
            </View>

            {renderTrackControls(track)}
          </View>
        ))}

        {(!currentProject?.tracks || currentProject.tracks.length === 0) && (
          <View style={styles.emptyTracksContainer}>
            <FontAwesome5 name="music" size={40} color="#ccc" />
            <Text style={styles.emptyTracksText}>No tracks added yet</Text>
            <Text style={styles.emptyTracksSubtext}>
              Add a track to start recording
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowBeatLibrary(true)}
        >
          <Ionicons name="musical-notes-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Beat Library</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowAddTrackModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Add Track</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowAudioFileUploader(true)}
        >
          <Ionicons name="document-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Import Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowAudioLibrary(true)}
        >
          <Ionicons name="library-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Audio Library</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowCollaborationPanel(true)}
        >
          <Ionicons name="people-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Collaborate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowUploadForm(true)}
        >
          <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Upload Song</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton}>
          <Ionicons name="save-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton}>
          <Ionicons name="share-outline" size={24} color={Colors.primary} />
          <Text style={styles.toolbarButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Beat Library Modal */}
      <BeatLibrary
        isVisible={showBeatLibrary}
        onClose={() => setShowBeatLibrary(false)}
        onSelectBeat={handleSelectBeat}
      />

      {/* Collaboration Panel */}
      {currentProject && (
        <CollaborationPanel
          projectId={currentProject.id}
          isVisible={showCollaborationPanel}
          onClose={() => setShowCollaborationPanel(false)}
        />
      )}

      {/* New Project Modal */}
      <Modal
        visible={showNewProjectModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Project</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Project Name"
              value={newProjectName}
              onChangeText={setNewProjectName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: '#f5f5f5',
                    borderWidth: 1,
                    borderColor: '#ddd',
                  },
                ]}
                onPress={() => {
                  // If there's no current project, we can't cancel
                  if (!currentProject) {
                    Alert.alert(
                      'Error',
                      'You need to create a project to use the studio.'
                    );
                    return;
                  }
                  setShowNewProjectModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>              

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createNewProject}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Track Modal */}
      <Modal visible={showAddTrackModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Add New Track</Text>
                        <View style={styles.trackSelectContainer}>
                            <Text style={styles.trackSelectLabel}>Select Track:</Text>
                            <Picker
                                selectedValue={selectedTrackId}
                                style={styles.trackSelectPicker}
                                onValueChange={(itemValue) => setSelectedTrackId(itemValue)}
                            >
                                {currentProject?.tracks.map((track) => (
                                    <Picker.Item key={track.id} label={track.name} value={track.id} />
                                ))}
                            </Picker>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Track Name"
                            value={newTrackName}
                            onChangeText={setNewTrackName}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
                                ]}
                                onPress={() => setShowAddTrackModal(false)}
                            >

                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={addNewTrack}
                            >
                                <Text style={styles.createButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Song Upload Form Modal */}
            <Modal
                visible={showUploadForm}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <SongUploadForm
                            onUploadComplete={async (songData) => {
                              try {
                                // Add the song using the mock service

                                // const newSong = await SongService.addSong(songData);

                                // Optionally, update the UI or show a success message
                                console.log('Song uploaded:', newSong);
                                Alert.alert('Success', 'Your song has been uploaded!');

                                // Reload the project list to include the new song
                                await loadCurrentProject();
                              } catch (error) {
                                console.error('Error uploading song:', error);
                                Alert.alert('Upload Error', 'Failed to upload song. Please try again.');
                              } finally {
                                setShowUploadForm(false);
                              }
                            }}
                            onCancel={() => setShowUploadForm(false)}
                        />
                    </View>
                </View>
            </Modal>

      {/* Audio File Uploader Modal */}
      {currentProject && (
        <Modal
          visible={showAudioFileUploader}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAudioFileUploader(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.audioUploaderContainer}>
              <AudioFileUploader
                projectId={currentProject.id}
                trackId={uploadTargetTrackId || undefined}
                onUploadComplete={handleAudioFileUploaded}
                onCancel={() => {
                  setShowAudioFileUploader(false);
                  setUploadTargetTrackId(null);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Audio Library Modal */}
      {currentProject && (
        <AudioLibrary
          isVisible={showAudioLibrary}
          onClose={() => setShowAudioLibrary(false)}
          projectId={currentProject.id}
          onSelectAudio={handleSelectAudioFromLibrary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  projectMeta: {
    fontSize: 14,
    color: '#666',
  },
  transportControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.5,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  tracksContainer: {
    flex: 1,
    padding: 16,
  },
  trackRow: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  recordingIndicator: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  trackContent: {
    height: 80,
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  waveformContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  waveformPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  emptyTrackPlaceholder: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyTrackText: {
    color: '#999',
    fontSize: 14,
  },
  trackControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
    volumeInput: {
        width: 40,
        height: 30,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        paddingHorizontal: 4,
        fontSize: 12,
        textAlign: 'center',
        marginLeft: 8
    },
  recordButton: {
    backgroundColor: '#F44336',
  },
  stopRecordingButton: {
    backgroundColor: '#F44336',
  },
  deleteButton: {
    backgroundColor: '#757575',
  },
  emptyTracksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTracksText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyTracksSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  toolbarButton: {
    alignItems: 'center',
  },
  toolbarButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.primary,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  
  },
  // Modal styles
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '80%',
      maxWidth: 400,
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#333',
  },
  modalInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
  },
  modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
  },
  modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginLeft: 10,
  },
  cancelButtonText: {
      color: '#333',
      fontWeight: 'bold',
  },
  createButton: {
      backgroundColor: Colors.primary,
  },
  createButtonText: {
      color: 'white',
      fontWeight: 'bold',
  },
  trackSelectContainer: {
      marginBottom: 20,
  },
  trackSelectLabel: {
      fontSize: 16,
      marginBottom: 10,
      color: '#333',
  },
  trackSelectPicker: {
    height: 50,
      width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  uploadButton: {
    backgroundColor: '#4a90e2',
  },
  audioUploaderContainer: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  trackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
