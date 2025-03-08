#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  }
};

// Helper function to log with colors
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').reduce((acc, line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          acc[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
        }
        return acc;
      }, {});
      
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });
      
      log('Environment variables loaded from .env file', colors.fg.green);
    } else {
      log('No .env file found, using existing environment variables', colors.fg.yellow);
    }
  } catch (error) {
    log(`Error loading .env file: ${error.message}`, colors.fg.red);
  }
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
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  };
  
  log('Initializing Firebase with config:', colors.fg.cyan);
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    log(`  ${key}: ${value ? '✓ Set' : '✗ Missing'}`, value ? colors.fg.green : colors.fg.red);
  });
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  return { app, auth, db };
}

// Force create demo accounts (delete if they exist and recreate)
async function forceCreateDemoAccounts(auth, db) {
  const demoAccounts = [
    { email: 'athlete@example.com', password: 'password123', role: 'athlete' },
    { email: 'fan@example.com', password: 'password123', role: 'fan' }
  ];
  
  for (const account of demoAccounts) {
    log(`Processing demo account: ${account.email}`, colors.fg.cyan);
    
    try {
      // Try to sign in with the account to check if it exists
      try {
        log(`Checking if ${account.email} exists...`, colors.fg.yellow);
        const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
        const user = userCredential.user;
        
        if (user) {
          log(`Account ${account.email} exists, deleting it...`, colors.fg.yellow);
          try {
            // Delete the user
            await deleteUser(user);
            log(`Account ${account.email} deleted successfully`, colors.fg.green);
          } catch (deleteError) {
            log(`Error deleting account ${account.email}: ${deleteError.message}`, colors.fg.red);
            // If we can't delete, we'll try to update it instead
            log(`Attempting to update account ${account.email} instead...`, colors.fg.yellow);
            await signOut(auth);
          }
        }
      } catch (signInError) {
        log(`Account ${account.email} doesn't exist or couldn't be signed in: ${signInError.message}`, colors.fg.yellow);
      }
      
      // Create the account (whether it existed before or not)
      log(`Creating account ${account.email}...`, colors.fg.yellow);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
        const user = userCredential.user;
        
        if (user) {
          // Set display name based on role
          const displayName = account.role === 'athlete' ? 'Demo Athlete' : 'Demo Fan';
          await updateProfile(user, {
            displayName: displayName
          });
          
          // Create user document in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            email: account.email,
            displayName: displayName,
            role: account.role,
            username: account.role === 'athlete' ? 'demoathlete' : 'demofan',
            createdAt: serverTimestamp(),
            isVerified: account.role === 'athlete'
          });
          
          log(`Demo account ${account.email} created successfully with UID: ${user.uid}`, colors.fg.green);
          
          // Sign out immediately
          await signOut(auth);
        }
      } catch (createError) {
        log(`Error creating demo account ${account.email}: ${createError.message}`, colors.fg.red);
        
        // If the account already exists with a different password, try to sign in with the old password
        if (createError.code === 'auth/email-already-in-use') {
          log(`Account ${account.email} already exists but couldn't be accessed. This might be due to a password change or authentication issue.`, colors.fg.red);
        }
      }
    } catch (error) {
      log(`Unexpected error with demo account ${account.email}: ${error.message}`, colors.fg.red);
    }
  }
}

// Main function
async function main() {
  log('🚀 Starting BallTalk Demo Accounts Creation', colors.fg.green + colors.bright);
  
  // Step 1: Load environment variables
  log('\n📝 Step 1: Loading environment variables...', colors.fg.yellow);
  loadEnv();
  
  // Step 2: Initialize Firebase
  log('\n🔥 Step 2: Initializing Firebase...', colors.fg.yellow);
  const { auth, db } = initializeFirebase();
  
  // Step 3: Force create demo accounts
  log('\n👤 Step 3: Force creating demo accounts...', colors.fg.yellow);
  await forceCreateDemoAccounts(auth, db);
  
  log('\n✅ Demo accounts creation completed!', colors.fg.green + colors.bright);
  log('You should now be able to log in with the demo accounts:', colors.fg.white);
  log('  - Athlete: athlete@example.com / password123', colors.fg.white);
  log('  - Fan: fan@example.com / password123', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 