/**
 * Script to deploy chat features to Firebase for testing
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

const CHAT_VERSION = '1.1.0';
const CHANNEL_NAME = `chat-features-${Date.now()}`;

async function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return stdout;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function createPreviewChannelConfig() {
  const configPath = path.join(__dirname, '../firebase.json');
  const config = JSON.parse(await readFileAsync(configPath, 'utf8'));
  
  // Ensure chat features are included in deployment
  if (!config.hosting?.rewrites) {
    throw new Error('Invalid firebase.json: missing rewrites configuration');
  }
  
  // Add cache busting for app.json to ensure fresh configuration
  if (!config.hosting.headers) {
    config.hosting.headers = [];
  }
  
  // Add header for app.json to prevent caching
  const hasAppJsonHeader = config.hosting.headers.some(
    (header) => header.source === '/app.json'
  );
  
  if (!hasAppJsonHeader) {
    config.hosting.headers.push({
      source: '/app.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate'
        }
      ]
    });
  }
  
  await writeFileAsync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('Updated Firebase config to ensure no caching for app.json');
}

async function updateAppConfig() {
  const appConfigPath = path.join(__dirname, '../app.json');
  const appConfig = JSON.parse(await readFileAsync(appConfigPath, 'utf8'));
  
  // Update version info
  appConfig.version = CHAT_VERSION;
  appConfig.extra = {
    ...appConfig.extra,
    chatFeaturesEnabled: true,
    premiumGroupsEnabled: true,
    lastUpdated: new Date().toISOString()
  };
  
  await writeFileAsync(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf8');
  console.log(`Updated app.json with chat version ${CHAT_VERSION}`);
}

async function deployToFirebase() {
  try {
    // Update configurations
    await createPreviewChannelConfig();
    await updateAppConfig();
    
    // Build for web
    await runCommand('npm run build:web');
    
    // Deploy Firestore rules
    await runCommand('firebase deploy --only firestore:rules');
    
    // Deploy Storage rules
    await runCommand('firebase deploy --only storage:rules');
    
    // Deploy to a preview channel
    await runCommand(`firebase hosting:channel:deploy ${CHANNEL_NAME} --expires 7d`);
    
    console.log('\n========================================');
    console.log(`🎉 Chat features deployed to preview channel: ${CHANNEL_NAME}`);
    console.log('The preview URL should be displayed above.');
    console.log('This channel will expire after 7 days.');
    console.log('========================================\n');
    
    console.log('To deploy to production:');
    console.log('  npm run deploy');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deployToFirebase(); 