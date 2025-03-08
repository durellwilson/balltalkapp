import React from 'react';
import { View, StyleSheet, Text, Pressable, useColorScheme } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from '../../contexts/auth';

type NavigationItemType = {
  name: string;
  path: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
};

const NavigationBar = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isFan = user?.role === 'fan';

  // Define navigation items
  let navigationItems: NavigationItemType[] = [
    {
      name: 'Home',
      path: '/(tabs)',
      icon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
    },
    {
      name: 'Studio',
      path: '/(tabs)/studio',
      icon: ({ size, color }) => <Ionicons name="mic" size={size} color={color} />,
    },
    {
      name: 'Discover',
      path: '/(tabs)/discover',
      icon: ({ size, color }) => <MaterialCommunityIcons name="compass" size={size} color={color} />,
    },
    // Show Fan Hub for fans, regular profile for athletes or default
    {
      name: isFan ? 'Fan Hub' : 'Profile',
      path: isFan ? '/(tabs)/fan-profile' : '/(tabs)/profile',
      icon: ({ size, color }) => <Ionicons name={isFan ? "people" : "person"} size={size} color={color} />,
    },
    {
      name: 'Testing',
      path: '/(tabs)/testing',
      icon: ({ size, color }) => <MaterialIcons name="phonelink-setup" size={size} color={color} />,
    },
  ];

  // Only show the Studio tab for athletes
  if (user?.role !== 'athlete' && user?.role !== 'fan') {
    navigationItems = navigationItems.filter(item => item.path !== '/(tabs)/studio');
  }

  // Handle tab press
  const handlePress = (path: string) => {
    router.push(path);
  };

  // Get active colors based on theme
  const activeColor = isDarkMode ? '#4f9df8' : '#007AFF';
  const inactiveColor = isDarkMode ? '#888888' : '#8E8E93';
  const backgroundColor = isDarkMode ? '#121212' : '#fff';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';

  return (
    <View style={[styles.container, { backgroundColor, borderTopColor: borderColor }]}>
      {navigationItems.map((item) => {
        const isActive = 
          pathname === item.path || 
          (item.path === '/(tabs)' && pathname === '/(tabs)/index');
        
        return (
          <Pressable
            key={item.name}
            style={styles.tabItem}
            onPress={() => handlePress(item.path)}
          >
            {item.icon({
              size: 24,
              color: isActive ? activeColor : inactiveColor,
            })}
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? activeColor : inactiveColor },
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default NavigationBar;
