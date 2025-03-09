/**
 * This script creates a simple mock audio file for testing purposes
 * It uses Buffer to create a minimal valid MP3 file
 */

const fs = require('fs');
const path = require('path');

// Create the test-assets directory if it doesn't exist
const testAssetsDir = path.join(process.cwd(), 'test-assets');
if (!fs.existsSync(testAssetsDir)) {
  fs.mkdirSync(testAssetsDir, { recursive: true });
  console.log(`Created directory: ${testAssetsDir}`);
}

// Path to save the test audio file
const testAudioPath = path.join(testAssetsDir, 'test-audio.mp3');

// Create a simple MP3 file with ID3v2 header
// This is a minimalist example that will be recognized as an MP3 file
// For real testing, you'd want to use a proper audio file
function createMinimalMP3File() {
  // MP3 file with ID3v2 header (minimum valid MP3)
  // ID3v2 header (10 bytes) + minimal MP3 frame (4 bytes)
  const buffer = Buffer.from([
    // ID3v2 header (10 bytes)
    0x49, 0x44, 0x33,       // "ID3" identifier
    0x03, 0x00,             // version 3.0
    0x00,                   // flags
    0x00, 0x00, 0x00, 0x0A, // size (10 bytes excluding header)
    
    // Minimal content (10 bytes as promised in the header)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    
    // Minimal MP3 frame (4 bytes)
    0xFF, 0xFB, 0x90, 0x44  // MPEG-1 Layer 3, 44.1kHz
  ]);
  
  return buffer;
}

// Alternative: If you want to create a file with audio data from scratch
// This is more complex but creates a more realistic test file
function createTestToneMP3() {
  // This would require audio processing libraries
  // For simplicity, we're just creating a minimal valid MP3 file
  return createMinimalMP3File();
}

// Write the test audio file
try {
  const audioData = createMinimalMP3File();
  fs.writeFileSync(testAudioPath, audioData);
  console.log(`Created test audio file: ${testAudioPath}`);
  console.log(`File size: ${audioData.length} bytes`);
} catch (error) {
  console.error('Error creating test audio file:', error);
} 