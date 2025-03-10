import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createShadow } from '../utils/shadowStyles';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  const navigateToStudio = () => {
    router.push('/studio');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>BallTalk</Text>
          <Text style={styles.subtitle}>Connect with Athletes through Music</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardText}>
              The platform where athletes share their musical talent and connect with fans.
            </Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleGetStarted}
              accessibilityLabel="Get Started"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.featuresContainer}>
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={navigateToStudio}
              accessibilityLabel="Studio"
              accessibilityRole="button"
            >
              <Ionicons name="mic" size={32} color="#0A84FF" />
              <Text style={styles.featureTitle}>Studio</Text>
              <Text style={styles.featureText}>
                Record, mix, and master your audio
              </Text>
            </TouchableOpacity>
            
            {/* Add more feature cards here */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0A84FF',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    ...createShadow(0, 4, 12, 0.1),
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    width: '45%',
    alignItems: 'center',
    ...createShadow(0, 2, 8, 0.1),
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
