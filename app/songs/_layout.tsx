import { Stack } from 'expo-router';

export default function SongsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Songs',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Song Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
} 