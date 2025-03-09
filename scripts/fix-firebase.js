#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔥 FIXING FIREBASE INITIALIZATION ISSUES 🔥');

const projectRoot = process.cwd();

// Create a fixed version of the firebase.config.ts file
const firebaseConfigPath = path.join(projectRoot, 'config/firebase.config.ts');
const fixedFirebaseConfigPath = path.join(projectRoot, 'config/firebase.config.fixed.ts');

// Read the original firebase config
const originalConfig = fs.readFileSync(firebaseConfigPath, 'utf8');

// Create a fixed version that ensures Firebase is initialized only once
const fixedConfig = originalConfig.replace(
  // Find the initialization block
  /\/\/ Initialize Firebase[\s\S]*?try {[\s\S]*?firebaseApp = initializeFirebase\(\);[\s\S]*?const services = initializeServices\(firebaseApp\);[\s\S]*?auth = services\.auth;[\s\S]*?db = services\.db;[\s\S]*?storage = services\.storage;[\s\S]*?connectToEmulators\(auth, db, storage\);[\s\S]*?} catch \(error\) {[\s\S]*?console\.error\('Fatal error initializing Firebase:', error\);[\s\S]*?}/,
  // Replace with a safer initialization that checks if Firebase is already initialized
  `// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  console.log('Initializing Firebase...');
  
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    console.log('No Firebase app found, initializing...');
    if (!validateFirebaseConfig()) {
      throw new Error('Invalid Firebase configuration');
    }
    
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    console.log('Firebase app already initialized, reusing...');
    firebaseApp = getApp();
  }
  
  // Initialize services
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  
  // Set persistence for authentication on web
  if (Platform.OS === 'web') {
    try {
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('Firebase auth persistence set to browserLocalPersistence');
        })
        .catch((error) => {
          console.error('Error setting auth persistence:', error);
        });
    } catch (err) {
      console.warn('Error setting persistence, may already be set:', err);
    }
    
    // Enable offline persistence for Firestore
    try {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore offline persistence enabled for web');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
          } else {
            console.error('Error enabling Firestore persistence:', err);
          }
        });
    } catch (err) {
      console.warn('Error enabling persistence, may already be enabled:', err);
    }
  }
  
  // Connect to emulators if needed
  const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  if (useEmulators) {
    try {
      console.log('Connecting to Firebase emulators...');
      const host = Platform.OS === 'web' ? 'localhost' : '10.0.2.2';
      connectAuthEmulator(auth, \`http://\${host}:9099\`);
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      console.log('Connected to Firebase emulators successfully');
    } catch (error) {
      console.error('Error connecting to Firebase emulators:', error);
    }
  }
} catch (error) {
  console.error('Fatal error initializing Firebase:', error);
}`
);

// Write the fixed config to a new file
fs.writeFileSync(fixedFirebaseConfigPath, fixedConfig);
console.log(`✅ Created fixed Firebase config at: ${fixedFirebaseConfigPath}`);

// Backup the original file
const backupPath = path.join(projectRoot, 'config/firebase.config.backup.ts');
fs.copyFileSync(firebaseConfigPath, backupPath);
console.log(`✅ Backed up original Firebase config to: ${backupPath}`);

// Replace the original file with the fixed version
fs.copyFileSync(fixedFirebaseConfigPath, firebaseConfigPath);
console.log(`✅ Replaced Firebase config with fixed version`);

// Clear all caches
console.log('🧹 Clearing all caches...');
try {
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
  execSync('rm -rf .expo', { stdio: 'inherit' });
  console.log('✅ Caches cleared');
} catch (error) {
  console.error('❌ Error clearing caches:', error);
}

// Fix package.json main field if it's still set to temp/entry.js
const packageJsonPath = path.join(projectRoot, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.main === './temp/entry.js') {
  packageJson.main = 'expo-router/entry';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fixed package.json main field back to expo-router/entry');
}

console.log('🚀 Building web app for deployment...');
try {
  execSync('npm run build:web', { stdio: 'inherit' });
  console.log('✅ Web app built successfully');
} catch (error) {
  console.error('❌ Error building web app:', error);
  process.exit(1);
}

console.log('🚀 Deploying to Firebase...');
try {
  execSync('npm run deploy', { stdio: 'inherit' });
  console.log('✅ Deployed to Firebase successfully');
} catch (error) {
  console.error('❌ Error deploying to Firebase:', error);
  process.exit(1);
}

console.log('🎉 All done! Your app should now be running correctly on Firebase.'); 