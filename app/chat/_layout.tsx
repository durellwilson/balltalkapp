/**
 * Chat Layout
 * 
 * This layout provides consistent navigation for all chat-related screens.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function ChatLayout() {
  const router = useRouter();
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
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/chat/diagnostics')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Chats'
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Conversation'
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Chat'
        }}
      />
      <Stack.Screen
        name="new-group"
        options={{
          title: 'New Group Chat'
        }}
      />
      <Stack.Screen
        name="add-members"
        options={{
          title: 'Add Members'
        }}
      />
      <Stack.Screen
        name="premium-groups"
        options={{
          title: 'Premium Groups'
        }}
      />
      <Stack.Screen
        name="create-premium-group"
        options={{
          title: 'Create Premium Group'
        }}
      />
      <Stack.Screen
        name="diagnostics"
        options={{
          title: 'Chat Diagnostics',
        }}
      />
    </Stack>
  );
} 