import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import SongDetailScreen from '../../screens/SongDetailScreen';

export default function SongDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Song Details',
        }}
      />
      <SongDetailScreen songId={id} />
    </>
  );
} 