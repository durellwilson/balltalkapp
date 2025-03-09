#!/usr/bin/env node

/**
 * Script to test the getUserProjects function after the index is created
 * 
 * Usage:
 * 1. Make sure you have the required dependencies: npm install firebase
 * 2. Run this script: node scripts/test-get-user-projects.js <userId>
 */

// Import required modules
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constants
const PROJECTS_COLLECTION = 'projects';

/**
 * Get projects for a user
 * 
 * @param {string} userId - ID of the user
 * @param {number} limitCount - Maximum number of projects to return
 * @returns {Promise<Array>} Array of user projects
 */
async function getUserProjects(userId, limitCount = 10) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Getting projects for user: ${userId} with limit: ${limitCount}`);
    
    // Create the query with the index
    const projectsQuery = query(
      collection(db, PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      orderBy('__name__', 'asc'),
      limit(limitCount)
    );
    
    console.log('Query created successfully');
    
    // Execute the query
    const querySnapshot = await getDocs(projectsQuery);
    const projects = [];
    
    console.log(`Query executed successfully, got ${querySnapshot.size} results`);
    
    // Process the results
    querySnapshot.forEach((doc) => {
      const projectData = doc.data();
      projects.push({
        ...projectData,
        id: doc.id,
        tempo: projectData.tempo || 120,
        tracks: projectData.tracks || [],
      });
    });
    
    console.log(`Processed ${projects.length} projects`);
    
    return projects;
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw new Error(`Failed to get user projects: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    // Get the user ID from the command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.error('Usage: node scripts/test-get-user-projects.js <userId>');
      process.exit(1);
    }
    
    console.log('Testing getUserProjects function...');
    
    // Call the function
    const projects = await getUserProjects(userId);
    
    // Print the results
    console.log('Projects:', JSON.stringify(projects, null, 2));
    console.log(`Found ${projects.length} projects for user ${userId}`);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 