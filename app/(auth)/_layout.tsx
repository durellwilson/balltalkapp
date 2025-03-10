/**
 * Authentication Layout
 * 
 * This layout provides consistent navigation for all authentication-related screens.
 */

import React from 'react';
import { Stack } from "expo-router";
import { useTheme } from '../../hooks/useTheme';

export default function AuthLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          title: 'Login'
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
          title: 'Sign Up'
        }} 
      />
      <Stack.Screen 
        name="athlete-signup" 
        options={{ 
          title: 'Athlete Sign Up'
        }} 
      />
      <Stack.Screen 
        name="fan-hub" 
        options={{ 
          title: 'Fan Hub'
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}
