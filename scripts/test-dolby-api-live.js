#!/usr/bin/env node

/**
 * This script tests the Dolby.io API integration with live credentials
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

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
    log(`API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`, colors.fg.green);
    
    return { apiKey, apiSecret };
  } catch (error) {
    log(`Error loading environment variables: ${error.message}`, colors.fg.red);
    return false;
  }
}

// Get authentication headers for Dolby.io API
function getAuthHeaders(apiKey, apiSecret) {
  // Clean the credentials
  const cleanApiKey = apiKey.replace(/"/g, '').trim();
  const cleanApiSecret = apiSecret.replace(/"/g, '').trim();
  
  // Create the credentials string
  const credentials = `${cleanApiKey}:${cleanApiSecret}`;
  
  // Base64 encode the credentials
  const base64Credentials = Buffer.from(credentials).toString('base64');
  
  // Log the credentials for debugging (remove in production)
  log(`Using credentials: ${credentials}`, colors.fg.yellow);
  log(`Base64 encoded: ${base64Credentials}`, colors.fg.yellow);
  
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
    
    // Generate a unique input URL
    const inputName = `test-${uuidv4()}.wav`;
    const inputUrl = `dlb://input/${inputName}`;
    
    // Get presigned URL for upload
    const response = await axios.post(
      'https://api.dolby.com/media/input',
      { url: inputUrl },
      { headers: getAuthHeaders(apiKey, apiSecret) }
    );
    
    const presignedUrl = response.data.url;
    
    // Upload file to presigned URL
    const fileData = fs.readFileSync(filePath);
    await axios.put(presignedUrl, fileData, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': fileData.length
      }
    });
    
    log('File uploaded successfully', colors.fg.green);
    return inputUrl;
  } catch (error) {
    log(`Error uploading file: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Analyze audio with Dolby.io
async function analyzeAudio(apiKey, apiSecret, inputUrl) {
  try {
    log('Analyzing audio...', colors.fg.blue);
    
    // Start analysis job
    const response = await axios.post(
      'https://api.dolby.com/media/analyze',
      {
        input: inputUrl,
        content: { type: 'music' }
      },
      { headers: getAuthHeaders(apiKey, apiSecret) }
    );
    
    const jobId = response.data.job_id;
    log(`Analysis job started with ID: ${jobId}`, colors.fg.blue);
    
    // Poll for job completion
    let status = 'Pending';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (status !== 'Success' && status !== 'Failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const statusResponse = await axios.get(
        `https://api.dolby.com/media/analyze/job/${jobId}`,
        { headers: getAuthHeaders(apiKey, apiSecret) }
      );
      
      status = statusResponse.data.status;
      log(`Analysis job status: ${status} (attempt ${attempts}/${maxAttempts})`, colors.fg.blue);
      
      if (status === 'Failed') {
        throw new Error(`Analysis job failed: ${statusResponse.data.error || 'Unknown error'}`);
      }
      
      if (status === 'Success') {
        log('Analysis completed successfully', colors.fg.green);
        log('Analysis results:', colors.fg.green);
        console.log(JSON.stringify(statusResponse.data.metrics, null, 2));
        return statusResponse.data;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Analysis job timed out');
    }
  } catch (error) {
    log(`Error analyzing audio: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Enhance audio with Dolby.io
async function enhanceAudio(apiKey, apiSecret, inputUrl) {
  try {
    log('Enhancing audio...', colors.fg.blue);
    
    // Generate a unique output URL
    const outputName = `enhanced-${uuidv4()}.wav`;
    const outputUrl = `dlb://output/${outputName}`;
    
    // Start enhancement job
    const response = await axios.post(
      'https://api.dolby.com/media/enhance',
      {
        input: inputUrl,
        output: { url: outputUrl },
        content: { type: 'music' },
        audio: {
          noise_reduction: 'medium'
        }
      },
      { headers: getAuthHeaders(apiKey, apiSecret) }
    );
    
    const jobId = response.data.job_id;
    log(`Enhancement job started with ID: ${jobId}`, colors.fg.blue);
    
    // Poll for job completion
    let status = 'Pending';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (status !== 'Success' && status !== 'Failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const statusResponse = await axios.get(
        `https://api.dolby.com/media/enhance/job/${jobId}`,
        { headers: getAuthHeaders(apiKey, apiSecret) }
      );
      
      status = statusResponse.data.status;
      log(`Enhancement job status: ${status} (attempt ${attempts}/${maxAttempts})`, colors.fg.blue);
      
      if (status === 'Failed') {
        throw new Error(`Enhancement job failed: ${statusResponse.data.error || 'Unknown error'}`);
      }
      
      if (status === 'Success') {
        log('Enhancement completed successfully', colors.fg.green);
        return statusResponse.data;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Enhancement job timed out');
    }
  } catch (error) {
    log(`Error enhancing audio: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Main function
async function main() {
  try {
    logSection('Testing Dolby.io API Integration (Live)');
    
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
    
    log('All Dolby.io API tests passed successfully!', colors.fg.green);
  } catch (error) {
    log(`Error testing Dolby.io API: ${error.message}`, colors.fg.red);
    process.exit(1);
  }
}

// Run the main function
main(); 