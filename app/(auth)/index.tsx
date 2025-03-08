import { Redirect } from 'expo-router';

// This is a redirect file that sends users to the login screen
export default function AuthIndex() {
  // Redirect to the login page by default
  return <Redirect href="/(auth)/login" />;
}
