
import VocalIsolationService, { VocalIsolationMode } from '../../services/audio/VocalIsolationService';
import { DolbyOutputFormat } from '../../services/audio/DolbyMasteringService';

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
    console.log('\nTesting with vocals only mode...');
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
    console.log('\nTesting with instrumental only mode...');
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
    console.log('\nTesting with separate tracks mode...');
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
    console.log('\nTesting getting results...');
    const results = await VocalIsolationService.getVocalIsolationResults(TEST_USER_ID);
    console.log('Results:', results);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Error testing VocalIsolationService:', error);
  }
}

// Run the test
testVocalIsolation();
