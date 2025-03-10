/**
 * Payment Layout
 * 
 * This layout provides consistent navigation for all payment-related screens.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function PaymentLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.background,
        }
      }}
    >
      <Stack.Screen
        name="subscription"
        options={{
          title: 'Premium Subscription',
        }}
      />
      <Stack.Screen
        name="subscribe"
        options={{
          title: 'Subscribe',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Payment Successful',
        }}
      />
    </Stack>
  );
} 