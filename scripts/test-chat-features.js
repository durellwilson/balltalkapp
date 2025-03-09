/**
 * Test script for chat features including message reactions and read receipts
 * 
 * This script tests:
 * 1. Creating a test conversation
 * 2. Sending a test message
 * 3. Adding a reaction to the message
 * 4. Marking the message as read
 * 5. Removing the reaction
 * 6. Cleaning up test data
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove 
} = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

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
const auth = getAuth(app);
const db = getFirestore(app);

// Test user credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';

// Test data
const TEST_USER_ID = 'test-user-id';
const TEST_OTHER_USER_ID = 'test-other-user-id';
const TEST_CONVERSATION_ID = `test-conversation-${uuidv4()}`;
const TEST_MESSAGE_ID = `test-message-${uuidv4()}`;
const TEST_EMOJI = '👍';

// Helper function to log steps
const logStep = (step, message) => {
  console.log(`\n[STEP ${step}] ${message}`);
};

// Helper function to log success
const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

// Helper function to log error
const logError = (error) => {
  console.error(`❌ ERROR: ${error.message || error}`);
  return error;
};

// Main test function
async function runTests() {
  try {
    logStep(1, 'Signing in test user');
    try {
      await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      const currentUser = auth.currentUser;
      logSuccess(`Signed in as ${currentUser.email} (${currentUser.uid})`);
    } catch (error) {
      // If sign in fails, create a test user
      logStep('1b', 'Creating test user');
      await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      const currentUser = auth.currentUser;
      logSuccess(`Created and signed in as ${currentUser.email} (${currentUser.uid})`);
    }

    logStep(2, 'Creating test conversation');
    await setDoc(doc(db, 'conversations', TEST_CONVERSATION_ID), {
      id: TEST_CONVERSATION_ID,
      participants: [TEST_USER_ID, TEST_OTHER_USER_ID],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGroupChat: false,
      unreadCount: {
        [TEST_USER_ID]: 0,
        [TEST_OTHER_USER_ID]: 1
      }
    });
    logSuccess(`Created test conversation with ID: ${TEST_CONVERSATION_ID}`);

    logStep(3, 'Sending test message');
    await setDoc(doc(db, 'messages', TEST_MESSAGE_ID), {
      id: TEST_MESSAGE_ID,
      conversationId: TEST_CONVERSATION_ID,
      senderId: TEST_USER_ID,
      receiverId: TEST_OTHER_USER_ID,
      content: 'This is a test message for reactions and read receipts',
      timestamp: new Date().toISOString(),
      isRead: false,
      readBy: [TEST_USER_ID], // Sender has read the message
      reactions: [] // Initialize empty reactions array
    });
    logSuccess(`Sent test message with ID: ${TEST_MESSAGE_ID}`);

    logStep(4, 'Adding reaction to message');
    const reaction = {
      emoji: TEST_EMOJI,
      userId: TEST_OTHER_USER_ID,
      timestamp: new Date().toISOString()
    };
    await updateDoc(doc(db, 'messages', TEST_MESSAGE_ID), {
      reactions: arrayUnion(reaction)
    });
    logSuccess(`Added reaction ${TEST_EMOJI} to message`);

    logStep(5, 'Marking message as read');
    await updateDoc(doc(db, 'messages', TEST_MESSAGE_ID), {
      readBy: arrayUnion(TEST_OTHER_USER_ID)
    });
    await updateDoc(doc(db, 'conversations', TEST_CONVERSATION_ID), {
      unreadCount: {
        [TEST_USER_ID]: 0,
        [TEST_OTHER_USER_ID]: 0
      }
    });
    logSuccess('Marked message as read');

    logStep(6, 'Verifying message reactions and read receipts');
    const messageDoc = await getDoc(doc(db, 'messages', TEST_MESSAGE_ID));
    const messageData = messageDoc.data();
    
    if (messageData.reactions.length > 0 && 
        messageData.reactions[0].emoji === TEST_EMOJI && 
        messageData.reactions[0].userId === TEST_OTHER_USER_ID) {
      logSuccess('Reaction was successfully added to the message');
    } else {
      throw new Error('Reaction was not added correctly');
    }
    
    if (messageData.readBy.includes(TEST_OTHER_USER_ID)) {
      logSuccess('Message was marked as read by the recipient');
    } else {
      throw new Error('Message was not marked as read correctly');
    }

    const conversationDoc = await getDoc(doc(db, 'conversations', TEST_CONVERSATION_ID));
    const conversationData = conversationDoc.data();
    
    if (conversationData.unreadCount[TEST_OTHER_USER_ID] === 0) {
      logSuccess('Conversation unread count was updated correctly');
    } else {
      throw new Error('Conversation unread count was not updated correctly');
    }

    logStep(7, 'Removing reaction from message');
    await updateDoc(doc(db, 'messages', TEST_MESSAGE_ID), {
      reactions: arrayRemove(reaction)
    });
    
    const updatedMessageDoc = await getDoc(doc(db, 'messages', TEST_MESSAGE_ID));
    const updatedMessageData = updatedMessageDoc.data();
    
    if (updatedMessageData.reactions.length === 0) {
      logSuccess('Reaction was successfully removed from the message');
    } else {
      throw new Error('Reaction was not removed correctly');
    }

    logStep(8, 'Cleaning up test data');
    await deleteDoc(doc(db, 'messages', TEST_MESSAGE_ID));
    await deleteDoc(doc(db, 'conversations', TEST_CONVERSATION_ID));
    logSuccess('Test data cleaned up');

    console.log('\n✅✅✅ ALL TESTS PASSED! Message reactions and read receipts are working correctly. ✅✅✅');
  } catch (error) {
    logError(error);
    console.error('\n❌❌❌ TESTS FAILED! Please check the error messages above. ❌❌❌');
    
    // Try to clean up test data even if tests fail
    try {
      await deleteDoc(doc(db, 'messages', TEST_MESSAGE_ID));
      await deleteDoc(doc(db, 'conversations', TEST_CONVERSATION_ID));
      console.log('Test data cleaned up after failure');
    } catch (cleanupError) {
      console.error('Failed to clean up test data:', cleanupError);
    }
  } finally {
    // Sign out
    await signOut(auth);
    console.log('Test user signed out');
    process.exit();
  }
}

// Run the tests
runTests(); 