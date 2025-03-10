/**
 * Fix Navigation Paths Script
 * 
 * This script fixes invalid navigation paths in the codebase.
 * It looks for router.push calls with invalid paths and replaces them with the correct paths.
 */

const fs = require('fs');
const path = require('path');

// Define the paths that need to be fixed
const pathsToFix = [
  { file: '/app/(auth)/login.tsx', line: 177, oldPath: '/signup', newPath: '/(auth)/signup' },
  { file: '/app/(auth)/login.tsx', line: 285, oldPath: '/fan-hub', newPath: '/chat/fan-hub' },
  { file: '/app/(tabs)/index.tsx', line: 148, oldPath: '/profile/1', newPath: '/(tabs)/profile/1' },
  { file: '/app/(tabs)/index.tsx', line: 224, oldPath: '/community', newPath: '/chat/community' },
  { file: '/app/(tabs)/index.tsx', line: 238, oldPath: '/fan-hub', newPath: '/chat/fan-hub' },
  { file: '/app/(tabs)/profile.tsx', line: 172, oldPath: '/profile/edit', newPath: '/(tabs)/profile/edit' },
  { file: '/app/(tabs)/profile.tsx', line: 180, oldPath: '/profile/settings', newPath: '/(tabs)/profile/settings' },
  { file: '/app/admin/verification-test.tsx', line: 94, oldPath: '/(tabs)/admin-verification', newPath: '/admin/verification' },
  { file: '/app/chat/chat.tsx', line: 152, oldPath: '/chat/new-group', newPath: '/chat/new-group' },
  { file: '/app/chat/fan-hub.tsx', line: 172, oldPath: '/search', newPath: '/search' },
  { file: '/app/chat/index.tsx', line: 52, oldPath: '/chat/new-group', newPath: '/chat/new-group' },
  { file: '/app/profile-default.tsx', line: 68, oldPath: '/onboarding/athlete', newPath: '/onboarding/athlete' },
  { file: '/app/profile-default.tsx', line: 74, oldPath: '/onboarding/fan', newPath: '/onboarding/fan' },
  { file: '/app/studio/recordings.tsx', line: 91, oldPath: '/login', newPath: '/(auth)/login' },
  { file: '/app/studio/recordings.tsx', line: 98, oldPath: '/athlete-signup', newPath: '/(auth)/athlete-signup' },
  { file: '/app/studio/recordings.tsx', line: 117, oldPath: '/athlete-signup', newPath: '/(auth)/athlete-signup' },
  { file: '/app/studio/save-processed-audio.tsx', line: 142, oldPath: '/home', newPath: '/' }
];

// Function to fix a single file
function fixFile(filePath, fixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return false;
  }
  
  // Read file content
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Apply fixes
  for (const fix of fixes) {
    // Create a regex to match router.push with the old path
    const regex = new RegExp(`router\\.push\\(['"](${fix.oldPath})['"]\\)`, 'g');
    
    // Replace with the new path
    const newContent = content.replace(regex, `router.push('${fix.newPath}')`);
    
    // Check if content was modified
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`Fixed navigation path in ${filePath}: ${fix.oldPath} -> ${fix.newPath}`);
    }
  }
  
  // Save file if modified
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Group fixes by file
const fixesByFile = {};
for (const fix of pathsToFix) {
  if (!fixesByFile[fix.file]) {
    fixesByFile[fix.file] = [];
  }
  fixesByFile[fix.file].push(fix);
}

// Fix each file
let totalFixed = 0;
for (const [file, fixes] of Object.entries(fixesByFile)) {
  if (fixFile(file, fixes)) {
    totalFixed++;
  }
}

console.log(`Fixed navigation paths in ${totalFixed} files.`); 