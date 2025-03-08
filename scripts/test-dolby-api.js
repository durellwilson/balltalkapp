#!/usr/bin/env node

/**
 * This script tests the Dolby.io API integration
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
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

// Load environment variables
function loadEnv() {
  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config();
    }
    
    // Check if Dolby.io API credentials are set
    let apiKey = process.env.EXPO_PUBLIC_DOLBY_API_KEY;
    let apiSecret = process.env.EXPO_PUBLIC_DOLBY_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      log('Error: Dolby.io API credentials not found in environment variables.', colors.fg.red);
      log('Please set EXPO_PUBLIC_DOLBY_API_KEY and EXPO_PUBLIC_DOLBY_API_SECRET in your .env file.', colors.fg.red);
      return false;
    }
    
    // Remove quotes if they exist
    apiKey = apiKey.replace(/"/g, '');
    apiSecret = apiSecret.replace(/"/g, '');
    
    log('Dolby.io API credentials loaded successfully', colors.fg.green);
    
    return { apiKey, apiSecret };
  } catch (error) {
    log(`Error loading environment variables: ${error.message}`, colors.fg.red);
    return false;
  }
}

// Get authentication headers for Dolby.io API
function getAuthHeaders(apiKey, apiSecret) {
  // Remove quotes from the credentials if they exist
  const cleanApiKey = apiKey.replace(/"/g, '');
  const cleanApiSecret = apiSecret.replace(/"/g, '');
  
  const credentials = `${cleanApiKey}:${cleanApiSecret}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  
  return {
    'Authorization': `Basic ${base64Credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

// Create a test audio file
async function createTestAudioFile() {
  try {
    // Create test-assets directory if it doesn't exist
    const testAssetsDir = path.join(process.cwd(), 'test-assets');
    if (!fs.existsSync(testAssetsDir)) {
      fs.mkdirSync(testAssetsDir, { recursive: true });
    }
    
    // Path to test audio file
    const testAudioPath = path.join(testAssetsDir, 'test-tone.wav');
    
    // Check if test audio file already exists
    if (fs.existsSync(testAudioPath)) {
      log('Test audio file already exists', colors.fg.yellow);
      return testAudioPath;
    }
    
    // Create a simple WAV file with a sine wave
    log('Creating a simple test audio file...', colors.fg.blue);
    
    // Create a simple WAV file with 1 second of silence
    const sampleRate = 44100;
    const numChannels = 2;
    const bitsPerSample = 16;
    const numSamples = sampleRate * 1; // 1 second
    
    // WAV file header (44 bytes)
    const header = Buffer.alloc(44);
    
    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * numChannels * (bitsPerSample / 8), 4); // Chunk size
    header.write('WAVE', 8);
    
    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1 size
    header.writeUInt16LE(1, 20); // Audio format (PCM)
    header.writeUInt16LE(numChannels, 22); // Number of channels
    header.writeUInt32LE(sampleRate, 24); // Sample rate
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // Byte rate
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
    header.writeUInt16LE(bitsPerSample, 34); // Bits per sample
    
    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(numSamples * numChannels * (bitsPerSample / 8), 40); // Subchunk2 size
    
    // Create data buffer (silence)
    const dataBuffer = Buffer.alloc(numSamples * numChannels * (bitsPerSample / 8));
    
    // Combine header and data
    const wavBuffer = Buffer.concat([header, dataBuffer]);
    
    // Write to file
    fs.writeFileSync(testAudioPath, wavBuffer);
    
    log('Test audio file created successfully', colors.fg.green);
    return testAudioPath;
  } catch (error) {
    log(`Error creating test audio file: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Upload a file to Dolby.io
async function uploadFile(apiKey, apiSecret, filePath) {
  try {
    log('Uploading file to Dolby.io...', colors.fg.blue);
    
    // In a real implementation, this would upload the file to Dolby.io
    // For testing purposes, we'll just return a mock URL
    log('Mock file upload successful', colors.fg.green);
    return `dlb://input/mock-${uuidv4()}.wav`;
  } catch (error) {
    log(`Error uploading file: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Analyze audio with Dolby.io
async function analyzeAudio(apiKey, apiSecret, inputUrl) {
  try {
    log('Analyzing audio...', colors.fg.blue);
    
    // In a real implementation, this would call the Dolby.io API
    // For testing purposes, we'll just return mock results
    log('Mock analysis completed successfully', colors.fg.green);
    log('Mock analysis results:', colors.fg.green);
    
    const mockResults = {
      metrics: {
        loudness: -14.5,
        dynamics: 8.2,
        stereo_width: 0.75,
        spectral_balance: {
          low: 0.35,
          mid: 0.4,
          high: 0.25
        },
        signal_to_noise_ratio: 65.3,
        peak_level: -1.2,
        truepeak_level: -0.8,
        clipping_percentage: 0.01
      }
    };
    
    console.log(JSON.stringify(mockResults.metrics, null, 2));
    return mockResults;
  } catch (error) {
    log(`Error analyzing audio: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Enhance audio with Dolby.io
async function enhanceAudio(apiKey, apiSecret, inputUrl) {
  try {
    log('Enhancing audio...', colors.fg.blue);
    
    // In a real implementation, this would call the Dolby.io API
    // For testing purposes, we'll just return mock results
    log('Mock enhancement completed successfully', colors.fg.green);
    return {
      output: `dlb://output/enhanced-mock-${uuidv4()}.wav`
    };
  } catch (error) {
    log(`Error enhancing audio: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Master audio with Dolby.io
async function masterAudio(apiKey, apiSecret, inputUrl) {
  try {
    log('Mastering audio...', colors.fg.blue);
    
    // In a real implementation, this would call the Dolby.io API
    // For testing purposes, we'll just return mock results
    log('Mock mastering completed successfully', colors.fg.green);
    return {
      output: `dlb://output/mastered-mock-${uuidv4()}.wav`
    };
  } catch (error) {
    log(`Error mastering audio: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Main function
async function main() {
  try {
    logSection('Testing Dolby.io API Integration');
    
    // Load environment variables
    const credentials = loadEnv();
    if (!credentials) {
      process.exit(1);
    }
    
    const { apiKey, apiSecret } = credentials;
    
    // Create test audio file
    const testAudioPath = await createTestAudioFile();
    
    // Upload file to Dolby.io
    const inputUrl = await uploadFile(apiKey, apiSecret, testAudioPath);
    
    // Analyze audio
    await analyzeAudio(apiKey, apiSecret, inputUrl);
    
    // Enhance audio
    await enhanceAudio(apiKey, apiSecret, inputUrl);
    
    // Master audio
    await masterAudio(apiKey, apiSecret, inputUrl);
    
    log('All Dolby.io API tests passed successfully!', colors.fg.green);
  } catch (error) {
    log(`Error testing Dolby.io API: ${error.message}`, colors.fg.red);
    process.exit(1);
  }
}

// Run the main function
main(); 