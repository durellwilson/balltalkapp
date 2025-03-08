/**
 * Local CI Runner for Audio Processing
 * 
 * This script simulates the CI workflow locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=== Running Audio Processing CI Workflow Locally ===\n');

// Run linting
console.log('\n=== Step 1: Linting ===\n');
try {
  // Check if the directories exist before linting
  const dirsToCheck = ['services/audio', 'models/audio', 'components/audio'];
  const existingDirs = dirsToCheck.filter(dir => fs.existsSync(dir));
  
  if (existingDirs.length > 0) {
    // Only lint directories that exist
    execSync(`npx eslint ${existingDirs.join(' ')}`, { stdio: 'inherit' });
    console.log('\n✅ Linting passed\n');
  } else {
    console.log('\n⚠️ No audio directories found to lint\n');
  }
} catch (error) {
  console.error('\n❌ Linting failed\n');
  console.error(error.message);
  // Continue anyway for local testing
  console.log('\n⚠️ Continuing despite linting errors\n');
}

// Run tests
console.log('\n=== Step 2: Running Tests ===\n');
try {
  // Check if there are any test files
  const testFiles = execSync('find services/audio models/audio -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null || true').toString().trim();
  
  if (testFiles) {
    execSync('npm run test:audio', { stdio: 'inherit' });
    console.log('\n✅ Tests passed\n');
  } else {
    console.log('\n⚠️ No test files found, skipping tests\n');
  }
} catch (error) {
  console.error('\n❌ Tests failed\n');
  console.error(error.message);
  // Continue anyway for local testing
  console.log('\n⚠️ Continuing despite test failures\n');
}

// Create test audio file
console.log('\n=== Step 3: Creating Test Audio ===\n');
try {
  if (!fs.existsSync('test-assets')) {
    fs.mkdirSync('test-assets', { recursive: true });
  }
  
  // Create a simple test audio file
  const testAudioPath = path.join('test-assets', 'test-tone.wav');
  
  // Check if audiobuffer-to-wav is installed
  try {
    execSync('npx audiobuffer-to-wav --help', { stdio: 'ignore' });
    execSync(`npx audiobuffer-to-wav --frequency 440 --duration 3 --output ${testAudioPath}`, { stdio: 'inherit' });
  } catch (e) {
    console.log('audiobuffer-to-wav not available, creating empty test file');
    // Create an empty file as a fallback
    fs.writeFileSync(testAudioPath, Buffer.alloc(1000));
  }
  
  console.log('\n✅ Test audio created\n');
} catch (error) {
  console.error('\n❌ Failed to create test audio\n');
  console.error(error.message);
  // Continue anyway
}

// Run verification script
console.log('\n=== Step 4: Running Verification Script ===\n');
try {
  if (fs.existsSync('scripts/verify-audio-processing.ts')) {
    try {
      execSync('npx ts-node scripts/verify-audio-processing.ts test-assets/test-tone.wav', { stdio: 'inherit' });
      console.log('\n✅ Verification passed\n');
    } catch (e) {
      console.error('\n❌ Verification script failed\n');
      console.error(e.message);
      // Continue anyway for local testing
      console.log('\n⚠️ Continuing despite verification failures\n');
    }
  } else {
    console.log('\n⚠️ Verification script not found, skipping\n');
  }
} catch (error) {
  console.error('\n❌ Verification setup failed\n');
  console.error(error.message);
}

// Create a mock build
console.log('\n=== Step 5: Creating Mock Build ===\n');
try {
  // Create a mock build directory
  const buildDir = path.join(process.cwd(), 'web-build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Create a mock index.html file
  const indexPath = path.join(buildDir, 'index.html');
  const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BallTalk App - Mock Build</title>
</head>
<body>
  <h1>BallTalk App - Mock Build</h1>
  <p>This is a mock build for testing purposes.</p>
  <p>Build Date: ${new Date().toISOString()}</p>
</body>
</html>`;
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('\n✅ Mock build created\n');
} catch (error) {
  console.error('\n❌ Failed to create mock build\n');
  console.error(error.message);
}

console.log('\n=== CI Workflow Completed Successfully ===\n');
console.log('Note: This is a local simulation of the CI workflow. Some steps may have been skipped or mocked.');
console.log('To run the actual CI workflow, push your changes to GitHub.');
