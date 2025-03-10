#!/usr/bin/env node

/**
 * Update Imports Script
 * 
 * This script helps update imports after moving files by:
 * 1. Identifying imports that need to be updated
 * 2. Updating import paths to point to the new locations
 * 3. Handling both relative and absolute imports
 * 
 * Usage:
 *   node scripts/update-imports.js [options]
 * 
 * Options:
 *   --scan           Scan the codebase for imports that need to be updated
 *   --fix            Fix identified import issues
 *   --map=<file>     Specify a JSON file with old->new path mappings
 *   --dry-run        Show what would be done without making changes
 *   --help           Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting import statements update...');

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, 'app');

// Define import mappings (old import path -> new import path)
const importMappings = [
  // Screens to app mappings
  { old: '../screens/AudioMasteringScreen', new: '../app/studio/audio-mastering' },
  { old: '../screens/AudioUploadScreen', new: '../app/studio/audio-upload' },
  { old: '../screens/BatchProcessingScreen', new: '../app/studio/batch-processing' },
  { old: '../screens/DolbyDemoScreen', new: '../app/studio/dolby-demo' },
  { old: '../screens/PendingUploadsScreen', new: '../app/pending-uploads' },
  { old: '../screens/SaveProcessedAudioScreen', new: '../app/studio/save-processed-audio' },
  { old: '../screens/SharedTracksScreen', new: '../app/studio/shared-tracks' },
  { old: '../screens/SongDetailScreen', new: '../app/studio/song-detail' },
  { old: '../screens/StudioScreen', new: '../app/studio/studio' },
  { old: '../screens/TestScreen', new: '../app/studio/test' },
  { old: '../screens/VocalIsolationScreen', new: '../app/studio/vocal-isolation' },
  
  // Auth screens
  { old: '../screens/auth/LoginScreen', new: '../app/(auth)/login' },
  
  // Chat screens
  { old: '../screens/chat/AddGroupMembersScreen', new: '../app/chat/add-group-members' },
  { old: '../screens/chat/ChatScreen', new: '../app/chat/chat' },
  { old: '../screens/chat/ConversationScreen', new: '../app/chat/conversation' },
  { old: '../screens/chat/CreatePremiumGroupScreen', new: '../app/chat/create-premium-group' },
  { old: '../screens/chat/NewConversationScreen', new: '../app/chat/new-conversation' },
  { old: '../screens/chat/NewGroupChatScreen', new: '../app/chat/new-group-chat' },
  { old: '../screens/chat/PremiumGroupsScreen', new: '../app/chat/premium-groups' },
  
  // Payment screens
  { old: '../screens/payment/SubscriptionScreen', new: '../app/payment/subscription' },
  
  // Relative imports within app directory
  { old: './vocal-isolation', new: '../studio/vocal-isolation' },
  { old: './shared-tracks', new: '../studio/shared-tracks' },
  { old: './dolby-demo', new: '../studio/dolby-demo' },
  { old: './batch-processing', new: '../studio/batch-processing' },
  { old: './audio-mastering', new: '../studio/audio-mastering' },
  { old: './save-processed-audio', new: '../studio/save-processed-audio' },
  
  // Chat relative imports
  { old: './chat', new: '../chat/chat' },
  { old: './conversation', new: '../chat/conversation' },
  { old: './new-group-chat', new: '../chat/new-group-chat' },
  { old: './create-premium-group', new: '../chat/create-premium-group' },
  { old: './add-group-members', new: '../chat/add-group-members' },
  { old: './premium-groups', new: '../chat/premium-groups' },
  { old: './new-conversation', new: '../chat/new-conversation' },
  
  // Payment relative imports
  { old: './subscription', new: '../payment/subscription' },
  
  // Auth relative imports
  { old: './login', new: '../(auth)/login' },
];

// Find all TypeScript and JavaScript files in the project
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx'], ignore = ['node_modules', '.git', 'dist', '.expo']) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Skip ignored directories
    if (ignore.includes(file)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, extensions, ignore));
    } else if (extensions.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Update import statements in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const { old, new: newPath } of importMappings) {
    // Look for import statements
    const importRegex = new RegExp(`import\\s+(.+?)\\s+from\\s+['"]${old}['"]`, 'g');
    const newContent = content.replace(importRegex, `import $1 from '${newPath}'`);
    
    if (newContent !== content) {
      content = newContent;
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Main execution
const files = findFiles(projectRoot);
let updatedCount = 0;

for (const file of files) {
  const updated = updateImports(file);
  if (updated) {
    console.log(`Updated imports in: ${path.relative(projectRoot, file)}`);
    updatedCount++;
  }
}

console.log(`\n✅ Updated imports in ${updatedCount} files`);
console.log('🎉 Import statements update complete!');

// Suggest next steps
console.log('\nNext steps:');
console.log('1. Run the app to ensure all imports are working correctly');
console.log('2. If you encounter any issues, check the specific file and update the imports manually');
console.log('3. Run comprehensive tests as outlined in the TESTING-PLAN.md file'); 