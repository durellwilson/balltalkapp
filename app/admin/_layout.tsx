import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

/**
 * AdminLayout component that handles the admin stack navigation
 */
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
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
      <Stack.Screen
        name="verification"
        options={{
          title: 'Admin Verification',
        }}
      />
      <Stack.Screen
        name="verification-test"
        options={{
          title: 'Verification Test',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
