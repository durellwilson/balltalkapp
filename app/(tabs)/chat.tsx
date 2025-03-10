import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Simple Chat Tab implementation
 * Links to the consolidated chat features
 */
export default function ChatTab() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Chat',
          headerShown: true,
        }}
      />
      
      <View style={styles.content}>
        <Ionicons name="chatbubble-ellipses-outline" size={80} color="#999" />
        <Text style={styles.title}>Chat Coming Soon</Text>
        <Text style={styles.description}>
          We're working on bringing you a great chat experience.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/chat/new')}
        >
          <Text style={styles.buttonText}>Start a Conversation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
