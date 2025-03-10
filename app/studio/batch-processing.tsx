import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import BatchProcessor from '../../components/audio/BatchProcessor';

const BatchProcessingScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Batch Processing</Text>
          <Text style={styles.subtitle}>
            Process multiple audio files at once
          </Text>
        </View>

        {user ? (
          <BatchProcessor 
            userId={user.uid}
            onJobComplete={(job) => {
              console.log('Job completed:', job);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Please sign in to use batch processing
            </Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Batch Processing</Text>
          <Text style={styles.infoText}>
            Batch processing allows you to process multiple audio files at once, saving you time and effort.
            You can enhance, master, analyze, or isolate vocals from multiple files in a single operation.
          </Text>
          <Text style={styles.infoText}>
            The processing happens in the background, so you can continue using the app while your files are being processed.
            You'll receive notifications when your batch jobs are complete.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
});

export default BatchProcessingScreen; 