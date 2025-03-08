#!/usr/bin/env node

/**
 * This script seeds the Firebase emulators with test data
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
    admin.initializeApp({
      projectId: 'demo-project',
      databaseURL: 'http://localhost:9000?ns=demo-project',
    });
    
    // Point to emulators
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    
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

// Create test songs
async function createTestSongs(athleteId) {
  try {
    const db = admin.firestore();
    const now = new Date().toISOString();
    
    // Create test songs
    const songs = [
      {
        id: 'song1',
        artistId: athleteId,
        title: 'Game Day',
        genre: 'Hip Hop',
        description: 'A song about game day preparation',
        releaseDate: now,
        fileUrl: 'https://example.com/songs/gameday.mp3',
        duration: 180,
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
        playCount: 1000,
        likeCount: 500,
        commentCount: 50,
      },
      {
        id: 'song2',
        artistId: athleteId,
        title: 'Victory',
        genre: 'Rap',
        description: 'Celebrating a big win',
        releaseDate: now,
        fileUrl: 'https://example.com/songs/victory.mp3',
        duration: 210,
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
        playCount: 2000,
        likeCount: 1000,
        commentCount: 100,
      },
      {
        id: 'song3',
        artistId: athleteId,
        title: 'Champion Mindset',
        genre: 'Motivational',
        description: 'Staying focused on the goal',
        releaseDate: now,
        fileUrl: 'https://example.com/songs/champion.mp3',
        duration: 240,
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
        playCount: 3000,
        likeCount: 1500,
        commentCount: 150,
      },
    ];
    
    // Add songs to Firestore
    for (const song of songs) {
      await db.collection('songs').doc(song.id).set(song);
    }
    
    log(`Created ${songs.length} test songs`, colors.fg.green);
    return songs.map(song => song.id);
  } catch (error) {
    log(`Error creating test songs: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Create test playlists
async function createTestPlaylists(userId, songIds) {
  try {
    const db = admin.firestore();
    const now = new Date().toISOString();
    
    // Create test playlists
    const playlists = [
      {
        id: 'playlist1',
        userId,
        title: 'My Favorite Songs',
        description: 'A collection of my favorite songs',
        songs: songIds,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
        playCount: 500,
        followCount: 100,
      },
      {
        id: 'playlist2',
        userId,
        title: 'Workout Mix',
        description: 'Songs to get pumped up for a workout',
        songs: [songIds[0], songIds[2]],
        isPublic: true,
        createdAt: now,
        updatedAt: now,
        playCount: 1000,
        followCount: 200,
      },
    ];
    
    // Add playlists to Firestore
    for (const playlist of playlists) {
      await db.collection('playlists').doc(playlist.id).set(playlist);
    }
    
    log(`Created ${playlists.length} test playlists`, colors.fg.green);
  } catch (error) {
    log(`Error creating test playlists: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Create test comments
async function createTestComments(songIds, userIds) {
  try {
    const db = admin.firestore();
    const now = new Date().toISOString();
    
    // Create test comments
    const comments = [
      {
        id: 'comment1',
        songId: songIds[0],
        userId: userIds.fanId,
        text: 'This song is fire! 🔥',
        createdAt: now,
        likes: 50,
      },
      {
        id: 'comment2',
        songId: songIds[0],
        userId: userIds.athleteId,
        text: 'Thanks for the support!',
        createdAt: now,
        likes: 25,
      },
      {
        id: 'comment3',
        songId: songIds[1],
        userId: userIds.fanId,
        text: 'Love the beat on this one',
        createdAt: now,
        likes: 30,
      },
    ];
    
    // Add comments to Firestore
    for (const comment of comments) {
      await db.collection('songs').doc(comment.songId).collection('comments').doc(comment.id).set(comment);
    }
    
    log(`Created ${comments.length} test comments`, colors.fg.green);
  } catch (error) {
    log(`Error creating test comments: ${error.message}`, colors.fg.red);
    throw error;
  }
}

// Main function
async function main() {
  logSection('Seeding Firebase Emulators with Test Data');
  
  // Initialize Firebase Admin SDK
  if (!initializeFirebaseAdmin()) {
    process.exit(1);
  }
  
  try {
    // Create test users
    const userIds = await createTestUsers();
    
    // Create test songs
    const songIds = await createTestSongs(userIds.athleteId);
    
    // Create test playlists
    await createTestPlaylists(userIds.fanId, songIds);
    
    // Create test comments
    await createTestComments(songIds, userIds);
    
    log('Successfully seeded Firebase emulators with test data', colors.fg.green);
  } catch (error) {
    log(`Error seeding Firebase emulators: ${error.message}`, colors.fg.red);
    process.exit(1);
  }
}

// Run the main function
main(); 