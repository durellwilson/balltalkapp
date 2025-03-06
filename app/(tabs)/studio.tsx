import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { StudioInterface } from '../../components/studio/StudioInterface';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function StudioScreen() {
  const { user, isLoading } = useAuth();
  
  // Check if user is authenticated
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Music Studio</Text>
        <Text style={styles.subtitle}>Sign in to access the music studio</Text>
        
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
          The music studio is exclusively available to verified athletes.
        </Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="mic" size={24} color={Colors.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Record high-quality tracks</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="musical-notes" size={24} color={Colors.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Mix and master your music</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color={Colors.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Collaborate with other athletes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="share-social" size={24} color={Colors.primary} style={styles.featureIcon} />
            <Text style={styles.featureText}>Share with your subscribers</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/athlete-signup')}
        >
          <Text style={styles.buttonText}>Sign Up as an Athlete</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // If user is authenticated and is an athlete, show the studio interface
  return (
    <View style={styles.container}>
      <StudioInterface />
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
  featureList: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
});
