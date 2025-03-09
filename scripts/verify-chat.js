#!/usr/bin/env node

/**
 * Script to verify chat functionality
 * This script tests the chat functionality by creating conversations, sending messages, and checking reactions
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  deleteDoc
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Initialize Firebase
function initializeFirebase() {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  return { app, db, auth };
}

// Sign in with email and password
async function signIn(auth, email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    log(`❌ Authentication error: ${error.message}`, colors.red);
    throw error;
  }
}

// Create a test conversation
async function createTestConversation(db, user1Id, user2Id) {
  try {
    const conversationData = {
      participants: [user1Id, user2Id],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      createdBy: user1Id,
      isGroup: false,
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0
      }
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    log(`✅ Test conversation created with ID: ${docRef.id}`, colors.green);
    return docRef.id;
  } catch (error) {
    log(`❌ Error creating test conversation: ${error.message}`, colors.red);
    throw error;
  }
}

// Send a test message
async function sendTestMessage(db, conversationId, senderId, text) {
  try {
    const messageData = {
      conversationId,
      senderId,
      text,
      timestamp: serverTimestamp(),
      readBy: [senderId]
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    
    // Update conversation with last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: text.substring(0, 100),
      lastMessageAt: serverTimestamp()
    });
    
    log(`✅ Test message sent with ID: ${docRef.id}`, colors.green);
    return docRef.id;
  } catch (error) {
    log(`❌ Error sending test message: ${error.message}`, colors.red);
    throw error;
  }
}

// Add a reaction to a message
async function addReaction(db, messageId, userId, emoji) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    
    await updateDoc(messageRef, {
      reactions: arrayUnion({
        userId,
        emoji,
        timestamp: new Date()
      })
    });
    
    log(`✅ Reaction added to message`, colors.green);
  } catch (error) {
    log(`❌ Error adding reaction: ${error.message}`, colors.red);
    throw error;
  }
}

// Clean up test data
async function cleanupTestData(db, conversationId) {
  try {
    // Delete messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const deletePromises = [];
    
    messagesSnapshot.forEach((messageDoc) => {
      deletePromises.push(deleteDoc(doc(db, 'messages', messageDoc.id)));
    });
    
    await Promise.all(deletePromises);
    
    // Delete conversation
    await deleteDoc(doc(db, 'conversations', conversationId));
    
    log(`✅ Test data cleaned up`, colors.green);
  } catch (error) {
    log(`❌ Error cleaning up test data: ${error.message}`, colors.red);
  }
}

// Main function
async function main() {
  log('🔍 Verifying chat functionality...', colors.yellow);

  try {
    // Initialize Firebase
    const { db, auth } = initializeFirebase();
    
    // Get test credentials
    const email = await prompt('Enter test user email: ');
    const password = await prompt('Enter test user password: ');
    const testUserId = await prompt('Enter test recipient user ID: ');
    
    // Sign in
    log('🔑 Signing in...', colors.blue);
    const user = await signIn(auth, email, password);
    log(`✅ Signed in as ${user.email}`, colors.green);
    
    // Create test conversation
    log('💬 Creating test conversation...', colors.blue);
    const conversationId = await createTestConversation(db, user.uid, testUserId);
    
    // Send test message
    log('📤 Sending test message...', colors.blue);
    const messageId = await sendTestMessage(db, conversationId, user.uid, 'This is a test message from the verification script');
    
    // Add reaction
    log('👍 Adding reaction...', colors.blue);
    await addReaction(db, messageId, user.uid, '👍');
    
    // Clean up?
    const shouldCleanup = await prompt('Clean up test data? (y/n): ');
    
    if (shouldCleanup.toLowerCase() === 'y') {
      log('🧹 Cleaning up test data...', colors.blue);
      await cleanupTestData(db, conversationId);
    }
    
    log('✅ Chat functionality verification completed successfully!', colors.green);
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, colors.red);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(error => {
  log(`❌ Error: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
}); 