import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { defaultTheme } from '../constants';
import type { Theme } from '../constants/Theme';
import { Text, Button } from '../components/themed';
import { AthleteProfileCard, AthleteDashboard } from '../components';

/**
 * AthleteExamples screen
 * 
 * This standalone screen demonstrates the AthleteProfileCard and AthleteDashboard components.
 * It shows how to integrate athlete profiles into your app's dashboard.
 */
export default function AthleteExamples() {
  const router = useRouter();
  const [theme] = useState<Theme>(defaultTheme as unknown as Theme);

  // Example of a standalone athlete card
  const athleteData = {
    id: 'athlete123',
    name: 'Stephen Curry',
    username: 'stephcurry30',
    sport: 'basketball',
    team: 'Golden State Warriors',
    position: 'Point Guard',
    verified: true,
    isAuthenticated: true,
    metrics: [
      { label: 'Tracks', value: 24, icon: 'music' },
      { label: 'Followers', value: 4800000, icon: 'users' },
      { label: 'Plays', value: 7600000, icon: 'play' },
    ]
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <Stack.Screen 
        options={{
          title: 'Athlete Profiles',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerBackTitle: 'Back',
        }} 
      />

      <ScrollView style={styles.contentContainer}>
        {/* Intro Section */}
        <View style={styles.introSection}>
          <Text variant="h2" style={styles.title}>Athlete Profiles</Text>
          
          <Text variant="body1" style={styles.description}>
            This screen demonstrates the AthleteProfileCard and AthleteDashboard components.
            These components provide a rich interface for displaying athlete profiles with
            authentication status, metrics, and action buttons.
          </Text>
          
          <View style={styles.buttons}>
            <Button 
              title="Back to Home" 
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
          </View>
        </View>

        {/* Individual Athlete Card Example */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>Individual Athlete Card</Text>
          <Text variant="body2" style={styles.sectionDescription}>
            The AthleteProfileCard component displays a single athlete with metrics and action buttons.
          </Text>
          
          <AthleteProfileCard
            id={athleteData.id}
            name={athleteData.name}
            username={athleteData.username}
            sport={athleteData.sport}
            team={athleteData.team}
            position={athleteData.position}
            verified={athleteData.verified}
            isAuthenticated={athleteData.isAuthenticated}
            metrics={athleteData.metrics}
            onProfilePress={() => console.log(`Navigate to ${athleteData.name}'s profile`)}
            onMessagePress={() => console.log(`Message ${athleteData.name}`)}
            onMusicPress={() => console.log(`View ${athleteData.name}'s music`)}
          />
        </View>

        {/* Dashboard Example */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>Athlete Dashboard</Text>
          <Text variant="body2" style={styles.sectionDescription}>
            The AthleteDashboard component displays a collection of athlete cards in a dashboard layout.
          </Text>
          
          <AthleteDashboard onNavigateToProfile={function (): void {
            throw new Error('Function not implemented.');
          } } onNavigateToStudio={function (): void {
            throw new Error('Function not implemented.');
          } }          />
        </View>

        {/* Usage Instructions */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>Integration Guide</Text>
          <Text variant="body2" style={styles.sectionDescription}>
            To use these components in your app:
          </Text>
          
          <View style={styles.codeBlock}>
            <Text variant="body3" style={styles.code}>
              {`import { AthleteProfileCard, AthleteDashboard } from '../components';
              
// For a single athlete card
<AthleteProfileCard
  id="athlete123"
  name="Athlete Name"
  username="username"
  sport="basketball"
  team="Team Name"
  verified={true}
  isAuthenticated={true}
  metrics={[
    { label: 'Tracks', value: 24, icon: 'music' },
    { label: 'Followers', value: 4.8M, icon: 'users' },
  ]}
  onProfilePress={() => {/* navigate to profile */}}
  onMessagePress={() => {/* open chat */}}
  onMusicPress={() => {/* view music */}}
  onAuthenticatePress={() => {/* authenticate */}}
/>

// For a dashboard of athletes
<AthleteDashboard 
  theme={theme}
  limit={3} // Optional: limit the number of cards
  showTitle={true} // Optional: show section title
/>`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  introSection: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    marginRight: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
  },
  code: {
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
