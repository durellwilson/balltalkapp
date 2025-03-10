#!/usr/bin/env node

/**
 * Script to diagnose and restore recording functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.bright}${colors.cyan}====== RECORDING FUNCTIONALITY RECOVERY ======${colors.reset}\n`);

// 1. Check audio dependencies
console.log(`${colors.yellow}Checking audio dependencies...${colors.reset}`);
const requiredDependencies = [
  'expo-av',
  '@react-native-community/slider',
  'expo-file-system'
];

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const missingDeps = [];

requiredDependencies.forEach(dep => {
  if (!packageJson.dependencies[dep]) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.log(`${colors.red}Missing dependencies: ${missingDeps.join(', ')}${colors.reset}`);
  console.log(`${colors.yellow}Installing missing dependencies...${colors.reset}`);
  
  try {
    execSync(`npx expo install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log(`${colors.green}Dependencies installed successfully.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to install dependencies: ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.green}All required audio dependencies are installed.${colors.reset}`);
}

// 2. Check for common audio recording issues
console.log(`\n${colors.yellow}Checking for common audio recording issues...${colors.reset}`);

// Verify Audio component files exist
const audioComponentPaths = [
  path.join(process.cwd(), 'components', 'audio'),
  path.join(process.cwd(), 'services', 'audio')
];

audioComponentPaths.forEach(dirPath => {
  if (!fs.existsSync(dirPath)) {
    console.log(`${colors.red}Missing directory: ${dirPath}${colors.reset}`);
    console.log(`${colors.yellow}Creating directory structure...${colors.reset}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    const files = fs.readdirSync(dirPath);
    console.log(`${colors.green}Found ${files.length} files in ${dirPath}${colors.reset}`);
  }
});

// 3. Fix permissions
console.log(`\n${colors.yellow}Checking for permissions setup...${colors.reset}`);

// This would need specific implementation based on the app structure
console.log(`${colors.cyan}To manually verify permissions are correctly set up:${colors.reset}`);
console.log(`1. Check that app.json has the following permissions:`);
console.log(`   - "android.permissions.RECORD_AUDIO"`);
console.log(`   - "android.permissions.MODIFY_AUDIO_SETTINGS"`);
console.log(`2. Ensure your app requests microphone permissions at runtime`);

// 4. Create basic recording component if needed
const basicRecorderPath = path.join(process.cwd(), 'components', 'audio', 'BasicRecorder.tsx');
if (!fs.existsSync(basicRecorderPath)) {
  console.log(`\n${colors.yellow}Creating a basic audio recorder component...${colors.reset}`);
  
  const basicRecorderCode = `
import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function BasicRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<{ uri: string; duration: number }[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState<Audio.PermissionResponse | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('');

  async function requestPermissions() {
    try {
      console.log('Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      console.log('Permission response:', permission);
      setPermissionResponse(permission);
      
      if (permission.granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (err) {
      console.error('Error requesting permissions:', err);
    }
  }

  useEffect(() => {
    requestPermissions();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  async function startRecording() {
    try {
      if (!permissionResponse?.granted) {
        await requestPermissions();
        if (!permissionResponse?.granted) {
          setRecordingStatus('No permission to record');
          return;
        }
      }
      
      setRecordingStatus('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setRecordingStatus('Recording...');
      
      recording.setOnRecordingStatusUpdate(status => {
        if (status.isRecording) {
          setRecordingStatus(\`Recording... \${Math.floor(status.durationMillis / 1000)}s\`);
        }
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingStatus(\`Error: \${err.message}\`);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    
    try {
      setRecordingStatus('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        setRecordingStatus('No recording file created');
        return;
      }
      
      const info = await FileSystem.getInfoAsync(uri);
      
      setRecordings(prev => [
        ...prev, 
        { 
          uri, 
          duration: recording._finalDurationMillis ? 
            recording._finalDurationMillis / 1000 : 
            0 
        }
      ]);
      
      setRecording(null);
      setRecordingStatus('Recording stopped');
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecordingStatus(\`Error: \${err.message}\`);
    }
  }

  async function playSound(uri) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Audio Recorder</Text>
      
      {permissionResponse && (
        <Text style={styles.status}>
          Microphone Permission: {permissionResponse.granted ? 'Granted' : 'Denied'}
        </Text>
      )}
      
      <Text style={styles.status}>{recordingStatus}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title={recording ? "Stop Recording" : "Start Recording"}
          onPress={recording ? stopRecording : startRecording}
          disabled={!permissionResponse?.granted && !recording}
        />
      </View>
      
      <Text style={styles.subtitle}>Recordings ({recordings.length})</Text>
      
      {recordings.length === 0 ? (
        <Text style={styles.noRecordings}>No recordings yet</Text>
      ) : (
        recordings.map((item, index) => (
          <View key={index} style={styles.recordingItem}>
            <Text>Recording #{index + 1} ({item.duration.toFixed(1)}s)</Text>
            <Button 
              title={isPlaying ? "Stop" : "Play"} 
              onPress={() => playSound(item.uri)} 
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  status: {
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  noRecordings: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  }
});
`;

  fs.writeFileSync(basicRecorderPath, basicRecorderCode);
  console.log(`${colors.green}Created BasicRecorder.tsx${colors.reset}`);
}

// Create a simple test screen
const recorderScreenPath = path.join(process.cwd(), 'app', 'recorder.tsx');
if (!fs.existsSync(recorderScreenPath)) {
  console.log(`\n${colors.yellow}Creating a recorder test screen...${colors.reset}`);
  
  const recorderScreenCode = `
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import BasicRecorder from '../../components/audio/BasicRecorder';

export default function RecorderScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Audio Recorder' }} />
      <BasicRecorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;

  fs.writeFileSync(recorderScreenPath, recorderScreenCode);
  console.log(`${colors.green}Created recorder.tsx screen${colors.reset}`);
}

console.log(`\n${colors.green}${colors.bright}====== RECORDING RECOVERY COMPLETE ======${colors.reset}`);
console.log(`${colors.cyan}To test recording functionality:${colors.reset}`);
console.log(`1. Run the app with 'npm start'`);
console.log(`2. Navigate to the /recorder screen`);
console.log(`3. Test basic recording and playback`);
console.log(`\n${colors.yellow}If issues persist, check the console logs for specific errors${colors.reset}\n`); 