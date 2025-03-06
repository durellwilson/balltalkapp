import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AthleteProfileCard from '../../components/profile/AthleteProfileCard';
import { MOCK_ATHLETES } from '../../models/Athlete';

export default function AthletesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Featured Athletes</Text>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {MOCK_ATHLETES.map(athlete => (
          <AthleteProfileCard
            key={athlete.id}
            id={athlete.id}
            name={athlete.name}
            username={athlete.username}
            sport={athlete.sport}
            team={athlete.team}
            avatar={athlete.avatar}
            onPress={() => router.push(`/(tabs)/profile/${athlete.id}`)}
            onProfilePress={() => router.push(`/(tabs)/profile/${athlete.id}`)}
            onFollowPress={() => console.log('Follow athlete', athlete.id)}
            metrics={[
              { label: 'Followers', value: 1200000, icon: 'users' },
              { label: 'Tracks', value: 24, icon: 'music' },
              { label: 'Likes', value: 3500000, icon: 'heart' }
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  homeButton: {
    padding: 8,
    position: 'absolute',
    right: 8,
  },
  scrollContent: {
    padding: 16,
  },
});
