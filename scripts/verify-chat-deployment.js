/**
 * Script to verify chat deployment
 * 
 * This script checks:
 * 1. Firebase configuration
 * 2. Chat features enabled in app.json
 * 3. Firestore rules for chat collections
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);

async function verifyDeployment() {
  console.log('\n========================================');
  console.log('🔍 VERIFYING CHAT DEPLOYMENT');
  console.log('========================================\n');
  
  let success = true;
  
  // Check app.json configuration
  try {
    const appConfigPath = path.join(__dirname, '../app.json');
    const appConfig = JSON.parse(await readFileAsync(appConfigPath, 'utf8'));
    
    console.log('Checking app.json configuration...');
    
    if (appConfig.extra && appConfig.extra.chatFeaturesEnabled) {
      console.log('✅ Chat features are enabled in app.json');
    } else {
      console.log('❌ Chat features are not enabled in app.json');
      success = false;
    }
    
    if (appConfig.extra && appConfig.extra.premiumGroupsEnabled) {
      console.log('✅ Premium groups are enabled in app.json');
    } else {
      console.log('❌ Premium groups are not enabled in app.json');
      success = false;
    }
    
    console.log(`📝 App version: ${appConfig.version}`);
  } catch (error) {
    console.error('❌ Error reading app.json:', error.message);
    success = false;
  }
  
  // Check Firebase configuration
  try {
    const firebaseConfigPath = path.join(__dirname, '../firebase.json');
    const firebaseConfig = JSON.parse(await readFileAsync(firebaseConfigPath, 'utf8'));
    
    console.log('\nChecking Firebase configuration...');
    
    if (firebaseConfig.hosting && firebaseConfig.hosting.public === 'dist') {
      console.log('✅ Firebase hosting is configured correctly');
    } else {
      console.log('❌ Firebase hosting is not configured correctly');
      success = false;
    }
    
    if (firebaseConfig.firestore && firebaseConfig.firestore.rules === 'firestore.rules') {
      console.log('✅ Firestore rules are configured correctly');
    } else {
      console.log('❌ Firestore rules are not configured correctly');
      success = false;
    }
    
    // Check if storage rules are configured
    if (firebaseConfig.storage && Array.isArray(firebaseConfig.storage) && 
        firebaseConfig.storage.length > 0 && 
        firebaseConfig.storage[0].rules === 'storage.rules') {
      console.log('✅ Storage rules are configured correctly');
    } else {
      console.log('❌ Storage rules are not configured correctly');
      success = false;
    }
  } catch (error) {
    console.error('❌ Error reading firebase.json:', error.message);
    success = false;
  }
  
  // Check Firestore rules
  try {
    const firestoreRulesPath = path.join(__dirname, '../firestore.rules');
    const firestoreRules = await readFileAsync(firestoreRulesPath, 'utf8');
    
    console.log('\nChecking Firestore rules...');
    
    if (firestoreRules.includes('match /conversations/{conversationId}')) {
      console.log('✅ Firestore rules include conversation rules');
    } else {
      console.log('❌ Firestore rules do not include conversation rules');
      success = false;
    }
    
    if (firestoreRules.includes('match /messages/{messageId}')) {
      console.log('✅ Firestore rules include message rules');
    } else {
      console.log('❌ Firestore rules do not include message rules');
      success = false;
    }
  } catch (error) {
    console.error('❌ Error reading firestore.rules:', error.message);
    success = false;
  }
  
  // Final result
  console.log('\n========================================');
  if (success) {
    console.log('✅ CHAT DEPLOYMENT VERIFICATION SUCCESSFUL');
    console.log('All checks passed. The chat features should be working correctly.');
  } else {
    console.log('❌ CHAT DEPLOYMENT VERIFICATION FAILED');
    console.log('Some checks failed. Please review the issues above.');
  }
  console.log('========================================\n');
  
  return success;
}

// Run the verification
verifyDeployment().catch(error => {
  console.error('Error during verification:', error);
  process.exit(1);
}); 