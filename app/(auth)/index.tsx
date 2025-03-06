import { Redirect } from 'expo-router';

// This is a redirect file that sends users to the login screen
export default function AuthIndex() {
  // Use Redirect component instead of router.replace
  return <Redirect href="/(auth)/login" />;
}
