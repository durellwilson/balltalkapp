import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Song Details",
        }}
      />
      <Text style={styles.text}>Song Detail Screen</Text>
      <Text style={styles.subtext}>Viewing song with ID: {id}</Text>
      <Text style={styles.note}>This screen is being migrated from the old codebase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 18,
    marginBottom: 20,
  },
  note: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 