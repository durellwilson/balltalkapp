#!/usr/bin/env node

/**
 * Script to create the required Firestore index for the projects collection
 * This script uses the Firebase CLI to deploy the index
 * 
 * Usage:
 * 1. Make sure you have Firebase CLI installed: npm install -g firebase-tools
 * 2. Make sure you're logged in: firebase login
 * 3. Run this script: node scripts/create-firestore-index.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the Firestore indexes configuration file
const indexesFilePath = path.join(__dirname, '../firebase/config/firestore.indexes.json');

// Check if the file exists
if (!fs.existsSync(indexesFilePath)) {
  console.error(`Error: Firestore indexes file not found at ${indexesFilePath}`);
  process.exit(1);
}

// Read the current indexes configuration
let indexesConfig;
try {
  const fileContent = fs.readFileSync(indexesFilePath, 'utf8');
  indexesConfig = JSON.parse(fileContent);
} catch (error) {
  console.error(`Error reading or parsing the indexes file: ${error.message}`);
  process.exit(1);
}

// Check if the required index already exists
const requiredIndex = {
  collectionGroup: "projects",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "updatedAt", order: "DESCENDING" },
    { fieldPath: "__name__", order: "ASCENDING" }
  ]
};

// Function to check if two indexes are equivalent
function areIndexesEqual(index1, index2) {
  if (index1.collectionGroup !== index2.collectionGroup || 
      index1.queryScope !== index2.queryScope ||
      index1.fields.length !== index2.fields.length) {
    return false;
  }
  
  for (let i = 0; i < index1.fields.length; i++) {
    const field1 = index1.fields[i];
    const field2 = index2.fields[i];
    
    if (field1.fieldPath !== field2.fieldPath || 
        field1.order !== field2.order ||
        field1.arrayConfig !== field2.arrayConfig) {
      return false;
    }
  }
  
  return true;
}

// Check if the index already exists
const indexExists = indexesConfig.indexes.some(index => areIndexesEqual(index, requiredIndex));

if (indexExists) {
  console.log('The required index already exists in the configuration.');
} else {
  // Add the index to the configuration
  indexesConfig.indexes.push(requiredIndex);
  
  // Write the updated configuration back to the file
  try {
    fs.writeFileSync(indexesFilePath, JSON.stringify(indexesConfig, null, 2), 'utf8');
    console.log('Added the required index to the configuration file.');
  } catch (error) {
    console.error(`Error writing the updated configuration: ${error.message}`);
    process.exit(1);
  }
}

// Deploy the indexes to Firebase
console.log('Deploying Firestore indexes to Firebase...');
try {
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('Firestore indexes deployed successfully!');
} catch (error) {
  console.error(`Error deploying Firestore indexes: ${error.message}`);
  console.log('You can manually deploy the indexes using the Firebase console:');
  console.log('https://console.firebase.google.com/v1/r/project/balltalkbeta/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9iYWxsdGFsa2JldGEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2plY3RzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI');
  process.exit(1);
} 