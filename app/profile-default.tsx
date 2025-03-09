import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from '../components/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';
import { router } from 'expo-router';
import Colors from '../constants/Colors';

/**
 * Default profile screen shown when user role is not yet determined
 * or for users that don't fit into the athlete or fan categories
 */
export default function DefaultProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If no user is logged in, show login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.message}>Please sign in to access your profile</Text>
          <Button
            title="Sign In"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {user.displayName || user.username || user.email}</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Your account is currently set up, but we need a bit more information to personalize your experience.
          </Text>
          
          <Text style={styles.roleText}>
            Please select your role in the BallTalk community:
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="I'm an Athlete"
              onPress={() => router.push('/onboarding/athlete')}
              style={styles.roleButton}
            />
            
            <Button
              title="I'm a Fan"
              onPress={() => router.push('/onboarding/fan')}
              style={styles.roleButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 10,
  },
  roleButton: {
    marginBottom: 12,
    backgroundColor: Colors.primary,
  },
}); 