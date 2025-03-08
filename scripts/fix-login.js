#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
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

// Create demo accounts
async function createDemoAccounts(auth, db) {
  const demoAccounts = [
    { email: 'athlete@example.com', password: 'password123', role: 'athlete' },
    { email: 'fan@example.com', password: 'password123', role: 'fan' }
  ];
  
  for (const account of demoAccounts) {
    try {
      log(`Checking if ${account.email} exists...`, colors.fg.cyan);
      
      try {
        // Try to sign in with the account
        await signInWithEmailAndPassword(auth, account.email, account.password);
        log(`Demo account ${account.email} already exists`, colors.fg.green);
        
        // Sign out immediately
        await signOut(auth);
      } catch (error) {
        // If the account doesn't exist or there's an auth error, create it
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          log(`Creating demo account for ${account.email}...`, colors.fg.yellow);
          
          try {
            // Create the user
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
              
              log(`Demo account ${account.email} created successfully`, colors.fg.green);
              
              // Sign out immediately
              await signOut(auth);
            }
          } catch (createError) {
            log(`Error creating demo account ${account.email}: ${createError.message}`, colors.fg.red);
            
            // If the account already exists, try to update it
            if (createError.code === 'auth/email-already-in-use') {
              log(`Account ${account.email} already exists, trying to update Firestore document...`, colors.fg.yellow);
              
              try {
                // Try to sign in
                const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
                const user = userCredential.user;
                
                if (user) {
                  // Set display name based on role
                  const displayName = account.role === 'athlete' ? 'Demo Athlete' : 'Demo Fan';
                  await updateProfile(user, {
                    displayName: displayName
                  });
                  
                  // Update user document in Firestore
                  await setDoc(doc(db, 'users', user.uid), {
                    email: account.email,
                    displayName: displayName,
                    role: account.role,
                    username: account.role === 'athlete' ? 'demoathlete' : 'demofan',
                    updatedAt: serverTimestamp(),
                    isVerified: account.role === 'athlete'
                  }, { merge: true });
                  
                  log(`Demo account ${account.email} updated successfully`, colors.fg.green);
                  
                  // Sign out immediately
                  await signOut(auth);
                }
              } catch (updateError) {
                log(`Error updating demo account ${account.email}: ${updateError.message}`, colors.fg.red);
              }
            }
          }
        } else {
          log(`Error checking demo account ${account.email}: ${error.message}`, colors.fg.red);
        }
      }
    } catch (error) {
      log(`Unexpected error with demo account ${account.email}: ${error.message}`, colors.fg.red);
    }
  }
}

// Main function
async function main() {
  log('🚀 Starting BallTalk Login Fix', colors.fg.green + colors.bright);
  
  // Step 1: Load environment variables
  log('\n📝 Step 1: Loading environment variables...', colors.fg.yellow);
  loadEnv();
  
  // Step 2: Initialize Firebase
  log('\n🔥 Step 2: Initializing Firebase...', colors.fg.yellow);
  const { auth, db } = initializeFirebase();
  
  // Step 3: Create demo accounts
  log('\n👤 Step 3: Creating demo accounts...', colors.fg.yellow);
  await createDemoAccounts(auth, db);
  
  log('\n✅ Login fix completed!', colors.fg.green + colors.bright);
  log('You should now be able to log in with the demo accounts:', colors.fg.white);
  log('  - Athlete: athlete@example.com / password123', colors.fg.white);
  log('  - Fan: fan@example.com / password123', colors.fg.white);
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.fg.red);
  process.exit(1);
}); 