/**
 * Documentation Cleanup Script
 * 
 * This script removes duplicate documentation files that have been consolidated
 * into the main README.md file.
 */

const fs = require('fs');
const path = require('path');

// List of documentation files to be removed
const filesToRemove = [
  'README-CHAT-IMPLEMENTATION.md',
  'IMPLEMENTATION_SUMMARY.md',
  'CHAT_IMPLEMENTATION_SUMMARY.md',
  'README-ERROR-HANDLING.md',
  'RECOVERY_REPORT.md',
  'APP_RECOVERY_GUIDE.md',
  'NAVIGATION_FIX_REPORT.md',
  'DEPLOYMENT_SUMMARY.md',
  'README-PREMIUM-CHAT.md',
  'README-CHAT-TESTING.md',
  'README-CHAT.md',
  'FIREBASE_IMPLEMENTATION_GUIDE.md',
  'FIREBASE_TESTING_GUIDE.md',
  'TESTING_GUIDE.md',
  'AUTHENTICATION_GUIDE.md',
  'AUDIO_PROCESSING_GUIDE.md',
  'FIREBASE_INTEGRATION_GUIDE.md',
  'DEVELOPMENT_LOG.md',
  'development_plan.md',
  'DOLBY_API_GUIDE.md',
  'TESTING.md',
  'DAW_STUDIO_FIXES.md',
  'DAW_STUDIO_GUIDE.md',
  'typescript-errors-report.md',
  'USAGE_GUIDE.md',
  'ATHLETE_FEATURES.md',
  'DEBUG_GUIDE.md',
  'FEATURE_REQUESTS.md',
];

// Archive directory for keeping backups
const archiveDir = path.join(__dirname, '..', 'docs', 'archive');

// Create archive directory if it doesn't exist
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
  console.log(`Created archive directory: ${archiveDir}`);
}

// Process each file
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    try {
      // Create a backup in the archive directory
      const backupPath = path.join(archiveDir, file);
      fs.copyFileSync(filePath, backupPath);
      console.log(`Backed up ${file} to ${backupPath}`);
      
      // Remove the original file
      fs.unlinkSync(filePath);
      console.log(`Removed ${file}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Documentation cleanup complete!');
console.log(`Backup files are stored in: ${archiveDir}`);
console.log('All documentation has been consolidated into README.md'); 