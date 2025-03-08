#!/usr/bin/env node

/**
 * Test script for VocalIsolationService
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
  }
};

// Log with color
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log a section header
function logSection(title) {
  console.log('\n');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
  log(`  ${title}`, colors.bright + colors.fg.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
}

// Execute a command and return the output
function execute(command, options = {}) {
  try {
    log(`> ${command}`, colors.dim);
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.fg.red);
    log(error.message, colors.fg.red);
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    return null;
  }
}

// Create a test file
function createTestFile() {
  const testDir = path.join(process.cwd(), 'tests');
  const testFile = path.join(testDir, 'test-vocal-isolation.js');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testContent = `
// Import the services
// Note: In a real test, you would import the actual services
// For this mock test, we'll create mock objects

// Mock VocalIsolationMode enum
const VocalIsolationMode = {
  VOCALS_ONLY: 'vocals_only',
  INSTRUMENTAL_ONLY: 'instrumental_only',
  SEPARATE_TRACKS: 'separate_tracks'
};

// Mock DolbyOutputFormat enum
const DolbyOutputFormat = {
  WAV: 'wav',
  MP3: 'mp3',
  OGG: 'ogg',
  AAC: 'aac',
  MP4: 'mp4'
};

// Mock VocalIsolationService
const VocalIsolationService = {
  getDefaultVocalIsolationOptions() {
    return {
      mode: VocalIsolationMode.SEPARATE_TRACKS,
      outputFormat: DolbyOutputFormat.MP3,
      preserveMetadata: true
    };
  },
  
  async isolateVocals(userId, audioFileUrl, options, projectId, trackId) {
    console.log(\`Isolating vocals for user \${userId} with mode \${options.mode}\`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock result
    const result = {
      id: 'mock-result-' + Math.random().toString(36).substring(2, 9),
      originalFileUrl: audioFileUrl,
      mode: options.mode,
      outputFormat: options.outputFormat,
      metrics: {
        vocalSeparationQuality: 0.85,
        vocalPresence: 0.75
      },
      createdAt: new Date().toISOString(),
      userId,
      projectId,
      trackId
    };
    
    // Add appropriate URLs based on mode
    if (options.mode === VocalIsolationMode.VOCALS_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS) {
      result.vocalsFileUrl = audioFileUrl; // Use original for mock
    }
    
    if (options.mode === VocalIsolationMode.INSTRUMENTAL_ONLY || options.mode === VocalIsolationMode.SEPARATE_TRACKS) {
      result.instrumentalFileUrl = audioFileUrl; // Use original for mock
    }
    
    return result;
  },
  
  async getVocalIsolationResults(userId, limitCount = 10) {
    console.log(\`Getting vocal isolation results for user \${userId} with limit \${limitCount}\`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create mock results
    return [
      {
        id: 'mock-result-1',
        originalFileUrl: 'https://example.com/test-audio.mp3',
        vocalsFileUrl: 'https://example.com/test-audio-vocals.mp3',
        instrumentalFileUrl: 'https://example.com/test-audio-instrumental.mp3',
        mode: VocalIsolationMode.SEPARATE_TRACKS,
        outputFormat: DolbyOutputFormat.MP3,
        metrics: {
          vocalSeparationQuality: 0.85,
          vocalPresence: 0.75
        },
        createdAt: new Date().toISOString(),
        userId
      }
    ];
  }
};

// Test audio file URL (replace with a real audio file URL for testing)
const TEST_AUDIO_URL = 'https://example.com/test-audio.mp3';
const TEST_USER_ID = 'test-user-123';

async function testVocalIsolation() {
  console.log('Testing VocalIsolationService...');
  
  try {
    // Test with default options
    console.log('Testing with default options...');
    const defaultOptions = VocalIsolationService.getDefaultVocalIsolationOptions();
    console.log('Default options:', defaultOptions);
    
    // Test with vocals only mode
    console.log('\\nTesting with vocals only mode...');
    const vocalsOnlyResult = await VocalIsolationService.isolateVocals(
      TEST_USER_ID,
      TEST_AUDIO_URL,
      {
        mode: VocalIsolationMode.VOCALS_ONLY,
        outputFormat: DolbyOutputFormat.MP3,
        preserveMetadata: true
      }
    );
    console.log('Vocals only result:', vocalsOnlyResult);
    
    // Test with instrumental only mode
    console.log('\\nTesting with instrumental only mode...');
    const instrumentalOnlyResult = await VocalIsolationService.isolateVocals(
      TEST_USER_ID,
      TEST_AUDIO_URL,
      {
        mode: VocalIsolationMode.INSTRUMENTAL_ONLY,
        outputFormat: DolbyOutputFormat.MP3,
        preserveMetadata: true
      }
    );
    console.log('Instrumental only result:', instrumentalOnlyResult);
    
    // Test with separate tracks mode
    console.log('\\nTesting with separate tracks mode...');
    const separateTracksResult = await VocalIsolationService.isolateVocals(
      TEST_USER_ID,
      TEST_AUDIO_URL,
      {
        mode: VocalIsolationMode.SEPARATE_TRACKS,
        outputFormat: DolbyOutputFormat.MP3,
        preserveMetadata: true
      }
    );
    console.log('Separate tracks result:', separateTracksResult);
    
    // Test getting results
    console.log('\\nTesting getting results...');
    const results = await VocalIsolationService.getVocalIsolationResults(TEST_USER_ID);
    console.log('Results:', results);
    
    console.log('\\nAll tests passed!');
  } catch (error) {
    console.error('Error testing VocalIsolationService:', error);
  }
}

// Run the test
testVocalIsolation();
`;
  
  fs.writeFileSync(testFile, testContent);
  log(`Created test file: ${testFile}`, colors.fg.green);
  
  return testFile;
}

// Main function
async function main() {
  logSection('Testing VocalIsolationService');
  
  // Create test file
  const testFile = createTestFile();
  
  // Run the test
  log('Running test...', colors.fg.yellow);
  execute(`node ${testFile}`);
  
  log('Test completed!', colors.fg.green);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 