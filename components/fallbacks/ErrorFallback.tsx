
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrorFallback({ error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message || 'An unknown error occurred'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
