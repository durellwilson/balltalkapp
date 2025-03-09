import React from 'react';
import { Redirect } from 'expo-router';

/**
 * ChatTab component that redirects to the chat functionality
 * This ensures the chat tab is properly linked to the chat screens
 */
export default function ChatTab() {
  return <Redirect href="/chat" />;
}
