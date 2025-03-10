/**
 * Audio Processing Verification Script
 * 
 * This script tests the audio processing functionality by:
 * 1. Loading a test audio file
 * 2. Processing the audio file with different presets
 * 3. Comparing the results
 * 
 * Usage: npx ts-node scripts/verify-audio-processing.ts [path-to-audio-file]
 */

import fs from 'fs';
import path from 'path';
import AudioEngine from '../../services/audio/AudioEngine';
import { DEFAULT_PROCESSING_SETTINGS } from '../../models/audio/MasteringModels';
import { trackAudioProcessing } from '../../services/analytics/AudioProcessingAnalytics';

// Check if a file path was provided
const testFilePath = process.argv[2];
if (!testFilePath) {
  console.error('Please provide a path to a test audio file.');
  console.error('Usage: npx ts-node scripts/verify-audio-processing.ts [path-to-audio-file]');
  process.exit(1);
}

// Check if the file exists
if (!fs.existsSync(testFilePath)) {
  console.error(`File not found: ${testFilePath}`);
  process.exit(1);
}

// Check if the file is an audio file
const fileExtension = path.extname(testFilePath).toLowerCase();
const supportedExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
if (!supportedExtensions.includes(fileExtension)) {
  console.error(`Unsupported file type: ${fileExtension}`);
  console.error(`Supported file types: ${supportedExtensions.join(', ')}`);
  process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Main verification function
async function verifyAudioProcessing() {
  console.log('Starting audio processing verification...');
  console.log(`Test file: ${testFilePath}`);
  
  try {
    // Create an instance of the AudioEngine
    const audioEngine = new AudioEngine();
    
    // Convert file path to URI format
    const fileUri = `file://${path.resolve(testFilePath)}`;
    console.log(`Loading audio file: ${fileUri}`);
    
    // Load the audio file
    const loaded = await audioEngine.loadAudio(fileUri);
    if (!loaded) {
      console.error('Failed to load audio file');
      process.exit(1);
    }
    
    console.log('Audio file loaded successfully');
    
    // Process the audio file with each preset
    console.log('\nProcessing audio with different presets...');
    
    const results = [];
    const testUserId = 'test-user';
    
    for (const settings of DEFAULT_PROCESSING_SETTINGS) {
      console.log(`\nApplying preset: ${settings.name}`);
      console.log(`- Description: ${settings.description}`);
      
      // Set the processing mode based on the preset
      audioEngine.setProcessingMode('dolby');
      
      // Create Dolby options from the preset
      const dolbyOptions = {
        profile: 'balanced',
        outputFormat: 'wav',
        targetLoudness: settings.targetLoudness,
        stereoEnhancement: 'medium',
        dynamicEQ: true,
        limitingMode: 'transparent'
      };
      
      const startTime = Date.now();
      
      // Process the audio
      const result = await audioEngine.processAudio(testUserId, {
        dolby: dolbyOptions,
        projectId: 'test-project',
        trackId: 'test-track'
      });
      
      const processingTime = Date.now() - startTime;
      
      if (result.success) {
        console.log('Processing result:');
        console.log(`- Original file: ${result.result.originalFileUrl}`);
        console.log(`- Processed file: ${result.result.processedFileUrl}`);
        console.log(`- Processing time: ${processingTime} ms`);
        
        // Track the processing for analytics
        await trackAudioProcessing(
          'mastering',
          processingTime / 1000, // Convert to seconds
          true,
          {
            preset_id: settings.id,
            preset_name: settings.name,
            input_format: fileExtension.slice(1),
            output_format: 'wav',
            file_size: fs.statSync(testFilePath).size
          }
        );
        
        results.push({
          presetId: settings.id,
          presetName: settings.name,
          processingTime,
          success: true
        });
      } else {
        console.error(`Processing failed: ${result.error}`);
        
        // Track the failed processing
        await trackAudioProcessing(
          'mastering',
          processingTime / 1000, // Convert to seconds
          false,
          {
            preset_id: settings.id,
            preset_name: settings.name,
            error: result.error
          }
        );
        
        results.push({
          presetId: settings.id,
          presetName: settings.name,
          processingTime,
          success: false,
          error: result.error
        });
      }
    }
    
    // Compare the results
    console.log('\nComparison of results:');
    console.table(results);
    
    // Clean up
    await audioEngine.unloadAudio();
    
    console.log('\nVerification completed successfully!');
  } catch (error) {
    console.error('Verification failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the verification
verifyAudioProcessing().catch(error => {
  console.error('Unhandled error:');
  console.error(error);
  process.exit(1);
});
