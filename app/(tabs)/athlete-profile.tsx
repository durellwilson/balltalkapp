import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/auth';
import AthleteProfileView from '../../components/profile/AthleteProfileView';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AthleteVerificationForm from '../../components/verification/AthleteVerificationForm';

export default function AthleteProfileScreen() {
  const { user } = useAuth();
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  
  // Check if user is authenticated
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Athlete Profile</Text>
        <Text style={styles.subtitle}>Sign in to view your athlete profile</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/athlete-signup')}>
            <Text style={styles.signupLink}>Sign up as an athlete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Check if user is an athlete
  if (user?.role !== 'athlete') {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Athletes Only</Text>
        <Text style={styles.subtitle}>
          This profile section is exclusively for athletes.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/athlete-signup')}
        >
          <Text style={styles.buttonText}>Sign Up as an Athlete</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show verification form if requested
  if (showVerificationForm) {
    return (
      <AthleteVerificationForm 
        onCancel={() => setShowVerificationForm(false)}
        onComplete={() => {
          setShowVerificationForm(false);
          // In a real app, we would refresh the user data here
        }}
      />
    );
  }
  
  // If user is authenticated and is an athlete, show the profile
  return (
    <View style={styles.container}>
      <AthleteProfileView 
        onRequestVerification={() => setShowVerificationForm(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
