import { View, useColorScheme } from "react-native";
import { Slot } from "expo-router";
import NavigationBar from '../../components/layout/NavigationBar';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' }}>
      <Slot />
      <NavigationBar />
    </View>
  );
}
