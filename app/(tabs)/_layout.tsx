import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/Colors';

/**
 * TabLayout component that handles the bottom tab navigation
 * Exactly 4 tabs are shown: Home, Studio, Profile, Chat
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.neutral600,
        tabBarStyle: { 
          height: Platform.OS === 'ios' ? 80 : 60, 
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          borderTopColor: Colors.neutral400,
          borderTopWidth: 1
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.light.cardBackground,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: Colors.light.text,
        },
        headerShadowVisible: false,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      
      {/* Studio Tab */}
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color }) => <Ionicons name="mic" size={24} color={color} />
        }}
      />
      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }}
      />
      
      {/* Chat Tab */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />
        }}
      />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  }
});
