#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting final codebase cleanup...');

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, 'app');
const studioDir = path.join(appDir, 'studio');
const chatDir = path.join(appDir, 'chat');
const authDir = path.join(appDir, '(auth)');
const paymentDir = path.join(appDir, 'payment');

// 1. Fix naming inconsistencies in chat directory
console.log('\n🔧 Fixing naming inconsistencies in chat directory...');

// Files to rename (old name -> new name)
const chatFilesToRename = [
  { oldName: 'ChatScreen.tsx', newName: 'chat-screen.tsx' },
  { oldName: 'ConversationScreen.tsx', newName: 'conversation-screen.tsx' },
  { oldName: 'NewConversationScreen.tsx', newName: 'new-conversation-screen.tsx' }
];

let renamedCount = 0;

for (const { oldName, newName } of chatFilesToRename) {
  const oldPath = path.join(chatDir, oldName);
  const newPath = path.join(chatDir, newName);
  
  if (fs.existsSync(oldPath)) {
    // Check if the destination already exists
    if (fs.existsSync(newPath)) {
      // Compare file sizes
      const oldStat = fs.statSync(oldPath);
      const newStat = fs.statSync(newPath);
      
      if (oldStat.size > newStat.size) {
        // Old file is larger, replace the new one
        fs.unlinkSync(newPath);
        fs.renameSync(oldPath, newPath);
        console.log(`Replaced smaller file: ${path.relative(projectRoot, newPath)}`);
        renamedCount++;
      } else {
        // New file is larger or same size, delete the old one
        fs.unlinkSync(oldPath);
        console.log(`Deleted smaller duplicate: ${path.relative(projectRoot, oldPath)}`);
        renamedCount++;
      }
    } else {
      // Rename the file
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${path.relative(projectRoot, oldPath)} -> ${path.relative(projectRoot, newPath)}`);
      renamedCount++;
    }
  }
}

console.log(`✅ Renamed ${renamedCount} files in chat directory`);

// 2. Move chat-related files from studio to chat directory
console.log('\n🔄 Moving chat-related files from studio to chat directory...');

// Files to move from studio to chat
const filesToMove = [
  { source: 'chat.tsx', destination: 'chat.tsx' },
  { source: 'conversation.tsx', destination: 'conversation.tsx' },
  { source: 'new-group-chat.tsx', destination: 'new-group-chat.tsx' },
  { source: 'create-premium-group.tsx', destination: 'create-premium-group.tsx' },
  { source: 'add-group-members.tsx', destination: 'add-group-members.tsx' }
];

let movedCount = 0;

for (const { source, destination } of filesToMove) {
  const sourcePath = path.join(studioDir, source);
  const destPath = path.join(chatDir, destination);
  
  if (fs.existsSync(sourcePath)) {
    // Check if the destination already exists
    if (fs.existsSync(destPath)) {
      // Compare file sizes
      const sourceStat = fs.statSync(sourcePath);
      const destStat = fs.statSync(destPath);
      
      if (sourceStat.size > destStat.size) {
        // Source file is larger, replace the destination
        fs.unlinkSync(destPath);
        fs.copyFileSync(sourcePath, destPath);
        fs.unlinkSync(sourcePath);
        console.log(`Replaced smaller file: ${path.relative(projectRoot, destPath)}`);
        movedCount++;
      } else {
        // Destination file is larger or same size, delete the source
        fs.unlinkSync(sourcePath);
        console.log(`Kept larger file: ${path.relative(projectRoot, destPath)}`);
        movedCount++;
      }
    } else {
      // Move the file
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
      console.log(`Moved: ${path.relative(projectRoot, sourcePath)} -> ${path.relative(projectRoot, destPath)}`);
      movedCount++;
    }
  }
}

console.log(`✅ Moved ${movedCount} chat-related files from studio to chat directory`);

// 3. Move payment-related files from studio to payment directory
console.log('\n🔄 Moving payment-related files from studio to payment directory...');

// Files to move from studio to payment
const paymentFilesToMove = [
  { source: 'subscription.tsx', destination: 'subscription.tsx' }
];

let movedPaymentCount = 0;

for (const { source, destination } of paymentFilesToMove) {
  const sourcePath = path.join(studioDir, source);
  const destPath = path.join(paymentDir, destination);
  
  if (fs.existsSync(sourcePath)) {
    // Check if the destination already exists
    if (fs.existsSync(destPath)) {
      // Compare file sizes
      const sourceStat = fs.statSync(sourcePath);
      const destStat = fs.statSync(destPath);
      
      if (sourceStat.size > destStat.size) {
        // Source file is larger, replace the destination
        fs.unlinkSync(destPath);
        fs.copyFileSync(sourcePath, destPath);
        fs.unlinkSync(sourcePath);
        console.log(`Replaced smaller file: ${path.relative(projectRoot, destPath)}`);
        movedPaymentCount++;
      } else {
        // Destination file is larger or same size, delete the source
        fs.unlinkSync(sourcePath);
        console.log(`Kept larger file: ${path.relative(projectRoot, destPath)}`);
        movedPaymentCount++;
      }
    } else {
      // Move the file
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
      console.log(`Moved: ${path.relative(projectRoot, sourcePath)} -> ${path.relative(projectRoot, destPath)}`);
      movedPaymentCount++;
    }
  }
}

console.log(`✅ Moved ${movedPaymentCount} payment-related files from studio to payment directory`);

// 4. Move auth-related files from chat to auth directory
console.log('\n🔄 Moving auth-related files from chat to auth directory...');

// Files to move from chat to auth
const authFilesToMove = [
  { source: 'login.tsx', destination: 'login.tsx' }
];

let movedAuthCount = 0;

for (const { source, destination } of authFilesToMove) {
  const sourcePath = path.join(chatDir, source);
  const destPath = path.join(authDir, destination);
  
  if (fs.existsSync(sourcePath)) {
    // Check if the destination already exists
    if (fs.existsSync(destPath)) {
      // Compare file sizes
      const sourceStat = fs.statSync(sourcePath);
      const destStat = fs.statSync(destPath);
      
      if (sourceStat.size > destStat.size) {
        // Source file is larger, replace the destination
        fs.unlinkSync(destPath);
        fs.copyFileSync(sourcePath, destPath);
        fs.unlinkSync(sourcePath);
        console.log(`Replaced smaller file: ${path.relative(projectRoot, destPath)}`);
        movedAuthCount++;
      } else {
        // Destination file is larger or same size, delete the source
        fs.unlinkSync(sourcePath);
        console.log(`Kept larger file: ${path.relative(projectRoot, destPath)}`);
        movedAuthCount++;
      }
    } else {
      // Move the file
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
      console.log(`Moved: ${path.relative(projectRoot, sourcePath)} -> ${path.relative(projectRoot, destPath)}`);
      movedAuthCount++;
    }
  }
}

console.log(`✅ Moved ${movedAuthCount} auth-related files from chat to auth directory`);

// 5. Clean up duplicate files in app directory
console.log('\n🔍 Cleaning up duplicate files in app directory...');

// Files to check for duplicates (root app directory vs subdirectories)
const filesToCheck = [
  { rootFile: 'audio-mastering.tsx', subFile: 'studio/audio-mastering.tsx' },
  { rootFile: 'batch-processing.tsx', subFile: 'studio/batch-processing.tsx' },
  { rootFile: 'dolby-demo.tsx', subFile: 'studio/dolby-demo.tsx' },
  { rootFile: 'save-processed-audio.tsx', subFile: 'studio/save-processed-audio.tsx' },
  { rootFile: 'shared-tracks.tsx', subFile: 'studio/shared-tracks.tsx' },
  { rootFile: 'vocal-isolation.tsx', subFile: 'studio/vocal-isolation.tsx' },
  { rootFile: 'TestScreen.tsx', subFile: 'studio/test.tsx' }
];

let cleanedCount = 0;

for (const { rootFile, subFile } of filesToCheck) {
  const rootPath = path.join(appDir, rootFile);
  const subPath = path.join(appDir, subFile);
  
  if (fs.existsSync(rootPath) && fs.existsSync(subPath)) {
    // Compare file sizes
    const rootStat = fs.statSync(rootPath);
    const subStat = fs.statSync(subPath);
    
    if (rootStat.size > subStat.size) {
      // Root file is larger, replace the sub file
      fs.unlinkSync(subPath);
      fs.copyFileSync(rootPath, subPath);
      fs.unlinkSync(rootPath);
      console.log(`Replaced smaller file: ${path.relative(projectRoot, subPath)}`);
      cleanedCount++;
    } else {
      // Sub file is larger or same size, delete the root file
      fs.unlinkSync(rootPath);
      console.log(`Deleted duplicate: ${path.relative(projectRoot, rootPath)}`);
      cleanedCount++;
    }
  }
}

console.log(`✅ Cleaned up ${cleanedCount} duplicate files in app directory`);

// 6. Clean up duplicate files in studio directory
console.log('\n🔍 Cleaning up duplicate files in studio directory...');

// Files to check for duplicates in studio directory
const studioFilesToCheck = [
  { file1: 'dolby.tsx', file2: 'dolby-demo.tsx' },
  { file1: 'batch.tsx', file2: 'batch-processing.tsx' }
];

let cleanedStudioCount = 0;

for (const { file1, file2 } of studioFilesToCheck) {
  const path1 = path.join(studioDir, file1);
  const path2 = path.join(studioDir, file2);
  
  if (fs.existsSync(path1) && fs.existsSync(path2)) {
    // Compare file sizes
    const stat1 = fs.statSync(path1);
    const stat2 = fs.statSync(path2);
    
    if (stat1.size > stat2.size) {
      // File1 is larger, replace file2
      fs.unlinkSync(path2);
      fs.renameSync(path1, path2);
      console.log(`Replaced smaller file: ${path.relative(projectRoot, path2)}`);
      cleanedStudioCount++;
    } else {
      // File2 is larger or same size, delete file1
      fs.unlinkSync(path1);
      console.log(`Deleted duplicate: ${path.relative(projectRoot, path1)}`);
      cleanedStudioCount++;
    }
  }
}

console.log(`✅ Cleaned up ${cleanedStudioCount} duplicate files in studio directory`);

// 7. Clean up duplicate files in chat directory
console.log('\n🔍 Cleaning up duplicate files in chat directory...');

// Files to check for duplicates in chat directory
const chatFilesToCheck = [
  { file1: 'new-group.tsx', file2: 'new-group-chat.tsx' },
  { file1: 'add-members.tsx', file2: 'add-group-members.tsx' }
];

let cleanedChatCount = 0;

for (const { file1, file2 } of chatFilesToCheck) {
  const path1 = path.join(chatDir, file1);
  const path2 = path.join(chatDir, file2);
  
  if (fs.existsSync(path1) && fs.existsSync(path2)) {
    // Compare file sizes
    const stat1 = fs.statSync(path1);
    const stat2 = fs.statSync(path2);
    
    if (stat1.size > stat2.size) {
      // File1 is larger, replace file2
      fs.unlinkSync(path2);
      fs.renameSync(path1, path2);
      console.log(`Replaced smaller file: ${path.relative(projectRoot, path2)}`);
      cleanedChatCount++;
    } else {
      // File2 is larger or same size, delete file1
      fs.unlinkSync(path1);
      console.log(`Deleted duplicate: ${path.relative(projectRoot, path1)}`);
      cleanedChatCount++;
    }
  }
}

console.log(`✅ Cleaned up ${cleanedChatCount} duplicate files in chat directory`);

console.log('\n🎉 Final codebase cleanup complete!');
console.log(`
Summary:
- Renamed ${renamedCount} files in chat directory
- Moved ${movedCount} chat-related files from studio to chat directory
- Moved ${movedPaymentCount} payment-related files from studio to payment directory
- Moved ${movedAuthCount} auth-related files from chat to auth directory
- Cleaned up ${cleanedCount} duplicate files in app directory
- Cleaned up ${cleanedStudioCount} duplicate files in studio directory
- Cleaned up ${cleanedChatCount} duplicate files in chat directory
`);

// Suggest next steps
console.log('Next steps:');
console.log('1. Run the app to ensure all features work correctly');
console.log('2. Update import statements if needed');
console.log('3. Run comprehensive tests as outlined in the TESTING-PLAN.md file'); 