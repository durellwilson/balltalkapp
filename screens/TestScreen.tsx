import React from 'react';
import { ScrollView, Text, StyleSheet, View, Platform } from 'react-native';
import FirebaseVerification from '../components/FirebaseVerification';
import BasicRecorder from '../components/audio/recorder/BasicRecorder';
import SimpleEqualizer from '../components/audio/SimpleEqualizer';

export default function TestScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>BallTalk Testing</Text>
        <Text style={styles.subheading}>Platform: {Platform.OS}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firebase Connectivity</Text>
        <FirebaseVerification />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Recording</Text>
        <BasicRecorder />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Processing</Text>
        <SimpleEqualizer />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BallTalk App - Development Version
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
}); 