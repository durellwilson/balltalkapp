import { View, useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Define tab color based on theme
  const tabColor = colorScheme === 'dark' ? Colors.theme.dark.text : Colors.PRIMARY;

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tabColor,
          tabBarStyle: { 
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
            borderTopColor: colorScheme === 'dark' ? '#333' : '#e5e5e5',
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
          },
          headerShown: true,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="studio"
          options={{
            title: 'Studio',
            tabBarIcon: ({ color }) => <TabBarIcon name="mic" color={color} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dolby"
          options={{
            title: 'Dolby',
            tabBarIcon: ({ color }) => <TabBarIcon name="musical-notes" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shared-tracks"
          options={{
            title: 'Shared',
            tabBarIcon: ({ color }) => <TabBarIcon name="people" color={color} />,
            href: '/shared-tracks',
          }}
        />
        <Tabs.Screen
          name="vocal-isolation"
          options={{
            title: 'Vocals',
            tabBarIcon: ({ color }) => <TabBarIcon name="mic-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="batch"
          options={{
            title: 'Batch',
            tabBarIcon: ({ color }) => <TabBarIcon name="layers-outline" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
