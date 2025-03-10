import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function DolbyDemoScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Dolby Demo",
        }}
      />
      <Text style={styles.text}>Dolby Demo Screen</Text>
      <Text style={styles.subtext}>This screen is being migrated from the old codebase.</Text>
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 