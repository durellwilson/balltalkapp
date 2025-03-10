import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AdminIndex() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.description}>Administrative tools and settings</Text>
      </View>
      
      {/* Add your content here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textDim,
  },
});
