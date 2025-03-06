import { Text, View } from 'react-native';

// This is a redirect file that sends users to the auth flow
export default function Index() {
  // Use Redirect component instead of router.replace
  return <View><Text>This is the modified index file.</Text></View>;
}
