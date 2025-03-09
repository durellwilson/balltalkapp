import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Chats'
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: 'Conversation'
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: false,
          title: 'New Chat'
        }}
      />
      <Stack.Screen
        name="new-group"
        options={{
          headerShown: false,
          title: 'New Group Chat'
        }}
      />
      <Stack.Screen
        name="add-members"
        options={{
          headerShown: false,
          title: 'Add Members'
        }}
      />
      <Stack.Screen
        name="premium-groups"
        options={{
          headerShown: false,
          title: 'Premium Groups'
        }}
      />
      <Stack.Screen
        name="create-premium-group"
        options={{
          headerShown: false,
          title: 'Create Premium Group'
        }}
      />
    </Stack>
  );
} 