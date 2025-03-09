#!/usr/bin/env node

/**
 * Script to create the required Firestore index for the projects collection
 * This script uses the Firebase Admin SDK to create the index programmatically
 * 
 * Usage:
 * 1. Make sure you have the Firebase Admin SDK installed: npm install firebase-admin
 * 2. Set up your service account credentials: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 * 3. Run this script: node scripts/create-index.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    // If GOOGLE_APPLICATION_CREDENTIALS environment variable is set,
    // the SDK will use it automatically
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Get Firestore instance
const firestore = admin.firestore();

// Define the index
const index = {
  collectionGroup: 'projects',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'updatedAt', order: 'DESCENDING' },
    { fieldPath: '__name__', order: 'ASCENDING' }
  ]
};

async function createIndex() {
  try {
    console.log('Creating Firestore index...');
    
    // Get the project ID
    const projectId = process.env.FIREBASE_PROJECT_ID || admin.app().options.projectId;
    
    if (!projectId) {
      console.error('Error: Firebase project ID not found. Please set the FIREBASE_PROJECT_ID environment variable.');
      process.exit(1);
    }
    
    console.log(`Using Firebase project: ${projectId}`);
    
    // Create the index using the Firestore Admin API
    const firestoreAdmin = admin.firestore().collection('__admin__').doc('indexes');
    
    // Check if the index already exists
    const indexId = `${index.collectionGroup}_${index.fields.map(f => `${f.fieldPath}_${f.order}`).join('_')}`;
    const existingIndexes = await firestoreAdmin.get();
    
    if (existingIndexes.exists && existingIndexes.data() && existingIndexes.data()[indexId]) {
      console.log('Index already exists.');
      process.exit(0);
    }
    
    // Create the index
    await firestoreAdmin.set({
      [indexId]: index
    }, { merge: true });
    
    console.log('Index created successfully!');
    console.log('Note: It may take a few minutes for the index to be fully built.');
    
    // Provide the manual URL as a fallback
    console.log('\nIf the index creation fails, you can create it manually using the Firebase console:');
    console.log('https://console.firebase.google.com/v1/r/project/balltalkbeta/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9iYWxsdGFsa2JldGEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2plY3RzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
  } catch (error) {
    console.error('Error creating index:', error);
    
    // Provide the manual URL as a fallback
    console.log('\nYou can create the index manually using the Firebase console:');
    console.log('https://console.firebase.google.com/v1/r/project/balltalkbeta/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9iYWxsdGFsa2JldGEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2plY3RzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
    process.exit(1);
  }
}

createIndex(); 