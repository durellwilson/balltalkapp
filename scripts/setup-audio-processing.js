/**
 * Setup Audio Processing Dependencies
 * 
 * This script installs all necessary dependencies for the audio processing system
 * and sets up the required environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to log with colors
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  log('='.repeat(80), colors.fg.cyan);
  log(`  ${title}`, colors.fg.cyan + colors.bright);
  log('='.repeat(80), colors.fg.cyan);
}

// Helper function to run commands and handle errors
function runCommand(command, errorMessage, ignoreError = false) {
  try {
    log(`> ${command}`, colors.dim);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreError) {
      log(`Warning: ${errorMessage}`, colors.fg.yellow);
      log(`Command failed: ${command}`, colors.fg.yellow);
      log(`${error.message}`, colors.fg.yellow);
      return true;
    } else {
      log(`ERROR: ${errorMessage}`, colors.fg.red);
      log(`Command failed: ${command}`, colors.fg.red);
      log(`${error.message}`, colors.fg.red);
      return false;
    }
  }
}

// Create necessary directories
function createDirectories() {
  logSection('Creating Directories');
  
  const directories = [
    'services/audio',
    'models/audio',
    'components/audio',
    'scripts',
    'output'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      log(`Creating directory: ${dir}`, colors.fg.yellow);
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      log(`Directory already exists: ${dir}`, colors.fg.green);
    }
  });
}

// Install dependencies
function installDependencies() {
  logSection('Installing Dependencies');
  
  // Core dependencies
  const coreDependencies = [
    'audiobuffer-to-wav',
    'firebase',
    'uuid',
    'expo-av',
    'expo-file-system'
  ];
  
  // Optional dependencies (may not be available)
  const optionalDependencies = [
    '@dolbyio/media-processing'
  ];
  
  // Dev dependencies
  const devDependencies = [
    'jest',
    'ts-jest',
    '@types/jest',
    '@testing-library/react-native',
    'ts-node'
  ];
  
  log('Installing core dependencies...', colors.fg.yellow);
  if (!runCommand(`npm install --save ${coreDependencies.join(' ')}`, 'Failed to install core dependencies')) {
    return false;
  }
  
  log('Installing optional dependencies...', colors.fg.yellow);
  optionalDependencies.forEach(dep => {
    runCommand(`npm install --save ${dep}`, `Failed to install optional dependency: ${dep}`, true);
  });
  
  log('Installing dev dependencies...', colors.fg.yellow);
  if (!runCommand(`npm install --save-dev ${devDependencies.join(' ')}`, 'Failed to install dev dependencies')) {
    return false;
  }
  
  return true;
}

// Create mock implementation for Dolby.io API
function createMockDolbyImplementation() {
  logSection('Creating Mock Dolby.io Implementation');
  
  const mockDolbyDir = path.join(process.cwd(), 'services/audio/mocks');
  if (!fs.existsSync(mockDolbyDir)) {
    fs.mkdirSync(mockDolbyDir, { recursive: true });
  }
  
  const mockDolbyPath = path.join(mockDolbyDir, 'MockDolbyService.ts');
  const mockDolbyContent = `/**
 * Mock implementation of Dolby.io Media Processing API
 * 
 * This is used when the actual Dolby.io package is not available
 */

export interface DolbyProcessingOptions {
  profile?: string;
  outputFormat?: string;
  targetLoudness?: number;
  stereoEnhancement?: string;
  dynamicEQ?: boolean;
  limitingMode?: string;
}

export interface DolbyProcessingResult {
  url: string;
  metadata?: {
    loudness: number;
    peakLevel: number;
    dynamicRange: number;
    processingTime: number;
  };
}

export interface DolbyAnalysisResult {
  loudness: number;
  peakLevel: number;
  dynamicRange: number;
  spectralContent: number[];
}

class MockDolbyClient {
  async analyze(audioUrl: string): Promise<DolbyAnalysisResult> {
    console.log('MOCK: Analyzing audio file:', audioUrl);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock analysis data
    return {
      loudness: -14,
      peakLevel: -1.2,
      dynamicRange: 12,
      spectralContent: Array(100).fill(0).map(() => Math.random() * 100)
    };
  }
  
  async process(audioUrl: string, options: DolbyProcessingOptions): Promise<DolbyProcessingResult> {
    console.log('MOCK: Processing audio file:', audioUrl);
    console.log('MOCK: Processing options:', options);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock processing result
    return {
      url: \`\${audioUrl.split('.')[0]}_processed.wav\`,
      metadata: {
        loudness: options.targetLoudness || -14,
        peakLevel: -0.1,
        dynamicRange: 8,
        processingTime: 2.1
      }
    };
  }
}

export function createClient(apiKey?: string, apiSecret?: string) {
  console.warn('Using mock Dolby.io client implementation');
  return new MockDolbyClient();
}
`;
  
  fs.writeFileSync(mockDolbyPath, mockDolbyContent);
  log('Created mock Dolby.io implementation', colors.fg.green);
  
  // Create index file to export the mock
  const indexPath = path.join(mockDolbyDir, 'index.ts');
  const indexContent = `export * from './MockDolbyService';
`;
  
  fs.writeFileSync(indexPath, indexContent);
  log('Created mock index file', colors.fg.green);
}

// Create .env file with placeholder values
function createEnvFile() {
  logSection('Creating Environment File');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your-database-url

# Dolby.io API Configuration
EXPO_PUBLIC_DOLBY_API_KEY=your-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=your-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=true
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14
`;
  
  if (!fs.existsSync(envPath)) {
    log('Creating .env file with placeholder values', colors.fg.yellow);
    fs.writeFileSync(envPath, envContent);
    log('Created .env file. Please update with your actual values.', colors.fg.green);
  } else {
    log('.env file already exists. Skipping creation.', colors.fg.green);
  }
}

// Update package.json scripts
function updatePackageScripts() {
  logSection('Updating Package Scripts');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let packageJson;
  
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    log('Failed to read package.json', colors.fg.red);
    return false;
  }
  
  // Add or update scripts
  const newScripts = {
    'test:audio': 'jest --testPathPattern="services/audio|models/audio"',
    'verify:audio': 'ts-node scripts/verify-audio-processing.ts',
    'setup:audio': 'node scripts/setup-audio-processing.js',
    'ci:audio': 'node .github/workflows/run-audio-ci.js'
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...newScripts };
  
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('Updated package.json scripts', colors.fg.green);
    return true;
  } catch (error) {
    log('Failed to update package.json', colors.fg.red);
    return false;
  }
}

// Create a script to run the CI workflow locally
function createCIRunnerScript() {
  logSection('Creating CI Runner Script');
  
  const ciDir = path.join(process.cwd(), '.github/workflows');
  if (!fs.existsSync(ciDir)) {
    fs.mkdirSync(ciDir, { recursive: true });
  }
  
  const ciRunnerPath = path.join(ciDir, 'run-audio-ci.js');
  const ciRunnerContent = `/**
 * Local CI Runner for Audio Processing
 * 
 * This script simulates the CI workflow locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\\n=== Running Audio Processing CI Workflow Locally ===\\n');

// Run linting
console.log('\\n=== Step 1: Linting ===\\n');
try {
  execSync('npx eslint services/audio models/audio components/audio screens/StudioScreen.tsx', { stdio: 'inherit' });
  console.log('\\n✅ Linting passed\\n');
} catch (error) {
  console.error('\\n❌ Linting failed\\n');
  process.exit(1);
}

// Run tests
console.log('\\n=== Step 2: Running Tests ===\\n');
try {
  execSync('npm run test:audio', { stdio: 'inherit' });
  console.log('\\n✅ Tests passed\\n');
} catch (error) {
  console.error('\\n❌ Tests failed\\n');
  process.exit(1);
}

// Create test audio file
console.log('\\n=== Step 3: Creating Test Audio ===\\n');
try {
  if (!fs.existsSync('test-assets')) {
    fs.mkdirSync('test-assets', { recursive: true });
  }
  
  // Check if audiobuffer-to-wav is installed
  try {
    execSync('npx audiobuffer-to-wav --help', { stdio: 'ignore' });
    execSync('npx audiobuffer-to-wav --frequency 440 --duration 3 --output test-assets/test-tone.wav', { stdio: 'inherit' });
  } catch (e) {
    console.log('audiobuffer-to-wav not available, creating empty test file');
    fs.writeFileSync('test-assets/test-tone.wav', Buffer.alloc(1000));
  }
  
  console.log('\\n✅ Test audio created\\n');
} catch (error) {
  console.error('\\n❌ Failed to create test audio\\n');
  console.error(error);
  // Continue anyway
}

// Run verification script
console.log('\\n=== Step 4: Running Verification Script ===\\n');
try {
  if (fs.existsSync('scripts/verify-audio-processing.ts')) {
    execSync('npx ts-node scripts/verify-audio-processing.ts test-assets/test-tone.wav', { stdio: 'inherit' });
    console.log('\\n✅ Verification passed\\n');
  } else {
    console.log('\\n⚠️ Verification script not found, skipping\\n');
  }
} catch (error) {
  console.error('\\n❌ Verification failed\\n');
  console.error(error);
  process.exit(1);
}

console.log('\\n=== CI Workflow Completed Successfully ===\\n');
`;
  
  fs.writeFileSync(ciRunnerPath, ciRunnerContent);
  log('Created CI runner script', colors.fg.green);
}

// Main function
async function main() {
  logSection('Audio Processing Setup');
  
  log('Setting up audio processing system...', colors.fg.yellow);
  
  // Create directories
  createDirectories();
  
  // Install dependencies
  if (!installDependencies()) {
    log('Setup failed at dependency installation step', colors.fg.red);
    process.exit(1);
  }
  
  // Create mock Dolby implementation
  createMockDolbyImplementation();
  
  // Create .env file
  createEnvFile();
  
  // Update package.json scripts
  if (!updatePackageScripts()) {
    log('Setup failed at package.json update step', colors.fg.red);
    process.exit(1);
  }
  
  // Create CI runner script
  createCIRunnerScript();
  
  logSection('Setup Complete');
  log('Audio processing system setup completed successfully!', colors.fg.green);
  log('Next steps:', colors.fg.yellow);
  log('1. Update the .env file with your actual API keys', colors.fg.white);
  log('2. Run tests with: npm run test:audio', colors.fg.white);
  log('3. Verify audio processing with: npm run verify:audio <path-to-audio-file>', colors.fg.white);
  log('4. Run the CI workflow locally with: npm run ci:audio', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 