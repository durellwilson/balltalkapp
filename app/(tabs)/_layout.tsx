import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '../../constants/Colors';

/**
 * TabLayout component that handles the bottom tab navigation
 * Tabs are conditionally rendered based on user role:
 * - Athletes: Home, Studio, Profile, Chat
 * - Fans: Home, Discover, Profile, Chat
 */
export default function TabLayout() {
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';
  const isFan = user?.role === 'fan';
  
  // Log user role for debugging
  useEffect(() => {
    if (user) {
      console.log(`User role: ${user.role || 'undefined'}`);
    } else {
      console.log('No user signed in');
    }
  }, [user]);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarStyle: { 
          height: Platform.OS === 'ios' ? 80 : 60, 
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          borderTopColor: '#E5E5E5',
          borderTopWidth: 1
        }
      }}
    >
      {/* Home Tab - Visible to all users */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      
      {/* Studio Tab - Only visible to athletes */}
      {isAthlete && (
        <Tabs.Screen
          name="studio"
          options={{
            title: 'Studio',
            tabBarIcon: ({ color }) => <Ionicons name="mic" size={24} color={color} />
          }}
        />
      )}
      
      {/* Discover Tab - Only visible to fans */}
      {isFan && (
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />
          }}
        />
      )}
      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }}
      />
      
      {/* Chat Tab - Visible to all users */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />
        }}
      />

      {/* 
        Hidden screens - These are accessible via direct navigation
        but not shown in the tab bar
      */}
      <Tabs.Screen name="shared-tracks" options={{ href: null }} />
      <Tabs.Screen name="batch" options={{ href: null }} />
      <Tabs.Screen name="vocal-isolation" options={{ href: null }} />
      <Tabs.Screen name="dolby" options={{ href: null }} />
      <Tabs.Screen name="athletes-example" options={{ href: null }} />
      <Tabs.Screen name="verification-test" options={{ href: null }} />
      <Tabs.Screen name="testing" options={{ href: null }} />
      <Tabs.Screen name="recordings" options={{ href: null }} />
      <Tabs.Screen name="songs" options={{ href: null }} />
      <Tabs.Screen name="podcasts" options={{ href: null }} />
      <Tabs.Screen name="athletes" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="fan-hub" options={{ href: null }} />
      <Tabs.Screen name="admin-verification" options={{ href: null }} />
      <Tabs.Screen name="athlete-profile" options={{ href: null }} />
      <Tabs.Screen name="fan-profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
