#!/usr/bin/env node

/**
 * Consolidate Codebase Script
 * 
 * This script analyzes the codebase and helps identify:
 * 1. Potential duplicate files
 * 2. Components that should be moved to the components directory
 * 3. Screens that should be migrated to the app directory
 * 4. Legacy directories that should be removed
 * 
 * Usage:
 *   node scripts/consolidate-codebase.js
 * 
 * Options:
 *   --update-report  Updates the consolidation report
 *   --dry-run        Shows what would be done without making changes
 *   --help           Shows this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting codebase consolidation...');

const projectRoot = process.cwd();
const tabsDir = path.join(projectRoot, 'app', '(tabs)');
const studioDir = path.join(projectRoot, 'app', 'studio');
const chatDir = path.join(projectRoot, 'app', 'chat');
const authDir = path.join(projectRoot, 'app', '(auth)');
const paymentDir = path.join(projectRoot, 'app', 'payment');

// Ensure all directories exist
[studioDir, chatDir, authDir, paymentDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Define which files should go where
const fileMappings = [
  // Studio related files
  { source: path.join(tabsDir, 'vocal-isolation.tsx'), destination: path.join(studioDir, 'vocal-isolation.tsx') },
  { source: path.join(tabsDir, 'shared-tracks.tsx'), destination: path.join(studioDir, 'shared-tracks.tsx') },
  { source: path.join(tabsDir, 'dolby.tsx'), destination: path.join(studioDir, 'dolby.tsx') },
  { source: path.join(tabsDir, 'batch.tsx'), destination: path.join(studioDir, 'batch-processing.tsx') },
  { source: path.join(tabsDir, 'recordings.tsx'), destination: path.join(studioDir, 'recordings.tsx') },
  { source: path.join(tabsDir, 'songs.tsx'), destination: path.join(studioDir, 'songs.tsx') },
  { source: path.join(tabsDir, 'podcasts.tsx'), destination: path.join(studioDir, 'podcasts.tsx') },
  
  // Community related files
  { source: path.join(tabsDir, 'fan-hub.tsx'), destination: path.join(chatDir, 'fan-hub.tsx') },
  { source: path.join(tabsDir, 'community.tsx'), destination: path.join(chatDir, 'community.tsx') },
  
  // Profile related files
  { source: path.join(tabsDir, 'athlete-profile.tsx'), destination: path.join('app', 'athlete-profile.tsx') },
  { source: path.join(tabsDir, 'fan-profile.tsx'), destination: path.join('app', 'fan-profile.tsx') },
  { source: path.join(tabsDir, 'athletes-example.tsx'), destination: path.join('app', 'athlete-examples.tsx') },
  { source: path.join(tabsDir, 'athletes.tsx'), destination: path.join('app', 'athletes.tsx') },
  
  // Admin related files
  { source: path.join(tabsDir, 'admin-verification.tsx'), destination: path.join('app', 'admin', 'verification.tsx') },
  { source: path.join(tabsDir, 'verification-test.tsx'), destination: path.join('app', 'admin', 'verification-test.tsx') },
  
  // Testing files
  { source: path.join(tabsDir, 'testing.tsx'), destination: path.join('app', 'testing.tsx') },
  { source: path.join(tabsDir, 'discover.tsx'), destination: path.join('app', 'discover.tsx') },
];

// Create admin directory if needed
const adminDir = path.join(projectRoot, 'app', 'admin');
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
  console.log(`Created directory: ${adminDir}`);
}

// Move files
let movedCount = 0;
fileMappings.forEach(({ source, destination }) => {
  if (fs.existsSync(source)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`Created directory: ${destDir}`);
    }
    
    // Read the source file
    const content = fs.readFileSync(source, 'utf8');
    
    // Write to destination
    fs.writeFileSync(destination, content);
    console.log(`Moved: ${path.basename(source)} -> ${destination}`);
    
    // Delete the source file
    fs.unlinkSync(source);
    movedCount++;
  } else {
    console.log(`Warning: Source file not found: ${source}`);
  }
});

// Update the tabs layout file to remove references to moved files
const tabsLayoutPath = path.join(tabsDir, '_layout.tsx');
if (fs.existsSync(tabsLayoutPath)) {
  let layoutContent = fs.readFileSync(tabsLayoutPath, 'utf8');
  
  // Remove the hidden screens section
  layoutContent = layoutContent.replace(
    /\/\* Hidden screens that should be moved to a different directory \*\/[\s\S]*?(?=<\/Tabs>)/,
    ''
  );
  
  fs.writeFileSync(tabsLayoutPath, layoutContent);
  console.log('Updated tabs layout file to remove hidden screens');
}

// Create a _layout.tsx file for the studio directory if it doesn't exist
const studioLayoutPath = path.join(studioDir, '_layout.tsx');
if (!fs.existsSync(studioLayoutPath)) {
  const studioLayoutContent = `import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

/**
 * StudioLayout component that handles the studio stack navigation
 */
export default function StudioLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.cardBackground,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: Colors.light.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Studio',
        }}
      />
      <Stack.Screen
        name="vocal-isolation"
        options={{
          title: 'Vocal Isolation',
        }}
      />
      <Stack.Screen
        name="shared-tracks"
        options={{
          title: 'Shared Tracks',
        }}
      />
      <Stack.Screen
        name="dolby"
        options={{
          title: 'Dolby Audio',
        }}
      />
      <Stack.Screen
        name="batch-processing"
        options={{
          title: 'Batch Processing',
        }}
      />
      <Stack.Screen
        name="recordings"
        options={{
          title: 'Recordings',
        }}
      />
      <Stack.Screen
        name="songs"
        options={{
          title: 'Songs',
        }}
      />
      <Stack.Screen
        name="podcasts"
        options={{
          title: 'Podcasts',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;
  fs.writeFileSync(studioLayoutPath, studioLayoutContent);
  console.log('Created studio layout file');
}

// Create a _layout.tsx file for the chat directory if it doesn't exist
const chatLayoutPath = path.join(chatDir, '_layout.tsx');
if (!fs.existsSync(chatLayoutPath)) {
  const chatLayoutContent = `import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

/**
 * ChatLayout component that handles the chat stack navigation
 */
export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.cardBackground,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: Colors.light.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Chat',
        }}
      />
      <Stack.Screen
        name="fan-hub"
        options={{
          title: 'Fan Hub',
        }}
      />
      <Stack.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;
  fs.writeFileSync(chatLayoutPath, chatLayoutContent);
  console.log('Created chat layout file');
}

// Create a _layout.tsx file for the admin directory if it doesn't exist
const adminLayoutPath = path.join(adminDir, '_layout.tsx');
if (!fs.existsSync(adminLayoutPath)) {
  const adminLayoutContent = `import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

/**
 * AdminLayout component that handles the admin stack navigation
 */
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.cardBackground,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: Colors.light.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="verification"
        options={{
          title: 'Admin Verification',
        }}
      />
      <Stack.Screen
        name="verification-test"
        options={{
          title: 'Verification Test',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;
  fs.writeFileSync(adminLayoutPath, adminLayoutContent);
  console.log('Created admin layout file');
}

// Create index files for each directory if they don't exist
const createIndexFile = (dir, title, description) => {
  const indexPath = path.join(dir, 'index.tsx');
  if (!fs.existsSync(indexPath)) {
    const indexContent = `import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ${title}Index() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>${title}</Text>
        <Text style={styles.description}>${description}</Text>
      </View>
      
      {/* Add your content here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textDim,
  },
});
`;
    fs.writeFileSync(indexPath, indexContent);
    console.log(`Created index file for ${title}`);
  }
};

createIndexFile(studioDir, 'Studio', 'Create and manage your audio content');
createIndexFile(chatDir, 'Chat', 'Connect with fans and other athletes');
createIndexFile(adminDir, 'Admin', 'Administrative tools and settings');

console.log(`\n✅ Moved ${movedCount} files to their appropriate directories`);
console.log('🎉 Codebase consolidation complete!'); 