import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../../hooks/useTheme';

interface AudioLayer {
  id: string;
  uri: string;
  name: string;
  sound?: Audio.Sound;
  isLoaded: boolean;
  volume: number;
  isMuted: boolean;
  color: string;
}

const COLORS = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
  '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41'
];

export default function LayeredRecorder() {
  const { theme } = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [layers, setLayers] = useState<AudioLayer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const [recordingLevels, setRecordingLevels] = useState<number[]>([]);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;
  
  // Timer ref for recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      pulseAnim.setValue(1);
    };
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    // Request permissions on component mount
    const getPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          setStatus('Microphone permission not granted');
          return;
        }
        
        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
        
        setStatus('Ready to record');
      } catch (err) {
        console.error('Failed to get permissions', err);
        setStatus('Error getting permissions');
        setPermissionStatus('error');
      }
    };
    
    getPermissions();
    
    // Cleanup function
    return () => {
      stopAllSounds();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  async function startRecording() {
    try {
      if (permissionStatus !== 'granted') {
        setStatus('Microphone permission not granted');
        return;
      }
      
      // Reset state
      setRecordingDuration(0);
      setRecordingLevels([]);
      
      // Stop all playing sounds before recording
      if (isPlaying) {
        await stopAllSounds();
      }
      
      // Create new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate,
        100 // Update status every 100ms
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setStatus('Recording...');
      
      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      setStatus('Error starting recording');
    }
  }
  
  function onRecordingStatusUpdate(status: Audio.RecordingStatus) {
    if (status.isRecording) {
      // Get the metering level (if available)
      if (status.metering !== undefined) {
        // Convert dB to a value between 0 and 1
        const level = Math.max(0, Math.min(1, (status.metering + 160) / 160));
        setRecordingLevels(prev => [...prev.slice(-19), level]);
        levelAnim.setValue(level);
      }
    }
  }

  async function stopRecording() {
    try {
      if (!recording) {
        setStatus('No active recording');
        return;
      }
      
      setStatus('Stopping recording...');
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      
      if (uri) {
        // Add new layer
        const newLayer: AudioLayer = {
          id: Date.now().toString(),
          uri,
          name: `Layer ${layers.length + 1}`,
          isLoaded: false,
          volume: 1,
          isMuted: false,
          color: COLORS[layers.length % COLORS.length]
        };
        
        setLayers(prev => [...prev, newLayer]);
        setStatus('Layer added');
        
        // Load the sound
        loadSound(newLayer);
      }
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      setStatus('Error stopping recording');
    }
  }
  
  async function loadSound(layer: AudioLayer) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: layer.uri },
        { shouldPlay: false, volume: layer.volume }
      );
      
      setLayers(prev => 
        prev.map(l => 
          l.id === layer.id 
            ? { ...l, sound, isLoaded: true } 
            : l
        )
      );
      
    } catch (err) {
      console.error(`Failed to load sound for layer ${layer.name}:`, err);
      Alert.alert('Error', `Failed to load sound for ${layer.name}`);
    }
  }
  
  async function playAllLayers() {
    try {
      if (isPlaying) {
        await stopAllSounds();
        return;
      }
      
      // Make sure all sounds are loaded
      const unloadedLayers = layers.filter(layer => !layer.isLoaded);
      if (unloadedLayers.length > 0) {
        for (const layer of unloadedLayers) {
          await loadSound(layer);
        }
      }
      
      // Play all sounds
      for (const layer of layers) {
        if (layer.sound && !layer.isMuted) {
          await layer.sound.setVolumeAsync(layer.volume * masterVolume);
          await layer.sound.playFromPositionAsync(0);
          
          // Set up completion handler
          layer.sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        }
      }
      
      setIsPlaying(true);
      setStatus('Playing all layers');
      
    } catch (err) {
      console.error('Failed to play layers:', err);
      setStatus('Error playing layers');
    }
  }
  
  async function stopAllSounds() {
    try {
      for (const layer of layers) {
        if (layer.sound) {
          await layer.sound.stopAsync();
        }
      }
      
      setIsPlaying(false);
      setStatus('Playback stopped');
      
    } catch (err) {
      console.error('Failed to stop sounds:', err);
      setStatus('Error stopping playback');
    }
  }
  
  async function toggleMuteLayer(layerId: string) {
    try {
      setLayers(prev => 
        prev.map(layer => {
          if (layer.id === layerId) {
            // If we're currently playing, update the sound's volume
            if (isPlaying && layer.sound) {
              const newMuted = !layer.isMuted;
              layer.sound.setVolumeAsync(newMuted ? 0 : layer.volume * masterVolume);
            }
            
            return { ...layer, isMuted: !layer.isMuted };
          }
          return layer;
        })
      );
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }
  
  async function updateLayerVolume(layerId: string, volume: number) {
    try {
      setLayers(prev => 
        prev.map(layer => {
          if (layer.id === layerId) {
            // If we're currently playing and not muted, update the sound's volume
            if (isPlaying && layer.sound && !layer.isMuted) {
              layer.sound.setVolumeAsync(volume * masterVolume);
            }
            
            return { ...layer, volume };
          }
          return layer;
        })
      );
    } catch (err) {
      console.error('Failed to update volume:', err);
    }
  }
  
  async function updateMasterVolume(volume: number) {
    try {
      setMasterVolume(volume);
      
      // Update all playing sounds
      if (isPlaying) {
        for (const layer of layers) {
          if (layer.sound && !layer.isMuted) {
            await layer.sound.setVolumeAsync(layer.volume * volume);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update master volume:', err);
    }
  }
  
  async function deleteLayer(layerId: string) {
    try {
      const layer = layers.find(l => l.id === layerId);
      
      if (layer?.sound) {
        await layer.sound.unloadAsync();
      }
      
      setLayers(prev => prev.filter(l => l.id !== layerId));
      setStatus(`Deleted ${layer?.name || 'layer'}`);
      
    } catch (err) {
      console.error('Failed to delete layer:', err);
      setStatus('Error deleting layer');
    }
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  function renameLayer(layerId: string, newName: string) {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, name: newName } 
          : layer
      )
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: theme.text }]}>{status}</Text>
        {isRecording && (
          <Text style={[styles.durationText, { color: theme.primary }]}>
            {formatTime(recordingDuration)}
          </Text>
        )}
      </View>
      
      <View style={styles.visualizer}>
        {recordingLevels.map((level, index) => (
          <View 
            key={index} 
            style={[
              styles.levelBar,
              { 
                height: 5 + level * 50,
                backgroundColor: theme.primary 
              }
            ]} 
          />
        ))}
      </View>
      
      <View style={styles.controlsContainer}>
        {!isRecording && (
          <TouchableOpacity 
            style={[styles.recordButton, { backgroundColor: theme.error }]} 
            onPress={startRecording}
            disabled={permissionStatus !== 'granted'}
          >
            <Ionicons name="mic" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {isRecording && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={[styles.stopButton, { backgroundColor: theme.error }]} 
              onPress={stopRecording}
            >
              <Ionicons name="square" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {layers.length > 0 && !isRecording && (
          <TouchableOpacity 
            style={[
              styles.playButton, 
              { backgroundColor: isPlaying ? theme.warning : theme.success }
            ]} 
            onPress={playAllLayers}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {layers.length > 0 && (
        <>
          <View style={styles.masterVolumeContainer}>
            <Text style={[styles.masterVolumeLabel, { color: theme.text }]}>
              Master Volume
            </Text>
            <Slider
              style={styles.masterVolumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={masterVolume}
              onValueChange={updateMasterVolume}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />
          </View>
          
          <Text style={[styles.layersTitle, { color: theme.text }]}>
            Layers ({layers.length})
          </Text>
          
          <ScrollView style={styles.layersContainer}>
            {layers.map((layer, index) => (
              <View 
                key={layer.id} 
                style={[
                  styles.layerItem, 
                  { borderColor: theme.border }
                ]}
              >
                <View style={styles.layerHeader}>
                  <View style={[styles.layerColorIndicator, { backgroundColor: layer.color }]} />
                  <Text style={[styles.layerName, { color: theme.text }]}>
                    {layer.name}
                  </Text>
                  <TouchableOpacity 
                    style={styles.layerAction}
                    onPress={() => toggleMuteLayer(layer.id)}
                  >
                    <Ionicons 
                      name={layer.isMuted ? "volume-mute" : "volume-high"} 
                      size={24} 
                      color={layer.isMuted ? theme.error : theme.text} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.layerAction}
                    onPress={() => {
                      const newName = prompt('Enter new name for layer:', layer.name);
                      if (newName) renameLayer(layer.id, newName);
                    }}
                  >
                    <MaterialIcons name="edit" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.layerAction}
                    onPress={() => {
                      Alert.alert(
                        'Delete Layer',
                        `Are you sure you want to delete ${layer.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteLayer(layer.id) }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash" size={24} color={theme.error} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.layerVolumeContainer}>
                  <Ionicons name="volume-low" size={18} color={theme.text} />
                  <Slider
                    style={styles.layerVolumeSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={layer.volume}
                    onValueChange={(value) => updateLayerVolume(layer.id, value)}
                    minimumTrackTintColor={layer.color}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={layer.color}
                    disabled={layer.isMuted}
                  />
                  <Ionicons name="volume-high" size={18} color={theme.text} />
                </View>
                
                {!layer.isLoaded && (
                  <View style={styles.layerLoadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.layerLoadingText, { color: theme.text }]}>
                      Loading...
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  visualizer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  levelBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  masterVolumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  masterVolumeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 120,
  },
  masterVolumeSlider: {
    flex: 1,
    height: 40,
  },
  layersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  layersContainer: {
    flex: 1,
  },
  layerItem: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  layerColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  layerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  layerAction: {
    padding: 5,
    marginLeft: 5,
  },
  layerVolumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerVolumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  layerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  layerLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
}); 