import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import AuthService from '../../services/AuthService';

/**
 * A component with a button to initialize demo accounts.
 * Useful for debugging authentication issues.
 */
const InitializeDemoAccounts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createDemoAccountsDirect = async () => {
    setIsLoading(true);
    
    try {
      console.log('[InitializeDemoAccounts] Creating demo accounts directly...');
      
      const demoAccounts = [
        { email: 'athlete@example.com', password: 'password123', role: 'athlete' as const, displayName: 'Demo Athlete', username: 'demoathlete' },
        { email: 'fan@example.com', password: 'password123', role: 'fan' as const, displayName: 'Demo Fan', username: 'demofan' }
      ];
      
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // Try to sign out any current user
      if (currentUser) {
        await auth.signOut();
      }
      
      for (const account of demoAccounts) {
        try {
          console.log(`[InitializeDemoAccounts] Setting up account: ${account.email}`);
          
          // Try to sign in with the account to check if it exists
          try {
            console.log(`[InitializeDemoAccounts] Checking if ${account.email} exists...`);
            const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
            console.log(`[InitializeDemoAccounts] Account exists: ${userCredential.user.uid}`);
            
            // Check if user document exists and create it if not
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              console.log(`[InitializeDemoAccounts] Creating user document for: ${account.email}`);
              await setDoc(userDocRef, {
                email: account.email,
                displayName: account.displayName,
                role: account.role,
                username: account.username,
                createdAt: serverTimestamp(),
                isVerified: account.role === 'athlete',
                provider: 'email'
              });
            }
            
            // Sign out to prepare for next account
            await auth.signOut();
          } catch (signInError: any) {
            // Handle auth/user-not-found
            if (signInError.code === 'auth/user-not-found') {
              console.log(`[InitializeDemoAccounts] Creating new account: ${account.email}`);
              
              // Create the user
              const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
              console.log(`[InitializeDemoAccounts] Account created: ${userCredential.user.uid}`);
              
              // Set display name
              await updateProfile(userCredential.user, {
                displayName: account.displayName
              });
              
              // Create user document in Firestore
              const userDocRef = doc(db, 'users', userCredential.user.uid);
              await setDoc(userDocRef, {
                email: account.email,
                displayName: account.displayName,
                role: account.role,
                username: account.username,
                createdAt: serverTimestamp(),
                isVerified: account.role === 'athlete',
                provider: 'email'
              });
              
              // Sign out to prepare for next account
              await auth.signOut();
            } else {
              // Some other error with sign in
              console.error(`[InitializeDemoAccounts] Error checking account ${account.email}:`, signInError);
            }
          }
        } catch (accountError) {
          console.error(`[InitializeDemoAccounts] Error with account ${account.email}:`, accountError);
        }
      }
      
      console.log('[InitializeDemoAccounts] Demo accounts setup complete');
      Alert.alert(
        'Success',
        'Demo accounts have been created:\n\n1. Email: athlete@example.com\nPassword: password123\n\n2. Email: fan@example.com\nPassword: password123',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[InitializeDemoAccounts] Error creating demo accounts:', error);
      Alert.alert(
        'Error',
        'There was an error creating demo accounts. Check the console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Testing</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={createDemoAccountsDirect}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Initialize Demo Accounts</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.description}>
        This will create demo accounts with the following credentials:
      </Text>
      <View style={styles.accountInfo}>
        <Text style={styles.accountText}>Email: athlete@example.com</Text>
        <Text style={styles.accountText}>Password: password123</Text>
        <Text style={styles.accountText}>Role: Athlete</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountText}>Email: fan@example.com</Text>
        <Text style={styles.accountText}>Password: password123</Text>
        <Text style={styles.accountText}>Role: Fan</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  description: {
    marginBottom: 8,
    fontSize: 14,
  },
  accountInfo: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  accountText: {
    fontSize: 14,
    marginVertical: 2,
  },
});

export default InitializeDemoAccounts; 