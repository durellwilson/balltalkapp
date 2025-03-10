/**
 * Create Missing Screens Script
 * 
 * This script creates the missing screens mentioned in the STATUS-SUMMARY.md file.
 * It creates basic screen templates for each missing screen.
 */

const fs = require('fs');
const path = require('path');

// Define the missing screens
const missingScreens = [
  { path: 'app/(auth)/login.tsx', title: 'Login' },
  { path: 'app/verification-test.tsx', title: 'Verification Test' },
  { path: 'app/community.tsx', title: 'Community' },
  { path: 'app/onboarding/athlete.tsx', title: 'Athlete Onboarding' },
  { path: 'app/onboarding/fan.tsx', title: 'Fan Onboarding' },
  { path: 'app/(auth)/athlete-signup.tsx', title: 'Athlete Signup' },
  { path: 'app/chat/new-group.tsx', title: 'New Group Chat' },
  { path: 'app/search.tsx', title: 'Search' },
  { path: 'app/admin/verification.tsx', title: 'Admin Verification' },
  { path: 'app/(tabs)/profile/edit.tsx', title: 'Edit Profile' },
  { path: 'app/(tabs)/profile/settings.tsx', title: 'Profile Settings' },
  { path: 'app/(tabs)/profile/[id].tsx', title: 'User Profile' },
  { path: 'app/chat/fan-hub.tsx', title: 'Fan Hub' },
  { path: 'app/(auth)/signup.tsx', title: 'Signup' }
];

// Template for a basic screen
function createScreenTemplate(title) {
  return `import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';

/**
 * ${title} Screen
 */
export default function ${title.replace(/\s/g, '')}Screen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>${title}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.text}>This is the ${title} screen.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
});`;
}

// Create a screen file
function createScreen(screenInfo) {
  const fullPath = path.join(process.cwd(), screenInfo.path);
  const dirPath = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
  
  // Check if file already exists
  if (fs.existsSync(fullPath)) {
    console.log(`Screen already exists: ${screenInfo.path}`);
    return false;
  }
  
  // Create the screen file
  const content = createScreenTemplate(screenInfo.title);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created screen: ${screenInfo.path}`);
  return true;
}

// Create each missing screen
let totalCreated = 0;
for (const screen of missingScreens) {
  if (createScreen(screen)) {
    totalCreated++;
  }
}

console.log(`Created ${totalCreated} missing screens.`); 