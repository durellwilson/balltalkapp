#!/usr/bin/env node

/**
 * This script creates test users in the real Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
  }
};

// Log with color
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log a section header
function logSection(title) {
  console.log('\n');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
  log(`  ${title}`, colors.bright + colors.fg.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.fg.cyan);
}

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if service account key file exists
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      log('Error: service-account.json file not found.', colors.fg.red);
      log('Please create a service account key file and save it as service-account.json in the project root.', colors.fg.red);
      return false;
    }
    
    // Initialize Firebase Admin SDK with service account
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://balltalkbeta-default-rtdb.firebaseio.com',
    });
    
    log('Firebase Admin SDK initialized', colors.fg.green);
    return true;
  } catch (error) {
    log(`Error initializing Firebase Admin SDK: ${error.message}`, colors.fg.red);
    return false;
  }
}

// Create test users
async function createTestUsers() {
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    // Create athlete user
    const athleteUser = {
      email: 'athlete@example.com',
      password: 'password123',
      displayName: 'Test Athlete',
    };
    
    let athleteRecord;
    try {
      athleteRecord = await auth.createUser(athleteUser);
      log(`Created athlete user: ${athleteUser.email}`, colors.fg.green);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        athleteRecord = await auth.getUserByEmail(athleteUser.email);
        log(`Athlete user already exists: ${athleteUser.email}`, colors.fg.yellow);
      } else {
        throw error;
      }
    }
    
    // Create athlete profile in Firestore
    await db.collection('users').doc(athleteRecord.uid).set({
      id: athleteRecord.uid,
      email: athleteUser.email,
      displayName: athleteUser.displayName,
      username: 'testathlete',
      role: 'athlete',
      isVerified: true,
      verificationStatus: 'approved',
      sport: 'Basketball',
      league: 'NBA',
      team: 'Los Angeles Lakers',
      position: 'Point Guard',
      bio: 'Professional basketball player',
      createdAt: new Date().toISOString(),
    });
    log('Created athlete profile in Firestore', colors.fg.green);
    
    // Create fan user
    const fanUser = {
      email: 'fan@example.com',
      password: 'password123',
      displayName: 'Test Fan',
    };
    
    let fanRecord;
    try {
      fanRecord = await auth.createUser(fanUser);
      log(`Created fan user: ${fanUser.email}`, colors.fg.green);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        fanRecord = await auth.getUserByEmail(fanUser.email);
        log(`Fan user already exists: ${fanUser.email}`, colors.fg.yellow);
      } else {
        throw error;
      }
    }
    
    // Create fan profile in Firestore
    await db.collection('users').doc(fanRecord.uid).set({
      id: fanRecord.uid,
      email: fanUser.email,
      displayName: fanUser.displayName,
      username: 'testfan',
      role: 'fan',
      favoriteAthletes: [athleteRecord.uid],
      favoriteLeagues: ['NBA'],
      favoriteTeams: ['Los Angeles Lakers'],
      createdAt: new Date().toISOString(),
    });
    log('Created fan profile in Firestore', colors.fg.green);
    
    return {
      athleteId: athleteRecord.uid,
      fanId: fanRecord.uid,
    };
  } catch (error) {
    log(`Error creating test users: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Main function
async function main() {
  logSection('Creating Test Users in Firebase');
  
  // Initialize Firebase Admin SDK
  if (!initializeFirebaseAdmin()) {
    process.exit(1);
  }
  
  try {
    // Create test users
    const userIds = await createTestUsers();
    
    log('Successfully created test users in Firebase', colors.fg.green);
    log(`Athlete ID: ${userIds.athleteId}`, colors.fg.green);
    log(`Fan ID: ${userIds.fanId}`, colors.fg.green);
    log('\nYou can now log in with the following credentials:', colors.fg.green);
    log('Athlete: athlete@example.com / password123', colors.fg.green);
    log('Fan: fan@example.com / password123', colors.fg.green);
  } catch (error) {
    log(`Error creating test users: ${error.message}`, colors.fg.red);
    process.exit(1);
  }
}

// Run the main function
main(); 