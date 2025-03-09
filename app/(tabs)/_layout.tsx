import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/auth';
import Colors from '../../constants/Colors';

/**
 * TabLayout component that handles the bottom tab navigation
 * Tabs are conditionally rendered based on user role
 */
export default function TabLayout() {
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';
  const isFan = user?.role === 'fan';
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarStyle: { 
          height: 80, 
          paddingBottom: 20,
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
      {isAthlete ? (
        <Tabs.Screen
          name="studio"
          options={{
            title: 'Studio',
            tabBarIcon: ({ color }) => <Ionicons name="mic" size={24} color={color} />
          }}
        />
      ) : (
        <Tabs.Screen
          name="studio"
          options={{
            tabBarButton: () => null
          }}
        />
      )}
      
      {/* Profile Tab - Different for fans and athletes */}
      <Tabs.Screen
        name={isFan ? 'fan-profile' : 'profile'}
        options={{
          title: isFan ? 'Fan Hub' : 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name={isFan ? "people" : "person"} size={24} color={color} />
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
      <Tabs.Screen name="discover" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="shared-tracks" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="batch" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="vocal-isolation" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="dolby" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="athletes-example" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="verification-test" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="testing" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="recordings" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="songs" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="podcasts" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="athletes" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="community" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="fan-hub" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="admin-verification" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="athlete-profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
